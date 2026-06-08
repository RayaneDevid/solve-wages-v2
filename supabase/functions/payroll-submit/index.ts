import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { canAccessPole, getAllowedPoles } from '../_shared/roles.ts';

interface PayrollEntrySnapshot {
  discord_id: string;
  discord_username: string;
  steam_id: string | null;
  grade: string;
  tickets_ig: number | null;
  tickets_discord: number | null;
  bda_count: number | null;
  nb_animations: number | null;
  nb_animations_mj: number | null;
  nb_animations_mj_p: number | null;
  nb_animations_mj_m: number | null;
  nb_animations_mj_g: number | null;
  nb_heures_mj: string | null;
  nb_candidatures_ecrites: number | null;
  nb_oraux: number | null;
  commentaire: string | null;
  presence_reunion: boolean;
  montant: number;
  is_inactive: boolean;
}

interface PayrollSnapshot {
  total_montant: number;
  entry_count: number;
  entries: PayrollEntrySnapshot[];
}

const SNAPSHOT_FIELDS: Array<{ key: keyof PayrollEntrySnapshot; label: string }> = [
  { key: 'discord_username', label: 'Nom Discord' },
  { key: 'steam_id', label: 'Steam ID' },
  { key: 'grade', label: 'Grade' },
  { key: 'tickets_ig', label: 'Tickets IG' },
  { key: 'tickets_discord', label: 'Tickets Discord' },
  { key: 'bda_count', label: 'BDA' },
  { key: 'nb_animations', label: 'Animations' },
  { key: 'nb_animations_mj', label: 'Total Anim. MJ' },
  { key: 'nb_animations_mj_p', label: 'Petites animations MJ' },
  { key: 'nb_animations_mj_m', label: 'Moyennes animations MJ' },
  { key: 'nb_animations_mj_g', label: 'Grandes animations MJ' },
  { key: 'nb_heures_mj', label: 'Heures MJ' },
  { key: 'nb_candidatures_ecrites', label: 'Candidatures écrites' },
  { key: 'nb_oraux', label: 'Oraux' },
  { key: 'commentaire', label: 'Commentaire' },
  { key: 'presence_reunion', label: 'Réunion' },
  { key: 'montant', label: 'Montant' },
  { key: 'is_inactive', label: 'Inactif' },
];

function normalizeValue(value: unknown): unknown {
  return value === undefined ? null : value;
}

function buildSnapshot(entries: PayrollEntrySnapshot[]): PayrollSnapshot {
  const sortedEntries = [...entries].sort((a, b) => a.discord_username.localeCompare(b.discord_username));
  return {
    total_montant: sortedEntries.reduce((sum, entry) => sum + (entry.montant ?? 0), 0),
    entry_count: sortedEntries.length,
    entries: sortedEntries,
  };
}

function getEntryLabel(entry: PayrollEntrySnapshot): string {
  return entry.discord_username || entry.discord_id;
}

