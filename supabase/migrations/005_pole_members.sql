-- pole_members: persistent roster of staff per pole, independent of payroll weeks
create table pole_members (
  id uuid primary key default gen_random_uuid(),
  pole pole_type not null,
  discord_username text not null,
  discord_id text unique not null,
  steam_id text,
  grade text not null,
  staff_id uuid references users(id),
  added_by_id uuid not null references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A member can only belong to one pole
alter table pole_members add constraint uq_pole_members_pole_discord unique (pole, discord_id);

create index idx_pole_members_pole on pole_members(pole);
create index idx_pole_members_discord_id on pole_members(discord_id);
create index idx_pole_members_active on pole_members(pole, is_active);

create trigger pole_members_updated_at before update on pole_members
for each row execute function update_updated_at();
