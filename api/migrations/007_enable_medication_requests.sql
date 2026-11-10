UPDATE platform_services
SET is_enabled = TRUE,
    updated_at = NOW()
WHERE service_key = 'medication_requests';
