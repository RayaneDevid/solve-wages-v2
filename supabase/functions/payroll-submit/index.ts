import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getUser } from '../_shared/auth.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { canAccessPole } from '../_shared/roles.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return errorResponse('Méthode non autorisée', 405);
    }

    const user = await getUser(req);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

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

    // Update submission status
    const { data: updated, error: updateError } = await supabase
      .from('payroll_submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', submission.id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(updateError.message, 500);
    }

    return jsonResponse(updated);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return errorResponse(error instanceof Error ? error.message : 'Erreur interne', status);
  }
});
