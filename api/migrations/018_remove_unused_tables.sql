-- Remove legacy tables with no active application read/write path.
-- Export any legacy data before applying if it must be retained.
DROP TABLE IF EXISTS public.email_verification_tokens;
DROP TABLE IF EXISTS public.system_settings;
DROP TABLE IF EXISTS public.educational_resources;
DROP TABLE IF EXISTS public.partner_organizations;
