-- Route Alerts — demand capture for routes with no listings

CREATE TABLE IF NOT EXISTS route_alerts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_city   TEXT NOT NULL,
  to_city     TEXT NOT NULL,
  looking_for TEXT NOT NULL CHECK (looking_for IN ('request', 'trip')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE route_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own route alerts"
  ON route_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own route alerts"
  ON route_alerts FOR SELECT
  USING (auth.uid() = user_id);
