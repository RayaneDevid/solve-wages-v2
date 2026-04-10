ALTER TABLE pole_members
  ADD COLUMN is_probatoire boolean NOT NULL DEFAULT false,
  ADD COLUMN probatoire_since date DEFAULT NULL;
