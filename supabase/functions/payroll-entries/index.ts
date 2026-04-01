import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { getAllowedPoles, canAccessPole, isAdmin } from '../_shared/roles.ts';

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

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const weekId = url.searchParams.get('week_id');
      const poleParam = url.searchParams.get('pole');

      if (!weekId) {
        return errorResponse('week_id est requis', 400);
      }

      const allowedPoles = getAllowedPoles(user);

      if (Array.isArray(allowedPoles) && allowedPoles.length === 0) {
        return errorResponse('Accès refusé', 403);
      }

      let query = supabase
        .from('payroll_entries')
        .select('*')
        .eq('payroll_week_id', weekId);

      if (poleParam) {
        if (allowedPoles !== null && !allowedPoles.includes(poleParam)) {
          return errorResponse('Accès refusé', 403);
        }
        query = query.eq('pole', poleParam);
      } else {
        if (allowedPoles !== null) {
          query = query.in('pole', allowedPoles);
        }
      }

      query = query.order('discord_username', { ascending: true });

      const { data: entries, error: entriesError } = await query;

      if (entriesError) {
        return errorResponse(entriesError.message, 500);
      }

      // Pre-fill from pole_members: for each active member without an entry this week, add a blank row
      const targetPole = poleParam;
      if (targetPole) {
        const { data: poleMembers, error: membersError } = await supabase
          .from('pole_members')
          .select('*')
          .eq('pole', targetPole)
          .eq('is_active', true)
          .order('discord_username', { ascending: true });

        if (membersError) {
          return errorResponse(membersError.message, 500);
        }

        const existingDiscordIds = new Set(
          (entries ?? []).map((e: { discord_id: string }) => e.discord_id),
        );

        const prefilled = (poleMembers ?? [])
          .filter((m: { discord_id: string }) => !existingDiscordIds.has(m.discord_id))
          .map((m: { staff_id: string | null; discord_username: string; discord_id: string; steam_id: string | null; grade: string }) => ({
            id: null,
            payroll_week_id: weekId,
            submission_id: null,
            staff_id: m.staff_id,
            pole: targetPole,
            discord_username: m.discord_username,
            discord_id: m.discord_id,
            steam_id: m.steam_id,
            grade: m.grade,
            tickets_ig: null,
            tickets_discord: null,
            bda_count: null,
            nb_animations: null,
            nb_animations_mj: null,
            nb_candidatures_ecrites: null,
            nb_oraux: null,
            commentaire: null,
            presence_reunion: false,
            montant: 0,
            modified_by_coordinator: false,
            coordinator_modified_at: null,
            confirmed_by_coordinator: false,
            confirmed_at: null,
            filled_by_id: null,
            created_at: null,
            updated_at: null,
            is_prefilled: true,
          }));

        const allEntries = [
          ...(entries ?? []).map((e: Record<string, unknown>) => ({ ...e, is_prefilled: false })),
          ...prefilled,
        ];

        return jsonResponse(allEntries);
      }

      return jsonResponse(entries ?? []);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await req.json();
      const { week_id: weekId, pole, entries } = body;

      if (!weekId || !pole || !Array.isArray(entries)) {
        return errorResponse('week_id, pole et entries sont requis', 400);
      }

      if (!canAccessPole(user, pole)) {
        return errorResponse('Accès refusé', 403);
      }

      const hasWrongPole = entries.some(
        (e: Record<string, unknown>) => e.pole !== undefined && e.pole !== pole,
      );
      if (hasWrongPole) {
        return errorResponse('Toutes les entrées doivent appartenir au pôle déclaré', 400);
      }

      const { data: week, error: weekError } = await supabase
        .from('payroll_weeks')
        .select('*')
        .eq('id', weekId)
        .maybeSingle();

      if (weekError) {
        return errorResponse(weekError.message, 500);
      }

      if (!week) {
        return errorResponse('Semaine introuvable', 404);
      }

      if (isAdmin(user)) {
        if (week.status === 'locked') {
          return errorResponse('Semaine verrouillée, modification impossible', 400);
        }
      } else {
        if (week.status !== 'open') {
          return errorResponse('La saisie n\'est pas ouverte', 400);
        }
      }

      const { data: existingSubmission, error: subFetchError } = await supabase
        .from('payroll_submissions')
        .select('*')
        .eq('payroll_week_id', weekId)
        .eq('pole', pole)
        .maybeSingle();

      if (subFetchError) {
        return errorResponse(subFetchError.message, 500);
      }

      let submissionId: string;

      if (existingSubmission) {
        submissionId = existingSubmission.id;
      } else {
        const { data: newSubmission, error: subInsertError } = await supabase
          .from('payroll_submissions')
          .insert({
            payroll_week_id: weekId,
            submitted_by_id: user.id,
            pole,
            status: 'draft',
          })
          .select()
          .single();

        if (subInsertError) {
          return errorResponse(subInsertError.message, 500);
        }

        submissionId = newSubmission.id;
      }

      const discordIds = entries.map((e: { discord_id: string }) => e.discord_id);
      const { data: staffUsers } = await supabase
        .from('users')
        .select('id, discord_id')
        .in('discord_id', discordIds)
        .is('deleted_at', null);

      const discordToStaffId: Record<string, string> = {};
      if (staffUsers) {
        for (const su of staffUsers) {
          discordToStaffId[su.discord_id] = su.id;
        }
      }

      const isCoordinateur = isAdmin(user);
      const now = new Date().toISOString();

      const { data: existingEntries } = await supabase
        .from('payroll_entries')
        .select('discord_id, pole, confirmed_by_coordinator, confirmed_at')
        .eq('payroll_week_id', weekId)
        .eq('pole', pole);

      const existingByKey: Record<string, { confirmed_by_coordinator: boolean; confirmed_at: string | null }> = {};
      for (const e of existingEntries ?? []) {
        existingByKey[`${e.discord_id}:${e.pole}`] = {
          confirmed_by_coordinator: e.confirmed_by_coordinator,
          confirmed_at: e.confirmed_at,
        };
      }

      const rowsToUpsert = entries.map((entry: Record<string, unknown>) => {
        const key = `${entry.discord_id}:${pole}`;
        const existing = existingByKey[key];

        const row: Record<string, unknown> = {
          payroll_week_id: weekId,
          submission_id: submissionId,
          pole,
          discord_username: entry.discord_username,
          discord_id: entry.discord_id,
          steam_id: entry.steam_id ?? null,
          grade: entry.grade,
          tickets_ig: entry.tickets_ig ?? null,
          tickets_discord: entry.tickets_discord ?? null,
          bda_count: entry.bda_count ?? null,
          nb_animations: entry.nb_animations ?? null,
          nb_animations_mj: entry.nb_animations_mj ?? null,
          nb_candidatures_ecrites: entry.nb_candidatures_ecrites ?? null,
          nb_oraux: entry.nb_oraux ?? null,
          commentaire: entry.commentaire ?? null,
          presence_reunion: entry.presence_reunion ?? false,
          montant: entry.montant ?? 0,
          is_inactive: entry.is_inactive ?? false,
          filled_by_id: user.id,
          staff_id: discordToStaffId[entry.discord_id as string] ?? null,
          confirmed_by_coordinator: existing?.confirmed_by_coordinator ?? false,
          confirmed_at: existing?.confirmed_at ?? null,
        };

        if (isCoordinateur) {
          row.modified_by_coordinator = true;
          row.coordinator_modified_at = now;
        }

        return row;
      });

      const { data: freshWeek } = await supabase
        .from('payroll_weeks')
        .select('status')
        .eq('id', weekId)
        .single();

      if (!freshWeek || freshWeek.status === 'locked' || (!isCoordinateur && freshWeek.status !== 'open')) {
        return errorResponse('Semaine verrouillée ou fermée, modification impossible', 400);
      }

      const { data: upserted, error: upsertError } = await supabase
        .from('payroll_entries')
        .upsert(rowsToUpsert, { onConflict: 'payroll_week_id,discord_id,pole' })
        .select();

      if (upsertError) {
        return errorResponse(upsertError.message, 500);
      }

      return jsonResponse(upserted ?? []);
    }

    if (req.method === 'PATCH') {
      if (!isAdmin(user)) {
        return errorResponse('Seul le coordinateur peut confirmer les entrées', 403);
      }

      const body = await req.json();
      const { entry_id, entry_ids, confirmed } = body;

      if (typeof confirmed !== 'boolean') {
        return errorResponse('confirmed est requis', 400);
      }

      if (Array.isArray(entry_ids) && entry_ids.length > 0) {
        const { data: entries, error: fetchErr } = await supabase
          .from('payroll_entries')
          .select('id, payroll_week_id')
          .in('id', entry_ids);

        if (fetchErr) return errorResponse(fetchErr.message, 500);
        if (!entries || entries.length === 0) return errorResponse('Aucune entrée trouvée', 404);

        const weekIds = [...new Set(entries.map((e: { payroll_week_id: string }) => e.payroll_week_id))];
        const { data: weeks, error: weeksErr } = await supabase
          .from('payroll_weeks')
          .select('id, status')
          .in('id', weekIds);

        if (weeksErr) return errorResponse(weeksErr.message, 500);
        if (weeks?.some((w: { status: string }) => w.status === 'locked')) {
          return errorResponse('Semaine verrouillée', 400);
        }

        const now = new Date().toISOString();
        const { data: updated, error: updateErr } = await supabase
          .from('payroll_entries')
          .update({
            confirmed_by_coordinator: confirmed,
            confirmed_at: confirmed ? now : null,
          })
          .in('id', entry_ids)
          .select();

        if (updateErr) return errorResponse(updateErr.message, 500);

        return jsonResponse(updated ?? []);
      }

      if (!entry_id) {
        return errorResponse('entry_id ou entry_ids est requis', 400);
      }

      const { data: entry, error: fetchErr } = await supabase
        .from('payroll_entries')
        .select('id, payroll_week_id')
        .eq('id', entry_id)
        .maybeSingle();

      if (fetchErr) return errorResponse(fetchErr.message, 500);
      if (!entry) return errorResponse('Entrée introuvable', 404);

      const { data: week, error: weekErr } = await supabase
        .from('payroll_weeks')
        .select('status')
        .eq('id', entry.payroll_week_id)
        .single();

      if (weekErr) return errorResponse(weekErr.message, 500);
      if (week.status === 'locked') {
        return errorResponse('Semaine verrouillée', 400);
      }

      const updates: Record<string, unknown> = {
        confirmed_by_coordinator: confirmed,
        confirmed_at: confirmed ? new Date().toISOString() : null,
      };

      const { data: updated, error: updateErr } = await supabase
        .from('payroll_entries')
        .update(updates)
        .eq('id', entry_id)
        .select()
        .single();

      if (updateErr) return errorResponse(updateErr.message, 500);

      return jsonResponse(updated);
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const entryId = url.searchParams.get('entry_id');

      if (!entryId) {
        return errorResponse('entry_id est requis', 400);
      }

      const { data: entry, error: entryError } = await supabase
        .from('payroll_entries')
        .select('id, pole, payroll_week_id')
        .eq('id', entryId)
        .maybeSingle();

      if (entryError) {
        return errorResponse(entryError.message, 500);
      }

      if (!entry) {
        return errorResponse('Entrée introuvable', 404);
      }

      const { data: week, error: weekError } = await supabase
        .from('payroll_weeks')
        .select('status')
        .eq('id', entry.payroll_week_id)
        .single();

      if (weekError) {
        return errorResponse(weekError.message, 500);
      }

      if (week.status === 'locked') {
        return errorResponse('Semaine verrouillée, suppression impossible', 400);
      }

      if (!canAccessPole(user, entry.pole)) {
        return errorResponse('Accès refusé', 403);
      }

      const { error: deleteError } = await supabase
        .from('payroll_entries')
        .delete()
        .eq('id', entryId);

      if (deleteError) {
        return errorResponse(deleteError.message, 500);
      }

      return jsonResponse({ success: true });
    }

    return errorResponse('Méthode non autorisée', 405);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
