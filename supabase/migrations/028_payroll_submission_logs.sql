-- Store readable payroll submission history per week and per pole.
-- Logs are created only when "Soumettre les paies" is pressed.

CREATE TABLE payroll_submission_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_week_id uuid NOT NULL REFERENCES payroll_weeks(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES payroll_submissions(id) ON DELETE CASCADE,
  pole pole_type NOT NULL,
  submitted_by_id uuid NOT NULL REFERENCES users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  total_montant integer NOT NULL DEFAULT 0,
  entry_count integer NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL,
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payroll_submission_logs_week_pole_submitted
  ON payroll_submission_logs(payroll_week_id, pole, submitted_at DESC);

CREATE INDEX idx_payroll_submission_logs_submission
  ON payroll_submission_logs(submission_id);

ALTER TABLE payroll_submission_logs ENABLE ROW LEVEL SECURITY;
