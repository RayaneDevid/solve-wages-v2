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
    if (req.method !== 'POST') {
      return errorResponse('Méthode non autorisée', 405);
    }

    const user = await getUser(req);

    if (!isAdmin(user)) {
      return errorResponse('Accès refusé', 403);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { action, week_id } = await req.json();

    // --- action: open ---
    if (action === 'open') {
      if (week_id) {
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

        if (week.status !== 'closed') {
          return errorResponse('La semaine doit être fermée pour être ouverte', 400);
        }

        const { data: updated, error: updateError } = await supabase
          .from('payroll_weeks')
          .update({ status: 'open', opened_at: new Date().toISOString() })
          .eq('id', week_id)
          .select()
          .single();

        if (updateError) {
          return errorResponse(updateError.message, 500);
        }

        return jsonResponse(updated);
      }

      // No week_id: use current week
      const { weekStart, weekEnd } = getCurrentWeekDates();

      const { data: existing, error: findError } = await supabase
        .from('payroll_weeks')
        .select('*')
        .eq('week_start', weekStart)
        .maybeSingle();

      if (findError) {
        return errorResponse(findError.message, 500);
      }

      if (existing) {
        if (existing.status === 'open') {
          return jsonResponse(existing);
        }

        if (existing.status === 'locked') {
          return errorResponse('Semaine verrouillée, modification impossible', 400);
        }

        // status === 'closed'
        const { data: updated, error: updateError } = await supabase
          .from('payroll_weeks')
          .update({ status: 'open', opened_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          return errorResponse(updateError.message, 500);
        }

        return jsonResponse(updated);
      }

      // Does not exist: create it as open
      const { data: created, error: insertError } = await supabase
        .from('payroll_weeks')
        .insert({
          week_start: weekStart,
          week_end: weekEnd,
          status: 'open',
          opened_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return errorResponse(insertError.message, 500);
      }

      return jsonResponse(created, 201);
    }

    // --- action: close ---
    if (action === 'close') {
      if (!week_id) {
        return errorResponse('week_id est requis pour fermer une semaine', 400);
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

      if (week.status !== 'open') {
        return errorResponse("La semaine n'est pas ouverte", 400);
      }

      const { data: updated, error: updateError } = await supabase
        .from('payroll_weeks')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', week_id)
        .select()
        .single();

      if (updateError) {
        return errorResponse(updateError.message, 500);
      }

      return jsonResponse(updated);
    }

    // --- action: lock ---
    if (action === 'lock') {
      if (!week_id) {
        return errorResponse('week_id est requis pour verrouiller une semaine', 400);
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

      if (week.status === 'locked') {
        return errorResponse('Semaine déjà verrouillée', 400);
      }

      const { data: updated, error: updateError } = await supabase
        .from('payroll_weeks')
        .update({
          status: 'locked',
          locked_at: new Date().toISOString(),
          locked_by_id: user.id,
        })
        .eq('id', week_id)
        .select()
        .single();

      if (updateError) {
        return errorResponse(updateError.message, 500);
      }

      return jsonResponse(updated);
    }

    return errorResponse('Action invalide. Actions possibles : open, close, lock', 400);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
