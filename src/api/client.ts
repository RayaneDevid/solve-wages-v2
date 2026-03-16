import axios from 'axios';
import { supabase } from '@/lib/supabase';

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`,
  headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
});

let cachedToken: string | null = null;
let tokenExpiry = 0;

apiClient.interceptors.request.use(async (config) => {
  if (!cachedToken || Date.now() > tokenExpiry) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedToken = session.access_token;
      tokenExpiry = (session.expires_at ?? 0) * 1000 - 60000;
    }
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    cachedToken = null;
    tokenExpiry = 0;
  }
});

export default apiClient;
