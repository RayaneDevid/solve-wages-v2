-- Add coordinator confirmation tracking to payroll_entries
ALTER TABLE payroll_entries
  ADD COLUMN confirmed_by_coordinator boolean NOT NULL DEFAULT false,
  ADD COLUMN confirmed_at timestamptz;
