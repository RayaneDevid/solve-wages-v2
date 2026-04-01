import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return errorResponse('Méthode non autorisée', 405);
  }

  try {
    // 1. Extract JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('JWT manquant', 401);
    }
    const jwt = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 2. Get auth user from JWT
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authUser) {
      return errorResponse('JWT invalide', 401);
    }

    // 3. Extract discord_id from auth user metadata
    const discordId =
      authUser.user_metadata?.provider_id ||
      authUser.identities?.[0]?.id;

    if (!discordId) {
      return errorResponse('Discord ID introuvable dans les métadonnées', 400);
    }

    // 4. Look up user in our users table by discord_id (excluding soft-deleted)
    const { data: appUser, error: lookupError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .is('deleted_at', null)
      .single();

    if (lookupError || !appUser) {
      return errorResponse("Vous n'avez pas accès au panel. Contactez le coordinateur.", 403);
    }

    // 5. Check if user is active
    if (!appUser.is_active) {
      return errorResponse('Votre accès a été désactivé.', 403);
    }

    // 6. Update user: link supabase_auth_id, avatar, username, last_login
    const avatarUrl = authUser.user_metadata?.avatar_url || null;
    const username =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.custom_claims?.global_name ||
      appUser.username;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        supabase_auth_id: authUser.id,
        avatar_url: avatarUrl,
        username,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', appUser.id)
      .select('id, discord_id, username, avatar_url, role, is_active, last_login_at, created_at, updated_at')
      .single();

    if (updateError || !updatedUser) {
      return errorResponse('Erreur lors de la mise à jour du profil', 500);
    }

    // 7. Return complete user
    return jsonResponse(updatedUser);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Erreur interne',
      500,
    );
  }
});
