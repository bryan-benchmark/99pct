-- Existing reviews remain identifiable as legacy records with no gate assessment.
-- Do not backfill a fabricated clearance for an immutable historical review.
ALTER TABLE decision_reviews ADD COLUMN gates JSONB;
