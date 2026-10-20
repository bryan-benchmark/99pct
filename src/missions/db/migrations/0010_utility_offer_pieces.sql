ALTER TABLE utility_offers ADD COLUMN piece TEXT NOT NULL DEFAULT '';

ALTER TABLE utility_offers ADD CONSTRAINT utility_offers_piece_length CHECK (length(piece) <= 80);
