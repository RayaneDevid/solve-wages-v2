-- Remove streamer pole: Référent Streamer are now paid via responsables pole only

-- Delete streamer pole_members that already exist in responsables (avoid duplicate key)
DELETE FROM pole_members
WHERE pole = 'streamer'
  AND discord_id IN (
    SELECT discord_id FROM pole_members WHERE pole = 'responsables'
  );

-- Migrate remaining streamer members to responsables
UPDATE pole_members SET pole = 'responsables' WHERE pole = 'streamer';

-- payroll_entries: delete conflicts then migrate
DELETE FROM payroll_entries
WHERE pole = 'streamer'
  AND (payroll_week_id, discord_id) IN (
    SELECT payroll_week_id, discord_id FROM payroll_entries WHERE pole = 'responsables'
  );
UPDATE payroll_entries SET pole = 'responsables' WHERE pole = 'streamer';

-- payroll_submissions: delete conflicts then migrate
DELETE FROM payroll_submissions
WHERE pole = 'streamer'
  AND (payroll_week_id) IN (
    SELECT payroll_week_id FROM payroll_submissions WHERE pole = 'responsables'
  );
UPDATE payroll_submissions SET pole = 'responsables' WHERE pole = 'streamer';

-- Recreate pole_type without streamer
ALTER TABLE pole_members ALTER COLUMN pole TYPE text;
ALTER TABLE payroll_entries ALTER COLUMN pole TYPE text;
ALTER TABLE payroll_submissions ALTER COLUMN pole TYPE text;

DROP FUNCTION IF EXISTS get_pole_for_role(user_role);
DROP TYPE pole_type;
CREATE TYPE pole_type AS ENUM (
  'gerance',
  'administration',
  'responsables',
  'moderation',
  'animation',
  'mj',
  'douane',
  'builder',
  'lore',
  'equilibrage_pvp',
  'community_manager',
  'support'
);

ALTER TABLE pole_members ALTER COLUMN pole TYPE pole_type USING pole::pole_type;
ALTER TABLE payroll_entries ALTER COLUMN pole TYPE pole_type USING pole::pole_type;
ALTER TABLE payroll_submissions ALTER COLUMN pole TYPE pole_type USING pole::pole_type;

-- Update get_pole_for_role: referent_streamer now maps to responsables
CREATE OR REPLACE FUNCTION get_pole_for_role(r user_role)
RETURNS pole_type AS $$
BEGIN
  RETURN CASE
    WHEN r IN ('coordinateur', 'developpeur') THEN NULL
    WHEN r IN ('gerant_rp', 'gerant_dev', 'gerant_staff', 'gerant_discord', 'gerant_equilibrage', 'gerant_serveur') THEN 'gerance'::pole_type
    WHEN r = 'administrateur' THEN 'administration'::pole_type
    WHEN r IN ('resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane', 'resp_builder', 'resp_lore', 'resp_equilibrage_pvp', 'resp_cm', 'referent_streamer') THEN 'responsables'::pole_type
    WHEN r IN ('moderateur_senior', 'moderateur') THEN 'moderation'::pole_type
    WHEN r IN ('animateur_senior', 'animateur') THEN 'animation'::pole_type
    WHEN r IN ('mj_senior', 'mj') THEN 'mj'::pole_type
    WHEN r IN ('douanier_senior', 'douanier') THEN 'douane'::pole_type
    WHEN r IN ('builder') THEN 'builder'::pole_type
    WHEN r IN ('lore') THEN 'lore'::pole_type
    WHEN r IN ('equilibrage_pvp') THEN 'equilibrage_pvp'::pole_type
    WHEN r IN ('cm') THEN 'community_manager'::pole_type
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
