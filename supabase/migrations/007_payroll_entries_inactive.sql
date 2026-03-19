-- Add is_inactive flag to payroll_entries
ALTER TABLE payroll_entries
  ADD COLUMN is_inactive boolean NOT NULL DEFAULT false;
