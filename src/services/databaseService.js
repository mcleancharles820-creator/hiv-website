/**
 * HIVeLink Platform - Relational Database Service Layer
 * Provides relational CRUD operations, foreign key join resolution,
 * and state synchronization for the React frontend.
 */

import { DatabaseSchema } from '../types/database';

const DB_STORAGE_KEY = 'rising_hiv_relational_db_v3';

// Initial Seed Dataset for Frontend Client Storage (Infrastructure/Catalog only, zero static users)
const initialDatabase = {
  Users: [],
  HealthWorkers: [],
  Patients: [],
  Appointments: [],
  MedicationRequests: [],
  ChatSessions: [],
  ChatMessages: [],
  SupportGroupMembers: [],
  ActivityLogs: [],
  PublicInquiries: [],
  Medications: [
    { medication_id: 1, medication_code: 'art', name: 'Antiretroviral therapy', category: 'HIV Treatment', detail: 'HIV treatment · Take only as prescribed', default_dosage: 'As prescribed', stock_status: 'In stock', stock_quantity: 250, prescription_needed: true, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { medication_id: 2, medication_code: 'prep', name: 'PrEP', category: 'HIV Prevention', detail: 'HIV prevention medication · Ask a health worker', default_dosage: '1 tablet daily', stock_status: 'In stock', stock_quantity: 180, prescription_needed: true, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { medication_id: 3, medication_code: 'pep', name: 'PEP', category: 'Emergency Prevention', detail: 'Post-exposure medication · Urgent care required', default_dosage: '28-day course', stock_status: 'Out of stock', stock_quantity: 0, prescription_needed: true, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { medication_id: 4, medication_code: 'opportunistic', name: 'Preventive care medication', category: 'Preventive Care', detail: 'For infection prevention · Prescription required', default_dosage: 'As directed', stock_status: 'Out of stock', stock_quantity: 0, prescription_needed: true, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
  ],
  TestingFacilities: [
    { facility_id: 1, name: 'Rural Health Unit', facility_type: 'Rural Health Unit', address: 'Barangay Dap-dap, Odiongan', city: 'Odiongan', province: 'Romblon', country: 'Philippines', latitude: 12.401000, longitude: 121.990000, contact_phone: '+63 917 123 4567', services_offered: 'Confidential HIV Testing, PrEP counseling', operating_hours: 'Mon-Fri 8:00 AM - 5:00 PM', maps_url: 'https://www.google.com/maps/search/Rural+Health+Unit+Odiongan+Romblon', is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { facility_id: 2, name: 'Romblon Provincial Hospital', facility_type: 'Provincial Hospital', address: 'Liwanag, Odiongan', city: 'Odiongan', province: 'Romblon', country: 'Philippines', latitude: 12.405500, longitude: 121.986200, contact_phone: '+63 920 987 6543', services_offered: 'HIV Treatment Hub, ART Dispensing, Confirmatory Testing', operating_hours: '24/7 Care', maps_url: 'https://www.google.com/maps/search/Romblon+Provincial+Hospital+Odiongan', is_active: true, created_at: '2026-01-01T00:00:00Z' }
  ],
  SupportGroups: [
    { group_id: 1, name: 'Living Positive', detail: 'Peer connection · Weekly online circle', schedule: 'Weekly online circle', target_audience: 'Open to all living with HIV', facilitator_worker_id: null, member_count: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { group_id: 2, name: 'Island Care Circle', detail: 'Local support · Romblon community', schedule: 'Every Saturday', target_audience: 'Romblon community', facilitator_worker_id: null, member_count: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { group_id: 3, name: 'Young Advocates', detail: 'Peer support · Ages 18–29', schedule: 'Bi-weekly Sundays', target_audience: 'Ages 18–29', facilitator_worker_id: null, member_count: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' }
  ],
  PlatformServices: [
    { service_id: 1, service_key: 'testing_referrals', name: 'HIV testing referrals', detail: 'Local testing and facility guidance', is_enabled: true, display_order: 1, updated_at: '2026-01-01T00:00:00Z' },
    { service_id: 2, service_key: 'treatment_referrals', name: 'Treatment referrals', detail: 'Connect patients to treatment hubs', is_enabled: true, display_order: 2, updated_at: '2026-01-01T00:00:00Z' },
    { service_id: 3, service_key: 'chat_support', name: 'Private chat support', detail: 'Patient to health worker messaging', is_enabled: true, display_order: 3, updated_at: '2026-01-01T00:00:00Z' },
    { service_id: 4, service_key: 'medication_requests', name: 'Medication requests', detail: 'Treatment availability requests', is_enabled: false, display_order: 4, updated_at: '2026-01-01T00:00:00Z' }
  ],
  SystemSettings: [
    { setting_key: 'platform_name', setting_value: 'HIVeLink', data_type: 'string', description: 'Platform brand name', updated_at: '2026-01-01T00:00:00Z' },
    { setting_key: 'support_email', setting_value: 'support@risinghiv.org', data_type: 'string', description: 'Primary support email', updated_at: '2026-01-01T00:00:00Z' }
  ],
  EducationalResources: [
    { resource_id: 1, resource_number: '01', category: 'Guest Essentials', title: 'Know your status', summary: 'Testing is the only way to know. Most results are ready quickly, and confidential options are available.', action_label: 'Find a test', display_order: 1, is_published: true, created_at: '2026-01-01T00:00:00Z' },
    { resource_id: 2, resource_number: '02', category: 'Guest Essentials', title: 'Treatment works', summary: 'With the right treatment, people living with HIV can live long, healthy lives. Undetectable means untransmittable.', action_label: 'Understand U=U', display_order: 2, is_published: true, created_at: '2026-01-01T00:00:00Z' },
    { resource_id: 3, resource_number: '03', category: 'Guest Essentials', title: 'Prevention is personal', summary: 'Condoms, PrEP, PEP, and regular testing can all help. Choose the tools that feel right for you.', action_label: 'Explore prevention', display_order: 3, is_published: true, created_at: '2026-01-01T00:00:00Z' }
  ],
  PartnerOrganizations: [
    { org_id: 1, name: 'Philippine HIV & AIDS Support House', description: 'Community support and referrals ↗', website_url: 'https://www.pamf.org.ph/', category: 'Community Support', display_order: 1, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { org_id: 2, name: 'AIDS Data Hub', description: 'HIV information and regional resources ↗', website_url: 'https://www.aidsdatahub.org/', category: 'Data & Research', display_order: 2, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { org_id: 3, name: 'The Global Fund', description: 'Donate to end AIDS, TB, and malaria ↗', website_url: 'https://www.globalfund.org/en/donate/', category: 'Global Donations', display_order: 3, is_active: true, created_at: '2026-01-01T00:00:00Z' }
  ]
};
class DatabaseService {
  constructor() {
    this.listeners = [];
    this.useApi = process.env.NODE_ENV === 'production' || process.env.REACT_APP_USE_API === 'true';
    this.data = this.loadDatabase();
  }

  async apiRequest(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || 'The server could not complete the request.');
      error.details = result;
      error.status = response.status;
      throw error;
    }
    return result;
  }

  async refresh() {
    if (!this.useApi) return this.data;
    const snapshot = await this.apiRequest('/api/bootstrap');
    this.data = { ...initialDatabase, ...snapshot };
    this.notify();
    return this.data;
  }

  async restoreSession() {
    if (!this.useApi) return null;
    const session = await this.apiRequest('/api/auth/session');
    await this.refresh();
    const patient = this.getTable('Patients').find((record) => record.user_id === session.user.user_id) || null;
    const worker = this.getTable('HealthWorkers').find((record) => record.user_id === session.user.user_id) || null;
    return { user: session.user, patient, worker };
  }

  async logout() {
    if (!this.useApi) return;
    await this.apiRequest('/api/auth/logout', { method: 'POST' });
    this.data = initialDatabase;
    this.notify();
  }

  async sendAccountEmail(userId, subject, message) {
    if (!this.useApi) return { error: 'Email delivery is only available when the backend API is enabled.' };
    try {
      return await this.apiRequest('/api/admin/email', {
        method: 'POST',
        body: JSON.stringify({ userId, subject, message }),
      });
    } catch (error) {
      return { error: error.message };
    }
  }

  async resendVerificationEmail(email) {
    if (!this.useApi) return { error: 'Email verification is only available when the backend API is enabled.' };
    try {
      return await this.apiRequest('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
    } catch (error) {
      return { error: error.message };
    }
  }

  async resendVerificationForUser(userId) {
    if (!this.useApi) return { error: 'Email verification is only available when the backend API is enabled.' };
    try {
      return await this.apiRequest('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ userId }) });
    } catch (error) {
      return { error: error.message };
    }
  }

  async markChatRead(chatSessionId, readerRole) {
    if (this.useApi) {
      try {
        const result = await this.apiRequest(`/api/chat/sessions/${encodeURIComponent(chatSessionId)}/read`, { method: 'POST' });
        await this.refresh();
        return result;
      } catch (error) {
        return { error: error.message };
      }
    }
    const incomingRole = readerRole === 'health-worker' || readerRole === 'worker' ? 'patient' : 'worker';
    this.data = {
      ...this.data,
      ChatMessages: this.getTable('ChatMessages').map((message) => (
        message.chat_session_id === chatSessionId && message.sender_role === incomingRole
          ? { ...message, is_read: true }
          : message
      )),
    };
    this.saveDatabase(this.data);
    return { updatedCount: true };
  }

  async getClaimablePatients(workerId) {
    if (this.useApi) {
      try {
        const result = await this.apiRequest('/api/worker/claimable-patients');
        return result.patients || [];
      } catch (error) {
        this.lastError = error.message;
        return [];
      }
    }
    const worker = this.findById('HealthWorkers', workerId);
    const workerUser = worker ? this.findById('Users', worker.user_id) : null;
    const canClaim = Boolean(worker?.is_verified)
      && Boolean(worker?.is_available)
      && workerUser?.is_active !== false
      && workerUser?.email_verified !== false;
    if (!canClaim) return [];
    return this.getUsersListDetailed()
      .filter((patient) => !patient.assignedWorkerId
        && patient.accountStatus === 'Active'
        && patient.emailVerified
        && (!worker.primary_facility_id || !patient.preferredFacilityId || Number(patient.preferredFacilityId) === Number(worker.primary_facility_id)))
      .map((patient) => ({ patient_id: patient.patientId, full_name: patient.fullName, care_status: patient.careStatus, preferred_facility_id: patient.preferredFacilityId }));
  }

  async claimPatient(patientId, workerId) {
    if (this.useApi) {
      try {
        const result = await this.apiRequest('/api/worker/claim-patient', { method: 'POST', body: JSON.stringify({ patientId }) });
        await this.refresh();
        return result;
      } catch (error) {
        return { error: error.message };
      }
    }
    const patient = this.findById('Patients', patientId);
    const worker = this.findById('HealthWorkers', workerId);
    const workerUser = worker ? this.findById('Users', worker.user_id) : null;
    if (!patient || !worker || !workerUser || patient.assigned_worker_id) return { error: 'This patient is no longer available to claim.' };
    if (!worker.is_verified || !worker.is_available || workerUser.is_active === false || workerUser.email_verified === false) {
      return { error: 'A verified and available health worker is required.' };
    }
    const patientUser = this.findById('Users', patient.user_id);
    if (!patientUser || patientUser.is_active === false) return { error: 'This patient is no longer available to claim.' };
    if (worker.primary_facility_id && patient.preferred_facility_id && Number(worker.primary_facility_id) !== Number(patient.preferred_facility_id)) return { error: 'This patient is outside your assigned facility.' };
    this.update('Patients', patientId, { assigned_worker_id: workerId });
    return { patient: this.findById('Patients', patientId) };
  }

  async remoteMutation(method, tableName, id, record) {
    try {
      const url = `/api/records/${tableName}${id === undefined ? '' : `/${encodeURIComponent(id)}`}`;
      const result = await this.apiRequest(url, { method, body: method === 'DELETE' ? undefined : JSON.stringify({ record }) });
      if (tableName !== 'PublicInquiries') await this.refresh();
      this.lastError = null;
      return result.record || result.deleted;
    } catch (error) {
      this.lastError = error.message;
      console.error('API request failed:', error.message);
      this.notify();
      return { error: error.message };
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.data);
      } catch (e) {
        console.error('Database listener error:', e);
      }
    });
  }

  loadDatabase() {
    if (this.useApi) return initialDatabase;
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read relational DB from storage:', e);
    }
    this.saveDatabase(initialDatabase);
    return initialDatabase;
  }

  saveDatabase(database = this.data) {
    this.data = database;
    if (this.useApi) {
      this.notify();
      return;
    }
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(database));
    } catch (e) {
      console.error('Failed to persist database state:', e);
    }
    this.notify();
  }

  resetToDefault() {
    this.saveDatabase(initialDatabase);
    return this.data;
  }

  /**
   * Generic Table Query Methods
   */
  getTable(tableName) {
    return this.data[tableName] || [];
  }

  findById(tableName, id) {
    const pk = DatabaseSchema[tableName]?.primaryKey || 'id';
    return this.getTable(tableName).find((item) => item[pk] === id) || null;
  }

  insert(tableName, record) {
    if (this.useApi) return this.remoteMutation('POST', tableName, undefined, record);
    const pk = DatabaseSchema[tableName]?.primaryKey || 'id';
    const items = this.getTable(tableName);
    const maxId = items.reduce((max, cur) => (cur[pk] > max ? cur[pk] : max), 0);
    const newRecord = {
      ...record,
      [pk]: record[pk] || maxId + 1,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...items, newRecord];
    this.data = { ...this.data, [tableName]: updated };
    this.saveDatabase(this.data);
    return newRecord;
  }

  update(tableName, id, patch) {
    if (this.useApi) return this.remoteMutation('PATCH', tableName, id, patch);
    const pk = DatabaseSchema[tableName]?.primaryKey || 'id';
    const items = this.getTable(tableName);
    const updated = items.map((item) => {
      if (item[pk] === id) {
        return {
          ...item,
          ...patch,
          [pk]: id,
          updated_at: new Date().toISOString(),
        };
      }
      return item;
    });
    this.data = { ...this.data, [tableName]: updated };
    this.saveDatabase(this.data);
    return this.findById(tableName, id);
  }

  delete(tableName, id) {
    if (this.useApi) return this.remoteMutation('DELETE', tableName, id);
    const pk = DatabaseSchema[tableName]?.primaryKey || 'id';
    const items = this.getTable(tableName);
    const filtered = items.filter((item) => item[pk] !== id);
    this.data = { ...this.data, [tableName]: filtered };
    this.saveDatabase(this.data);
    return true;
  }

  /**
   * Registration & Authentication Database Encoding
   */
  registerUser({ fullName, firstName, lastName, email, password, role = 'patient', age, dateOfBirth, gender, contactNumber, termsAccepted = true }) {
    if (this.useApi) {
      const nameParts = String(fullName || '').trim().split(/\s+/);
      return this.apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ firstName: firstName || nameParts.shift(), lastName: lastName || nameParts.join(' '), email, password, age, dateOfBirth, gender, contactNumber, termsAccepted }),
      }).catch((error) => ({ error: error.message, verificationPending: Boolean(error.details?.verificationPending) }));
    }
    // 1. Data Type normalization and parsing
    const parsedAge = age ? parseInt(age, 10) : null;
    const formattedDob = dateOfBirth ? String(dateOfBirth) : null;
    const formattedEmail = String(email || '').trim().toLowerCase();
    const formattedName = String(fullName || `${firstName || ''} ${lastName || ''}`).trim();
    const formattedPhone = contactNumber ? String(contactNumber).trim() : null;
    const cleanPassword = String(password || '');

    if (!formattedEmail) {
      return { error: 'Email address is required.' };
    }
    if (cleanPassword && cleanPassword.toLowerCase() === formattedEmail) {
      return { error: 'Password cannot be the same as your email address.' };
    }

    // Check if user exists
    const existingUser = this.getTable('Users').find((u) => u.email.toLowerCase() === formattedEmail);
    if (existingUser) {
      return { error: 'An account with this email already exists. Please sign in instead.' };
    }

    // Insert new User
    const newUser = this.insert('Users', {
      email: formattedEmail,
      password_hash: `hash_${password || 'secret'}`,
      full_name: formattedName,
      role,
      contact_number: formattedPhone,
      date_of_birth: formattedDob,
      age: parsedAge,
      gender: gender || null,
      terms_accepted: Boolean(termsAccepted),
      is_active: true,
    });

    // Create role-specific relational record
    let patient = null;
    let worker = null;

    if (role === 'patient') {
      patient = this.insert('Patients', {
        user_id: newUser.user_id,
        assigned_worker_id: null,
        preferred_facility_id: 1,
        care_status: 'Active care plan',
        medical_notes: 'Newly registered patient account.',
        emergency_contact: null,
        emergency_phone: null,
      });

      // Initialize default chat session for private support
      this.insert('ChatSessions', {
        patient_id: patient.patient_id,
        worker_id: null,
        subject: 'Welcome to private support',
        status: 'Open',
        preview: 'A health worker will be ready to answer your questions.',
        last_updated: new Date().toISOString(),
      });

      // Log registration activity
      this.insert('ActivityLogs', {
        actor_user_id: newUser.user_id,
        actor_name: newUser.full_name,
        action: 'New patient registered',
        category: 'Authentication',
        details: `Registered account for ${newUser.full_name} (${newUser.email})`,
      });
    } else if (role === 'health-worker') {
      worker = this.insert('HealthWorkers', {
        user_id: newUser.user_id,
        specialty: 'HIV care support',
        license_number: null,
        primary_facility_id: 1,
        is_verified: true,
        is_available: true,
        bio_summary: 'Licensed Health Worker',
      });

      this.insert('ActivityLogs', {
        actor_user_id: newUser.user_id,
        actor_name: newUser.full_name,
        action: 'New health worker registered',
        category: 'Authentication',
        details: `Health worker profile created for ${newUser.full_name}`,
      });
    } else if (role === 'admin') {
      this.insert('ActivityLogs', {
        actor_user_id: newUser.user_id,
        actor_name: newUser.full_name,
        action: 'New administrator registered',
        category: 'Authentication',
        details: `Admin profile created for ${newUser.full_name}`,
      });
    }

    return { user: newUser, patient, worker };
  }

  login({ email, password, role = 'patient' }) {
    if (this.useApi) {
      return this.apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
        .then(async (result) => {
          await this.refresh();
          return result;
        })
        .catch((error) => ({ error: error.message }));
    }
    const formattedEmail = String(email || '').trim().toLowerCase();
    const formattedPassword = String(password || '');

    if (!formattedEmail) {
      return { error: 'Please enter your email address.' };
    }

    const user = this.getTable('Users').find((u) => u.email.toLowerCase() === formattedEmail);

    if (!user) {
      return { error: 'Account not found. Please register an account first before logging in.' };
    }

    if (user.password_hash && user.password_hash !== `hash_${formattedPassword}` && user.password_hash !== formattedPassword) {
      return { error: 'Incorrect password. Please verify your password and try again.' };
    }

    if (user.role !== role) {
      return { error: `This account is registered as a ${user.role}, not a ${role}.` };
    }

    const patient = this.getTable('Patients').find((p) => p.user_id === user.user_id) || null;
    const worker = this.getTable('HealthWorkers').find((w) => w.user_id === user.user_id) || null;

    return { user, patient, worker };
  }

  /**
   * Appointments Database Operations
   */
  bookAppointment({ patient_id, worker_id = 1, facility_id = 1, appointment_date, appointment_time, appointment_type = 'HIV care consultation', status = 'Requested', notes = '' }) {
    if (this.useApi) return this.insert('Appointments', { patient_id, worker_id, facility_id, appointment_date, appointment_time, appointment_type, status, notes });
    return this.insert('Appointments', {
      patient_id: parseInt(patient_id, 10),
      worker_id: worker_id ? parseInt(worker_id, 10) : null,
      facility_id: facility_id ? parseInt(facility_id, 10) : 1,
      appointment_date: String(appointment_date),
      appointment_time: String(appointment_time),
      appointment_type: String(appointment_type),
      status: String(status),
      notes: String(notes || ''),
    });
  }

  /**
   * Medication Request Operations
   */
  requestMedication({ patient_id, medication_id = null, medication_name, dosage = 'As prescribed', schedule = 'Ask your health worker', availability = 'In stock', status = 'Pending' }) {
    if (this.useApi) return this.insert('MedicationRequests', { patient_id, medication_id, medication_name, dosage, schedule, availability, status });
    return this.insert('MedicationRequests', {
      patient_id: parseInt(patient_id, 10),
      medication_id: medication_id ? parseInt(medication_id, 10) : null,
      medication_name: String(medication_name),
      dosage: String(dosage),
      schedule: String(schedule),
      availability: String(availability),
      status: String(status),
      reviewed_by_worker_id: null,
      review_notes: null,
      requested_at: new Date().toISOString(),
    });
  }

  /**
   * Chat Operations
   */
  sendChatMessage({ chat_session_id = 1, sender_user_id, sender_role = 'patient', message_text }) {
    const text = String(message_text || '').trim();
    if (!text) return null;
    if (this.useApi) return this.insert('ChatMessages', { chat_session_id, sender_user_id, sender_role, message_text: text });

    const msg = this.insert('ChatMessages', {
      chat_session_id: parseInt(chat_session_id, 10),
      sender_user_id: parseInt(sender_user_id, 10),
      sender_role: String(sender_role),
      message_text: text,
      is_read: false,
      sent_at: new Date().toISOString(),
    });

    this.update('ChatSessions', parseInt(chat_session_id, 10), {
      preview: text,
      last_updated: new Date().toISOString(),
      status: 'Open',
    });

    return msg;
  }

  /**
   * Relational Joins & Aggregated Views
   */
  getPatientCompleteProfile(patientId) {
    const patient = this.findById('Patients', patientId) || this.getTable('Patients')[0];
    if (!patient) return null;
    const user = this.findById('Users', patient.user_id) || { full_name: 'Patient User', email: '', contact_number: '' };
    const worker = patient.assigned_worker_id ? this.findById('HealthWorkers', patient.assigned_worker_id) : null;
    const workerUser = worker ? this.findById('Users', worker.user_id) : null;
    const facility = patient.preferred_facility_id ? this.findById('TestingFacilities', patient.preferred_facility_id) : null;
    const appointments = this.getTable('Appointments').filter((a) => a.patient_id === patient.patient_id);
    const medicationRequests = this.getTable('MedicationRequests').filter((m) => m.patient_id === patient.patient_id);
    const chatSessions = this.getTable('ChatSessions').filter((c) => c.patient_id === patient.patient_id);
    const memberships = this.getTable('SupportGroupMembers').filter((sgm) => sgm.patient_id === patient.patient_id);
    const supportGroups = memberships.map((m) => this.findById('SupportGroups', m.group_id)).filter(Boolean);

    return {
      ...patient,
      user,
      assignedWorker: worker ? { ...worker, user: workerUser } : null,
      preferredFacility: facility,
      appointments,
      medicationRequests,
      chatSessions,
      supportGroups,
    };
  }

  /**
   * Complete Availment & Service History Query
   */
  getUserServicesAvailed(userIdOrPatientId) {
    let patient = null;
    if (userIdOrPatientId) {
      patient = this.getTable('Patients').find((p) => p.user_id === userIdOrPatientId || p.patient_id === userIdOrPatientId);
    }
    if (!patient) {
      return {
        patientId: null,
        totalCount: 0,
        appointments: [],
        medicationRequests: [],
        chatSessions: [],
        supportGroups: [],
        servicesList: [],
      };
    }

    const patientId = patient.patient_id;
    const appointments = this.getTable('Appointments')
      .filter((a) => a.patient_id === patientId)
      .map((a) => {
        const facility = a.facility_id ? this.findById('TestingFacilities', a.facility_id) : null;
        const worker = a.worker_id ? this.findById('HealthWorkers', a.worker_id) : null;
        const workerUser = worker ? this.findById('Users', worker.user_id) : null;
        return {
          ...a,
          facilityName: facility?.name || 'Local Health Facility',
          workerName: workerUser?.full_name || 'Assigned Health Worker',
        };
      });

    const medicationRequests = this.getTable('MedicationRequests')
      .filter((m) => m.patient_id === patientId)
      .map((m) => {
        const worker = m.reviewed_by_worker_id ? this.findById('HealthWorkers', m.reviewed_by_worker_id) : null;
        const workerUser = worker ? this.findById('Users', worker.user_id) : null;
        return {
          ...m,
          reviewedByWorkerName: workerUser?.full_name || null,
        };
      });

    const chatSessions = this.getTable('ChatSessions')
      .filter((c) => c.patient_id === patientId)
      .map((c) => {
        const worker = c.worker_id ? this.findById('HealthWorkers', c.worker_id) : null;
        const workerUser = worker ? this.findById('Users', worker.user_id) : null;
        const messageCount = this.getTable('ChatMessages').filter((m) => m.chat_session_id === c.chat_session_id).length;
        return {
          ...c,
          workerName: workerUser?.full_name || 'Health Worker Support',
          messageCount,
        };
      });

    const memberships = this.getTable('SupportGroupMembers').filter((sgm) => sgm.patient_id === patientId);
    const supportGroups = memberships.map((m) => {
      const grp = this.findById('SupportGroups', m.group_id);
      return {
        membershipId: m.membership_id,
        roleInGroup: m.role_in_group || 'Member',
        joinedAt: m.joined_at,
        ...(grp || { name: 'Support Group', detail: '', schedule: '' }),
      };
    });

    const servicesList = [
      ...appointments.map((a) => ({
        id: `apt-${a.appointment_id}`,
        category: 'Appointment & Testing',
        type: a.appointment_type || 'HIV care consultation',
        name: `${a.appointment_type || 'HIV care consultation'} · ${a.facilityName}`,
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status || 'Requested',
        statusType: (a.status === 'Confirmed' || a.status === 'Completed') ? 'success' : a.status === 'Cancelled' ? 'danger' : 'warning',
        details: `Assigned: ${a.workerName} · Facility: ${a.facilityName}`,
        raw: a,
      })),
      ...medicationRequests.map((m) => ({
        id: `med-${m.request_id}`,
        category: 'Medication & Treatment',
        type: 'Medication Request',
        name: m.medication_name,
        date: m.requested_at ? m.requested_at.slice(0, 10) : 'Recent',
        time: m.dosage || 'Prescribed dose',
        status: m.status || 'Pending',
        statusType: (m.status === 'Approved' || m.status === 'Dispensed') ? 'success' : m.status === 'Needs information' ? 'info' : 'warning',
        details: `Dosage: ${m.dosage || 'As prescribed'} · Schedule: ${m.schedule || 'Regular'} · Stock: ${m.availability || 'In stock'}`,
        raw: m,
      })),
      ...chatSessions.map((c) => ({
        id: `chat-${c.chat_session_id}`,
        category: 'Confidential Support Chat',
        type: 'Support Thread',
        name: c.subject || 'Private Chat Consultation',
        date: c.last_updated ? c.last_updated.slice(0, 10) : 'Recent',
        time: `${c.messageCount || 0} messages`,
        status: c.status || 'Open',
        statusType: c.status === 'Resolved' ? 'success' : c.status === 'Open' ? 'info' : 'warning',
        details: `Health Worker: ${c.workerName} · Preview: "${c.preview || 'No messages yet'}"`,
        raw: c,
      })),
      ...supportGroups.map((g) => ({
        id: `grp-${g.group_id || g.membershipId}`,
        category: 'Community Support Group',
        type: 'Group Membership',
        name: g.name,
        date: g.joinedAt ? g.joinedAt.slice(0, 10) : 'Active',
        time: g.schedule || 'Scheduled',
        status: 'Active Member',
        statusType: 'success',
        details: `${g.detail || ''} · Schedule: ${g.schedule || 'Weekly'}`,
        raw: g,
      })),
    ];

    return {
      patientId,
      totalCount: servicesList.length,
      appointments,
      medicationRequests,
      chatSessions,
      supportGroups,
      servicesList,
    };
  }

  /**
   * Admin Detailed List Queries
   */
  getUsersListDetailed() {
    return this.getTable('Users')
      .filter((u) => u.role === 'patient')
      .map((u) => {
        const patient = this.getTable('Patients').find((p) => p.user_id === u.user_id);
        const facility = patient?.preferred_facility_id ? this.findById('TestingFacilities', patient.preferred_facility_id) : null;
        const worker = patient?.assigned_worker_id ? this.findById('HealthWorkers', patient.assigned_worker_id) : null;
        const workerUser = worker ? this.findById('Users', worker.user_id) : null;
        const servicesAvailed = this.getUserServicesAvailed(u.user_id);

        return {
          userId: u.user_id,
          id: u.user_id,
          patientId: patient?.patient_id || null,
          fullName: u.full_name,
          name: u.full_name,
          email: u.email,
          emailVerified: u.email_verified !== false,
          contactNumber: u.contact_number || 'Not provided',
          phone: u.contact_number || '',
          age: u.age || 'N/A',
          dateOfBirth: u.date_of_birth || 'N/A',
          gender: u.gender || 'Not specified',
          accountStatus: u.is_active !== false ? 'Active' : 'Inactive',
          careStatus: patient?.care_status || 'Active care plan',
          medicalNotes: patient?.medical_notes || 'No medical notes provided.',
          emergencyContact: patient?.emergency_contact || 'None',
          emergencyPhone: patient?.emergency_phone || 'None',
          preferredFacilityName: facility?.name || 'Rural Health Unit',
          preferredFacilityId: patient?.preferred_facility_id || 1,
          assignedWorkerName: workerUser?.full_name || 'Unassigned',
          assignedWorkerId: patient?.assigned_worker_id || null,
          registeredAt: u.created_at,
          servicesAvailedCount: servicesAvailed.totalCount,
          servicesAvailed,
          role: 'Patient',
          rawUser: u,
          rawPatient: patient,
        };
      });
  }

  getHealthWorkersListDetailed() {
    return this.getTable('HealthWorkers').map((w) => {
      const u = this.findById('Users', w.user_id) || {};
      const facility = w.primary_facility_id ? this.findById('TestingFacilities', w.primary_facility_id) : null;
      const assignedPatients = this.getTable('Patients')
        .filter((p) => p.assigned_worker_id === w.worker_id)
        .map((p) => {
          const pu = this.findById('Users', p.user_id);
          return {
            patientId: p.patient_id,
            name: pu?.full_name || 'Patient',
            careStatus: p.care_status || 'Stable',
          };
        });
      const activeAppointments = this.getTable('Appointments').filter((a) => a.worker_id === w.worker_id);
      const activeChats = this.getTable('ChatSessions').filter((c) => c.worker_id === w.worker_id);

      return {
        workerId: w.worker_id,
        id: w.worker_id,
        userId: w.user_id,
        fullName: u.full_name || 'Health Worker',
        name: u.full_name || 'Health Worker',
        email: u.email || 'worker@risinghiv.org',
        emailVerified: u.email_verified !== false,
        contactNumber: u.contact_number || 'Not provided',
        phone: u.contact_number || '',
        specialty: w.specialty || 'HIV care support',
        licenseNumber: w.license_number || 'N/A',
        primaryFacilityName: facility?.name || 'Rural Health Unit',
        primaryFacilityId: w.primary_facility_id || 1,
        isVerified: Boolean(w.is_verified),
        verificationStatus: w.is_verified ? 'Verified' : 'Pending Verification',
        isAvailable: Boolean(w.is_available),
        availabilityStatus: w.is_available ? 'Available' : 'On Leave',
        accountStatus: u.is_active !== false ? 'Active' : 'Inactive',
        bioSummary: w.bio_summary || 'Licensed Health Worker providing community HIV care.',
        assignedPatients,
        assignedPatientsCount: assignedPatients.length,
        appointmentsCount: activeAppointments.length,
        chatsCount: activeChats.length,
        joinedAt: w.created_at || u.created_at,
        rawUser: u,
        rawWorker: w,
      };
    });
  }

  /**
   * Admin CRUD Operations
   */
  adminCreateUser({ fullName, email, password, contactNumber, age, dateOfBirth, gender, careStatus = 'Active care plan', medicalNotes = '', preferredFacilityId = 1, assignedWorkerId = null, emergencyContact = '', emergencyPhone = '', isActive = true }) {
    if (this.useApi) {
      return this.apiRequest('/api/admin/users', { method: 'POST', body: JSON.stringify({ fullName, email, password, contactNumber, age, dateOfBirth, gender, careStatus, medicalNotes, preferredFacilityId, assignedWorkerId, emergencyContact, emergencyPhone, isActive }) })
        .then(async (result) => { await this.refresh(); return result; })
        .catch((error) => ({ error: error.message }));
    }
    const regResult = this.registerUser({
      fullName,
      email,
      password: password || 'default123',
      role: 'patient',
      age,
      dateOfBirth,
      gender,
      contactNumber,
      termsAccepted: true,
    });
    if (regResult.error) return regResult;

    const user = regResult.user;
    if (isActive === false) {
      this.update('Users', user.user_id, { is_active: false });
    }

    const patient = regResult.patient;
    if (patient) {
      this.update('Patients', patient.patient_id, {
        care_status: careStatus || 'Active care plan',
        medical_notes: medicalNotes || 'Managed patient account',
        preferred_facility_id: preferredFacilityId ? parseInt(preferredFacilityId, 10) : 1,
        assigned_worker_id: assignedWorkerId ? parseInt(assignedWorkerId, 10) : null,
        emergency_contact: emergencyContact || null,
        emergency_phone: emergencyPhone || null,
      });
    }

    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Created user account: ${user.full_name}`,
      category: 'User Management',
      details: `Created patient account ${user.email}`,
    });

    return { user: this.findById('Users', user.user_id), patient: patient ? this.findById('Patients', patient.patient_id) : null };
  }

  adminUpdateUser(userId, { fullName, email, contactNumber, age, dateOfBirth, gender, careStatus, medicalNotes, preferredFacilityId, assignedWorkerId, emergencyContact, emergencyPhone, isActive }) {
    if (this.useApi) {
      return this.apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'PATCH', body: JSON.stringify({ fullName, email, contactNumber, age, dateOfBirth, gender, careStatus, medicalNotes, preferredFacilityId, assignedWorkerId, emergencyContact, emergencyPhone, isActive }) })
        .then(async (result) => { await this.refresh(); return result; })
        .catch((error) => ({ error: error.message }));
    }
    const id = parseInt(userId, 10);
    const existing = this.findById('Users', id);
    if (!existing) return { error: 'User not found.' };

    const userPatch = {};
    if (fullName !== undefined) userPatch.full_name = fullName;
    if (email !== undefined) userPatch.email = email.trim().toLowerCase();
    if (contactNumber !== undefined) userPatch.contact_number = contactNumber;
    if (age !== undefined) userPatch.age = age ? parseInt(age, 10) : null;
    if (dateOfBirth !== undefined) userPatch.date_of_birth = dateOfBirth;
    if (gender !== undefined) userPatch.gender = gender;
    if (isActive !== undefined) userPatch.is_active = Boolean(isActive);

    const updatedUser = this.update('Users', id, userPatch);

    const patient = this.getTable('Patients').find((p) => p.user_id === id);
    let updatedPatient = null;
    if (patient) {
      const patientPatch = {};
      if (careStatus !== undefined) patientPatch.care_status = careStatus;
      if (medicalNotes !== undefined) patientPatch.medical_notes = medicalNotes;
      if (preferredFacilityId !== undefined) patientPatch.preferred_facility_id = preferredFacilityId ? parseInt(preferredFacilityId, 10) : null;
      if (assignedWorkerId !== undefined) patientPatch.assigned_worker_id = assignedWorkerId ? parseInt(assignedWorkerId, 10) : null;
      if (emergencyContact !== undefined) patientPatch.emergency_contact = emergencyContact;
      if (emergencyPhone !== undefined) patientPatch.emergency_phone = emergencyPhone;

      updatedPatient = this.update('Patients', patient.patient_id, patientPatch);
    }

    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Updated user profile: ${updatedUser.full_name}`,
      category: 'User Management',
      details: `Updated details for ${updatedUser.email}`,
    });

    return { user: updatedUser, patient: updatedPatient };
  }

  adminDeleteUser(userId) {
    if (this.useApi) {
      return this.apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
        .then(async (result) => { await this.refresh(); return result.deleted; })
        .catch((error) => ({ error: error.message }));
    }
    const id = parseInt(userId, 10);
    const user = this.findById('Users', id);
    if (!user) return false;

    const patient = this.getTable('Patients').find((p) => p.user_id === id);
    if (patient) {
      const pid = patient.patient_id;
      this.data.Appointments = (this.data.Appointments || []).filter((a) => a.patient_id !== pid);
      this.data.MedicationRequests = (this.data.MedicationRequests || []).filter((m) => m.patient_id !== pid);

      const sessionIds = (this.data.ChatSessions || []).filter((c) => c.patient_id === pid).map((c) => c.chat_session_id);
      this.data.ChatMessages = (this.data.ChatMessages || []).filter((m) => !sessionIds.includes(m.chat_session_id));
      this.data.ChatSessions = (this.data.ChatSessions || []).filter((c) => c.patient_id !== pid);
      this.data.SupportGroupMembers = (this.data.SupportGroupMembers || []).filter((sgm) => sgm.patient_id !== pid);
      this.data.Patients = (this.data.Patients || []).filter((p) => p.patient_id !== pid);
    }

    this.delete('Users', id);

    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Deleted user: ${user.full_name}`,
      category: 'User Management',
      details: `Removed user account ${user.email}`,
    });

    return true;
  }

  adminCreateHealthWorker({ fullName, email, password, contactNumber, specialty = 'HIV care support', licenseNumber = '', primaryFacilityId = 1, isVerified = true, isAvailable = true, bioSummary = '', isActive = true }) {
    if (this.useApi) {
      return this.apiRequest('/api/admin/workers', { method: 'POST', body: JSON.stringify({ fullName, email, password, contactNumber, specialty, licenseNumber, primaryFacilityId, isVerified, isAvailable, bioSummary, isActive }) })
        .then(async (result) => { await this.refresh(); return result; })
        .catch((error) => ({ error: error.message }));
    }
    const regResult = this.registerUser({
      fullName,
      email,
      password: password || 'default123',
      role: 'health-worker',
      contactNumber,
      termsAccepted: true,
    });
    if (regResult.error) return regResult;

    const user = regResult.user;
    if (isActive === false) {
      this.update('Users', user.user_id, { is_active: false });
    }

    const worker = regResult.worker;
    if (worker) {
      this.update('HealthWorkers', worker.worker_id, {
        specialty: specialty || 'HIV care support',
        license_number: licenseNumber || null,
        primary_facility_id: primaryFacilityId ? parseInt(primaryFacilityId, 10) : 1,
        is_verified: Boolean(isVerified),
        is_available: Boolean(isAvailable),
        bio_summary: bioSummary || 'Licensed Health Worker',
      });
    }

    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Created health worker: ${user.full_name}`,
      category: 'Care Team Management',
      details: `Created health worker ${user.email} (${specialty})`,
    });

    return { user: this.findById('Users', user.user_id), worker: worker ? this.findById('HealthWorkers', worker.worker_id) : null };
  }

  adminUpdateHealthWorker(workerId, { fullName, email, contactNumber, specialty, licenseNumber, primaryFacilityId, isVerified, isAvailable, bioSummary, isActive }) {
    if (this.useApi) {
      return this.apiRequest(`/api/admin/workers/${encodeURIComponent(workerId)}`, { method: 'PATCH', body: JSON.stringify({ fullName, email, contactNumber, specialty, licenseNumber, primaryFacilityId, isVerified, isAvailable, bioSummary, isActive }) })
        .then(async (result) => { await this.refresh(); return result; })
        .catch((error) => ({ error: error.message }));
    }
    const wid = parseInt(workerId, 10);
    const worker = this.findById('HealthWorkers', wid);
    if (!worker) return { error: 'Health Worker not found.' };

    const workerPatch = {};
    if (specialty !== undefined) workerPatch.specialty = specialty;
    if (licenseNumber !== undefined) workerPatch.license_number = licenseNumber;
    if (primaryFacilityId !== undefined) workerPatch.primary_facility_id = primaryFacilityId ? parseInt(primaryFacilityId, 10) : null;
    if (isVerified !== undefined) workerPatch.is_verified = Boolean(isVerified);
    if (isAvailable !== undefined) workerPatch.is_available = Boolean(isAvailable);
    if (bioSummary !== undefined) workerPatch.bio_summary = bioSummary;

    const updatedWorker = this.update('HealthWorkers', wid, workerPatch);

    let updatedUser = null;
    if (worker.user_id) {
      const userPatch = {};
      if (fullName !== undefined) userPatch.full_name = fullName;
      if (email !== undefined) userPatch.email = email.trim().toLowerCase();
      if (contactNumber !== undefined) userPatch.contact_number = contactNumber;
      if (isActive !== undefined) userPatch.is_active = Boolean(isActive);
      updatedUser = this.update('Users', worker.user_id, userPatch);
    }

    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Updated health worker: ${updatedUser?.full_name || 'Worker'}`,
      category: 'Care Team Management',
      details: `Updated profile for worker ID #${wid}`,
    });

    return { user: updatedUser, worker: updatedWorker };
  }

  adminDeleteHealthWorker(workerId) {
    if (this.useApi) {
      return this.apiRequest(`/api/admin/workers/${encodeURIComponent(workerId)}`, { method: 'DELETE' })
        .then(async (result) => { await this.refresh(); return result.deleted; })
        .catch((error) => ({ error: error.message }));
    }
    const wid = parseInt(workerId, 10);
    const worker = this.findById('HealthWorkers', wid);
    if (!worker) return false;

    const user = this.findById('Users', worker.user_id);
    const workerName = user?.full_name || `Worker #${wid}`;

    (this.data.Patients || []).forEach((p) => {
      if (p.assigned_worker_id === wid) p.assigned_worker_id = null;
    });
    (this.data.Appointments || []).forEach((a) => {
      if (a.worker_id === wid) a.worker_id = null;
    });
    (this.data.ChatSessions || []).forEach((c) => {
      if (c.worker_id === wid) c.worker_id = null;
    });
    (this.data.SupportGroups || []).forEach((g) => {
      if (g.facilitator_worker_id === wid) g.facilitator_worker_id = null;
    });

    this.delete('HealthWorkers', wid);
    if (worker.user_id) {
      this.delete('Users', worker.user_id);
    }

    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Deleted health worker: ${workerName}`,
      category: 'Care Team Management',
      details: `Removed health worker profile and user record`,
    });

    return true;
  }

  adminCreateService({ name, service_key, detail, is_enabled = true }) {
    if (this.useApi) return this.insert('PlatformServices', { service_key: service_key || name.toLowerCase().replace(/[^a-z0-9]/g, '_'), name, detail, is_enabled, display_order: this.getTable('PlatformServices').length + 1 });
    const key = (service_key || name.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();
    const newService = this.insert('PlatformServices', {
      service_key: key,
      name: name.trim(),
      detail: detail || '',
      is_enabled: Boolean(is_enabled),
      display_order: (this.getTable('PlatformServices').length || 0) + 1,
    });
    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Created platform service: ${newService.name}`,
      category: 'Platform Management',
      details: `Added new service ${newService.service_key}`,
    });
    return newService;
  }

  adminUpdateService(serviceId, { name, service_key, detail, is_enabled }) {
    if (this.useApi) return this.update('PlatformServices', serviceId, { name, service_key, detail, is_enabled });
    const sid = parseInt(serviceId, 10);
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (service_key !== undefined) patch.service_key = service_key;
    if (detail !== undefined) patch.detail = detail;
    if (is_enabled !== undefined) patch.is_enabled = Boolean(is_enabled);
    const updated = this.update('PlatformServices', sid, patch);
    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Updated platform service: ${updated?.name || sid}`,
      category: 'Platform Management',
      details: `Updated service configuration`,
    });
    return updated;
  }

  adminDeleteService(serviceId) {
    if (this.useApi) return this.delete('PlatformServices', serviceId);
    const sid = parseInt(serviceId, 10);
    const target = this.findById('PlatformServices', sid);
    if (!target) return false;
    this.delete('PlatformServices', sid);
    this.insert('ActivityLogs', {
      actor_user_id: 1,
      actor_name: 'Administrator',
      action: `Deleted platform service: ${target.name}`,
      category: 'Platform Management',
      details: `Removed service ${target.service_key}`,
    });
    return true;
  }

  getHealthWorkerDashboard(workerId) {
    const worker = this.findById('HealthWorkers', workerId);
    if (!worker) return null;
    const user = this.findById('Users', worker.user_id);
    const assignedPatients = this.getTable('Patients')
      .filter((p) => p.assigned_worker_id === workerId)
      .map((p) => ({ ...p, user: this.findById('Users', p.user_id) }));
    const medicationRequests = this.getTable('MedicationRequests')
      .filter((mr) => mr.reviewed_by_worker_id === workerId || mr.status === 'Pending')
      .map((mr) => {
        const patient = this.findById('Patients', mr.patient_id);
        const patientUser = patient ? this.findById('Users', patient.user_id) : null;
        return { ...mr, patientName: patientUser?.full_name || 'Unknown Patient' };
      });
    const appointments = this.getTable('Appointments')
      .filter((a) => a.worker_id === workerId)
      .map((a) => {
        const patient = this.findById('Patients', a.patient_id);
        const patientUser = patient ? this.findById('Users', patient.user_id) : null;
        return { ...a, patientName: patientUser?.full_name || 'Patient' };
      });
    const groups = this.getTable('SupportGroups').filter((g) => g.facilitator_worker_id === workerId);

    return {
      worker: { ...worker, user },
      assignedPatients,
      medicationRequests,
      appointments,
      groups,
    };
  }

  getAdminPlatformOverview() {
    const users = this.getTable('Users');
    const patients = users.filter((u) => u.role === 'patient');
    const workers = this.getTable('HealthWorkers').map((w) => ({
      ...w,
      user: this.findById('Users', w.user_id),
    }));
    const appointments = this.getTable('Appointments');
    const chatSessions = this.getTable('ChatSessions');
    const services = this.getTable('PlatformServices');
    const logs = this.getTable('ActivityLogs');
    const settings = this.getTable('SystemSettings');

    return {
      totalUsers: users.length,
      patientCount: patients.length,
      workerCount: workers.length,
      monthlyAppointments: appointments.length,
      activeChatSessions: chatSessions.filter((c) => c.status === 'Open').length,
      users,
      workers,
      services,
      logs,
      settings,
    };
  }
}

export const db = new DatabaseService();
export default db;
