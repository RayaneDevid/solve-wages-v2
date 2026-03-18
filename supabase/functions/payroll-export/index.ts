import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { errorResponse } from '../_shared/response.ts';

const HEADERS = [
  'Pôle',
  'Grade',
  'Nom Discord',
  'Discord ID',
  'Steam ID',
  'Tickets IG',
  'Tickets Discord',
  'BDA',
  'Animations',
  'Animations MJ',
  'Candidatures écrites',
  'Oraux',
  'Commentaire',
  'Réunion',
  'Montant',
];

interface PayrollEntry {
  pole: string;
  grade: string;
  discord_username: string;
  discord_id: string;
  steam_id: string | null;
  tickets_ig: number | null;
  tickets_discord: number | null;
  bda_count: number | null;
  nb_animations: number | null;
  nb_animations_mj: number | null;
  nb_candidatures_ecrites: number | null;
  nb_oraux: number | null;
  commentaire: string | null;
  presence_reunion: boolean;
  montant: number;
}

function escapeCsvField(value: string, separator: string): string {
  if (separator === '\t') {
    return value;
  }
  // CSV: wrap if contains separator, quotes, or newlines
  if (value.includes(separator) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function entryToRow(entry: PayrollEntry): string[] {
  return [
    entry.pole,
    entry.grade,
    entry.discord_username,
    entry.discord_id,
    entry.steam_id ?? '',
    entry.tickets_ig?.toString() ?? '',
    entry.tickets_discord?.toString() ?? '',
    entry.bda_count?.toString() ?? '',
    entry.nb_animations?.toString() ?? '',
    entry.nb_animations_mj?.toString() ?? '',
    entry.nb_candidatures_ecrites?.toString() ?? '',
    entry.nb_oraux?.toString() ?? '',
    entry.commentaire ?? '',
    entry.presence_reunion ? 'Oui' : 'Non',
    entry.montant.toString(),
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return errorResponse('Méthode non autorisée', 405);
    }

    const user = await getUser(req);

    if (user.role !== 'coordinateur') {
      return errorResponse('Accès refusé', 403);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const url = new URL(req.url);
    const weekId = url.searchParams.get('week_id');
    const format = url.searchParams.get('format');

    if (!weekId) {
      return errorResponse('week_id est requis', 400);
    }

    if (!format || !['csv', 'tsv'].includes(format)) {
      return errorResponse('format doit être csv ou tsv', 400);
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

    // Fetch all entries for this week
    const { data: entries, error: entriesError } = await supabase
      .from('payroll_entries')
      .select('*')
      .eq('payroll_week_id', weekId)
      .order('pole', { ascending: true })
      .order('discord_username', { ascending: true });

    if (entriesError) {
      return errorResponse(entriesError.message, 500);
    }

    const separator = format === 'csv' ? ',' : '\t';

    // Build output
    const lines: string[] = [];

    // Header row
    lines.push(HEADERS.map((h) => escapeCsvField(h, separator)).join(separator));

    // Data rows
    for (const entry of (entries ?? []) as PayrollEntry[]) {
      const row = entryToRow(entry);
      lines.push(row.map((field) => escapeCsvField(field, separator)).join(separator));
    }

    const content = lines.join('\n');

    const responseHeaders: Record<string, string> = { ...corsHeaders };

    if (format === 'csv') {
      responseHeaders['Content-Type'] = 'text/csv; charset=utf-8';
      responseHeaders['Content-Disposition'] =
        `attachment; filename="paies_${week.week_start}_${week.week_end}.csv"`;
    } else {
      responseHeaders['Content-Type'] = 'text/plain; charset=utf-8';
    }

    return new Response(content, { status: 200, headers: responseHeaders });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
