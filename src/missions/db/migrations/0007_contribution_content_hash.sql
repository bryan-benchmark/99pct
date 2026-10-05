ALTER TABLE contributions ADD COLUMN content_hash TEXT;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM contributions WHERE content_hash IS NULL) THEN
    RAISE EXCEPTION 'existing contributions need a content hash before this migration';
  END IF;
END $$;
ALTER TABLE contributions ALTER COLUMN content_hash SET NOT NULL;
ALTER TABLE contributions ADD CONSTRAINT contributions_content_hash_format CHECK (content_hash ~ '^[0-9a-f]{64}$');
