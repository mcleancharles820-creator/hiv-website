-- ============================================================================
-- HIVeLink Platform - PostgreSQL & Supabase Database Schema
-- Compatible with PostgreSQL 13+, Supabase, Prisma, and Drizzle ORM
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types / Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'health-worker', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- 1. Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'health-worker', 'admin')),
    contact_number VARCHAR(30),
    date_of_birth DATE,
    age INT CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
    gender VARCHAR(50) CHECK (gender IS NULL OR gender IN ('Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Self-describe')),
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verification_tokens (
    token_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_verification_tokens_user ON email_verification_tokens(user_id, expires_at);

-- 2. Testing Facilities
CREATE TABLE testing_facilities (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50) NOT NULL DEFAULT 'Rural Health Unit',
    address VARCHAR(300) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Odiongan',
    province VARCHAR(100) NOT NULL DEFAULT 'Romblon',
    country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    contact_phone VARCHAR(50),
    services_offered TEXT NOT NULL,
    operating_hours VARCHAR(150),
    maps_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Health Workers
CREATE TABLE health_workers (
    worker_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    specialty VARCHAR(150) NOT NULL,
    license_number VARCHAR(100),
    primary_facility_id INT REFERENCES testing_facilities(facility_id) ON DELETE SET NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    bio_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Patients
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_worker_id INT REFERENCES health_workers(worker_id) ON DELETE SET NULL,
    preferred_facility_id INT REFERENCES testing_facilities(facility_id) ON DELETE SET NULL,
    care_status VARCHAR(50) NOT NULL DEFAULT 'Active care plan' CHECK (care_status IN ('Active care plan', 'New referral', 'Stable', 'Needs follow-up', 'Inactive')),
    medical_notes TEXT,
    emergency_contact VARCHAR(150),
    emergency_phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 5. Medications
CREATE TABLE medications (
    medication_id SERIAL PRIMARY KEY,
    medication_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    detail TEXT NOT NULL,
    default_dosage VARCHAR(100),
    stock_status VARCHAR(30) NOT NULL DEFAULT 'In stock' CHECK (stock_status IN ('In stock', 'Out of stock', 'Low stock')),
    stock_quantity INT NOT NULL DEFAULT 100,
    prescription_needed BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Medication Requests
CREATE TABLE medication_requests (
    request_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    medication_id INT REFERENCES medications(medication_id) ON DELETE SET NULL,
    medication_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL DEFAULT 'As prescribed',
    schedule VARCHAR(150) NOT NULL DEFAULT 'Ask your health worker',
    availability VARCHAR(50) NOT NULL DEFAULT 'In stock',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Ready for review', 'Approved', 'Needs information', 'Dispensed', 'Cancelled')),
    reviewed_by_worker_id INT REFERENCES health_workers(worker_id) ON DELETE SET NULL,
    review_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Appointments
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    worker_id INT REFERENCES health_workers(worker_id) ON DELETE SET NULL,
    facility_id INT REFERENCES testing_facilities(facility_id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    appointment_type VARCHAR(100) NOT NULL DEFAULT 'HIV care consultation',
    status VARCHAR(50) NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Chat Sessions
CREATE TABLE chat_sessions (
    chat_session_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    worker_id INT REFERENCES health_workers(worker_id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL DEFAULT 'Welcome to private support',
    status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Pending', 'Closed', 'Resolved')),
    preview TEXT,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Chat Messages
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    chat_session_id INT NOT NULL REFERENCES chat_sessions(chat_session_id) ON DELETE CASCADE,
    sender_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('patient', 'worker', 'admin', 'system')),
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Support Groups
CREATE TABLE support_groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    detail TEXT NOT NULL,
    schedule VARCHAR(150) NOT NULL,
    target_audience VARCHAR(150),
    facilitator_worker_id INT REFERENCES health_workers(worker_id) ON DELETE SET NULL,
    member_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Support Group Members
CREATE TABLE support_group_members (
    membership_id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES support_groups(group_id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    role_in_group VARCHAR(50) NOT NULL DEFAULT 'Member' CHECK (role_in_group IN ('Member', 'Peer Leader', 'Moderator')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, patient_id)
);
-- 12. Public Inquiries
CREATE TABLE public_inquiries (
    inquiry_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Responded', 'Closed')),
    assigned_worker_id INT REFERENCES health_workers(worker_id) ON DELETE SET NULL,
    response_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- 13. Platform Services
CREATE TABLE platform_services (
    service_id SERIAL PRIMARY KEY,
    service_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    detail VARCHAR(300) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. System Settings
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(30) NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'boolean', 'number', 'json')),
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Activity Logs
CREATE TABLE activity_logs (
    log_id SERIAL PRIMARY KEY,
    actor_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    actor_name VARCHAR(150) NOT NULL,
    action VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    ip_address VARCHAR(50),
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Educational Resources
CREATE TABLE educational_resources (
    resource_id SERIAL PRIMARY KEY,
    resource_number VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Knowledge 101',
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    action_label VARCHAR(100),
    display_order INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Partner Organizations
CREATE TABLE partner_organizations (
    org_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Referral',
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_worker ON patients(assigned_worker_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id, appointment_date);
CREATE INDEX idx_chat_messages_session ON chat_messages(chat_session_id, sent_at);

-- Initial Seed Data (Infrastructure & Public Catalogs)
INSERT INTO testing_facilities (facility_id, name, facility_type, address, city, province, country, latitude, longitude, contact_phone, services_offered, operating_hours, maps_url)
VALUES
(1, 'Rural Health Unit Odiongan', 'Rural Health Unit', 'Barangay Dap-dap, Odiongan', 'Odiongan', 'Romblon', 'Philippines', 12.401000, 121.990000, '+63 917 123 4567', 'Confidential HIV Testing, PrEP counseling, Primary Healthcare', 'Mon-Fri 8:00 AM - 5:00 PM', 'https://www.google.com/maps/search/Rural+Health+Unit+Odiongan+Romblon'),
(2, 'Romblon Provincial Hospital', 'Provincial Hospital', 'Liwanag, Odiongan', 'Odiongan', 'Romblon', 'Philippines', 12.405500, 121.986200, '+63 920 987 6543', 'HIV Treatment Hub, ART Dispensing, Confirmatory Testing', '24/7 Care', 'https://www.google.com/maps/search/Romblon+Provincial+Hospital+Odiongan');

INSERT INTO medications (medication_id, medication_code, name, category, detail, default_dosage, stock_status)
VALUES
(1, 'art', 'Antiretroviral therapy (ART)', 'HIV Treatment', 'HIV treatment · Take only as prescribed', '1 tablet daily', 'In stock'),
(2, 'prep', 'Pre-Exposure Prophylaxis (PrEP)', 'HIV Prevention', 'HIV prevention medication · Ask a health worker', '1 tablet daily', 'In stock'),
(3, 'pep', 'Post-Exposure Prophylaxis (PEP)', 'Emergency Prevention', 'Post-exposure medication · Urgent care required', '28-day course', 'Out of stock'),
(4, 'opportunistic', 'Preventive Care Medication (OI Prophylaxis)', 'Preventive Care', 'For infection prevention · Prescription required', 'As directed', 'Out of stock');

INSERT INTO support_groups (group_id, name, detail, schedule, target_audience, facilitator_worker_id, member_count)
VALUES
(1, 'Living Positive', 'Peer connection · Weekly online circle', 'Weekly online circle', 'Open to all living with HIV', NULL, 0),
(2, 'Island Care Circle', 'Local support · Romblon community', 'Every Saturday', 'Romblon community', NULL, 0),
(3, 'Young Advocates', 'Peer support · Safe digital community', 'Bi-weekly Sundays', 'Ages 18–29', NULL, 0);

INSERT INTO platform_services (service_id, service_key, name, detail, is_enabled, display_order)
VALUES
(1, 'testing_referrals', 'HIV testing referrals', 'Local testing and facility guidance', TRUE, 1),
(2, 'treatment_referrals', 'Treatment referrals', 'Connect patients to treatment hubs', TRUE, 2),
(3, 'chat_support', 'Private chat support', 'Patient to health worker messaging', TRUE, 3),
(4, 'medication_requests', 'Medication requests', 'Treatment availability requests', FALSE, 4);

INSERT INTO system_settings (setting_key, setting_value, data_type, description)
VALUES
('platform_name', 'HIVeLink', 'string', 'Platform brand name'),
('support_email', 'support@risinghiv.org', 'string', 'Public and escalation contact email');

INSERT INTO educational_resources (resource_id, resource_number, category, title, summary, action_label, display_order)
VALUES
(1, '01', 'Guest Essentials', 'Know your status', 'Testing is the only way to know. Most results are ready quickly, and confidential options are available.', 'Find a test', 1),
(2, '02', 'Guest Essentials', 'Treatment works', 'With the right treatment, people living with HIV can live long, healthy lives.', 'Understand U=U', 2),
(3, '03', 'Guest Essentials', 'Prevention is personal', 'Condoms, PrEP, PEP, and regular testing can all help.', 'Explore prevention', 3);

INSERT INTO partner_organizations (org_id, name, description, website_url, category, display_order)
VALUES
(1, 'Philippine HIV & AIDS Support House', 'Community support and referrals', 'https://www.pamf.org.ph/', 'Community Support', 1),
(2, 'AIDS Data Hub', 'HIV information and regional resources', 'https://www.aidsdatahub.org/', 'Data & Research', 2),
(3, 'The Global Fund', 'Donate to end AIDS, TB, and malaria', 'https://www.globalfund.org/en/donate/', 'Global Donations', 3);

SELECT setval('testing_facilities_facility_id_seq', (SELECT MAX(facility_id) FROM testing_facilities));
SELECT setval('medications_medication_id_seq', (SELECT MAX(medication_id) FROM medications));
SELECT setval('support_groups_group_id_seq', (SELECT MAX(group_id) FROM support_groups));
SELECT setval('platform_services_service_id_seq', (SELECT MAX(service_id) FROM platform_services));
SELECT setval('educational_resources_resource_id_seq', (SELECT MAX(resource_id) FROM educational_resources));
SELECT setval('partner_organizations_org_id_seq', (SELECT MAX(org_id) FROM partner_organizations));
