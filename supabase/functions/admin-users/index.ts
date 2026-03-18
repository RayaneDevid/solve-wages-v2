import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const user = await getUser(req);

    // All methods require coordinateur role
    if (user.role !== 'coordinateur') {
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

    // POST — Create user
    if (req.method === 'POST') {
      const body = await req.json();
      const { discord_id, username, role } = body;

      if (!discord_id || !username || !role) {
        return errorResponse('discord_id, username et role sont requis', 400);
      }

      // Check discord_id uniqueness
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', discord_id)
        .single();

      if (existing) {
        return errorResponse('Un utilisateur avec ce Discord ID existe déjà', 409);
      }

      const { data, error } = await supabase
        .from('users')
        .insert({ discord_id, username, role })
        .select('*')
        .single();

      if (error) {
        return errorResponse(error.message, 500);
      }
      return jsonResponse(data, 201);
    }

    // PATCH — Update user
    if (req.method === 'PATCH') {
      const body = await req.json();
      const { user_id, role, is_active } = body;

      if (!user_id) {
        return errorResponse('user_id est requis', 400);
      }

      // Prevent self-modification
      if (user_id === user.id) {
        return errorResponse('Vous ne pouvez pas vous modifier vous-même', 403);
      }

      const updates: Record<string, unknown> = {};
      if (role !== undefined) updates.role = role;
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
