/**
 * HIVeLink Platform - Database Entity Models & Types
 * Defines the variable structures, data types, constraints, and relationships
 * for the React application data layer.
 */

/**
 * @typedef {'patient' | 'health-worker' | 'admin'} UserRole
 * @typedef {'Woman' | 'Man' | 'Non-binary' | 'Prefer not to say' | 'Self-describe'} GenderType
 * @typedef {'Active care plan' | 'New referral' | 'Stable' | 'Needs follow-up' | 'Inactive'} CareStatus
 * @typedef {'Requested' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled'} AppointmentStatus
 * @typedef {'Pending' | 'Ready for review' | 'Approved' | 'Needs information' | 'Dispensed' | 'Cancelled'} MedicationRequestStatus
 * @typedef {'In stock' | 'Out of stock' | 'Low stock'} StockStatus
 * @typedef {'Open' | 'Pending' | 'Closed' | 'Resolved'} ChatStatus
 * @typedef {'patient' | 'worker' | 'admin' | 'system'} MessageSenderRole
 */

/**
 * 1. User Entity Model
 */
export const UserModel = {
  tableName: 'Users',
  primaryKey: 'user_id',
  fields: {
    user_id: { type: 'number', isPrimary: true, autoIncrement: true },
    email: { type: 'string', required: true, unique: true },
    password_hash: { type: 'string', required: true },
    full_name: { type: 'string', required: true, maxLength: 150 },
    role: { type: 'enum', options: ['patient', 'health-worker', 'admin'], required: true },
    contact_number: { type: 'string', required: false, maxLength: 30 },
    date_of_birth: { type: 'date', required: false },
    age: { type: 'number', required: false, min: 13, max: 120 },
    gender: { type: 'enum', options: ['Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Self-describe'], required: false },
    terms_accepted: { type: 'boolean', default: true },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    patientProfile: { type: 'hasOne', model: 'Patients', foreignKey: 'user_id' },
    healthWorkerProfile: { type: 'hasOne', model: 'HealthWorkers', foreignKey: 'user_id' },
    sentMessages: { type: 'hasMany', model: 'ChatMessages', foreignKey: 'sender_user_id' },
    activityLogs: { type: 'hasMany', model: 'ActivityLogs', foreignKey: 'actor_user_id' },
  },
};

/**
 * 2. Patient Entity Model
 */
export const PatientModel = {
  tableName: 'Patients',
  primaryKey: 'patient_id',
  fields: {
    patient_id: { type: 'number', isPrimary: true, autoIncrement: true },
    user_id: { type: 'number', required: true, unique: true, references: 'Users.user_id' },
    assigned_worker_id: { type: 'number', required: false, references: 'HealthWorkers.worker_id' },
    preferred_facility_id: { type: 'number', required: false, references: 'TestingFacilities.facility_id' },
    care_status: { type: 'enum', options: ['Active care plan', 'New referral', 'Stable', 'Needs follow-up', 'Inactive'], default: 'Active care plan' },
    medical_notes: { type: 'string', required: false },
    emergency_contact: { type: 'string', required: false },
    emergency_phone: { type: 'string', required: false },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    user: { type: 'belongsTo', model: 'Users', foreignKey: 'user_id' },
    assignedWorker: { type: 'belongsTo', model: 'HealthWorkers', foreignKey: 'assigned_worker_id' },
    preferredFacility: { type: 'belongsTo', model: 'TestingFacilities', foreignKey: 'preferred_facility_id' },
    appointments: { type: 'hasMany', model: 'Appointments', foreignKey: 'patient_id' },
    medicationRequests: { type: 'hasMany', model: 'MedicationRequests', foreignKey: 'patient_id' },
    chatSessions: { type: 'hasMany', model: 'ChatSessions', foreignKey: 'patient_id' },
    supportGroups: { type: 'belongsToMany', model: 'SupportGroups', through: 'SupportGroupMembers', foreignKey: 'patient_id', otherKey: 'group_id' },
  },
};
/**
 * 3. Health Worker Entity Model
 */
