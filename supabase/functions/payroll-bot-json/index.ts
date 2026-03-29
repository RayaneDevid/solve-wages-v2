import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/** Pole enum value → display label (must match frontend POLE_LABELS) */
const POLE_LABELS: Record<string, string> = {
  gerance: 'Gérance',
  administration: 'Administration',
  moderation: 'Modération',
  animation: 'Animation',
  mj: 'Maître du Jeu',
  douane: 'Douane',
  builder: 'Builder',
  community_manager: 'Community Manager',
  lore: 'Lore',
  equilibrage_pvp: 'Équilibrage PvP',
  streamer: 'Streamer',
  support: 'Support',
};

interface PayrollEntry {
  discord_id: string;
  steam_id: string | null;
  discord_username: string;
  montant: number;
  confirmed_by_coordinator: boolean;
  pole: string;
  grade: string;
}

/**
 * Public endpoint — no auth required.
 * The bot fetches this URL to get payroll data for a given week.
 * GET /payroll-bot-json?week_id=<uuid>
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const weekId = url.searchParams.get('week_id');

    if (!weekId) {
      return new Response(JSON.stringify({ error: 'week_id est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the week exists
    const { data: week, error: weekError } = await supabase
      .from('payroll_weeks')
      .select('id, status')
      .eq('id', weekId)
      .maybeSingle();

    if (weekError) {
      return new Response(JSON.stringify({ error: weekError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!week) {
      return new Response(JSON.stringify({ error: 'Semaine introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all entries for this week
    const { data: entries, error: entriesError } = await supabase
      .from('payroll_entries')
      .select('discord_id, steam_id, discord_username, montant, confirmed_by_coordinator, pole, grade')
      .eq('payroll_week_id', weekId)
      .order('pole', { ascending: true })
      .order('discord_username', { ascending: true });

    if (entriesError) {
      return new Response(JSON.stringify({ error: entriesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch approved primes for this week
    const { data: primes } = await supabase
      .from('primes')
      .select('discord_id, amount')
      .eq('payroll_week_id', weekId)
      .eq('status', 'approved');

    // Build a map discord_id → total approved prime amount
    const primesMap = new Map<string, number>();
    for (const p of primes ?? []) {
      primesMap.set(p.discord_id, (primesMap.get(p.discord_id) ?? 0) + p.amount);
    }

    // Map to the exact structure the bot expects (montant includes approved primes)
    const botJson = (entries ?? []).map((entry: PayrollEntry) => ({
      'ID Discord': entry.discord_id,
      'Steam ID': entry.steam_id ?? '',
      'Nom': entry.discord_username,
      'Montant de la paie': String(entry.montant + (primesMap.get(entry.discord_id) ?? 0)),
      'Confirmer pour envoi par le BOT': entry.confirmed_by_coordinator,
      'Confirmé par Nagisa': false,
      'Pôle': POLE_LABELS[entry.pole] ?? entry.pole,
      'Grade': entry.grade,
    }));

    // Tests for dev
    botJson.push({
      'ID Discord': '231447828172374016',
      'Steam ID': '76561198102020710',
      'Nom': 'Rayane',
      'Montant de la paie': '50000',
      'Confirmer pour envoi par le BOT': true,
      'Confirmé par Nagisa': false,
      'Pôle': 'Modération',
      'Grade': 'Développeur',
    });

    return new Response(JSON.stringify(botJson, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur interne' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