function buildChanges(previous: PayrollSnapshot | null, current: PayrollSnapshot): Record<string, unknown>[] {
  if (!previous) {
    return [{
      type: 'initial',
      label: 'Première soumission du pôle',
      entry_count: current.entry_count,
      total_montant: current.total_montant,
    }];
  }

  const previousById = new Map(previous.entries.map((entry) => [entry.discord_id, entry]));
  const currentById = new Map(current.entries.map((entry) => [entry.discord_id, entry]));
  const changes: Record<string, unknown>[] = [];

  for (const entry of current.entries) {
    const oldEntry = previousById.get(entry.discord_id);
    if (!oldEntry) {
      changes.push({
        type: 'added',
        discord_id: entry.discord_id,
        discord_username: getEntryLabel(entry),
        montant: entry.montant,
      });
      continue;
    }

    const fieldChanges = SNAPSHOT_FIELDS
      .map(({ key, label }) => ({
        field: key,
        label,
        old_value: normalizeValue(oldEntry[key]),
        new_value: normalizeValue(entry[key]),
      }))
      .filter((change) => change.old_value !== change.new_value);

    if (fieldChanges.length > 0) {
      changes.push({
        type: 'updated',
        discord_id: entry.discord_id,
        discord_username: getEntryLabel(entry),
        fields: fieldChanges,
      });
    }
  }

  for (const entry of previous.entries) {
    if (currentById.has(entry.discord_id)) continue;
    changes.push({
      type: 'removed',
      discord_id: entry.discord_id,
      discord_username: getEntryLabel(entry),
      montant: entry.montant,
    });
  }

  return changes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return errorResponse('Méthode non autorisée', 405);
    }

    const user = await getUser(req);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const weekId = url.searchParams.get('week_id');
      const pole = url.searchParams.get('pole');

      if (!weekId) {
        return errorResponse('week_id est requis', 400);
      }

      const allowedPoles = getAllowedPoles(user);
      if (Array.isArray(allowedPoles) && allowedPoles.length === 0) {
        return errorResponse('Accès refusé', 403);
      }

      let query = supabase
        .from('payroll_submission_logs')
        .select('*')
        .eq('payroll_week_id', weekId)
        .order('submitted_at', { ascending: false });

      if (pole) {
        if (!canAccessPole(user, pole)) {
          return errorResponse('Accès refusé', 403);
        }
        query = query.eq('pole', pole);
      } else if (allowedPoles !== null) {
        query = query.in('pole', allowedPoles);
      }

      const { data: logs, error: logsError } = await query;

      if (logsError) {
        return errorResponse(logsError.message, 500);
      }

      const submitterIds = [...new Set((logs ?? []).map((log: { submitted_by_id: string }) => log.submitted_by_id).filter(Boolean))];
      const usernameMap: Record<string, string> = {};

      if (submitterIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, username')
          .in('id', submitterIds)
          .is('deleted_at', null);

        for (const submitter of users ?? []) {
          usernameMap[submitter.id] = submitter.username;
        }
      }

      return jsonResponse((logs ?? []).map((log: Record<string, unknown>) => ({
        ...log,
        submitted_by_username: usernameMap[log.submitted_by_id as string] ?? null,
      })));
    }

    const body = await req.json();
    const { week_id: weekId, pole } = body;

    if (!weekId || !pole) {
      return errorResponse('week_id et pole sont requis', 400);
    }

    // Check user role: must be coordinateur or resp matching the pole
    if (!canAccessPole(user, pole)) {
      return errorResponse('Accès refusé', 403);
    }

    // Fetch the week
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

    if (week.status !== 'open') {
      return errorResponse('La saisie n\'est pas ouverte', 400);
    }

    // Check at least one entry with montant > 0 OR marked inactive
    const { count: activeCount, error: activeError } = await supabase
      .from('payroll_entries')
      .select('id', { count: 'exact', head: true })
      .eq('payroll_week_id', weekId)
      .eq('pole', pole)
      .gt('montant', 0);

    const { count: inactiveCount, error: inactiveError } = await supabase
      .from('payroll_entries')
      .select('id', { count: 'exact', head: true })
      .eq('payroll_week_id', weekId)
      .eq('pole', pole)
      .eq('is_inactive', true);

    if (activeError || inactiveError) {
      return errorResponse((activeError ?? inactiveError)!.message, 500);
    }

    const totalValid = (activeCount ?? 0) + (inactiveCount ?? 0);
    if (totalValid === 0) {
      return errorResponse('Aucune entrée avec un montant positif ou marquée inactive', 400);
    }

    // Find the submission
    const { data: submission, error: subError } = await supabase
      .from('payroll_submissions')
      .select('*')
      .eq('payroll_week_id', weekId)
      .eq('pole', pole)
      .maybeSingle();

    if (subError) {
      return errorResponse(subError.message, 500);
    }

    if (!submission) {
      return errorResponse('Aucune soumission trouvée', 404);
    }

    const { data: entries, error: entriesError } = await supabase
      .from('payroll_entries')
      .select('discord_id, discord_username, steam_id, grade, tickets_ig, tickets_discord, bda_count, nb_animations, nb_animations_mj, nb_animations_mj_p, nb_animations_mj_m, nb_animations_mj_g, nb_heures_mj, nb_candidatures_ecrites, nb_oraux, commentaire, presence_reunion, montant, is_inactive')
      .eq('payroll_week_id', weekId)
      .eq('pole', pole);

    if (entriesError) {
      return errorResponse(entriesError.message, 500);
    }

    const currentSnapshot = buildSnapshot((entries ?? []) as PayrollEntrySnapshot[]);

    const { data: previousLog, error: previousLogError } = await supabase
      .from('payroll_submission_logs')
      .select('snapshot')
      .eq('payroll_week_id', weekId)
      .eq('pole', pole)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousLogError) {
      return errorResponse(previousLogError.message, 500);
    }

    const previousSnapshot = (previousLog?.snapshot ?? null) as PayrollSnapshot | null;
    const changes = buildChanges(previousSnapshot, currentSnapshot);
    const submittedAt = new Date().toISOString();

    // Update submission status
    const { data: updated, error: updateError } = await supabase
      .from('payroll_submissions')
      .update({
        status: 'submitted',
        submitted_at: submittedAt,
      })
      .eq('id', submission.id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(updateError.message, 500);
    }

    const { error: logError } = await supabase
      .from('payroll_submission_logs')
      .insert({
        payroll_week_id: weekId,
        submission_id: submission.id,
        pole,
        submitted_by_id: user.id,
        submitted_at: submittedAt,
        total_montant: currentSnapshot.total_montant,
        entry_count: currentSnapshot.entry_count,
        snapshot: currentSnapshot,
        changes,
      });

    if (logError) {
      return errorResponse(logError.message, 500);
    }

    return jsonResponse(updated);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
