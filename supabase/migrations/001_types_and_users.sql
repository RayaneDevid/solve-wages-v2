-- Migration 001: Types and users table

create type user_role as enum (
  'coordinateur',
  'gerant_rp', 'gerant_dev', 'gerant_staff', 'gerant_discord', 'gerant_equilibrage', 'gerant_serveur',
  'administrateur',
  'resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane',
  'moderateur_senior', 'moderateur',
  'animateur_senior', 'animateur',
  'mj_senior', 'mj',
  'douanier_senior', 'douanier'
);

create type pole_type as enum (
  'gerance', 'administration', 'moderation', 'animation', 'mj', 'douane'
);

create table users (
  id uuid primary key default gen_random_uuid(),
  supabase_auth_id uuid unique references auth.users(id),
  discord_id text unique not null,
  username text not null,
  avatar_url text,
  role user_role not null default 'moderateur',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_discord_id on users(discord_id);
create index idx_users_role on users(role);

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users
for each row execute function update_updated_at();
