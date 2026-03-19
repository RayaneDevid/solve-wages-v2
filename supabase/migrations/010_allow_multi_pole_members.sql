-- Allow a member to be in multiple poles
-- Remove the unique constraint on discord_id alone (keep the composite unique on pole+discord_id)
ALTER TABLE pole_members DROP CONSTRAINT IF EXISTS pole_members_discord_id_key;
