-- 004: Add 'both' role option and travel_frequency to users

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'both';

ALTER TABLE users ADD COLUMN IF NOT EXISTS travel_frequency text;
