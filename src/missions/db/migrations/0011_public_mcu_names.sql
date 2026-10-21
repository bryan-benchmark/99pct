ALTER TABLE human_accounts ADD COLUMN public_name TEXT NOT NULL DEFAULT '';
ALTER TABLE human_accounts ADD COLUMN public_slug TEXT NOT NULL DEFAULT '';
ALTER TABLE human_accounts ADD CONSTRAINT human_accounts_public_name_length CHECK (length(public_name) <= 40);
ALTER TABLE human_accounts ADD CONSTRAINT human_accounts_public_slug_shape CHECK (public_slug = '' OR public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE UNIQUE INDEX human_accounts_public_slug_unique ON human_accounts (public_slug) WHERE public_slug <> '';

ALTER TABLE contributions ADD COLUMN public_name TEXT NOT NULL DEFAULT '';
ALTER TABLE contributions ADD COLUMN public_slug TEXT NOT NULL DEFAULT '';
ALTER TABLE contributions ADD CONSTRAINT contributions_public_name_length CHECK (length(public_name) <= 40);
ALTER TABLE contributions ADD CONSTRAINT contributions_public_slug_shape CHECK (public_slug = '' OR public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
