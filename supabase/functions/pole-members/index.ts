import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { canAccessPole, getAllowedPoles } from '../_shared/roles.ts';

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

    const url = new URL(req.url);

    // --- POST /bulk ---
    if (req.method === 'POST' && url.pathname.endsWith('/bulk')) {
      const { pole, members } = await req.json();

      if (!pole || !Array.isArray(members) || members.length === 0) {
        return errorResponse('pole et members sont requis', 400);
      }

      if (!canAccessPole(user, pole)) {
        return errorResponse('Accès refusé', 403);
      }

      // Get existing discord_ids in THIS pole
      const discordIds = members.map((m: { discord_id: string }) => m.discord_id);
      const { data: existing } = await supabase
        .from('pole_members')
        .select('id, discord_id, is_active')
        .eq('pole', pole)
        .in('discord_id', discordIds);

      const existingByDiscordId: Record<string, { id: string; is_active: boolean }> = {};
      for (const e of existing ?? []) {
        existingByDiscordId[e.discord_id] = { id: e.id, is_active: e.is_active };
      }

      // Lookup staff_ids
      const { data: staffUsers } = await supabase
        .from('users')
        .select('id, discord_id')
        .in('discord_id', discordIds);

      const discordToStaffId: Record<string, string> = {};
      if (staffUsers) {
        for (const su of staffUsers) {
          discordToStaffId[su.discord_id] = su.id;
        }
      }

      const toInsert: Record<string, unknown>[] = [];
      const toReactivate: { id: string; data: Record<string, unknown> }[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      for (const m of members) {
        if (!m.discord_username || !m.discord_id || !m.grade) {
          errors.push(`Données manquantes pour ${m.discord_id || 'inconnu'}`);
          continue;
        }
        const ex = existingByDiscordId[m.discord_id];
        if (ex) {
          if (ex.is_active) {
            skipped.push(m.discord_id);
          } else {
            // Reactivate inactive member
            toReactivate.push({
              id: ex.id,
              data: {
                pole,
                discord_username: m.discord_username,
                steam_id: m.steam_id ?? null,
                grade: m.grade,
                is_active: true,
                staff_id: discordToStaffId[m.discord_id] ?? null,
                added_by_id: user.id,
              },
            });
          }
          continue;
        }
        toInsert.push({
          pole,
          discord_username: m.discord_username,
          discord_id: m.discord_id,
          steam_id: m.steam_id ?? null,
          grade: m.grade,
          staff_id: discordToStaffId[m.discord_id] ?? null,
          added_by_id: user.id,
        });
      }

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('pole_members')
          .insert(toInsert);

        if (insertError) {
          return errorResponse(insertError.message, 500);
        }
      }

      // Reactivate inactive members
      for (const r of toReactivate) {
        const { error: updateError } = await supabase
          .from('pole_members')
          .update(r.data)
          .eq('id', r.id);

        if (updateError) {
          errors.push(`Erreur réactivation ${r.id}: ${updateError.message}`);
        }
      }

      return jsonResponse({
        added: toInsert.length,
        reactivated: toReactivate.length,
        skipped: skipped.length,
        errors,
      });
    }

    // --- GET ---
    if (req.method === 'GET') {
      const poleParam = url.searchParams.get('pole');
      const includeInactive = url.searchParams.get('include_inactive') === 'true';

      const readablePoles = getAllowedPoles(user);

      if (Array.isArray(readablePoles) && readablePoles.length === 0) {
        return errorResponse('Accès refusé', 403);
      }

      let query = supabase.from('pole_members').select('*');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      if (poleParam) {
        if (readablePoles !== null && !readablePoles.includes(poleParam)) {
          return errorResponse('Accès refusé', 403);
        }
        query = query.eq('pole', poleParam);
      } else if (readablePoles !== null) {
        query = query.in('pole', readablePoles);
      }

      query = query.order('discord_username', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return errorResponse(error.message, 500);
      }

      return jsonResponse(data ?? []);
    }

    // --- POST (single member) ---
    if (req.method === 'POST') {
      const { pole, discord_username, discord_id, steam_id, grade } = await req.json();

      if (!pole || !discord_username || !discord_id || !grade) {
        return errorResponse('pole, discord_username, discord_id et grade sont requis', 400);
      }

      if (!canAccessPole(user, pole)) {
        return errorResponse('Accès refusé', 403);
      }

      // Check if discord_id already exists in this pole
      const { data: existing } = await supabase
        .from('pole_members')
        .select('id, is_active')
        .eq('pole', pole)
        .eq('discord_id', discord_id)
        .maybeSingle();

      if (existing && existing.is_active) {
        return errorResponse('Ce membre est déjà actif dans ce pôle', 409);
      }

      // Auto-link staff_id
      const { data: staffUser } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', discord_id)
        .maybeSingle();

      // Reactivate inactive member
      if (existing && !existing.is_active) {
        const { data: reactivated, error: updateError } = await supabase
          .from('pole_members')
          .update({
            pole,
            discord_username,
            steam_id: steam_id ?? null,
            grade,
            is_active: true,
            staff_id: staffUser?.id ?? null,
            added_by_id: user.id,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          return errorResponse(updateError.message, 500);
        }

        return jsonResponse(reactivated, 201);
      }

      const { data: created, error: insertError } = await supabase
        .from('pole_members')
        .insert({
          pole,
          discord_username,
          discord_id,
          steam_id: steam_id ?? null,
          grade,
          staff_id: staffUser?.id ?? null,
          added_by_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        return errorResponse(insertError.message, 500);
      }

      return jsonResponse(created, 201);
    }

    // --- PUT ---
    if (req.method === 'PUT') {
      const { member_id, discord_username, steam_id, grade, is_active } = await req.json();

      if (!member_id) {
        return errorResponse('member_id est requis', 400);
      }

      // Fetch member to check pole access
      const { data: member, error: fetchError } = await supabase
        .from('pole_members')
        .select('*')
        .eq('id', member_id)
        .maybeSingle();

      if (fetchError) {
        return errorResponse(fetchError.message, 500);
      }

      if (!member) {
        return errorResponse('Membre introuvable', 404);
      }

      if (!canAccessPole(user, member.pole)) {
        return errorResponse('Accès refusé', 403);
      }

      const updates: Record<string, unknown> = {};
      if (discord_username !== undefined) updates.discord_username = discord_username;
      if (steam_id !== undefined) updates.steam_id = steam_id;
      if (grade !== undefined) updates.grade = grade;
      if (is_active !== undefined) updates.is_active = is_active;

      if (Object.keys(updates).length === 0) {
        return errorResponse('Aucun champ à mettre à jour', 400);
      }

      const { data: updated, error: updateError } = await supabase
        .from('pole_members')
        .update(updates)
        .eq('id', member_id)
        .select()
        .single();

      if (updateError) {
        return errorResponse(updateError.message, 500);
      }

      return jsonResponse(updated);
    }

    // --- DELETE ---
    if (req.method === 'DELETE') {
      const memberId = url.searchParams.get('member_id');

      if (!memberId) {
        return errorResponse('member_id est requis', 400);
      }

      // Fetch member to check pole access
      const { data: member, error: fetchError } = await supabase
        .from('pole_members')
        .select('*')
        .eq('id', memberId)
        .maybeSingle();

      if (fetchError) {
        return errorResponse(fetchError.message, 500);
      }

      if (!member) {
        return errorResponse('Membre introuvable', 404);
      }

      if (!canAccessPole(user, member.pole)) {
        return errorResponse('Accès refusé', 403);
      }

      // Soft delete via is_active = false
      const { data: updated, error: deleteError } = await supabase
        .from('pole_members')
        .update({ is_active: false })
        .eq('id', memberId)
        .select()
        .single();

      if (deleteError) {
        return errorResponse(deleteError.message, 500);
      }

      return jsonResponse(updated);
    }

    return errorResponse('Méthode non autorisée', 405);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
