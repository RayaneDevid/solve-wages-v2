-- Allow the same member to have entries in multiple poles for the same week
-- Change unique constraint from (payroll_week_id, discord_id) to (payroll_week_id, discord_id, pole)
ALTER TABLE payroll_entries DROP CONSTRAINT IF EXISTS payroll_entries_payroll_week_id_discord_id_key;
ALTER TABLE payroll_entries ADD CONSTRAINT payroll_entries_week_discord_pole_key UNIQUE (payroll_week_id, discord_id, pole);
