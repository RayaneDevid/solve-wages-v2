-- Add P / M / G sub-fields for MJ animations breakdown
ALTER TABLE payroll_entries
  ADD COLUMN nb_animations_mj_p integer DEFAULT NULL,
  ADD COLUMN nb_animations_mj_m integer DEFAULT NULL,
  ADD COLUMN nb_animations_mj_g integer DEFAULT NULL;
