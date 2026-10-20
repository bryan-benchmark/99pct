CREATE TABLE utility_offers (
  id UUID PRIMARY KEY,
  utility_slug TEXT NOT NULL,
  human_uid TEXT NOT NULL REFERENCES human_accounts(firebase_uid),
  kind TEXT NOT NULL CHECK (kind IN ('write', 'place', 'people', 'code')),
  note TEXT NOT NULL DEFAULT '',
  email_share_consented BOOLEAN NOT NULL CHECK (email_share_consented),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (utility_slug, human_uid),
  CHECK (utility_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CHECK (length(utility_slug) BETWEEN 1 AND 60),
  CHECK (length(note) <= 240)
);

CREATE INDEX utility_offers_slug_idx ON utility_offers (utility_slug);
