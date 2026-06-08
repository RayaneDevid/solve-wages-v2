CREATE INDEX IF NOT EXISTS idx_payroll_entries_week_pole_username
  ON payroll_entries(payroll_week_id, pole, discord_username);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_discord_week
  ON payroll_entries(discord_id, payroll_week_id);

CREATE INDEX IF NOT EXISTS idx_payroll_weeks_status_start
  ON payroll_weeks(status, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_primes_week_created
  ON primes(payroll_week_id, created_at DESC);
