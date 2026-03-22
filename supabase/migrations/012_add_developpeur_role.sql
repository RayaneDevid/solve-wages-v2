-- Add developpeur role with same permissions as coordinateur
ALTER TYPE user_role ADD VALUE 'developpeur';
-- Add referent_streamer role
ALTER TYPE user_role ADD VALUE 'referent_streamer';

-- Update get_pole_for_role: developpeur gets null (all poles), same as coordinateur
CREATE OR REPLACE FUNCTION get_pole_for_role(r user_role)
RETURNS pole_type AS $$
BEGIN
  RETURN CASE
    WHEN r IN ('coordinateur', 'developpeur') THEN NULL
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
    WHEN r = 'referent_streamer' THEN 'streamer'::pole_type
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
