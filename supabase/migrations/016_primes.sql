CREATE TABLE primes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_week_id uuid NOT NULL REFERENCES payroll_weeks(id) ON DELETE CASCADE,
  discord_id text NOT NULL,
  discord_username text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  comment text,
  submitted_by_id uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by_id uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_week_id, discord_id)
);
