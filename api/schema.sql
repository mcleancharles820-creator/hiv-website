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
    supabase_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    password_changed_at TIMESTAMPTZ,
    uic VARCHAR(32) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'health-worker', 'admin')),
    contact_number VARCHAR(30),
    date_of_birth DATE,
    birth_order INT NOT NULL DEFAULT 1 CHECK (birth_order BETWEEN 1 AND 50),
    age INT CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
    gender VARCHAR(50) CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Lesbian, Gay, Bisexual, and Transgender', 'LGBT', 'Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Self-describe', 'Self-described')),
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    uic_email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_uic_role_check CHECK (
        (role = 'patient' AND uic IS NOT NULL)
        OR (role IN ('health-worker', 'admin') AND uic IS NULL)
    )
);

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
-- 5. Appointments
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

-- 6. Chat Sessions
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

-- 7. Chat Messages
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    chat_session_id INT NOT NULL REFERENCES chat_sessions(chat_session_id) ON DELETE CASCADE,
    sender_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('patient', 'worker', 'admin', 'system')),
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Support Groups
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

-- 9. Support Group Members
CREATE TABLE support_group_members (
    membership_id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES support_groups(group_id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    role_in_group VARCHAR(50) NOT NULL DEFAULT 'Member' CHECK (role_in_group IN ('Member', 'Peer Leader', 'Moderator')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, patient_id)
);
-- 10. Public Inquiries
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

-- 11. Platform Services
CREATE TABLE platform_services (
    service_id SERIAL PRIMARY KEY,
    service_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    detail VARCHAR(300) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Activity Logs
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

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_worker ON patients(assigned_worker_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id, appointment_date);
CREATE INDEX idx_chat_messages_session ON chat_messages(chat_session_id, sent_at);

-- Initial Seed Data (Infrastructure & Public Catalogs)
INSERT INTO testing_facilities (facility_id, name, facility_type, address, city, province, country, latitude, longitude, contact_phone, services_offered, operating_hours, maps_url)
VALUES
(1, 'Rural Health Unit Odiongan', 'Rural Health Unit', '9XXJ+WXX, JP Laurel St, Odiongan, Romblon', 'Odiongan', 'Romblon', 'Philippines', 12.399906, 121.982498, '+63 917 123 4567', 'Confidential HIV Testing, PrEP counseling, Primary Healthcare', 'Mon-Fri 8:00 AM - 5:00 PM', 'https://www.google.com/maps/search/?api=1&query=12.399906%2C121.982498'),
(2, 'Romblon Provincial Hospital', 'Provincial Hospital', 'Liwanag, Odiongan', 'Odiongan', 'Romblon', 'Philippines', 12.405500, 121.986200, '+63 920 987 6543', 'HIV Treatment Hub, ART Dispensing, Confirmatory Testing', '24/7 Care', 'https://www.google.com/maps/search/Romblon+Provincial+Hospital+Odiongan');

INSERT INTO support_groups (group_id, name, detail, schedule, target_audience, facilitator_worker_id, member_count)
VALUES
(1, 'Living Positive', 'A private, peer-support space for conversation.', 'Live moderated group chat', 'Patients', NULL, 0);

INSERT INTO platform_services (service_id, service_key, name, detail, is_enabled, display_order)
VALUES
(1, 'testing_referrals', 'HIV testing referrals', 'Local testing and facility guidance', TRUE, 1),
(2, 'treatment_referrals', 'Treatment referrals', 'Connect patients to treatment hubs', TRUE, 2),
(3, 'chat_support', 'Private chat support', 'Patient to health worker messaging', TRUE, 3);

SELECT setval('testing_facilities_facility_id_seq', (SELECT MAX(facility_id) FROM testing_facilities));
SELECT setval('support_groups_group_id_seq', (SELECT MAX(group_id) FROM support_groups));
SELECT setval('platform_services_service_id_seq', (SELECT MAX(service_id) FROM platform_services));
