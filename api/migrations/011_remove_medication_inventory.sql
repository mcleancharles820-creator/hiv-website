-- Remove inventory tracking from medication catalogs and request records.
BEGIN;

ALTER TABLE medications
  DROP COLUMN IF EXISTS stock_status,
  DROP COLUMN IF EXISTS stock_quantity;

ALTER TABLE medication_requests
  DROP COLUMN IF EXISTS availability;

COMMIT;
