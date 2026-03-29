-- Payroll locks: prevent concurrent editing of the same pole by different users
CREATE TABLE payroll_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_week_id uuid NOT NULL REFERENCES payroll_weeks(id) ON DELETE CASCADE,
  pole text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_week_id, pole)
);
