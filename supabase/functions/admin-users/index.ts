import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { isAdmin } from '../_shared/roles.ts';

// Server-side grade display name → role enum mapping (safety net)
const GRADE_TO_ROLE: Record<string, string> = {
  'Développeur': 'developpeur',
  'Coordinateur': 'coordinateur',
  'Gérant Serveur': 'gerant_serveur',
  'Gérant Staff': 'gerant_staff',
  'Gérant RP': 'gerant_rp',
  'Gérant Equilibrage': 'gerant_equilibrage',
  'Gérant Développement': 'gerant_dev',
  'Gérant Discord': 'gerant_discord',
  'Administrateur': 'administrateur',
  'Responsable Modération': 'resp_moderation',
  'Modérateur Senior': 'moderateur_senior',
  'Modérateur': 'moderateur',
  'Responsable Animation': 'resp_animation',
  'Animateur Senior': 'animateur_senior',
  'Animateur': 'animateur',
  'Responsable MJ': 'resp_mj',
  'MJ Senior': 'mj_senior',
  'MJ': 'mj',
  'Responsable Douane': 'resp_douane',
  'Douanier Senior': 'douanier_senior',
  'Douanier': 'douanier',
  'Responsable Builder': 'resp_builder',
  'Builder': 'builder',
  'Responsable CM': 'resp_cm',
  'CM': 'cm',
  'Responsable Lore': 'resp_lore',
  'Lore': 'lore',
  'Resp. Équilibrage PvP': 'resp_equilibrage_pvp',
  'Équilibrage PvP': 'equilibrage_pvp',
  'Equilibrage': 'equilibrage_pvp',
  'Référent Streamer': 'referent_streamer',
};

function normalizeRole(role: string): string {
  return GRADE_TO_ROLE[role] ?? role;
}

// Role priority order (lower index = higher rank)
const ROLE_ORDER = [
  'developpeur', 'coordinateur', 'gerant_serveur', 'gerant_staff', 'gerant_rp',
  'gerant_dev', 'gerant_discord', 'gerant_equilibrage', 'administrateur',
  'resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane', 'resp_builder',
  'resp_cm', 'resp_lore', 'resp_equilibrage_pvp', 'referent_streamer',
  'moderateur_senior', 'animateur_senior', 'mj_senior', 'douanier_senior',
  'moderateur', 'animateur', 'mj', 'douanier', 'builder', 'cm', 'lore', 'equilibrage_pvp',
];

const ROLE_TO_POLE_MAP: Record<string, string> = {
  gerant_rp: 'gerance', gerant_dev: 'gerance', gerant_staff: 'gerance',
  gerant_discord: 'gerance', gerant_equilibrage: 'gerance', gerant_serveur: 'gerance',
  administrateur: 'administration',
  resp_moderation: 'moderation', moderateur_senior: 'moderation', moderateur: 'moderation',
  resp_animation: 'animation', animateur_senior: 'animation', animateur: 'animation',
  resp_mj: 'mj', mj_senior: 'mj', mj: 'mj',
  resp_douane: 'douane', douanier_senior: 'douane', douanier: 'douane',
  resp_builder: 'builder', builder: 'builder',
  resp_lore: 'lore', lore: 'lore',
  resp_equilibrage_pvp: 'equilibrage_pvp', equilibrage_pvp: 'equilibrage_pvp',
  resp_cm: 'community_manager', cm: 'community_manager',
  referent_streamer: 'streamer',
};

