-- Migration 002: Payroll tables

create type payroll_week_status as enum ('open', 'closed', 'locked');

create table payroll_weeks (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  status payroll_week_status not null default 'closed',
  opened_at timestamptz,
  closed_at timestamptz,
  locked_at timestamptz,
  locked_by_id uuid references users(id),
  created_at timestamptz not null default now(),
  unique(week_start)
);

create type submission_status as enum ('draft', 'submitted');

create table payroll_submissions (
  id uuid primary key default gen_random_uuid(),
  payroll_week_id uuid not null references payroll_weeks(id) on delete cascade,
  submitted_by_id uuid not null references users(id),
  pole pole_type not null,
  status submission_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(payroll_week_id, pole)
);

create table payroll_entries (
  id uuid primary key default gen_random_uuid(),
  payroll_week_id uuid not null references payroll_weeks(id) on delete cascade,
  submission_id uuid not null references payroll_submissions(id) on delete cascade,
  staff_id uuid references users(id),
  pole pole_type not null,

  -- Staff info
  discord_username text not null,
  discord_id text not null,
  steam_id text,
  grade text not null,

  -- Pole-specific counters
  tickets_ig integer,
  tickets_discord integer,
  bda_count integer,
  nb_animations integer,
  nb_animations_mj integer,
  nb_candidatures_ecrites integer,
  nb_oraux integer,

  -- Common fields
  commentaire text,
  presence_reunion boolean not null default false,
  montant integer not null default 0,

  -- Coordinator modification tracking
  modified_by_coordinator boolean not null default false,
  coordinator_modified_at timestamptz,

  -- Metadata
  filled_by_id uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(payroll_week_id, discord_id)
);

-- Indexes
create index idx_payroll_entries_week on payroll_entries(payroll_week_id);
create index idx_payroll_entries_pole on payroll_entries(pole);
create index idx_payroll_entries_staff on payroll_entries(staff_id);
create index idx_payroll_submissions_week on payroll_submissions(payroll_week_id);

-- Triggers
create trigger payroll_entries_updated_at before update on payroll_entries
for each row execute function update_updated_at();

create trigger payroll_submissions_updated_at before update on payroll_submissions
for each row execute function update_updated_at();