export const HealthWorkerModel = {
  tableName: 'HealthWorkers',
  primaryKey: 'worker_id',
  fields: {
    worker_id: { type: 'number', isPrimary: true, autoIncrement: true },
    user_id: { type: 'number', required: true, unique: true, references: 'Users.user_id' },
    specialty: { type: 'string', required: true, maxLength: 150 },
    license_number: { type: 'string', required: false, maxLength: 100 },
    primary_facility_id: { type: 'number', required: false, references: 'TestingFacilities.facility_id' },
    is_verified: { type: 'boolean', default: true },
    is_available: { type: 'boolean', default: true },
    bio_summary: { type: 'string', required: false },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    user: { type: 'belongsTo', model: 'Users', foreignKey: 'user_id' },
    primaryFacility: { type: 'belongsTo', model: 'TestingFacilities', foreignKey: 'primary_facility_id' },
    assignedPatients: { type: 'hasMany', model: 'Patients', foreignKey: 'assigned_worker_id' },
    appointments: { type: 'hasMany', model: 'Appointments', foreignKey: 'worker_id' },
    assignedChats: { type: 'hasMany', model: 'ChatSessions', foreignKey: 'worker_id' },
    reviewedMedications: { type: 'hasMany', model: 'MedicationRequests', foreignKey: 'reviewed_by_worker_id' },
    facilitatedGroups: { type: 'hasMany', model: 'SupportGroups', foreignKey: 'facilitator_worker_id' },
  },
};

/**
 * 4. Testing Facility Entity Model
 */
export const TestingFacilityModel = {
  tableName: 'TestingFacilities',
  primaryKey: 'facility_id',
  fields: {
    facility_id: { type: 'number', isPrimary: true, autoIncrement: true },
    name: { type: 'string', required: true, maxLength: 200 },
    facility_type: { type: 'string', default: 'Rural Health Unit' },
    address: { type: 'string', required: true, maxLength: 300 },
    city: { type: 'string', default: 'Odiongan' },
    province: { type: 'string', default: 'Romblon' },
    country: { type: 'string', default: 'Philippines' },
    latitude: { type: 'number', required: true },
    longitude: { type: 'number', required: true },
    contact_phone: { type: 'string', required: false },
    services_offered: { type: 'string', required: true },
    operating_hours: { type: 'string', required: false },
    maps_url: { type: 'string', required: false },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    staffWorkers: { type: 'hasMany', model: 'HealthWorkers', foreignKey: 'primary_facility_id' },
    appointments: { type: 'hasMany', model: 'Appointments', foreignKey: 'facility_id' },
  },
};

/**
 * 5. Medication Entity Model
 */
export const MedicationModel = {
  tableName: 'Medications',
  primaryKey: 'medication_id',
  fields: {
    medication_id: { type: 'number', isPrimary: true, autoIncrement: true },
    medication_code: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true, maxLength: 150 },
    category: { type: 'string', required: true, maxLength: 100 },
    detail: { type: 'string', required: true, maxLength: 500 },
    default_dosage: { type: 'string', required: false },
    stock_status: { type: 'enum', options: ['In stock', 'Out of stock', 'Low stock'], default: 'In stock' },
    stock_quantity: { type: 'number', default: 100 },
    prescription_needed: { type: 'boolean', default: true },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    requests: { type: 'hasMany', model: 'MedicationRequests', foreignKey: 'medication_id' },
  },
};
/**
 * 6. Medication Request Entity Model
 */
export const MedicationRequestModel = {
  tableName: 'MedicationRequests',
  primaryKey: 'request_id',
  fields: {
    request_id: { type: 'number', isPrimary: true, autoIncrement: true },
    patient_id: { type: 'number', required: true, references: 'Patients.patient_id' },
    medication_id: { type: 'number', required: false, references: 'Medications.medication_id' },
    medication_name: { type: 'string', required: true, maxLength: 150 },
    dosage: { type: 'string', default: 'As prescribed' },
    schedule: { type: 'string', default: 'Ask your health worker' },
    availability: { type: 'string', default: 'In stock' },
    status: { type: 'enum', options: ['Pending', 'Ready for review', 'Approved', 'Needs information', 'Dispensed', 'Cancelled'], default: 'Pending' },
    reviewed_by_worker_id: { type: 'number', required: false, references: 'HealthWorkers.worker_id' },
    review_notes: { type: 'string', required: false },
    requested_at: { type: 'datetime', default: () => new Date().toISOString() },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    patient: { type: 'belongsTo', model: 'Patients', foreignKey: 'patient_id' },
    medication: { type: 'belongsTo', model: 'Medications', foreignKey: 'medication_id' },
    reviewedBy: { type: 'belongsTo', model: 'HealthWorkers', foreignKey: 'reviewed_by_worker_id' },
  },
};

/**
 * 7. Appointment Entity Model
 */
