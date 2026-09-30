# HIVeLink App - Database Documentation

This document explains the database structure, entity models, variables, data types, and relationships built for the **HIVeLink** web application.

## Quick Files Overview

- **T-SQL / SQL Server Database Project:**
  - Master Schema: `../Hiv_database/schema.sql`
  - Seed Data: `../Hiv_database/seed.sql`
  - Modular Tables: `../Hiv_database/Tables/*.sql`
  - Reporting Views: `../Hiv_database/Views/*.sql`
  - Architecture & ERD: `../Hiv_database/DATABASE_DESIGN.md`
- **Cross-Platform Schemas:**
  - PostgreSQL / Supabase: `../Hiv_database/postgres_supabase_schema.sql`
  - MySQL / MariaDB: `../Hiv_database/mysql_schema.sql`
  - SQLite: `../Hiv_database/sqlite_schema.sql`
- **React Client Data Layer:**
  - Entity Models & Types: `src/types/database.js`
  - Relational Service & Mock DB: `src/services/databaseService.js`

---

## 1. Summary of Database Tables & Variables

| Table Name | Description | Key Variables & Data Types | Relationships |
|---|---|---|---|
| **Users** | Core logins & roles | `user_id` (PK, int), `email` (string, unique), `password_hash` (string), `full_name` (string), `role` (enum: patient/health-worker/admin), `age` (int), `gender` (string), `contact_number` (string) | 1:1 with `Patients` & `HealthWorkers`, 1:N with `ChatMessages` & `ActivityLogs` |
| **TestingFacilities** | Clinics & treatment hubs | `facility_id` (PK, int), `name` (string), `facility_type` (string), `address` (string), `latitude` (decimal), `longitude` (decimal), `contact_phone` (string), `services_offered` (string) | 1:N with `HealthWorkers`, `Patients` (preferred clinic), `Appointments` |
| **HealthWorkers** | Doctor/Nurse profiles | `worker_id` (PK, int), `user_id` (FK, int), `specialty` (string), `license_number` (string), `primary_facility_id` (FK, int), `is_available` (bool) | Belongs to `Users` (1:1), 1:N with `Patients`, `Appointments`, `ChatSessions`, `SupportGroups` |
| **Patients** | Patient care records | `patient_id` (PK, int), `user_id` (FK, int), `assigned_worker_id` (FK, int), `preferred_facility_id` (FK, int), `care_status` (enum), `medical_notes` (text) | Belongs to `Users` (1:1), 1:N with `Appointments`, `MedicationRequests`, `ChatSessions`, M:N with `SupportGroups` |
| **Medications** | Drug inventory catalog | `medication_id` (PK, int), `medication_code` (string), `name` (string), `category` (string), `detail` (string), `stock_status` (enum: In stock/Out of stock), `stock_quantity` (int) | 1:N with `MedicationRequests` |
| **MedicationRequests** | Patient refill requests | `request_id` (PK, int), `patient_id` (FK, int), `medication_id` (FK, int), `medication_name` (string), `dosage` (string), `schedule` (string), `status` (enum: Pending/Approved/etc.), `reviewed_by_worker_id` (FK, int) | Belongs to `Patients`, `Medications`, `HealthWorkers` |
| **Appointments** | Consultation bookings | `appointment_id` (PK, int), `patient_id` (FK, int), `worker_id` (FK, int), `facility_id` (FK, int), `appointment_date` (date), `appointment_time` (string), `appointment_type` (string), `status` (enum) | Belongs to `Patients`, `HealthWorkers`, `TestingFacilities` |
| **ChatSessions** | Support tickets | `chat_session_id` (PK, int), `patient_id` (FK, int), `worker_id` (FK, int), `subject` (string), `status` (enum: Open/Closed), `preview` (string), `last_updated` (datetime) | Belongs to `Patients`, `HealthWorkers`, 1:N with `ChatMessages` |
| **ChatMessages** | Confidential messages | `message_id` (PK, int), `chat_session_id` (FK, int), `sender_user_id` (FK, int), `sender_role` (enum), `message_text` (text), `is_read` (bool), `sent_at` (datetime) | Belongs to `ChatSessions`, `Users` |
| **SupportGroups** | Peer circles | `group_id` (PK, int), `name` (string), `detail` (string), `schedule` (string), `target_audience` (string), `facilitator_worker_id` (FK, int), `member_count` (int) | 1:N with `SupportGroupMembers`, Facilitated by `HealthWorkers` |
| **SupportGroupMembers**| Join table (M:N) | `membership_id` (PK, int), `group_id` (FK, int), `patient_id` (FK, int), `role_in_group` (enum), `joined_at` (datetime) | Many-to-Many between `Patients` and `SupportGroups` |
| **PublicInquiries** | Guest contact forms | `inquiry_id` (PK, int), `first_name` (string), `email` (string), `message` (text), `status` (enum), `assigned_worker_id` (FK, int) | Optional FK to `HealthWorkers` |
| **PlatformServices**| Feature switches | `service_id` (PK, int), `service_key` (string, unique), `name` (string), `detail` (string), `is_enabled` (bool), `display_order` (int) | Independent entity |
| **SystemSettings** | Platform config | `setting_key` (PK, string), `setting_value` (text), `data_type` (enum), `description` (text) | Independent entity |
| **ActivityLogs** | Security audit trail | `log_id` (PK, int), `actor_user_id` (FK, int), `actor_name` (string), `action` (string), `category` (string), `created_at` (datetime) | FK to `Users` |
| **EducationalResources**| Knowledge base | `resource_id` (PK, int), `resource_number` (string), `category` (string), `title` (string), `summary` (text), `action_label` (string) | Independent entity |
| **PartnerOrganizations**| NGO directories | `org_id` (PK, int), `name` (string), `description` (text), `website_url` (string), `category` (string) | Independent entity |

---

## 2. Using the Database in React Components

Import the database service:

```javascript
import db from './services/databaseService';

// 1. Get complete patient record with relations:
const patientData = db.getPatientCompleteProfile(1);
console.log(patientData.user.full_name);         // 'Alex Rivera'
console.log(patientData.assignedWorker.user.full_name); // 'Mara Santos'
console.log(patientData.appointments);           // Array of patient's appointments
console.log(patientData.supportGroups);          // Joined support groups

// 2. Insert new appointment:
const newAppointment = db.insert('Appointments', {
  patient_id: 1,
  worker_id: 1,
  facility_id: 1,
  appointment_date: '2026-09-15',
  appointment_time: '11:00 AM',
  appointment_type: 'HIV care consultation',
  status: 'Requested'
});

// 3. Update medication request status:
db.update('MedicationRequests', 1, { status: 'Approved', reviewed_by_worker_id: 1 });
```
