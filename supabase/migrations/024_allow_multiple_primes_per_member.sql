ALTER TABLE primes
  DROP CONSTRAINT IF EXISTS primes_payroll_week_id_discord_id_key;

CREATE INDEX IF NOT EXISTS primes_payroll_week_discord_idx
  ON primes(payroll_week_id, discord_id);
