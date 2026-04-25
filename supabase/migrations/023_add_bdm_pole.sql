-- Add BDM pole and roles
ALTER TYPE pole_type ADD VALUE 'bdm';

ALTER TYPE user_role ADD VALUE 'resp_bdm';
ALTER TYPE user_role ADD VALUE 'bdm';

-- Update get_pole_for_role to include BDM roles
CREATE OR REPLACE FUNCTION get_pole_for_role(r user_role)
RETURNS pole_type AS $$
BEGIN
  RETURN CASE
    WHEN r IN ('gerant_rp', 'gerant_dev', 'gerant_staff', 'gerant_discord', 'gerant_equilibrage', 'gerant_serveur') THEN 'gerance'::pole_type
    WHEN r = 'administrateur' THEN 'administration'::pole_type
    WHEN r IN ('resp_moderation', 'moderateur_senior', 'moderateur') THEN 'moderation'::pole_type
    WHEN r IN ('resp_animation', 'animateur_senior', 'animateur') THEN 'animation'::pole_type
    WHEN r IN ('resp_mj', 'mj_senior', 'mj') THEN 'mj'::pole_type
    WHEN r IN ('resp_douane', 'douanier_senior', 'douanier') THEN 'douane'::pole_type
    WHEN r IN ('resp_builder', 'builder') THEN 'builder'::pole_type
    WHEN r IN ('resp_lore', 'lore') THEN 'lore'::pole_type
    WHEN r IN ('resp_equilibrage_pvp', 'equilibrage_pvp') THEN 'equilibrage_pvp'::pole_type
    WHEN r IN ('resp_cm', 'cm') THEN 'community_manager'::pole_type
    WHEN r IN ('resp_modelisation', 'modelisateur') THEN 'modelisation'::pole_type
    WHEN r IN ('resp_bdm', 'bdm') THEN 'bdm'::pole_type
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update is_pole_responsible to include resp_bdm
CREATE OR REPLACE FUNCTION is_pole_responsible(r user_role)
RETURNS boolean AS $$
BEGIN
  RETURN r IN (
    'resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane',
    'resp_builder', 'resp_lore', 'resp_equilibrage_pvp', 'resp_cm',
    'resp_modelisation', 'resp_bdm'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
