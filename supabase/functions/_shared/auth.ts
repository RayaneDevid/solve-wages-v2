import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AppUser {
  id: string;
  supabase_auth_id: string | null;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function getUser(req: Request): Promise<AppUser> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpError('JWT manquant', 401);
  }

  const jwt = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verify JWT and get auth user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authUser) {
    throw new HttpError('JWT invalide', 401);
  }

  // Find app user by supabase_auth_id
  const { data: appUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_auth_id', authUser.id)
    .single();

  if (userError || !appUser) {
    throw new HttpError('Utilisateur non trouvé', 403);
  }

  if (!appUser.is_active) {
    throw new HttpError('Votre accès a été désactivé', 403);
  }

  return appUser as AppUser;
}