export const AppointmentModel = {
  tableName: 'Appointments',
  primaryKey: 'appointment_id',
  fields: {
    appointment_id: { type: 'number', isPrimary: true, autoIncrement: true },
    patient_id: { type: 'number', required: true, references: 'Patients.patient_id' },
    worker_id: { type: 'number', required: false, references: 'HealthWorkers.worker_id' },
    facility_id: { type: 'number', required: false, references: 'TestingFacilities.facility_id' },
    appointment_date: { type: 'date', required: true },
    appointment_time: { type: 'string', required: true },
    appointment_type: { type: 'string', default: 'HIV care consultation' },
    status: { type: 'enum', options: ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'], default: 'Requested' },
    notes: { type: 'string', required: false },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    patient: { type: 'belongsTo', model: 'Patients', foreignKey: 'patient_id' },
    worker: { type: 'belongsTo', model: 'HealthWorkers', foreignKey: 'worker_id' },
    facility: { type: 'belongsTo', model: 'TestingFacilities', foreignKey: 'facility_id' },
  },
};

/**
 * 8. Chat Session Entity Model
 */
export const ChatSessionModel = {
  tableName: 'ChatSessions',
  primaryKey: 'chat_session_id',
  fields: {
    chat_session_id: { type: 'number', isPrimary: true, autoIncrement: true },
    patient_id: { type: 'number', required: true, references: 'Patients.patient_id' },
    worker_id: { type: 'number', required: false, references: 'HealthWorkers.worker_id' },
    subject: { type: 'string', default: 'Welcome to private support' },
    status: { type: 'enum', options: ['Open', 'Pending', 'Closed', 'Resolved'], default: 'Open' },
    preview: { type: 'string', required: false },
    last_updated: { type: 'datetime', default: () => new Date().toISOString() },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    patient: { type: 'belongsTo', model: 'Patients', foreignKey: 'patient_id' },
    worker: { type: 'belongsTo', model: 'HealthWorkers', foreignKey: 'worker_id' },
    messages: { type: 'hasMany', model: 'ChatMessages', foreignKey: 'chat_session_id' },
  },
};

/**
 * 9. Chat Message Entity Model
 */
export const ChatMessageModel = {
  tableName: 'ChatMessages',
  primaryKey: 'message_id',
  fields: {
    message_id: { type: 'number', isPrimary: true, autoIncrement: true },
    chat_session_id: { type: 'number', required: true, references: 'ChatSessions.chat_session_id' },
    sender_user_id: { type: 'number', required: true, references: 'Users.user_id' },
    sender_role: { type: 'enum', options: ['patient', 'worker', 'admin', 'system'], required: true },
    message_text: { type: 'string', required: true },
    is_read: { type: 'boolean', default: false },
    sent_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    session: { type: 'belongsTo', model: 'ChatSessions', foreignKey: 'chat_session_id' },
    sender: { type: 'belongsTo', model: 'Users', foreignKey: 'sender_user_id' },
  },
};
/**
 * 10. Support Group Entity Model
 */
export const SupportGroupModel = {
  tableName: 'SupportGroups',
  primaryKey: 'group_id',
  fields: {
    group_id: { type: 'number', isPrimary: true, autoIncrement: true },
    name: { type: 'string', required: true, maxLength: 150 },
    detail: { type: 'string', required: true, maxLength: 500 },
    schedule: { type: 'string', required: true, maxLength: 150 },
    target_audience: { type: 'string', required: false },
    facilitator_worker_id: { type: 'number', required: false, references: 'HealthWorkers.worker_id' },
    member_count: { type: 'number', default: 0 },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    facilitator: { type: 'belongsTo', model: 'HealthWorkers', foreignKey: 'facilitator_worker_id' },
    members: { type: 'belongsToMany', model: 'Patients', through: 'SupportGroupMembers', foreignKey: 'group_id', otherKey: 'patient_id' },
  },
};

/**
 * 11. Support Group Member (Join Table Model)
 */
export const SupportGroupMemberModel = {
  tableName: 'SupportGroupMembers',
  primaryKey: 'membership_id',
  fields: {
    membership_id: { type: 'number', isPrimary: true, autoIncrement: true },
    group_id: { type: 'number', required: true, references: 'SupportGroups.group_id' },
    patient_id: { type: 'number', required: true, references: 'Patients.patient_id' },
    role_in_group: { type: 'enum', options: ['Member', 'Peer Leader', 'Moderator'], default: 'Member' },
    joined_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    group: { type: 'belongsTo', model: 'SupportGroups', foreignKey: 'group_id' },
    patient: { type: 'belongsTo', model: 'Patients', foreignKey: 'patient_id' },
  },
};

/**
 * 12. Public Inquiry Entity Model
 */
export const PublicInquiryModel = {
  tableName: 'PublicInquiries',
  primaryKey: 'inquiry_id',
  fields: {
    inquiry_id: { type: 'number', isPrimary: true, autoIncrement: true },
    first_name: { type: 'string', required: true, maxLength: 100 },
    email: { type: 'string', required: true, maxLength: 255 },
    message: { type: 'string', required: true },
    status: { type: 'enum', options: ['New', 'In Progress', 'Responded', 'Closed'], default: 'New' },
    assigned_worker_id: { type: 'number', required: false, references: 'HealthWorkers.worker_id' },
    response_notes: { type: 'string', required: false },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
    responded_at: { type: 'datetime', required: false },
  },
  relationships: {
    assignedWorker: { type: 'belongsTo', model: 'HealthWorkers', foreignKey: 'assigned_worker_id' },
  },
};

/**
 * 13. Platform Service Entity Model
 */
export const PlatformServiceModel = {
  tableName: 'PlatformServices',
  primaryKey: 'service_id',
  fields: {
    service_id: { type: 'number', isPrimary: true, autoIncrement: true },
    service_key: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
    detail: { type: 'string', required: true },
    is_enabled: { type: 'boolean', default: true },
    display_order: { type: 'number', default: 1 },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
};

/**
 * 14. System Setting Entity Model
 */
export const SystemSettingModel = {
  tableName: 'SystemSettings',
  primaryKey: 'setting_key',
  fields: {
    setting_key: { type: 'string', isPrimary: true },
    setting_value: { type: 'string', required: true },
    data_type: { type: 'enum', options: ['string', 'boolean', 'number', 'json'], default: 'string' },
    description: { type: 'string', required: false },
    updated_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
};

/**
 * 15. Activity Log Entity Model
 */
export const ActivityLogModel = {
  tableName: 'ActivityLogs',
  primaryKey: 'log_id',
  fields: {
    log_id: { type: 'number', isPrimary: true, autoIncrement: true },
    actor_user_id: { type: 'number', required: false, references: 'Users.user_id' },
    actor_name: { type: 'string', required: true },
    action: { type: 'string', required: true },
    category: { type: 'string', default: 'General' },
    ip_address: { type: 'string', required: false },
    details: { type: 'string', required: false },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
  relationships: {
    actor: { type: 'belongsTo', model: 'Users', foreignKey: 'actor_user_id' },
  },
};

/**
 * 16. Educational Resource Entity Model
 */
export const EducationalResourceModel = {
  tableName: 'EducationalResources',
  primaryKey: 'resource_id',
  fields: {
    resource_id: { type: 'number', isPrimary: true, autoIncrement: true },
    resource_number: { type: 'string', required: true },
    category: { type: 'string', default: 'Knowledge 101' },
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    action_label: { type: 'string', required: false },
    display_order: { type: 'number', default: 1 },
    is_published: { type: 'boolean', default: true },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
};

/**
 * 17. Partner Organization Entity Model
 */
export const PartnerOrganizationModel = {
  tableName: 'PartnerOrganizations',
  primaryKey: 'org_id',
  fields: {
    org_id: { type: 'number', isPrimary: true, autoIncrement: true },
    name: { type: 'string', required: true },
    description: { type: 'string', required: true },
    website_url: { type: 'string', required: true },
    category: { type: 'string', default: 'Referral' },
    display_order: { type: 'number', default: 1 },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'datetime', default: () => new Date().toISOString() },
  },
};

export const DatabaseSchema = {
  Users: UserModel,
  Patients: PatientModel,
  HealthWorkers: HealthWorkerModel,
  TestingFacilities: TestingFacilityModel,
  Medications: MedicationModel,
  MedicationRequests: MedicationRequestModel,
  Appointments: AppointmentModel,
  ChatSessions: ChatSessionModel,
  ChatMessages: ChatMessageModel,
  SupportGroups: SupportGroupModel,
  SupportGroupMembers: SupportGroupMemberModel,
  PublicInquiries: PublicInquiryModel,
  PlatformServices: PlatformServiceModel,
  SystemSettings: SystemSettingModel,
  ActivityLogs: ActivityLogModel,
  EducationalResources: EducationalResourceModel,
  PartnerOrganizations: PartnerOrganizationModel,
};

export default DatabaseSchema;