const ROLE_TO_GRADE_MAP: Record<string, string> = {
  gerant_rp: 'Gérant RP', gerant_dev: 'Gérant Développement', gerant_staff: 'Gérant Staff',
  gerant_discord: 'Gérant Discord', gerant_equilibrage: 'Gérant Equilibrage', gerant_serveur: 'Gérant Serveur',
  administrateur: 'Administrateur',
  resp_moderation: 'Responsable Modération', moderateur_senior: 'Modérateur Senior', moderateur: 'Modérateur',
  resp_animation: 'Responsable Animation', animateur_senior: 'Animateur Senior', animateur: 'Animateur',
  resp_mj: 'Responsable MJ', mj_senior: 'MJ Senior', mj: 'MJ',
  resp_douane: 'Responsable Douane', douanier_senior: 'Douanier Senior', douanier: 'Douanier',
  resp_builder: 'Responsable Builder', builder: 'Builder',
  resp_lore: 'Responsable Lore', lore: 'Lore',
  resp_equilibrage_pvp: 'Resp. Équilibrage PvP', equilibrage_pvp: 'Equilibrage',
  resp_cm: 'Responsable CM', cm: 'CM',
  referent_streamer: 'Référent Streamer',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await getUser(req);

    // All methods require admin role (coordinateur or developpeur)
    if (!isAdmin(user)) {
      return errorResponse('Accès réservé au coordinateur', 403);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // GET — List all users
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        return errorResponse(error.message, 500);
      }
      return jsonResponse(data);
    }

    // POST — Create user (single or bulk)
    if (req.method === 'POST') {
      const body = await req.json();

      // Bulk import: { users: [{ discord_id, username, role }] }
      if (Array.isArray(body.users)) {
        const users = body.users as { discord_id: string; username: string; role: string }[];
        if (users.length === 0) {
          return errorResponse('La liste est vide', 400);
        }

        const discordIds = users.map((u) => u.discord_id);
        const { data: existingUsers } = await supabase
          .from('users')
          .select('discord_id')
          .in('discord_id', discordIds);

        const existingSet = new Set((existingUsers ?? []).map((u: { discord_id: string }) => u.discord_id));
        const toInsert = users.filter((u) => !existingSet.has(u.discord_id));
        let added = 0;

        if (toInsert.length > 0) {
          const { error: insertErr } = await supabase
            .from('users')
            .insert(toInsert.map((u) => ({
              discord_id: u.discord_id,
              username: u.username,
              role: normalizeRole(u.role),
            })));

          if (insertErr) {
            return errorResponse(insertErr.message, 500);
          }
          added = toInsert.length;
        }

        return jsonResponse({ added, skipped: users.length - added });
      }

      // Single create
      const { discord_id, username, role, roles } = body;

      // Accept either roles[] (new) or role (legacy fallback)
      const rawRoles: string[] = Array.isArray(roles) && roles.length > 0
        ? roles
        : role ? [role] : [];

      if (!discord_id || !username || rawRoles.length === 0) {
        return errorResponse('discord_id, username et au moins un rôle sont requis', 400);
      }

      const normalizedRoles = rawRoles.map(normalizeRole);

      // Primary role = highest in hierarchy
      const primaryRole = [...normalizedRoles].sort((a, b) => {
        const ia = ROLE_ORDER.indexOf(a);
        const ib = ROLE_ORDER.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })[0];

      // Check discord_id uniqueness
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', discord_id)
        .maybeSingle();

      if (existing) {
        return errorResponse('Un utilisateur avec ce Discord ID existe déjà', 409);
      }

      const { data: createdUser, error } = await supabase
        .from('users')
        .insert({ discord_id, username, role: primaryRole, roles: normalizedRoles })
        .select('*')
        .single();

      if (error) {
        return errorResponse(error.message, 500);
      }

      // Create pole_members entries for each role that has a pole
      const poleEntries = normalizedRoles
        .filter((r) => ROLE_TO_POLE_MAP[r])
        .map((r) => ({
          discord_id,
          discord_username: username,
          pole: ROLE_TO_POLE_MAP[r],
          grade: ROLE_TO_GRADE_MAP[r] ?? r,
          staff_id: createdUser.id,
          added_by_id: user.id,
          is_active: true,
        }));

      if (poleEntries.length > 0) {
        const { error: poleErr } = await supabase.from('pole_members').insert(poleEntries);
        if (poleErr) {
          return errorResponse(poleErr.message, 500);
        }
      }

      return jsonResponse(createdUser, 201);
    }

    // PATCH — Update user
    if (req.method === 'PATCH') {
      const body = await req.json();
      const { user_id, role, roles, is_active } = body;

      if (!user_id) {
        return errorResponse('user_id est requis', 400);
      }

      // Prevent self-modification
      if (user_id === user.id) {
        return errorResponse('Vous ne pouvez pas vous modifier vous-même', 403);
      }

      const updates: Record<string, unknown> = {};

      if (Array.isArray(roles) && roles.length > 0) {
        const normalizedRoles = roles.map(normalizeRole);
        const primaryRole = [...normalizedRoles].sort((a, b) => {
          const ia = ROLE_ORDER.indexOf(a);
          const ib = ROLE_ORDER.indexOf(b);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        })[0];
        updates.roles = normalizedRoles;
        updates.role = primaryRole;
      } else if (role !== undefined) {
        updates.role = normalizeRole(role);
        updates.roles = [normalizeRole(role)];
      }

      if (is_active !== undefined) updates.is_active = is_active;

      if (Object.keys(updates).length === 0) {
        return errorResponse('Aucune modification fournie', 400);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user_id)
        .select('*')
        .single();

      if (error) {
        return errorResponse(error.message, 500);
      }
      return jsonResponse(data);
    }

    // DELETE — Delete user
    if (req.method === 'DELETE') {
      let userId: string | null = null;

      // Support both body and query param
      const url = new URL(req.url);
      userId = url.searchParams.get('user_id');

      if (!userId) {
        try {
          const body = await req.json();
          userId = body.user_id;
        } catch {
          // No body, that's ok if we got it from params
        }
      }

      if (!userId) {
        return errorResponse('user_id est requis', 400);
      }

      // Prevent self-deletion
      if (userId === user.id) {
        return errorResponse('Vous ne pouvez pas vous supprimer vous-même', 403);
      }

      // Get the user to check if they have a linked auth account
      const { data: targetUser } = await supabase
        .from('users')
        .select('supabase_auth_id')
        .eq('id', userId)
        .single();

      // Delete from users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        return errorResponse(deleteError.message, 500);
      }

      // Cascade: delete auth.user if linked
      if (targetUser?.supabase_auth_id) {
        await supabase.auth.admin.deleteUser(targetUser.supabase_auth_id);
      }

      return jsonResponse({ success: true });
    }

    return errorResponse('Méthode non autorisée', 405);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(
      error instanceof Error ? error.message : 'Erreur interne',
      status,
    );
  }
});
