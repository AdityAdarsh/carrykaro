-- Route alerts had no repeat-notification throttle: a user on a busy route was
-- re-emailed on every matching listing, forever. Add a timestamp to gate sends.

ALTER TABLE route_alerts ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;
