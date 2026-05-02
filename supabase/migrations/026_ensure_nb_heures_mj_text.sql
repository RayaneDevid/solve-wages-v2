DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payroll_entries'
      AND column_name = 'nb_heures_mj'
  ) THEN
    ALTER TABLE payroll_entries
      ALTER COLUMN nb_heures_mj DROP DEFAULT,
      ALTER COLUMN nb_heures_mj TYPE text USING nb_heures_mj::text,
      ALTER COLUMN nb_heures_mj SET DEFAULT NULL;
  ELSE
    ALTER TABLE payroll_entries
      ADD COLUMN nb_heures_mj text DEFAULT NULL;
  END IF;
END $$;
