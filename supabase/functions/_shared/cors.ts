// Set ALLOWED_ORIGIN in Supabase project secrets (e.g. https://mypanel.example.com).
// Falls back to '*' if not set (acceptable for JWT-authenticated APIs without cookies).
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') ?? '*';

export const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};
