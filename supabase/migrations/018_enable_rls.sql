-- Migration 018: Enable RLS on all tables
--
-- All data access goes through Edge Functions using the service_role key,
-- which bypasses RLS entirely. Enabling RLS with no permissive policies
-- simply blocks any direct client access while leaving Edge Functions untouched.

alter table users enable row level security;
alter table payroll_weeks enable row level security;
alter table payroll_submissions enable row level security;
alter table payroll_entries enable row level security;
alter table pole_members enable row level security;
alter table primes enable row level security;
alter table payroll_locks enable row level security;
