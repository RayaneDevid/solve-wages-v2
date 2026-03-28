-- Add responsables pole type (all pole responsables are paid here)
ALTER TYPE pole_type ADD VALUE 'responsables';

-- Update get_pole_for_role: resp_ roles now belong to responsables pole
CREATE OR REPLACE FUNCTION get_pole_for_role(r user_role)
RETURNS pole_type AS $$
BEGIN
  RETURN CASE
    WHEN r IN ('coordinateur', 'developpeur') THEN NULL
    WHEN r IN ('gerant_rp', 'gerant_dev', 'gerant_staff', 'gerant_discord', 'gerant_equilibrage', 'gerant_serveur') THEN 'gerance'::pole_type
    WHEN r = 'administrateur' THEN 'administration'::pole_type
    WHEN r IN ('resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane', 'resp_builder', 'resp_lore', 'resp_equilibrage_pvp', 'resp_cm') THEN 'responsables'::pole_type
    WHEN r IN ('moderateur_senior', 'moderateur') THEN 'moderation'::pole_type
    WHEN r IN ('animateur_senior', 'animateur') THEN 'animation'::pole_type
    WHEN r IN ('mj_senior', 'mj') THEN 'mj'::pole_type
    WHEN r IN ('douanier_senior', 'douanier') THEN 'douane'::pole_type
    WHEN r IN ('builder') THEN 'builder'::pole_type
    WHEN r IN ('lore') THEN 'lore'::pole_type
    WHEN r IN ('equilibrage_pvp') THEN 'equilibrage_pvp'::pole_type
    WHEN r IN ('cm') THEN 'community_manager'::pole_type
    WHEN r = 'referent_streamer' THEN 'streamer'::pole_type
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
