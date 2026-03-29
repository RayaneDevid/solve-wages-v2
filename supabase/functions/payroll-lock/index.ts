import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

// Lock expires after 30s without heartbeat
const LOCK_TTL_SECONDS = 30;

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

    // --- GET: check if a pole is locked ---
    if (req.method === 'GET') {
      const weekId = url.searchParams.get('week_id');
      const pole = url.searchParams.get('pole');

      if (!weekId || !pole) {
        return errorResponse('week_id et pole sont requis', 400);
      }

      const { data: lock } = await supabase
        .from('payroll_locks')
        .select('*')
        .eq('payroll_week_id', weekId)
        .eq('pole', pole)
        .maybeSingle();

      if (!lock) return jsonResponse(null);

      // Check if lock is stale
      const lockedAt = new Date(lock.locked_at).getTime();
      const now = Date.now();
      const age = (now - lockedAt) / 1000;

      if (age > LOCK_TTL_SECONDS) {
        // Stale lock — delete it and return null
        await supabase.from('payroll_locks').delete().eq('id', lock.id);
        return jsonResponse(null);
      }

      return jsonResponse(lock);
    }

    // --- POST: acquire or refresh lock ---
    if (req.method === 'POST') {
      const { week_id: weekId, pole } = await req.json();

      if (!weekId || !pole) {
        return errorResponse('week_id et pole sont requis', 400);
      }

      // Check for existing lock
      const { data: existing } = await supabase
        .from('payroll_locks')
        .select('*')
        .eq('payroll_week_id', weekId)
        .eq('pole', pole)
        .maybeSingle();

      if (existing) {
        const age = (Date.now() - new Date(existing.locked_at).getTime()) / 1000;

        // Another user holds a fresh lock
        if (existing.user_id !== user.id && age <= LOCK_TTL_SECONDS) {
          return jsonResponse({ locked_by: existing.username }, 409);
        }

        // Owned by this user or stale — refresh it
        const { data: updated, error } = await supabase
          .from('payroll_locks')
          .update({ user_id: user.id, username: user.username ?? 'Inconnu', locked_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) return errorResponse(error.message, 500);
        return jsonResponse(updated);
      }

      // No existing lock — create one
      const { data: created, error } = await supabase
        .from('payroll_locks')
        .insert({
          payroll_week_id: weekId,
          pole,
          user_id: user.id,
          username: user.username ?? 'Inconnu',
        })
        .select()
        .single();

      if (error) {
        // Unique constraint violation: another request acquired the lock between our check and insert
        if (error.code === '23505') {
          const { data: freshLock } = await supabase
            .from('payroll_locks')
            .select('username')
            .eq('payroll_week_id', weekId)
            .eq('pole', pole)
            .maybeSingle();
          return jsonResponse({ locked_by: freshLock?.username ?? 'Quelqu\'un d\'autre' }, 409);
        }
        return errorResponse(error.message, 500);
      }
      return jsonResponse(created);
    }

    // --- DELETE: release lock ---
    if (req.method === 'DELETE') {
      const { week_id: weekId, pole } = await req.json();

      if (!weekId || !pole) {
        return errorResponse('week_id et pole sont requis', 400);
      }

      await supabase
        .from('payroll_locks')
        .delete()
        .eq('payroll_week_id', weekId)
        .eq('pole', pole)
        .eq('user_id', user.id);

      return jsonResponse({ success: true });
    }

    return errorResponse('Méthode non autorisée', 405);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
