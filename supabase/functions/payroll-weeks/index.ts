import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { isAdmin } from '../_shared/roles.ts';

function getCurrentWeekDates(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await getUser(req);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // --- GET ---
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const current = url.searchParams.get('current');

      if (current === 'true') {
        // Find the most recent non-locked week first (open or closed).
        // Only fall back to the current calendar week if none exists.
        const { data: activeWeek, error: activeWeekError } = await supabase
          .from('payroll_weeks')
          .select('*')
          .in('status', ['open', 'closed'])
          .order('week_start', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeWeekError) {
          return errorResponse(activeWeekError.message, 500);
        }

        const { weekStart } = getCurrentWeekDates();

        const { data: week, error: weekError } = activeWeek
          ? { data: activeWeek, error: null }
          : await supabase
              .from('payroll_weeks')
              .select('*')
              .eq('week_start', weekStart)
              .maybeSingle();

        if (weekError) {
          return errorResponse(weekError.message, 500);
        }

        if (!week) {
          return jsonResponse(null);
        }

        const { data: submissions, error: subError } = await supabase
          .from('payroll_submissions')
          .select('id, pole, status, submitted_at, submitted_by_id')
          .eq('payroll_week_id', week.id);

        if (subError) {
          return errorResponse(subError.message, 500);
        }

        const submittedByIds = [...new Set((submissions ?? []).map((s: { submitted_by_id: string }) => s.submitted_by_id).filter(Boolean))];
        const usernameMap: Record<string, string> = {};
        if (submittedByIds.length > 0) {
          const { data: submitters } = await supabase
            .from('users')
            .select('id, username')
            .in('id', submittedByIds)
            .is('deleted_at', null);
          if (submitters) {
            for (const u of submitters) { usernameMap[u.id] = u.username; }
          }
        }

        const enrichedSubmissions = (submissions ?? []).map((s: Record<string, unknown>) => ({
          ...s,
          submitted_by_username: usernameMap[s.submitted_by_id as string] ?? null,
        }));

        return jsonResponse({ ...week, submissions: enrichedSubmissions });
      }

      // All weeks
      const { data: weeks, error: weeksError } = await supabase
        .from('payroll_weeks')
        .select('*')
        .order('week_start', { ascending: false });

      if (weeksError) {
        return errorResponse(weeksError.message, 500);
      }

      const weekIds = (weeks ?? []).map((w: { id: string }) => w.id);

      let submissions: { payroll_week_id: string; id: string; pole: string; status: string; submitted_at: string | null; submitted_by_id: string }[] = [];
      if (weekIds.length > 0) {
        const { data: subs, error: subError } = await supabase
          .from('payroll_submissions')
          .select('id, payroll_week_id, pole, status, submitted_at, submitted_by_id')
          .in('payroll_week_id', weekIds);

        if (subError) {
          return errorResponse(subError.message, 500);
        }
        submissions = subs ?? [];
      }

      const result = (weeks ?? []).map((week: { id: string }) => ({
        ...week,
        submissions: submissions.filter((s) => s.payroll_week_id === week.id),
      }));

      return jsonResponse(result);
    }

    // --- POST ---
    if (req.method === 'POST') {
      if (!isAdmin(user)) {
        return errorResponse('Accès refusé', 403);
      }

      const { weekStart, weekEnd } = getCurrentWeekDates();

      const { data: existing } = await supabase
        .from('payroll_weeks')
        .select('id')
        .eq('week_start', weekStart)
        .maybeSingle();

      if (existing) {
        return errorResponse('Une semaine existe déjà pour cette période', 409);
      }

      const { data: created, error: insertError } = await supabase
        .from('payroll_weeks')
        .insert({
          week_start: weekStart,
          week_end: weekEnd,
          status: 'closed',
        })
        .select()
        .single();

      if (insertError) {
        return errorResponse(insertError.message, 500);
      }

      return jsonResponse(created, 201);
    }

    // --- PATCH ---
    if (req.method === 'PATCH') {
      if (!isAdmin(user)) {
        return errorResponse('Accès refusé', 403);
      }

      const { week_id, status } = await req.json();

      if (!week_id || !status) {
        return errorResponse('week_id et status sont requis', 400);
      }

      if (!['open', 'closed', 'locked'].includes(status)) {
        return errorResponse('Statut invalide', 400);
      }

      const { data: week, error: fetchError } = await supabase
        .from('payroll_weeks')
        .select('*')
        .eq('id', week_id)
        .maybeSingle();

      if (fetchError) {
        return errorResponse(fetchError.message, 500);
      }

      if (!week) {
        return errorResponse('Semaine introuvable', 404);
      }

      // Validate transitions
      if (week.status === 'locked') {
        return errorResponse('Semaine verrouillée, modification impossible', 400);
      }

      const allowedTransitions: Record<string, string[]> = {
        closed: ['open', 'locked'],
        open: ['closed', 'locked'],
      };

      if (!allowedTransitions[week.status]?.includes(status)) {
        return errorResponse('Transition de statut invalide', 400);
      }

      const updateData: Record<string, string> = { status };
      const now = new Date().toISOString();

      if (status === 'open') {
        updateData.opened_at = now;
      } else if (status === 'closed') {
        updateData.closed_at = now;
      } else if (status === 'locked') {
        updateData.locked_at = now;
        updateData.locked_by_id = user.id;
      }

      const { data: updated, error: updateError } = await supabase
        .from('payroll_weeks')
        .update(updateData)
        .eq('id', week_id)
        .select()
        .single();

      if (updateError) {
        return errorResponse(updateError.message, 500);
      }

      return jsonResponse(updated);
    }

    return errorResponse('Méthode non autorisée', 405);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
