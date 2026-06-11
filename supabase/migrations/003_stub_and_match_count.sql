-- Add is_stub flag to hide auto-created listings from Browse
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_stub boolean DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_stub boolean DEFAULT false;
