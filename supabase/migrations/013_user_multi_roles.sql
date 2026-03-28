-- Add roles array column to users table
ALTER TABLE users ADD COLUMN roles user_role[] NOT NULL DEFAULT '{}';

-- Populate from existing role (every user gets their current role in the array)
UPDATE users SET roles = ARRAY[role];
