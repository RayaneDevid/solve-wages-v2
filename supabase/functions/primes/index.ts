import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { isAdmin } from '../_shared/roles.ts';
import type { AppUser } from '../_shared/roles.ts';

function isGerant(user: AppUser): boolean {
  return user.roles.some((r) => ['gerant_staff', 'gerant_rp', 'gerant_serveur'].includes(r));
}

function isResp(user: AppUser): boolean {
  return user.roles.some((r) => r.startsWith('resp_') || r === 'referent_streamer');
}

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

      if (!weekId) {
        return errorResponse('week_id est requis', 400);
      }

      if (!isAdmin(user) && !isGerant(user) && !isResp(user)) {
        return errorResponse('Accès refusé', 403);
      }

      const { data, error } = await supabase
        .from('primes')
        .select('*')
        .eq('payroll_week_id', weekId)
        .order('created_at', { ascending: false });

      if (error) {
        return errorResponse(error.message, 500);
      }

      const allPrimes = data ?? [];

      // Admin/coord see all; gérants see all resp + gérant primes; resp see primes from shared roles
      let primes = allPrimes;
      if (!isAdmin(user)) {
        const peerIds = new Set<string>([user.id]);

        if (isGerant(user)) {
          // Gérants see primes from all gérants + all responsables (excluding soft-deleted)
          const { data: peers } = await supabase
            .from('users')
            .select('id, roles')
            .filter('is_active', 'eq', true)
            .is('deleted_at', null);

          if (peers) {
            for (const peer of peers) {
              const peerRoles: string[] = peer.roles ?? [];
              const isPeerGerantOrResp = peerRoles.some(
                (r: string) => r.startsWith('resp_') || r === 'referent_streamer' || ['gerant_staff', 'gerant_rp', 'gerant_serveur'].includes(r),
              );
              if (isPeerGerantOrResp) peerIds.add(peer.id);
            }
          }
        } else {
          // Responsables see primes from users sharing at least one common resp role
          const userRespRoles = user.roles.filter(
            (r: string) => r.startsWith('resp_') || r === 'referent_streamer',
          );

          if (userRespRoles.length > 0) {
            const { data: peers } = await supabase
              .from('users')
              .select('id, roles')
              .filter('is_active', 'eq', true);

            if (peers) {
              for (const peer of peers) {
                const peerRoles: string[] = peer.roles ?? [];
                if (peerRoles.some((r: string) => userRespRoles.includes(r))) {
                  peerIds.add(peer.id);
                }
              }
            }
          }
        }

        primes = allPrimes.filter(
          (p: { submitted_by_id: string | null }) => p.submitted_by_id && peerIds.has(p.submitted_by_id),
        );
      }

      const userIds = [...new Set(primes.map((p: { submitted_by_id: string | null }) => p.submitted_by_id).filter(Boolean))];
      const usernameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, username').in('id', userIds).is('deleted_at', null);
        if (users) { for (const u of users) { usernameMap[u.id] = u.username; } }
      }
      const enriched = primes.map((p: Record<string, unknown>) => ({
        ...p,
        submitted_by_username: p.submitted_by_id ? (usernameMap[p.submitted_by_id as string] ?? null) : null,
      }));

      return jsonResponse(enriched);
    }

    if (req.method === 'POST') {
      if (!isGerant(user) && !isAdmin(user) && !isResp(user)) {
        return errorResponse('Accès refusé', 403);
      }

      const { week_id, discord_id, discord_username, amount, comment } = await req.json();

      if (!week_id || !discord_id || !discord_username || !amount) {
        return errorResponse('week_id, discord_id, discord_username et amount sont requis', 400);
      }

      if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0 || amount > 1_000_000) {
        return errorResponse('amount doit être un entier entre 1 et 1 000 000', 400);
      }

      const { data: week, error: weekError } = await supabase
        .from('payroll_weeks')
        .select('status')
        .eq('id', week_id)
        .maybeSingle();

      if (weekError || !week) {
        return errorResponse('Semaine introuvable', 404);
      }

      if (week.status === 'locked') {
        return errorResponse('La semaine est verrouillée', 400);
      }

      const { data: existing } = await supabase
        .from('primes')
        .select('*')
        .eq('payroll_week_id', week_id)
        .eq('discord_id', discord_id)
        .maybeSingle();

      if (existing) {
        if (existing.status !== 'pending') {
          return errorResponse('Cette prime a déjà été traitée et ne peut plus être modifiée', 400);
        }

        const { data: updated, error: updateError } = await supabase
          .from('primes')
          .update({
            discord_username,
            amount,
            comment: comment ?? null,
            submitted_by_id: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          return errorResponse(updateError.message, 500);
        }

        return jsonResponse(updated);
      }

      const { data: created, error: insertError } = await supabase
        .from('primes')
        .insert({
          payroll_week_id: week_id,
          discord_id,
          discord_username,
          amount,
          comment: comment ?? null,
          submitted_by_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        return errorResponse(insertError.message, 500);
      }

      return jsonResponse(created, 201);
    }

    if (req.method === 'PATCH') {
      if (!isAdmin(user)) {
        return errorResponse('Accès refusé', 403);
      }

      const { prime_id, status } = await req.json();

      if (!prime_id || !status) {
        return errorResponse('prime_id et status sont requis', 400);
      }

      if (!['approved', 'rejected'].includes(status)) {
        return errorResponse("status doit être 'approved' ou 'rejected'", 400);
      }

      const { data: prime, error: primeError } = await supabase
        .from('primes')
        .select('*, payroll_weeks(status)')
        .eq('id', prime_id)
        .maybeSingle();

      if (primeError || !prime) {
        return errorResponse('Prime introuvable', 404);
      }

      const weekStatus = (prime.payroll_weeks as { status: string } | null)?.status;
      if (weekStatus === 'locked') {
        return errorResponse('La semaine est verrouillée', 400);
      }

      const { data: updated, error: updateError } = await supabase
        .from('primes')
        .update({
          status,
          reviewed_by_id: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', prime_id)
        .select()
        .single();

      if (updateError) {
        return errorResponse(updateError.message, 500);
      }

      return jsonResponse(updated);
    }

    if (req.method === 'PUT') {
      const { prime_id, amount, comment } = await req.json();

      if (!prime_id || amount == null) {
        return errorResponse('prime_id et amount sont requis', 400);
      }

      if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0 || amount > 1_000_000) {
        return errorResponse('amount doit être un entier entre 1 et 1 000 000', 400);
      }

      const { data: prime, error: primeError } = await supabase
        .from('primes')
        .select('*, payroll_weeks(status)')
        .eq('id', prime_id)
        .maybeSingle();

      if (primeError || !prime) {
        return errorResponse('Prime introuvable', 404);
      }

      if (prime.status !== 'pending') {
        return errorResponse('Seules les primes en attente peuvent être modifiées', 400);
      }

      const weekStatus = (prime.payroll_weeks as { status: string } | null)?.status;
      if (weekStatus === 'locked') {
        return errorResponse('La semaine est verrouillée', 400);
      }

      if (!isAdmin(user) && prime.submitted_by_id !== user.id) {
        return errorResponse('Accès refusé', 403);
      }

      const { data: updated, error: updateError } = await supabase
        .from('primes')
        .update({
          amount,
          comment: comment ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prime_id)
        .select()
        .single();

      if (updateError) {
        return errorResponse(updateError.message, 500);
      }

      return jsonResponse(updated);
    }

    if (req.method === 'DELETE') {
      const { prime_id } = await req.json();

      if (!prime_id) {
        return errorResponse('prime_id est requis', 400);
      }

      const { data: prime, error: primeError } = await supabase
        .from('primes')
        .select('*, payroll_weeks(status)')
        .eq('id', prime_id)
        .maybeSingle();

      if (primeError || !prime) {
        return errorResponse('Prime introuvable', 404);
      }

      const weekStatus = (prime.payroll_weeks as { status: string } | null)?.status;
      if (weekStatus === 'locked') {
        return errorResponse('La semaine est verrouillée', 400);
      }

      if (prime.status !== 'pending') {
        return errorResponse('Seules les primes en attente peuvent être supprimées', 400);
      }

      if (!isAdmin(user) && prime.submitted_by_id !== user.id) {
        return errorResponse('Accès refusé', 403);
      }

      const { error: deleteError } = await supabase
        .from('primes')
        .delete()
        .eq('id', prime_id);

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
