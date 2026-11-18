-- Remove the discontinued medication request feature and its database records.

DROP TABLE IF EXISTS medication_requests CASCADE;
DROP TABLE IF EXISTS medications CASCADE;

ALTER TABLE patients
  DROP COLUMN IF EXISTS has_doctors_prescription,
  DROP COLUMN IF EXISTS medication_request_eligible;

DELETE FROM platform_services
WHERE service_key = 'medication_requests';
