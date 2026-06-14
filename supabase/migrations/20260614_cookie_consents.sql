-- Cookie consent audit log
-- Sparas vid varje samtycke (nytt val ersätter inte gammalt — append-only för revision)
CREATE TABLE IF NOT EXISTS cookie_consents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text,                          -- null för anonyma
  anon_id        text,                          -- 'anon::<ip_hash_16>' för anonyma
  necessary      boolean NOT NULL DEFAULT true,
  analytics      boolean NOT NULL DEFAULT false,
  marketing      boolean NOT NULL DEFAULT false,
  version        int NOT NULL DEFAULT 1,        -- consent-schema-version
  consented_at   timestamptz NOT NULL,
  user_agent     text,
  created_at     timestamptz DEFAULT now()
);

-- Index för GDPR-ärenden: "visa/radera mina val"
CREATE INDEX IF NOT EXISTS cookie_consents_user_idx ON cookie_consents (clerk_user_id);
CREATE INDEX IF NOT EXISTS cookie_consents_anon_idx  ON cookie_consents (anon_id);

-- RLS: service-role skriver, ingen anon-access
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

-- Inloggade kan läsa sina egna rader (för "Mina inställningar"-sida)
CREATE POLICY "users read own consents"
  ON cookie_consents FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
