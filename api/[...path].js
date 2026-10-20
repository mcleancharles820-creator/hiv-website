const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { isAllowedGender } = require('./genderOptions');
const getFullNameFromParts = require('./accountName');
const isPasswordRecoveryToken = require('./passwordRecoveryToken');
const { isEligibleSupervisor, validateDisplayAlias, validateGroupMessage } = require('./supportGroupPolicy');

const pool = globalThis.hivelinkPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
});
globalThis.hivelinkPool = pool;

function supabaseClients() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error('Supabase Auth environment variables are not configured.');
  if (!globalThis.hivelinkSupabasePublic) {
    globalThis.hivelinkSupabasePublic = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  }
  if (!globalThis.hivelinkSupabaseRecovery) {
    globalThis.hivelinkSupabaseRecovery = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false, flowType: 'implicit' } });
  }
  if (!globalThis.hivelinkSupabaseAdmin) {
    globalThis.hivelinkSupabaseAdmin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  }
  return { publicClient: globalThis.hivelinkSupabasePublic, recoveryClient: globalThis.hivelinkSupabaseRecovery, adminClient: globalThis.hivelinkSupabaseAdmin };
}

const sessionCookie = 'hivelink_session';
const tableConfig = {
  Users: { sql: 'users', id: 'user_id', updated: true, columns: ['full_name', 'email', 'contact_number', 'age', 'date_of_birth', 'gender', 'is_active'] },
  Patients: { sql: 'patients', id: 'patient_id', updated: true, columns: ['care_status', 'medical_notes', 'emergency_contact', 'emergency_phone', 'preferred_facility_id', 'assigned_worker_id'] },
  HealthWorkers: { sql: 'health_workers', id: 'worker_id', updated: true, columns: ['specialty', 'license_number', 'primary_facility_id', 'is_verified', 'is_available', 'bio_summary'] },
  Appointments: { sql: 'appointments', id: 'appointment_id', updated: true, columns: ['patient_id', 'worker_id', 'facility_id', 'appointment_date', 'appointment_time', 'appointment_type', 'status', 'notes'] },
  MedicationRequests: { sql: 'medication_requests', id: 'request_id', updated: true, columns: ['patient_id', 'medication_id', 'medication_name', 'dosage', 'schedule', 'quantity_requested', 'is_refill', 'patient_notes', 'availability', 'status', 'reviewed_by_worker_id', 'review_notes'] },
  ChatSessions: { sql: 'chat_sessions', id: 'chat_session_id', columns: ['patient_id', 'worker_id', 'subject', 'status', 'preview', 'last_updated'] },
  ChatMessages: { sql: 'chat_messages', id: 'message_id', columns: ['chat_session_id', 'sender_user_id', 'sender_role', 'message_text', 'is_read'] },
  SupportGroupMembers: { sql: 'support_group_members', id: 'membership_id', columns: ['group_id', 'patient_id', 'role_in_group'] },
  SupportGroups: { sql: 'support_groups', id: 'group_id', columns: ['name', 'detail', 'schedule', 'target_audience', 'facilitator_worker_id', 'member_count', 'is_active'] },
  PlatformServices: { sql: 'platform_services', id: 'service_id', columns: ['service_key', 'name', 'detail', 'is_enabled', 'display_order'] },
  PublicInquiries: { sql: 'public_inquiries', id: 'inquiry_id', columns: ['first_name', 'email', 'message', 'status', 'assigned_worker_id', 'response_notes'] },
};
const catalogTables = {
  Medications: 'medications', TestingFacilities: 'testing_facilities', EducationalResources: 'educational_resources',
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, private');
  res.end(JSON.stringify(body));
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}


function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const pair = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

function signSession(user) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const passwordChangedAt = user.password_changed_at ? new Date(user.password_changed_at).getTime() : null;
  const payload = Buffer.from(JSON.stringify({ sub: user.user_id, role: user.role, passwordChangedAt, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 })).toString('base64url');
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${crypto.createHmac('sha256', secret).update(unsigned).digest('base64url')}`;
}

async function currentUser(req) {
  const token = getCookie(req, sessionCookie);
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return null;
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;
  const unsigned = `${header}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(unsigned).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  let claims;
  try { claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!claims.sub || claims.exp <= Date.now() / 1000) return null;
  const result = await pool.query('SELECT user_id, email, full_name, role, contact_number, age, date_of_birth, gender, is_active, email_verified, password_changed_at FROM users WHERE user_id = $1', [claims.sub]);
  const profile = result.rows[0];
  if (!profile?.is_active || !profile.email_verified) return null;
  const currentPasswordChangedAt = profile.password_changed_at ? new Date(profile.password_changed_at).getTime() : null;
  if ((claims.passwordChangedAt ?? null) !== currentPasswordChangedAt) return null;
  delete profile.password_changed_at;
  return profile;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`);
}


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

async function sendRegisteredEmail(userId, { subject, text, title = subject, html: customHtml }) {
  const recipient = await pool.query('SELECT email, full_name FROM users WHERE user_id = $1 AND is_active = TRUE', [userId]);
  if (!recipient.rowCount) return { sent: false, error: 'Registered recipient not found.' };
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn('Email delivery skipped: RESEND_API_KEY or EMAIL_FROM is not configured.');
    return { sent: false, error: 'Email delivery is not configured.' };
  }
  const name = recipient.rows[0].full_name;
  const safeTitle = escapeHtml(title);
  const safeName = escapeHtml(name);
  const safeText = escapeHtml(text).replace(/\n/g, '<br>');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [recipient.rows[0].email],
        subject,
        text: `Hello ${name},\n\n${text}\n\nHIVeLink`,
        html: customHtml || `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#54151b"><h1 style="font-size:22px">${safeTitle}</h1><p>Hello ${safeName},</p><p>${safeText}</p><p>HIVeLink</p></div>`,
      }),
    });
    if (!response.ok) {
      console.error('Email provider rejected a message:', response.status);
      return { sent: false, error: 'Email provider rejected the message.' };
    }
    return { sent: true };
  } catch (error) {
    console.error('Email delivery failed:', error.message);
    return { sent: false, error: 'Email delivery failed.' };
  }
}

function applicationUrl() {
  const configured = process.env.APP_URL || process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) return `${configured.startsWith('http') ? configured : `https://${configured}`}`.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000';
}

async function sendVerificationEmail(userId, type = 'signup') {
  const baseUrl = applicationUrl();
  if (!baseUrl) return { sent: false, error: 'APP_URL is not configured.' };
  const profile = await pool.query('SELECT email, supabase_user_id FROM users WHERE user_id = $1 AND is_active = TRUE AND email_verified = FALSE', [userId]);
  if (!profile.rowCount || !profile.rows[0].supabase_user_id) return { sent: false, error: 'Supabase Auth account was not found.' };
  const { publicClient } = supabaseClients();
  const { error } = await publicClient.auth.resend({
    type,
    email: profile.rows[0].email,
    options: { emailRedirectTo: baseUrl },
  });
  if (error) {
    console.error('Supabase verification email failed:', error.message);
    return { sent: false, error: 'Supabase could not send the verification email.' };
  }
  return { sent: true };
}

async function notifyPatientRecord(table, id, subject, text) {
  const relation = table === 'Appointments'
    ? 'SELECT p.user_id FROM appointments r JOIN patients p USING (patient_id) WHERE r.appointment_id = $1'
    : 'SELECT p.user_id FROM medication_requests r JOIN patients p USING (patient_id) WHERE r.request_id = $1';
  const result = await pool.query(relation, [id]);
  if (result.rowCount) await sendRegisteredEmail(result.rows[0].user_id, { subject, text });
}

async function notifyChatCounterparty(chatSessionId, senderRole) {
  const result = await pool.query(
    `SELECT ${senderRole === 'patient' ? 'worker_user.user_id' : 'patient_user.user_id'} AS user_id
     FROM chat_sessions session
     JOIN patients patient ON patient.patient_id = session.patient_id
     JOIN users patient_user ON patient_user.user_id = patient.user_id
    LEFT JOIN health_workers worker ON worker.worker_id = patient.assigned_worker_id
     LEFT JOIN users worker_user ON worker_user.user_id = worker.user_id
     WHERE session.chat_session_id = $1`,
    [chatSessionId],
  );
  if (result.rows[0]?.user_id) {
    await sendRegisteredEmail(result.rows[0].user_id, {
      subject: 'New private support message',
      text: 'You have a new message in HIVeLink. Sign in to view and reply securely.',
    });
  }
}

async function bestEffort(task) {
  try { await task(); } catch (error) { console.error('Email notification failed:', error.message); }
}

async function logActivity(user, action, category, details) {
  try {
    await pool.query(
      'INSERT INTO activity_logs (actor_user_id, actor_name, action, category, details) VALUES ($1,$2,$3,$4,$5)',
      [user.user_id, user.full_name, action, category, details],
    );
  } catch (error) {
    console.error('Could not write activity log:', error.message);
  }
}

async function loadSnapshot(user) {
  const snapshot = { SupportGroupMembers: [], SupportGroupMessages: [] };
  const queries = Object.entries(catalogTables).map(async ([key, table]) => {
    const result = await pool.query(`SELECT * FROM ${table}`);
    snapshot[key] = result.rows;
  });
  queries.push((async () => {
    const rows = await pool.query('SELECT * FROM platform_services ORDER BY display_order');
    snapshot.PlatformServices = rows.rows;
  })());
  queries.push((async () => {
    const rows = await pool.query("SELECT setting_key, setting_value, data_type, description, updated_at FROM system_settings WHERE setting_key IN ('platform_name', 'support_email')");
    snapshot.SystemSettings = rows.rows;
  })());
  queries.push((async () => {
    const rows = await pool.query(
      `SELECT g.group_id, g.name, g.detail, g.schedule, g.is_active,
              g.facilitator_worker_id, w.is_verified AS supervisor_verified,
              w.is_available AS supervisor_available, su.full_name AS supervisor_name,
              su.role AS supervisor_role, su.is_active AS supervisor_active,
              su.email_verified AS supervisor_email_verified
       FROM support_groups g
       LEFT JOIN health_workers w ON w.worker_id = g.facilitator_worker_id
       LEFT JOIN users su ON su.user_id = w.user_id
       WHERE g.is_active = TRUE ORDER BY g.group_id LIMIT 1`,
    );
    const group = rows.rows[0];
    snapshot.SupportGroups = group ? [{
      group_id: group.group_id,
      name: group.name,
      detail: group.detail,
      schedule: group.schedule,
      is_active: group.is_active,
      has_supervisor: isEligibleSupervisor(
        { is_verified: group.supervisor_verified, is_available: group.supervisor_available },
        { role: group.supervisor_role, is_active: group.supervisor_active, email_verified: group.supervisor_email_verified },
      ),
      ...(user.role === 'admin' ? {
        facilitator_worker_id: group.facilitator_worker_id,
        supervisor_name: group.supervisor_name || null,
      } : {}),
    }] : [];
  })());

  if (user.role === 'admin') {
      for (const [key, config] of Object.entries(tableConfig)) {
        if (['PublicInquiries', 'SupportGroupMembers', 'SupportGroups'].includes(key)) continue;
        queries.push((async () => {
          const selection = key === 'Users' ? 'user_id, email, full_name, role, contact_number, date_of_birth, age, gender, terms_accepted, is_active, email_verified, created_at, updated_at' : '*';
        const rows = await pool.query(`SELECT ${selection} FROM ${config.sql}`);
        snapshot[key] = rows.rows;
      })());
    }
    queries.push((async () => { snapshot.ActivityLogs = (await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500')).rows; })());
    queries.push((async () => { snapshot.PublicInquiries = (await pool.query('SELECT * FROM public_inquiries ORDER BY created_at DESC')).rows; })());
  } else if (user.role === 'patient') {
    const patientGroupMembershipQuery = (async () => {
      const activeGroup = await pool.query(
        `SELECT g.group_id,
                EXISTS (
                  SELECT 1 FROM health_workers w JOIN users su ON su.user_id = w.user_id
                  WHERE w.worker_id = g.facilitator_worker_id AND w.is_verified = TRUE
                    AND w.is_available = TRUE AND su.role = 'health-worker'
                    AND su.is_active = TRUE AND su.email_verified = TRUE
                ) AS has_supervisor
         FROM support_groups g WHERE g.is_active = TRUE ORDER BY g.group_id LIMIT 1`,
      );
      const group = activeGroup.rows[0];
      if (!group) return;
      const membership = await pool.query(
        `SELECT sgm.group_id, sgm.display_alias, sgm.joined_at
         FROM support_group_members sgm
         JOIN patients p USING (patient_id)
         WHERE p.user_id = $1 AND sgm.group_id = $2 AND sgm.display_alias IS NOT NULL`,
        [user.user_id, group.group_id],
      );
      snapshot.SupportGroupMembers = membership.rows;
      if (!membership.rowCount || !group.has_supervisor) return;
      snapshot.SupportGroupMessages = (await pool.query(
        `SELECT message_id, group_id, sender_alias, sender_role,
                CASE WHEN is_redacted THEN '[Message removed by the health worker]' ELSE message_text END AS message_text,
                is_redacted, sent_at
         FROM support_group_messages WHERE group_id = $1 AND sent_at > $2
         ORDER BY sent_at, message_id LIMIT 300`,
        [group.group_id, membership.rows[0].joined_at],
      )).rows;
    })();
    queries.push(patientGroupMembershipQuery);
    queries.push((async () => { snapshot.Users = [user]; })());
    queries.push((async () => { snapshot.Patients = (await pool.query('SELECT * FROM patients WHERE user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.Appointments = (await pool.query('SELECT a.* FROM appointments a JOIN patients p USING (patient_id) WHERE p.user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.MedicationRequests = (await pool.query('SELECT m.* FROM medication_requests m JOIN patients p USING (patient_id) WHERE p.user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.ChatSessions = (await pool.query('SELECT c.* FROM chat_sessions c JOIN patients p USING (patient_id) WHERE p.user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.ChatMessages = (await pool.query('SELECT m.* FROM chat_messages m JOIN chat_sessions c USING (chat_session_id) JOIN patients p USING (patient_id) WHERE p.user_id = $1 ORDER BY sent_at', [user.user_id])).rows; })());
  } else if (user.role === 'health-worker') {
    const supervisorMessagesQuery = (async () => {
      const messages = await pool.query(
        `SELECT m.message_id, m.group_id, m.sender_alias, m.sender_role,
                CASE WHEN m.is_redacted THEN '[Message removed by the health worker]' ELSE m.message_text END AS message_text,
                m.is_redacted, m.sent_at
         FROM support_group_messages m
         JOIN support_groups g ON g.group_id = m.group_id AND g.is_active = TRUE
         JOIN health_workers w ON w.worker_id = g.facilitator_worker_id
         JOIN users supervisor ON supervisor.user_id = w.user_id
         WHERE supervisor.user_id = $1 AND w.is_verified = TRUE AND w.is_available = TRUE
           AND supervisor.is_active = TRUE AND supervisor.email_verified = TRUE
         ORDER BY m.sent_at, m.message_id LIMIT 300`,
        [user.user_id],
      );
      snapshot.SupportGroupMessages = messages.rows;
    })();
    queries.push(supervisorMessagesQuery);
    queries.push((async () => { snapshot.Users = [user, ...(await pool.query("SELECT u.user_id, u.email, u.full_name, u.role, u.contact_number, u.date_of_birth, u.age, u.gender, u.is_active, u.email_verified FROM users u JOIN patients p USING (user_id) JOIN health_workers h ON h.worker_id = p.assigned_worker_id WHERE h.user_id = $1", [user.user_id])).rows]; })());
    queries.push((async () => { snapshot.HealthWorkers = (await pool.query('SELECT * FROM health_workers WHERE user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.Patients = (await pool.query('SELECT p.* FROM patients p JOIN health_workers h ON h.worker_id = p.assigned_worker_id WHERE h.user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.Appointments = (await pool.query('SELECT a.* FROM appointments a JOIN patients p USING (patient_id) JOIN health_workers h ON h.worker_id = p.assigned_worker_id WHERE h.user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.MedicationRequests = (await pool.query('SELECT m.* FROM medication_requests m JOIN patients p USING (patient_id) JOIN health_workers h ON h.worker_id = p.assigned_worker_id WHERE h.user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.ChatSessions = (await pool.query('SELECT c.* FROM chat_sessions c JOIN patients p USING (patient_id) JOIN health_workers h ON h.worker_id = p.assigned_worker_id WHERE h.user_id = $1', [user.user_id])).rows; })());
    queries.push((async () => { snapshot.ChatMessages = (await pool.query('SELECT m.* FROM chat_messages m JOIN chat_sessions c USING (chat_session_id) JOIN patients p USING (patient_id) JOIN health_workers h ON h.worker_id = p.assigned_worker_id WHERE h.user_id = $1 ORDER BY sent_at', [user.user_id])).rows; })());
    queries.push((async () => {
      const groups = await pool.query(
        `SELECT g.group_id, g.name, g.detail, g.schedule, g.is_active,
                (g.facilitator_worker_id = h.worker_id AND h.is_verified AND h.is_available
                  AND wu.is_active AND wu.email_verified) AS is_current_user_supervisor,
                EXISTS (SELECT 1 FROM health_workers sw JOIN users su ON su.user_id = sw.user_id
                        WHERE sw.worker_id = g.facilitator_worker_id AND sw.is_verified = TRUE
                          AND sw.is_available = TRUE AND su.is_active = TRUE AND su.email_verified = TRUE) AS has_supervisor
         FROM support_groups g
         JOIN health_workers h ON h.user_id = $1
         JOIN users wu ON wu.user_id = h.user_id
         WHERE g.is_active = TRUE ORDER BY g.group_id LIMIT 1`,
        [user.user_id],
      );
      snapshot.SupportGroups = groups.rows;
    })());
  }
  await Promise.all(queries);
  return snapshot;
}

function allowed(role, table, operation) {
  if (table === 'PublicInquiries' && operation === 'insert') return true;
  if (table === 'SupportGroups' || table === 'SupportGroupMembers') return false;
  if (role === 'admin') return true;
  if (role === 'health-worker') {
    if (table === 'HealthWorkers') return operation === 'update';
    if (table === 'SupportGroups') return ['insert', 'update', 'delete'].includes(operation);
    if (table === 'ChatMessages') return ['insert', 'update'].includes(operation);
    if (['Patients', 'Appointments', 'MedicationRequests', 'ChatSessions'].includes(table)) return operation === 'update';
    return false;
  }
  if (role === 'patient') {
    if (table === 'Users') return operation === 'update';
    if (['Appointments', 'MedicationRequests'].includes(table)) return ['insert', 'update', 'delete'].includes(operation);
    if (table === 'ChatSessions') return operation === 'update';
    if (table === 'ChatMessages') return ['insert', 'update'].includes(operation);
    if (table === 'SupportGroupMembers') return operation === 'insert';
  }
  return false;
}

async function patientIdForUser(userId) {
  const result = await pool.query('SELECT patient_id FROM patients WHERE user_id = $1', [userId]);
  return result.rows[0]?.patient_id;
}

async function verifyRecordAccess(user, table, id, body) {
  if (user.role === 'admin') return true;
  if (table === 'Users') return String(id) === String(user.user_id);
   const patientId = await patientIdForUser(user.user_id);
  if (user.role === 'patient') {
    if (table === 'Appointments' || table === 'MedicationRequests' || table === 'ChatSessions') {
      const config = tableConfig[table];
      const result = await pool.query(`SELECT patient_id FROM ${config.sql} WHERE ${config.id} = $1`, [id]);
      return result.rows[0]?.patient_id === patientId;
    }
    if (table === 'ChatMessages') {
      const incomingRole = user.role === 'patient' ? 'worker' : 'patient';
      const result = await pool.query('SELECT 1 FROM chat_messages m JOIN chat_sessions c USING (chat_session_id) WHERE m.message_id = $1 AND c.patient_id = $2 AND m.sender_role = $3', [id, patientId, incomingRole]);
      return result.rowCount > 0;
    }
    return false;
  }
  if (user.role === 'health-worker') {
    const worker = await pool.query('SELECT worker_id FROM health_workers WHERE user_id = $1', [user.user_id]);
    const workerId = worker.rows[0]?.worker_id;
    if (!workerId) return false;
    if (table === 'HealthWorkers') return String(id) === String(workerId);
    if (table === 'Patients') return (await pool.query('SELECT 1 FROM patients WHERE patient_id = $1 AND assigned_worker_id = $2', [id, workerId])).rowCount > 0;
    if (table === 'Appointments') return (await pool.query('SELECT 1 FROM appointments a JOIN patients p USING (patient_id) WHERE a.appointment_id = $1 AND p.assigned_worker_id = $2', [id, workerId])).rowCount > 0;
    if (table === 'MedicationRequests') return (await pool.query('SELECT 1 FROM medication_requests m JOIN patients p USING (patient_id) WHERE m.request_id = $1 AND p.assigned_worker_id = $2', [id, workerId])).rowCount > 0;
    if (table === 'ChatSessions') return (await pool.query('SELECT 1 FROM chat_sessions c JOIN patients p USING (patient_id) WHERE c.chat_session_id = $1 AND p.assigned_worker_id = $2', [id, workerId])).rowCount > 0;
    if (table === 'ChatMessages') return (await pool.query("SELECT 1 FROM chat_messages m JOIN chat_sessions c USING (chat_session_id) JOIN patients p USING (patient_id) WHERE m.message_id = $1 AND m.sender_role = 'patient' AND p.assigned_worker_id = $2", [id, workerId])).rowCount > 0;
    if (table === 'SupportGroups') return (await pool.query('SELECT 1 FROM support_groups WHERE group_id = $1 AND facilitator_worker_id = $2', [id, workerId])).rowCount > 0;
  }
  return false;
}

async function mutate(req, user, table, id) {
  const config = tableConfig[table];
  if (!config) return { status: 404, body: { error: 'Unknown resource.' } };
   const operation = req.method === 'POST' ? 'insert' : req.method === 'PATCH' ? 'update' : req.method === 'DELETE' ? 'delete' : null;
  if (!operation || !allowed(user?.role, table, operation)) return { status: 403, body: { error: 'You are not allowed to modify this resource.' } };
  const body = getBody(req);
  const record = body.record || body;
  if (table === 'PublicInquiries' && operation === 'insert') {
    const result = await pool.query('INSERT INTO public_inquiries (first_name, email, message) VALUES ($1, $2, $3) RETURNING inquiry_id, first_name, status, created_at', [String(record.first_name || '').trim(), String(record.email || '').trim().toLowerCase(), String(record.message || '').trim()]);
    return { status: 201, body: { record: result.rows[0] } };
  }
  if (!user) return { status: 401, body: { error: 'Sign in required.' } };
  if (operation !== 'insert' && !(await verifyRecordAccess(user, table, id, record))) return { status: 404, body: { error: 'Record not found.' } };

  const values = {};
  for (const column of config.columns) if (Object.prototype.hasOwnProperty.call(record, column)) values[column] = record[column];
  if (table === 'Users' && values.gender !== undefined && !isAllowedGender(values.gender, user.role === 'health-worker' ? 'health-worker' : 'patient')) {
    return { status: 400, body: { error: user.role === 'health-worker' ? 'Choose Male or Female for health worker gender.' : 'Choose Male, Female, or Other for gender.' } };
  }
  if (user.role === 'patient' && table === 'Users' && values.email) {
    const current = await pool.query('SELECT email FROM users WHERE user_id = $1', [user.user_id]);
    if (String(values.email).trim().toLowerCase() !== current.rows[0]?.email) return { status: 400, body: { error: 'Changing account email is not available yet. Contact an administrator.' } };
  }
  if (user.role === 'health-worker') {
    if (table === 'HealthWorkers') {
      for (const key of Object.keys(values)) if (key !== 'is_available') delete values[key];
    } else if (table === 'Patients') {
      for (const key of Object.keys(values)) if (!['care_status', 'medical_notes'].includes(key)) delete values[key];
    } else if (table === 'Appointments' || table === 'MedicationRequests') {
      for (const key of Object.keys(values)) if (!['status', 'reviewed_by_worker_id', 'review_notes'].includes(key)) delete values[key];
    } else if (table === 'ChatSessions') {
      for (const key of Object.keys(values)) if (!['status', 'preview', 'last_updated'].includes(key)) delete values[key];
    } else if (table === 'SupportGroups') {
      for (const key of Object.keys(values)) if (!['name', 'detail', 'schedule', 'target_audience'].includes(key)) delete values[key];
      values.facilitator_worker_id = (await pool.query('SELECT worker_id FROM health_workers WHERE user_id = $1', [user.user_id])).rows[0]?.worker_id;
    }
  }
  if (user.role === 'patient') {
    if (table === 'Users') {
      for (const key of Object.keys(values)) if (!['full_name', 'email', 'contact_number'].includes(key)) delete values[key];
    } else if (table === 'Appointments') {
       for (const key of Object.keys(values)) if (!['appointment_date', 'appointment_time', 'appointment_type', 'facility_id', 'notes', 'status'].includes(key)) delete values[key];
       if (values.status && !['Requested', 'Cancelled'].includes(values.status)) return { status: 403, body: { error: 'Patients may only cancel or request appointments.' } };
    } else if (table === 'MedicationRequests') {
      for (const key of Object.keys(values)) if (!['medication_id', 'medication_name', 'dosage', 'schedule', 'quantity_requested', 'is_refill', 'patient_notes', 'availability', 'status'].includes(key)) delete values[key];
      if (values.status && values.status !== 'Cancelled') return { status: 403, body: { error: 'Patients may only cancel medication requests.' } };
      if (operation === 'update') {
        for (const [key, maxLength] of [['medication_name', 150], ['dosage', 100], ['schedule', 150]]) {
          if (Object.prototype.hasOwnProperty.call(values, key)) {
            values[key] = String(values[key] || '').trim();
            if (!values[key] || values[key].length > maxLength) return { status: 400, body: { error: 'Medication details are required and must fit their field limits.' } };
          }
        }
        if (Object.prototype.hasOwnProperty.call(values, 'quantity_requested')) {
          values.quantity_requested = Number(values.quantity_requested);
          if (!Number.isSafeInteger(values.quantity_requested) || values.quantity_requested < 1 || values.quantity_requested > 1000) return { status: 400, body: { error: 'Quantity must be a whole number from 1 to 1000.' } };
        }
        if (Object.prototype.hasOwnProperty.call(values, 'is_refill') && typeof values.is_refill !== 'boolean') return { status: 400, body: { error: 'Refill must be true or false.' } };
        if (Object.prototype.hasOwnProperty.call(values, 'patient_notes')) {
          values.patient_notes = String(values.patient_notes || '').trim();
          if (values.patient_notes.length > 500) return { status: 400, body: { error: 'Care team notes must be 500 characters or fewer.' } };
        }
      }
    } else if (table === 'ChatSessions') {
      for (const key of Object.keys(values)) if (!['preview', 'last_updated'].includes(key)) delete values[key];
    }
  }
  if (table === 'ChatMessages' && operation === 'update') {
    for (const key of Object.keys(values)) if (key !== 'is_read') delete values[key];
    if (values.is_read !== true) return { status: 403, body: { error: 'Messages may only be marked as read.' } };
  }
  if (table === 'Appointments' && operation === 'update' && user.role === 'patient') {
    if (Object.prototype.hasOwnProperty.call(values, 'facility_id')) {
      const facilityId = Number(values.facility_id);
      if (!Number.isSafeInteger(facilityId) || facilityId < 1) return { status: 400, body: { error: 'Choose an active clinic for your appointment request.' } };
      const facility = await pool.query('SELECT facility_id FROM testing_facilities WHERE facility_id = $1 AND is_active = TRUE', [facilityId]);
      if (!facility.rowCount) return { status: 400, body: { error: 'That clinic is unavailable. Choose another active clinic.' } };
      values.facility_id = facilityId;
    }
    if (Object.prototype.hasOwnProperty.call(values, 'appointment_date')) {
      const requestedDate = String(values.appointment_date || '').trim();
      const dateParts = requestedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const validDate = dateParts && new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))).toISOString().slice(0, 10) === requestedDate;
      const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const today = `${todayParts.find((part) => part.type === 'year')?.value}-${todayParts.find((part) => part.type === 'month')?.value}-${todayParts.find((part) => part.type === 'day')?.value}`;
      if (!validDate || requestedDate < today) return { status: 400, body: { error: 'Choose today or a future date for your appointment request.' } };
    }
    if (Object.prototype.hasOwnProperty.call(values, 'appointment_time') && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(values.appointment_time || '').trim())) return { status: 400, body: { error: 'Choose a valid preferred appointment time.' } };
    if (Object.prototype.hasOwnProperty.call(values, 'appointment_type')) {
      values.appointment_type = String(values.appointment_type || '').trim();
      if (!values.appointment_type || values.appointment_type.length > 100) return { status: 400, body: { error: 'Choose a visit reason of 1–100 characters.' } };
    }
    if (Object.prototype.hasOwnProperty.call(values, 'notes')) {
      values.notes = String(values.notes || '').trim();
      if (values.notes.length > 500) return { status: 400, body: { error: 'Appointment notes must be 500 characters or fewer.' } };
    }
  }
  if (user.role === 'health-worker' && table === 'Appointments' && operation === 'update'
      && values.status && !['Requested', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'].includes(values.status)) {
    return { status: 400, body: { error: 'Choose a valid appointment status.' } };
  }
  if (table === 'Appointments' && operation === 'insert') {
    if (user.role === 'patient') {
      const testingService = await pool.query("SELECT is_enabled FROM platform_services WHERE service_key = 'testing_referrals'");
      if (testingService.rows[0]?.is_enabled !== true) return { status: 403, body: { error: 'Appointment requests are currently unavailable.' } };
      values.patient_id = await patientIdForUser(user.user_id);
      if (!values.patient_id) return { status: 403, body: { error: 'Your patient record is unavailable. Please sign in again.' } };
      values.worker_id = null;
      values.status = 'Requested';
      values.appointment_type = String(values.appointment_type || '').trim();
      values.appointment_time = String(values.appointment_time || '').trim();
      values.notes = String(values.notes || '').trim();
      const facilityId = Number(values.facility_id);
      if (!Number.isSafeInteger(facilityId) || facilityId < 1) return { status: 400, body: { error: 'Choose an active clinic for your appointment request.' } };
      const facility = await pool.query('SELECT facility_id FROM testing_facilities WHERE facility_id = $1 AND is_active = TRUE', [facilityId]);
      if (!facility.rowCount) return { status: 400, body: { error: 'That clinic is unavailable. Choose another active clinic.' } };
      values.facility_id = facilityId;
      const requestedDate = String(values.appointment_date || '').trim();
      const dateParts = requestedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const validDate = dateParts && new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))).toISOString().slice(0, 10) === requestedDate;
      const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const today = `${todayParts.find((part) => part.type === 'year')?.value}-${todayParts.find((part) => part.type === 'month')?.value}-${todayParts.find((part) => part.type === 'day')?.value}`;
      if (!validDate || requestedDate < today) return { status: 400, body: { error: 'Choose today or a future date for your appointment request.' } };
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.appointment_time)) return { status: 400, body: { error: 'Choose a valid preferred appointment time.' } };
      if (!values.appointment_type || values.appointment_type.length > 100) return { status: 400, body: { error: 'Choose a visit reason of 1–100 characters.' } };
      if (values.notes.length > 500) return { status: 400, body: { error: 'Appointment notes must be 500 characters or fewer.' } };
    } else if (!values.appointment_date || !values.appointment_time || !values.appointment_type) {
      return { status: 400, body: { error: 'Appointment date, time, and type are required.' } };
    }
  }
  if (table === 'MedicationRequests' && operation === 'insert' && user.role === 'patient') {
    values.patient_id = await patientIdForUser(user.user_id);
    values.status = 'Pending';
    values.medication_name = String(values.medication_name || '').trim();
    values.dosage = String(values.dosage || '').trim();
    values.schedule = String(values.schedule || '').trim();
    values.quantity_requested = Number(values.quantity_requested);
    if (typeof values.is_refill !== 'boolean') return { status: 400, body: { error: 'Refill must be true or false.' } };
    values.patient_notes = String(values.patient_notes || '').trim();
    if (!values.patient_id) return { status: 403, body: { error: 'Your patient record is unavailable. Please sign in again.' } };
    if (!values.medication_name || values.medication_name.length > 150 || !values.dosage || values.dosage.length > 100 || !values.schedule || values.schedule.length > 150) return { status: 400, body: { error: 'Medication, prescribed dosage, and schedule are required and must fit their field limits.' } };
    if (!Number.isSafeInteger(values.quantity_requested) || values.quantity_requested < 1 || values.quantity_requested > 1000) return { status: 400, body: { error: 'Quantity must be a whole number from 1 to 1000.' } };
    if (values.medication_id !== undefined && values.medication_id !== null) {
      values.medication_id = Number(values.medication_id);
      if (!Number.isSafeInteger(values.medication_id) || values.medication_id < 1) return { status: 400, body: { error: 'Choose a valid medication.' } };
    }
    if (values.patient_notes.length > 500) return { status: 400, body: { error: 'Care team notes must be 500 characters or fewer.' } };
  }
  if (table === 'ChatMessages' && operation === 'insert') {
    values.sender_user_id = user.user_id;
    values.sender_role = user.role === 'health-worker' ? 'worker' : user.role;
    if (!values.message_text?.trim()) return { status: 400, body: { error: 'Message cannot be empty.' } };
    const access = user.role === 'patient'
      ? await pool.query('SELECT 1 FROM chat_sessions WHERE chat_session_id = $1 AND patient_id = $2', [values.chat_session_id, await patientIdForUser(user.user_id)])
      : await pool.query('SELECT 1 FROM chat_sessions c JOIN patients p USING (patient_id) JOIN health_workers h ON h.worker_id = p.assigned_worker_id WHERE c.chat_session_id = $1 AND h.user_id = $2', [values.chat_session_id, user.user_id]);
    if (!access.rowCount) return { status: 404, body: { error: 'Chat session not found.' } };
  }
  if (operation === 'insert' && user.role === 'patient' && table === 'SupportGroupMembers') values.patient_id = await patientIdForUser(user.user_id);
  if (operation === 'insert') {
    const keys = Object.keys(values);
    if (!keys.length) return { status: 400, body: { error: 'No valid fields provided.' } };
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const result = await pool.query(`INSERT INTO ${config.sql} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, keys.map((key) => values[key]));
    if (table === 'ChatMessages') {
      await pool.query('UPDATE chat_sessions SET preview = $1, last_updated = NOW() WHERE chat_session_id = $2', [values.message_text, values.chat_session_id]);
    }
    return { status: 201, body: { record: result.rows[0] } };
  }
  if (operation === 'delete') {
    const result = await pool.query(`DELETE FROM ${config.sql} WHERE ${config.id} = $1 RETURNING ${config.id}`, [id]);
    return { status: result.rowCount ? 200 : 404, body: { deleted: result.rowCount > 0 } };
  }
  const keys = Object.keys(values);
  if (!keys.length) return { status: 400, body: { error: 'No valid fields provided.' } };
  const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
  if (config.updated) assignments.push('updated_at = NOW()');
  const result = await pool.query(`UPDATE ${config.sql} SET ${assignments.join(', ')} WHERE ${config.id} = $${keys.length + 1} RETURNING *`, [...keys.map((key) => values[key]), id]);
  return { status: result.rowCount ? 200 : 404, body: { record: result.rows[0] || null } };
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  const pathname = new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (pathname === '/api/health' && req.method === 'GET') {
    if (!process.env.DATABASE_URL) return send(res, 503, { status: 'not-configured', error: 'DATABASE_URL is not configured.' });
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return send(res, 503, { status: 'not-configured', error: 'Supabase Auth is not configured.' });
    try { await pool.query('SELECT 1'); return send(res, 200, { status: 'ok' }); }
    catch { return send(res, 503, { status: 'unavailable' }); }
  }
  if (!process.env.DATABASE_URL) return send(res, 503, { error: 'Backend database is not configured.' });
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return send(res, 503, { error: 'SESSION_SECRET must contain at least 32 characters.' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return send(res, 503, { error: 'Supabase Auth environment variables are not configured.' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    try {
      if (new URL(req.headers.origin).host !== forwardedHost) return send(res, 403, { error: 'Cross-origin requests are not allowed.' });
    } catch {
      return send(res, 403, { error: 'Invalid request origin.' });
    }
  }
  try {
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      if (!applicationUrl()) return send(res, 503, { error: 'APP_URL is not configured.' });
      const body = getBody(req);
      const { fullName, error: nameError } = getFullNameFromParts(body);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (nameError) return send(res, 400, { error: nameError });
      if (!isAllowedGender(body.gender, 'patient')) return send(res, 400, { error: 'Choose Male, Female, or Other for gender.' });
      if (!email || password.length < 12) return send(res, 400, { error: 'Email and a password of at least 12 characters are required.' });
      const { publicClient, adminClient } = supabaseClients();
      const { data: authData, error: authError } = await publicClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: applicationUrl() },
      });
      if (authError || !authData.user) return send(res, 400, { error: authError?.message || 'Could not create the Supabase Auth account.' });
      if (authData.user.identities && authData.user.identities.length === 0) return send(res, 409, { error: 'An account with this email already exists.' });
      const emailVerified = Boolean(authData.user.email_confirmed_at);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const inserted = await client.query('INSERT INTO users (supabase_user_id, email, password_hash, full_name, role, contact_number, date_of_birth, age, gender, terms_accepted, email_verified) VALUES ($1,$2,NULL,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING user_id, supabase_user_id, email, full_name, role, contact_number, date_of_birth, age, gender, is_active, email_verified', [authData.user.id, email, fullName, 'patient', body.contactNumber || null, body.dateOfBirth || null, body.age || null, body.gender || null, Boolean(body.termsAccepted), emailVerified]);
        const patient = await client.query("INSERT INTO patients (user_id, preferred_facility_id, care_status, medical_notes) VALUES ($1, 1, 'Active care plan', 'Newly registered patient account.') RETURNING *", [inserted.rows[0].user_id]);
        await client.query("INSERT INTO chat_sessions (patient_id, subject, status, preview) VALUES ($1, 'Welcome to private support', 'Open', 'A health worker will be ready to answer your questions.')", [patient.rows[0].patient_id]);
        await client.query('COMMIT');
        const user = inserted.rows[0];
        if (emailVerified && authData.session) setSessionCookie(res, signSession(user));
        return send(res, 201, emailVerified && authData.session
          ? { user, patient: patient.rows[0], worker: null, realtimeSession: authData.session }
          : { verificationRequired: true, email: user.email });
      } catch (error) {
        await client.query('ROLLBACK');
        await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {});
        if (error.code === '23505') return send(res, 409, { error: 'An account with this email already exists.' });
        if (['23514', '22007', '22003'].includes(error.code)) return send(res, 400, { error: 'Some registration details are invalid.' });
        throw error;
      } finally { client.release(); }
    }
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = getBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const { publicClient, adminClient } = supabaseClients();
      let profile = (await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email])).rows[0];
      if (!profile) return send(res, 401, { error: 'Email or password is incorrect.' });
      let supabaseUserId = profile.supabase_user_id;
      let realtimeSession = null;
      if (!supabaseUserId) {
        if (!profile.password_hash || !(await bcrypt.compare(String(body.password || ''), profile.password_hash))) return send(res, 401, { error: 'Email or password is incorrect.' });
        const { data: legacyAuth, error: legacyError } = await adminClient.auth.admin.createUser({
          email,
          password: String(body.password || ''),
          email_confirm: true,
          user_metadata: { full_name: profile.full_name },
        });
        if (legacyError || !legacyAuth.user) return send(res, 401, { error: 'Email or password is incorrect.' });
        supabaseUserId = legacyAuth.user.id;
        profile = (await pool.query('UPDATE users SET supabase_user_id = $1, password_hash = NULL, email_verified = TRUE, updated_at = NOW() WHERE user_id = $2 RETURNING *', [supabaseUserId, profile.user_id])).rows[0];
        const { data: legacySession, error: legacySessionError } = await publicClient.auth.signInWithPassword({ email, password: String(body.password || '') });
        if (legacySessionError || !legacySession.session) return send(res, 500, { error: 'The account was migrated but its session could not be started. Try signing in again.' });
        realtimeSession = legacySession.session;
      } else {
        const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({ email, password: String(body.password || '') });
        if (authError || !authData.user) {
          if (/email not confirmed/i.test(authError?.message || '')) return send(res, 403, { error: 'Please verify your email before signing in.' });
          return send(res, 401, { error: 'Email or password is incorrect.' });
        }
        if (!authData.user.email_confirmed_at) return send(res, 403, { error: 'Please verify your email before signing in.' });
        realtimeSession = authData.session;
        profile = (await pool.query('UPDATE users SET email_verified = TRUE, password_hash = NULL, updated_at = NOW() WHERE user_id = $1 RETURNING *', [profile.user_id])).rows[0];
      }
      const user = { ...profile };
      delete user.password_hash;
      setSessionCookie(res, signSession(user));
      const patient = user.role === 'patient' ? (await pool.query('SELECT * FROM patients WHERE user_id = $1', [user.user_id])).rows[0] : null;
      const worker = user.role === 'health-worker' ? (await pool.query('SELECT * FROM health_workers WHERE user_id = $1', [user.user_id])).rows[0] : null;
      return send(res, 200, { user, patient: patient || null, worker: worker || null, realtimeSession });
    }
    if (pathname === '/api/auth/password-reset' && req.method === 'POST') {
      if (!applicationUrl()) return send(res, 503, { error: 'APP_URL is not configured.' });
      const email = String(getBody(req).email || '').trim().toLowerCase();
      if (!email || email.length > 255) return send(res, 400, { error: 'Enter a valid email address.' });

      try {
        const profileResult = await pool.query(
          'SELECT user_id, email, full_name, email_verified, supabase_user_id FROM users WHERE LOWER(email) = $1 AND is_active = TRUE LIMIT 1',
          [email],
        );
        const profile = profileResult.rows[0];
        if (profile?.email_verified) {
          const { adminClient } = supabaseClients();
          let supabaseUserId = profile.supabase_user_id;

          if (!supabaseUserId) {
            const createdAuth = await adminClient.auth.admin.createUser({
              email: profile.email,
              password: crypto.randomBytes(48).toString('base64url'),
              email_confirm: true,
              user_metadata: { full_name: profile.full_name },
            });
            if (createdAuth.error || !createdAuth.data.user) throw createdAuth.error || new Error('Could not prepare password recovery.');
            supabaseUserId = createdAuth.data.user.id;
            await pool.query(
              'UPDATE users SET supabase_user_id = $1, password_hash = NULL, updated_at = NOW() WHERE user_id = $2 AND supabase_user_id IS NULL',
              [supabaseUserId, profile.user_id],
            );
          }

          const { recoveryClient } = supabaseClients();
          const { error: resetError } = await recoveryClient.auth.resetPasswordForEmail(profile.email, {
            redirectTo: `${applicationUrl()}/?password-reset=1`,
          });
          if (resetError) throw resetError;
        }
      } catch (error) {
        console.error('Password reset email could not be requested:', error.message);
      }

      return send(res, 200, { ok: true, message: 'If an active account exists for that email, a password reset link has been sent.' });
    }
    if (pathname === '/api/auth/password-reset/confirm' && req.method === 'POST') {
      const body = getBody(req);
      const accessToken = String(body.accessToken || '');
      const password = String(body.password || '');
      if (!accessToken || password.length < 12) return send(res, 400, { error: 'The reset link and a password of at least 12 characters are required.' });
      if (/^Bearer\s/i.test(accessToken)) return send(res, 400, { error: 'The password reset link is invalid or expired.' });

      const { publicClient, adminClient } = supabaseClients();
      const { data: authData, error: tokenError } = await publicClient.auth.getUser(accessToken);
      if (tokenError || !authData.user?.id || !authData.user.email) {
        return send(res, 400, { error: 'The password reset link is invalid or has expired. Request a new link and try again.' });
      }
      if (!isPasswordRecoveryToken(accessToken)) {
        return send(res, 403, { error: 'Use a valid password reset link to change this password.' });
      }
      if (password.toLowerCase() === authData.user.email.toLowerCase()) {
        return send(res, 400, { error: 'Password cannot be the same as your email address.' });
      }

      const profile = await pool.query(
        'SELECT user_id, email FROM users WHERE supabase_user_id = $1 AND is_active = TRUE AND email_verified = TRUE',
        [authData.user.id],
      );
      if (!profile.rowCount || profile.rows[0].email.toLowerCase() !== authData.user.email.toLowerCase()) {
        return send(res, 400, { error: 'This reset link is not connected to an active account.' });
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(authData.user.id, { password });
      if (updateError) return send(res, 400, { error: 'The password could not be updated. Request a new reset link and try again.' });

      await pool.query(
        'UPDATE users SET password_hash = NULL, password_changed_at = NOW(), updated_at = NOW() WHERE user_id = $1',
        [profile.rows[0].user_id],
      );
      const { error: revokeError } = await adminClient.auth.admin.signOut(accessToken, 'global');
      if (revokeError) console.error('Could not revoke Supabase sessions after password reset:', revokeError.message);
      res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
      return send(res, 200, { ok: true, message: 'Your password has been changed. Sign in with your new password.' });
    }
    if (pathname === '/api/auth/resend-verification' && req.method === 'POST') {
      if (!applicationUrl()) return send(res, 503, { error: 'APP_URL is not configured.' });
      const body = getBody(req);
      let result;
      if (body.userId !== undefined) {
        const requester = await currentUser(req);
        if (requester?.role !== 'admin') return send(res, requester ? 403 : 401, { error: 'Administrator access required.' });
        const userId = Number(body.userId);
        if (!Number.isSafeInteger(userId) || userId < 1) return send(res, 400, { error: 'A valid registered user ID is required.' });
        result = await pool.query('SELECT user_id, email_verified FROM users WHERE user_id = $1 AND is_active = TRUE', [userId]);
      } else {
        const email = String(body.email || '').trim().toLowerCase();
        result = await pool.query('SELECT user_id, email_verified FROM users WHERE email = $1 AND is_active = TRUE', [email]);
      }
      if (result.rows[0] && !result.rows[0].email_verified) {
        const delivery = await sendVerificationEmail(result.rows[0].user_id);
        if (!delivery.sent) return send(res, 502, { error: 'The verification email could not be sent. Try again later.' });
      }
      return send(res, 200, { ok: true, message: 'If the account needs verification, a new link has been sent.' });
    }
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
      return send(res, 200, { ok: true });
    }
    const user = await currentUser(req);
    if (pathname === '/api/worker/claimable-patients' && req.method === 'GET') {
      if (user?.role !== 'health-worker') return send(res, user ? 403 : 401, { error: 'Health worker access required.' });
      const result = await pool.query(
        `SELECT p.patient_id, p.care_status, p.preferred_facility_id, p.created_at, u.full_name
         FROM patients p JOIN users u USING (user_id)
         JOIN health_workers h ON h.user_id = $1
         JOIN users worker_user ON worker_user.user_id = h.user_id
         WHERE p.assigned_worker_id IS NULL AND u.is_active = TRUE
           AND h.is_verified = TRUE AND h.is_available = TRUE
           AND worker_user.is_active = TRUE AND worker_user.email_verified = TRUE
           AND (h.primary_facility_id IS NULL OR p.preferred_facility_id IS NULL OR p.preferred_facility_id = h.primary_facility_id)
         ORDER BY p.created_at ASC`,
        [user.user_id],
      );
      return send(res, 200, { patients: result.rows });
    }
    if (pathname === '/api/worker/claim-patient' && req.method === 'POST') {
      if (user?.role !== 'health-worker') return send(res, user ? 403 : 401, { error: 'Health worker access required.' });
      const patientId = Number(getBody(req).patientId);
      if (!Number.isSafeInteger(patientId) || patientId < 1) return send(res, 400, { error: 'A valid patient ID is required.' });
      const claimed = await pool.query(
        `UPDATE patients p SET assigned_worker_id = h.worker_id, updated_at = NOW()
         FROM health_workers h, users worker_user
         WHERE h.user_id = $1 AND h.is_verified = TRUE AND h.is_available = TRUE
           AND worker_user.is_active = TRUE AND worker_user.email_verified = TRUE
           AND worker_user.user_id = h.user_id
           AND p.patient_id = $2 AND p.assigned_worker_id IS NULL
           AND EXISTS (SELECT 1 FROM users patient_user WHERE patient_user.user_id = p.user_id AND patient_user.is_active = TRUE)
           AND (h.primary_facility_id IS NULL OR p.preferred_facility_id IS NULL OR p.preferred_facility_id = h.primary_facility_id)
         RETURNING p.*`,
        [user.user_id, patientId],
      );
      if (!claimed.rowCount) return send(res, 409, { error: 'This patient is no longer available to claim, or is outside your assigned facility.' });
      await pool.query('INSERT INTO activity_logs (actor_user_id, actor_name, action, category, details) VALUES ($1,$2,$3,$4,$5)', [user.user_id, user.full_name, 'Claimed patient assignment', 'Care Team Management', `Claimed patient ID #${patientId}`]);
      return send(res, 200, { patient: claimed.rows[0] });
    }
    if (pathname === '/api/chat/session' && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Sign in required.' });
      if (user.role !== 'patient') return send(res, 403, { error: 'Patient access required.' });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const patientResult = await client.query(
          'SELECT patient_id, assigned_worker_id FROM patients WHERE user_id = $1 FOR UPDATE',
          [user.user_id],
        );
        const patient = patientResult.rows[0];
        if (!patient) {
          await client.query('ROLLBACK');
          return send(res, 404, { error: 'Patient profile not found.' });
        }

        const preferredSessionId = Number(getBody(req).preferredChatSessionId);
        if (Number.isSafeInteger(preferredSessionId) && preferredSessionId > 0) {
          const preferred = await client.query(
            'SELECT * FROM chat_sessions WHERE chat_session_id = $1 AND patient_id = $2',
            [preferredSessionId, patient.patient_id],
          );
          if (preferred.rowCount) {
            await client.query('COMMIT');
            return send(res, 200, { session: preferred.rows[0] });
          }
        }

        const existing = await client.query(
          'SELECT * FROM chat_sessions WHERE patient_id = $1 ORDER BY last_updated DESC, chat_session_id DESC LIMIT 1',
          [patient.patient_id],
        );
        if (existing.rowCount) {
          await client.query('COMMIT');
          return send(res, 200, { session: existing.rows[0] });
        }

        const created = await client.query(
          `INSERT INTO chat_sessions (patient_id, worker_id, subject, status, preview)
           VALUES ($1, $2, 'Welcome to private support', 'Open', 'A health worker will be ready to answer your questions.')
           RETURNING *`,
          [patient.patient_id, patient.assigned_worker_id],
        );
        await client.query('COMMIT');
        return send(res, 201, { session: created.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (pathname === '/api/support-group/state' && req.method === 'GET') {
      if (!user || !['patient', 'health-worker'].includes(user.role)) return send(res, user ? 403 : 401, { error: 'Group access required.' });
      const activeResult = await pool.query(
        `SELECT g.group_id, g.name, g.detail, g.schedule, g.is_active,
                g.facilitator_worker_id, w.is_verified AS supervisor_verified,
                w.is_available AS supervisor_available, su.user_id AS supervisor_user_id,
                su.role AS supervisor_role, su.is_active AS supervisor_active,
                su.email_verified AS supervisor_email_verified
         FROM support_groups g
         LEFT JOIN health_workers w ON w.worker_id = g.facilitator_worker_id
         LEFT JOIN users su ON su.user_id = w.user_id
         WHERE g.is_active = TRUE ORDER BY g.group_id LIMIT 1`,
      );
      const row = activeResult.rows[0];
      if (!row) return send(res, 200, { group: null, membership: null, messages: [] });
      const hasSupervisor = isEligibleSupervisor(
        { is_verified: row.supervisor_verified, is_available: row.supervisor_available },
        { role: row.supervisor_role, is_active: row.supervisor_active, email_verified: row.supervisor_email_verified },
      );
      const group = {
        group_id: row.group_id,
        name: row.name,
        detail: row.detail,
        schedule: row.schedule,
        is_active: row.is_active,
        has_supervisor: hasSupervisor,
      };
      let membership = null;
      let canRead = false;
      if (user.role === 'patient') {
        const membershipResult = await pool.query(
          `SELECT sgm.group_id, sgm.display_alias, sgm.joined_at
           FROM support_group_members sgm JOIN patients p USING (patient_id)
           WHERE sgm.group_id = $1 AND p.user_id = $2 AND sgm.display_alias IS NOT NULL`,
          [row.group_id, user.user_id],
        );
        membership = membershipResult.rows[0] || null;
        canRead = Boolean(membership && hasSupervisor);
      } else {
        const currentSupervisor = hasSupervisor && Number(row.supervisor_user_id) === Number(user.user_id);
        group.is_current_user_supervisor = currentSupervisor;
        canRead = currentSupervisor;
      }
      let messages = [];
      if (canRead) {
        const params = [row.group_id];
        let joinedAtFilter = '';
        if (membership) {
          params.push(membership.joined_at);
          joinedAtFilter = 'AND sent_at > $2';
        }
        messages = (await pool.query(
          `SELECT message_id, group_id, sender_alias, sender_role,
                  CASE WHEN is_redacted THEN '[Message removed by the health worker]' ELSE message_text END AS message_text,
                  is_redacted, sent_at
           FROM support_group_messages
           WHERE group_id = $1 ${joinedAtFilter}
           ORDER BY sent_at, message_id LIMIT 300`,
          params,
        )).rows;
      }
      return send(res, 200, { group, membership, messages });
    }
    if (pathname === '/api/support-group/join' && req.method === 'POST') {
      if (user?.role !== 'patient') return send(res, user ? 403 : 401, { error: 'Patient access required.' });
      const { alias, error: aliasError } = validateDisplayAlias(getBody(req).alias, { fullName: user.full_name, email: user.email });
      if (aliasError) return send(res, 400, { error: aliasError });
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const activeGroup = await client.query(
          `SELECT g.group_id FROM support_groups g
           JOIN health_workers w ON w.worker_id = g.facilitator_worker_id
           JOIN users supervisor ON supervisor.user_id = w.user_id
           WHERE g.is_active = TRUE AND w.is_verified = TRUE AND w.is_available = TRUE
             AND supervisor.role = 'health-worker' AND supervisor.is_active = TRUE AND supervisor.email_verified = TRUE
           ORDER BY g.group_id LIMIT 1 FOR UPDATE OF g`,
        );
        if (!activeGroup.rowCount) {
          await client.query('ROLLBACK');
          return send(res, 409, { error: 'The private group is unavailable until its verified health-worker supervisor is assigned.' });
        }
        const patient = await client.query('SELECT patient_id FROM patients WHERE user_id = $1', [user.user_id]);
        if (!patient.rowCount) {
          await client.query('ROLLBACK');
          return send(res, 404, { error: 'Patient profile not found.' });
        }
        const existing = await client.query(
          'SELECT display_alias FROM support_group_members WHERE group_id = $1 AND patient_id = $2',
          [activeGroup.rows[0].group_id, patient.rows[0].patient_id],
        );
        if (existing.rows[0]?.display_alias) {
          await client.query('ROLLBACK');
          return send(res, 409, { error: 'You have already joined this group.' });
        }
        const aliasUsed = await client.query(
          `SELECT 1 FROM support_group_members
             WHERE group_id = $1 AND LOWER(display_alias) = LOWER($2)
           UNION ALL
           SELECT 1 FROM support_group_messages
             WHERE group_id = $1 AND sender_role = 'member' AND LOWER(sender_alias) = LOWER($2)
           LIMIT 1`,
          [activeGroup.rows[0].group_id, alias],
        );
        if (aliasUsed.rowCount) {
          await client.query('ROLLBACK');
          return send(res, 409, { error: 'That alias is already in use. Choose another display alias.' });
        }
        const joined = await client.query(
          `INSERT INTO support_group_members (group_id, patient_id, role_in_group, display_alias)
           VALUES ($1, $2, 'Member', $3)
           ON CONFLICT (group_id, patient_id) DO UPDATE
             SET display_alias = EXCLUDED.display_alias, joined_at = NOW()
           RETURNING group_id, display_alias, joined_at`,
          [activeGroup.rows[0].group_id, patient.rows[0].patient_id, alias],
        );
        await client.query('COMMIT');
        return send(res, 201, { membership: joined.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') return send(res, 409, { error: 'That alias is already in use. Choose another display alias.' });
        throw error;
      } finally { client.release(); }
    }
    if (pathname === '/api/support-group/leave' && req.method === 'POST') {
      if (user?.role !== 'patient') return send(res, user ? 403 : 401, { error: 'Patient access required.' });
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT group_id FROM support_groups WHERE is_active = TRUE ORDER BY group_id LIMIT 1 FOR UPDATE');
        const result = await client.query(
          `DELETE FROM support_group_members sgm USING patients p, support_groups g
           WHERE sgm.patient_id = p.patient_id AND p.user_id = $1
             AND g.group_id = sgm.group_id AND g.is_active = TRUE`,
          [user.user_id],
        );
        await client.query('COMMIT');
        return send(res, 200, { ok: true, left: result.rowCount > 0 });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }
    if (pathname === '/api/support-group/messages' && req.method === 'POST') {
      if (!user || !['patient', 'health-worker'].includes(user.role)) return send(res, user ? 403 : 401, { error: 'Group access required.' });
      const { messageText, error: messageError } = validateGroupMessage(getBody(req).messageText);
      if (messageError) return send(res, 400, { error: messageError });
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const activeGroup = await client.query(
          `SELECT g.group_id, g.facilitator_worker_id FROM support_groups g
           JOIN health_workers w ON w.worker_id = g.facilitator_worker_id
           JOIN users supervisor ON supervisor.user_id = w.user_id
           WHERE g.is_active = TRUE AND w.is_verified = TRUE AND w.is_available = TRUE
             AND supervisor.role = 'health-worker' AND supervisor.is_active = TRUE AND supervisor.email_verified = TRUE
           ORDER BY g.group_id LIMIT 1 FOR UPDATE OF g`,
        );
        const group = activeGroup.rows[0];
        if (!group) {
          await client.query('ROLLBACK');
          return send(res, 409, { error: 'The private group is currently unavailable.' });
        }
        let senderAlias;
        let senderRole;
        if (user.role === 'patient') {
          const membership = await client.query(
            `SELECT sgm.display_alias FROM support_group_members sgm
             JOIN patients p USING (patient_id)
             WHERE sgm.group_id = $1 AND p.user_id = $2
             FOR UPDATE OF sgm`,
            [group.group_id, user.user_id],
          );
          if (!membership.rowCount || !membership.rows[0].display_alias) {
            await client.query('ROLLBACK');
            return send(res, 403, { error: 'Join the group before sending a message.' });
          }
          senderAlias = membership.rows[0].display_alias;
          senderRole = 'member';
        } else {
          const supervisor = await client.query(
            `SELECT w.worker_id FROM health_workers w JOIN users u ON u.user_id = w.user_id
             WHERE w.worker_id = $1 AND w.user_id = $2 AND w.is_verified = TRUE AND w.is_available = TRUE
               AND u.is_active = TRUE AND u.email_verified = TRUE`,
            [group.facilitator_worker_id, user.user_id],
          );
          if (!supervisor.rowCount) {
            await client.query('ROLLBACK');
            return send(res, 403, { error: 'Only the designated group supervisor can post as a health worker.' });
          }
          senderAlias = 'Health worker';
          senderRole = 'supervisor';
        }
        await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [user.user_id]);
        await client.query("DELETE FROM support_group_message_rate_limit_events WHERE sent_at < NOW() - INTERVAL '10 minutes'");
        const recent = await client.query(
          `SELECT COUNT(*)::int AS count FROM support_group_message_rate_limit_events
           WHERE user_id = $1 AND sent_at > NOW() - INTERVAL '1 minute'`,
          [user.user_id],
        );
        if (recent.rows[0].count >= 12) {
          await client.query('ROLLBACK');
          return send(res, 429, { error: 'Please wait a moment before sending another message.' });
        }
        await client.query('INSERT INTO support_group_message_rate_limit_events (user_id) VALUES ($1)', [user.user_id]);
        const inserted = await client.query(
          `INSERT INTO support_group_messages (group_id, sender_alias, sender_role, message_text)
           VALUES ($1, $2, $3, $4)
           RETURNING message_id, group_id, sender_alias, sender_role, message_text, is_redacted, sent_at`,
          [group.group_id, senderAlias, senderRole, messageText],
        );
        await client.query('COMMIT');
        return send(res, 201, { message: inserted.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }
    const redactSupportGroupMessage = pathname.match(/^\/api\/support-group\/messages\/(\d+)\/redact$/);
    if (redactSupportGroupMessage && req.method === 'POST') {
      if (user?.role !== 'health-worker') return send(res, user ? 403 : 401, { error: 'Health-worker access required.' });
      const messageId = Number(redactSupportGroupMessage[1]);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const redacted = await client.query(
          `UPDATE support_group_messages m SET is_redacted = TRUE,
             message_text = '[Message removed by the health worker]'
           FROM support_groups g, health_workers w, users supervisor
           WHERE m.message_id = $1 AND g.group_id = m.group_id AND g.is_active = TRUE
             AND w.worker_id = g.facilitator_worker_id AND w.user_id = supervisor.user_id
             AND supervisor.user_id = $2 AND supervisor.role = 'health-worker'
             AND supervisor.is_active = TRUE AND supervisor.email_verified = TRUE
             AND w.is_verified = TRUE AND w.is_available = TRUE AND m.is_redacted = FALSE
           RETURNING m.message_id`,
          [messageId, user.user_id],
        );
        if (!redacted.rowCount) {
          await client.query('ROLLBACK');
          return send(res, 404, { error: 'Message not found or moderation access is unavailable.' });
        }
        await client.query(
          'INSERT INTO activity_logs (actor_user_id, actor_name, action, category, details) VALUES ($1,$2,$3,$4,$5)',
          [user.user_id, user.full_name, 'Redacted a support-group message', 'Community Safety', `Removed support-group message #${messageId}`],
        );
        await client.query('COMMIT');
        return send(res, 200, { ok: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }
    const markReadMatch = pathname.match(/^\/api\/chat\/sessions\/(\d+)\/read$/);
    if (markReadMatch && req.method === 'POST') {
      if (!user) return send(res, 401, { error: 'Sign in required.' });
      const sessionId = Number(markReadMatch[1]);
      const access = user.role === 'admin'
        ? await pool.query('SELECT 1 FROM chat_sessions WHERE chat_session_id = $1', [sessionId])
        : await pool.query(`SELECT 1 FROM chat_sessions c
            JOIN patients p USING (patient_id)
            LEFT JOIN health_workers h ON h.worker_id = p.assigned_worker_id
            LEFT JOIN users worker_user ON worker_user.user_id = h.user_id
            WHERE c.chat_session_id = $1 AND (p.user_id = $2 OR worker_user.user_id = $2)`, [sessionId, user.user_id]);
      if (!access.rowCount) return send(res, 404, { error: 'Chat session not found.' });
      const incomingRole = user.role === 'health-worker' ? 'patient' : 'worker';
      const updated = await pool.query('UPDATE chat_messages SET is_read = TRUE WHERE chat_session_id = $1 AND sender_role = $2 AND is_read = FALSE RETURNING message_id', [sessionId, incomingRole]);
      return send(res, 200, { updatedCount: updated.rowCount });
    }
    if (pathname === '/api/admin/support-group/supervisor' && req.method === 'PUT') {
      if (user?.role !== 'admin') return send(res, user ? 403 : 401, { error: 'Administrator access required.' });
      const rawWorkerId = getBody(req).workerId;
      const workerId = rawWorkerId === null || rawWorkerId === '' ? null : Number(rawWorkerId);
      if (workerId !== null && (!Number.isSafeInteger(workerId) || workerId < 1)) {
        return send(res, 400, { error: 'Choose a valid health worker or clear the assignment.' });
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const group = await client.query('SELECT group_id FROM support_groups WHERE is_active = TRUE ORDER BY group_id LIMIT 1 FOR UPDATE');
        if (!group.rowCount) {
          await client.query('ROLLBACK');
          return send(res, 409, { error: 'The single active support group is not configured.' });
        }
        let supervisorName = null;
        if (workerId !== null) {
          const eligible = await client.query(
            `SELECT w.worker_id, u.full_name FROM health_workers w JOIN users u ON u.user_id = w.user_id
             WHERE w.worker_id = $1 AND w.is_verified = TRUE AND w.is_available = TRUE
               AND u.role = 'health-worker' AND u.is_active = TRUE AND u.email_verified = TRUE`,
            [workerId],
          );
          if (!eligible.rowCount) {
            await client.query('ROLLBACK');
            return send(res, 400, { error: 'Only verified, active, available, email-confirmed health workers can supervise the group.' });
          }
          supervisorName = eligible.rows[0].full_name;
        }
        await client.query('UPDATE support_groups SET facilitator_worker_id = $1 WHERE group_id = $2', [workerId, group.rows[0].group_id]);
        await client.query(
          'INSERT INTO activity_logs (actor_user_id, actor_name, action, category, details) VALUES ($1,$2,$3,$4,$5)',
          [user.user_id, user.full_name, workerId ? 'Assigned support-group supervisor' : 'Removed support-group supervisor', 'Community Safety', workerId ? `Assigned verified worker ${workerId} to the single support group` : 'Paused access to the single support group until a supervisor is assigned'],
        );
        await client.query('COMMIT');
        return send(res, 200, { group: { group_id: group.rows[0].group_id, facilitator_worker_id: workerId, supervisor_name: supervisorName, has_supervisor: Boolean(workerId) } });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }
    if (pathname === '/api/admin/email' && req.method === 'POST') {
      if (user?.role !== 'admin') return send(res, user ? 403 : 401, { error: 'Administrator access required.' });
      const body = getBody(req);
      const userId = Number(body.userId);
      const subject = String(body.subject || '').trim();
      const text = String(body.message || '').trim();
      if (!Number.isSafeInteger(userId) || userId < 1 || !subject || subject.length > 160 || !text || text.length > 5000) {
        return send(res, 400, { error: 'Choose a registered user and provide a subject and message (up to 5,000 characters).' });
      }
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return send(res, 503, { error: 'Email delivery is not configured.' });
      const result = await sendRegisteredEmail(userId, { subject, text });
      return result.sent ? send(res, 200, { sent: true }) : send(res, 502, { error: result.error });
    }
    const adminUserRoute = pathname.match(/^\/api\/admin\/(users|workers)(?:\/(\d+))?$/);
    if (adminUserRoute) {
      if (user?.role !== 'admin') return send(res, user ? 403 : 401, { error: 'Administrator access required.' });
      const kind = adminUserRoute[1];
      const id = adminUserRoute[2];
      const body = getBody(req);
      if (req.method === 'POST' && !applicationUrl()) return send(res, 503, { error: 'APP_URL is not configured.' });
      const client = await pool.connect();
      let supabaseAuthUserId = null;
      try {
        await client.query('BEGIN');
        if (kind === 'users' && req.method === 'POST') {
          const { fullName, error: nameError } = getFullNameFromParts(body);
          const email = String(body.email || '').trim().toLowerCase();
          const password = String(body.password || '');
          if (nameError) { await client.query('ROLLBACK'); return send(res, 400, { error: nameError }); }
          if (!isAllowedGender(body.gender, 'patient')) { await client.query('ROLLBACK'); return send(res, 400, { error: 'Choose Male, Female, or Other for gender.' }); }
          if (!email || password.length < 12) { await client.query('ROLLBACK'); return send(res, 400, { error: 'Email and a password of at least 12 characters are required.' }); }
          const assignedWorkerId = body.assignedWorkerId === '' || body.assignedWorkerId === undefined || body.assignedWorkerId === null ? null : Number(body.assignedWorkerId);
          if (assignedWorkerId !== null) {
            if (!Number.isSafeInteger(assignedWorkerId) || assignedWorkerId < 1) { await client.query('ROLLBACK'); return send(res, 400, { error: 'Select a valid health worker.' }); }
            const eligible = await client.query('SELECT 1 FROM health_workers h JOIN users u USING (user_id) WHERE h.worker_id = $1 AND h.is_verified = TRUE AND h.is_available = TRUE AND u.is_active = TRUE AND u.email_verified = TRUE', [assignedWorkerId]);
            if (!eligible.rowCount) { await client.query('ROLLBACK'); return send(res, 400, { error: 'The selected health worker is not verified and available.' }); }
          }
          const { adminClient } = supabaseClients();
          const { data: authData, error: authError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { full_name: fullName } });
          if (authError || !authData.user) { await client.query('ROLLBACK'); return send(res, 400, { error: authError?.message || 'Could not create the Supabase Auth account.' }); }
          supabaseAuthUserId = authData.user.id;
          const created = await client.query('INSERT INTO users (supabase_user_id, email, password_hash, full_name, role, contact_number, date_of_birth, age, gender, is_active, terms_accepted, email_verified) VALUES ($1,$2,NULL,$3,\'patient\',$4,$5,$6,$7,$8,$9,FALSE) RETURNING user_id, supabase_user_id, email, full_name, role, contact_number, date_of_birth, age, gender, is_active, email_verified', [supabaseAuthUserId, email, fullName, body.contactNumber || null, body.dateOfBirth || null, body.age || null, body.gender || null, body.isActive !== false, true]);
          const patient = await client.query('INSERT INTO patients (user_id, care_status, medical_notes, preferred_facility_id, assigned_worker_id, emergency_contact, emergency_phone) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [created.rows[0].user_id, body.careStatus || 'Active care plan', body.medicalNotes || 'Managed patient account', body.preferredFacilityId || 1, assignedWorkerId, body.emergencyContact || null, body.emergencyPhone || null]);
          await client.query("INSERT INTO chat_sessions (patient_id, subject, status, preview) VALUES ($1, 'Welcome to private support', 'Open', 'A health worker will be ready to answer your questions.')", [patient.rows[0].patient_id]);
          await client.query('INSERT INTO activity_logs (actor_user_id, actor_name, action, category, details) VALUES ($1,$2,$3,$4,$5)', [user.user_id, user.full_name, `Created user account: ${fullName}`, 'User Management', `Created patient account ${email}`]);
          await client.query('COMMIT');
          const verification = await sendVerificationEmail(created.rows[0].user_id);
          return send(res, 201, { user: created.rows[0], patient: patient.rows[0], verificationRequired: true, verificationEmailSent: verification.sent });
        }
        if (kind === 'workers' && req.method === 'POST') {
          const { fullName, error: nameError } = getFullNameFromParts(body);
          const email = String(body.email || '').trim().toLowerCase();
          const password = String(body.password || '');
          if (nameError) { await client.query('ROLLBACK'); return send(res, 400, { error: nameError }); }
          if (!isAllowedGender(body.gender, 'health-worker')) { await client.query('ROLLBACK'); return send(res, 400, { error: 'Choose Male or Female for health worker gender.' }); }
          if (!email || password.length < 12) { await client.query('ROLLBACK'); return send(res, 400, { error: 'Email and a password of at least 12 characters are required.' }); }
          const { adminClient } = supabaseClients();
          const { data: authData, error: authError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { full_name: fullName } });
          if (authError || !authData.user) { await client.query('ROLLBACK'); return send(res, 400, { error: authError?.message || 'Could not create the Supabase Auth account.' }); }
          supabaseAuthUserId = authData.user.id;
          const created = await client.query('INSERT INTO users (supabase_user_id, email, password_hash, full_name, role, contact_number, gender, is_active, terms_accepted, email_verified) VALUES ($1,$2,NULL,$3,\'health-worker\',$4,$5,$6,TRUE,FALSE) RETURNING user_id, supabase_user_id, email, full_name, role, contact_number, gender, is_active, email_verified', [supabaseAuthUserId, email, fullName, body.contactNumber || null, body.gender, body.isActive !== false]);
          const worker = await client.query('INSERT INTO health_workers (user_id, specialty, license_number, primary_facility_id, is_verified, is_available, bio_summary) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [created.rows[0].user_id, body.specialty || 'HIV care support', body.licenseNumber || null, body.primaryFacilityId || 1, body.isVerified !== false, body.isAvailable !== false, body.bioSummary || 'Licensed Health Worker']);
          await client.query('INSERT INTO activity_logs (actor_user_id, actor_name, action, category, details) VALUES ($1,$2,$3,$4,$5)', [user.user_id, user.full_name, `Created health worker: ${fullName}`, 'Care Team Management', `Created health worker ${email}`]);
          await client.query('COMMIT');
          const verification = await sendVerificationEmail(created.rows[0].user_id);
          return send(res, 201, { user: created.rows[0], worker: worker.rows[0], verificationRequired: true, verificationEmailSent: verification.sent });
        }
        if (req.method === 'PATCH' && id) {
          const isWorker = kind === 'workers';
          const profile = isWorker
            ? await client.query('SELECT h.worker_id, h.user_id, u.email, u.supabase_user_id FROM health_workers h JOIN users u USING (user_id) WHERE h.worker_id = $1', [id])
            : await client.query('SELECT p.patient_id, p.user_id, u.email, u.supabase_user_id FROM patients p JOIN users u USING (user_id) WHERE p.user_id = $1', [id]);
          if (!profile.rowCount) { await client.query('ROLLBACK'); return send(res, 404, { error: 'Record not found.' }); }
          const userId = profile.rows[0].user_id;
          const userFields = { fullName: 'full_name', email: 'email', contactNumber: 'contact_number', isActive: 'is_active', age: 'age', dateOfBirth: 'date_of_birth', gender: 'gender' };
          if (body.gender !== undefined && !isAllowedGender(body.gender, isWorker ? 'health-worker' : 'patient')) {
            await client.query('ROLLBACK');
            return send(res, 400, { error: isWorker ? 'Choose Male or Female for health worker gender.' : 'Choose Male, Female, or Other for gender.' });
          }
          if (body.email !== undefined && String(body.email).trim().toLowerCase() !== profile.rows[0].email) {
            await client.query('ROLLBACK');
            return send(res, 400, { error: 'Changing account email is not available yet. Create a new account with the correct address.' });
          }
          const patches = Object.entries(userFields).filter(([key]) => Object.prototype.hasOwnProperty.call(body, key)
            && (key !== 'email' || String(body.email).trim().toLowerCase() !== profile.rows[0].email));
          if (patches.length) {
            const clauses = patches.map(([, column], index) => `${column} = $${index + 1}`);
            clauses.push('updated_at = NOW()');
            await client.query(`UPDATE users SET ${clauses.join(', ')} WHERE user_id = $${patches.length + 1}`, [...patches.map(([key]) => key === 'email' ? String(body[key]).trim().toLowerCase() : key === 'fullName' ? String(body[key]).trim() : body[key]), userId]);
          }
          const table = isWorker ? 'health_workers' : 'patients';
          const tableId = isWorker ? 'worker_id' : 'patient_id';
          const relationId = isWorker ? profile.rows[0].worker_id : profile.rows[0].patient_id;
          const fields = isWorker
            ? { specialty: 'specialty', licenseNumber: 'license_number', primaryFacilityId: 'primary_facility_id', isVerified: 'is_verified', isAvailable: 'is_available', bioSummary: 'bio_summary' }
            : { careStatus: 'care_status', medicalNotes: 'medical_notes', preferredFacilityId: 'preferred_facility_id', assignedWorkerId: 'assigned_worker_id', emergencyContact: 'emergency_contact', emergencyPhone: 'emergency_phone' };
          if (!isWorker && Object.prototype.hasOwnProperty.call(body, 'assignedWorkerId')) {
            const rawWorkerId = body.assignedWorkerId;
            const assignedWorkerId = rawWorkerId === '' || rawWorkerId === null ? null : Number(rawWorkerId);
            if (assignedWorkerId !== null) {
              if (!Number.isSafeInteger(assignedWorkerId) || assignedWorkerId < 1) { await client.query('ROLLBACK'); return send(res, 400, { error: 'Select a valid health worker.' }); }
              const eligible = await client.query('SELECT 1 FROM health_workers h JOIN users u USING (user_id) WHERE h.worker_id = $1 AND h.is_verified = TRUE AND h.is_available = TRUE AND u.is_active = TRUE AND u.email_verified = TRUE', [assignedWorkerId]);
              if (!eligible.rowCount) { await client.query('ROLLBACK'); return send(res, 400, { error: 'The selected health worker is not verified and available.' }); }
            }
            body.assignedWorkerId = assignedWorkerId;
          }
          const updates = Object.entries(fields).filter(([key]) => Object.prototype.hasOwnProperty.call(body, key));
          if (updates.length) {
            const clauses = updates.map(([, column], index) => `${column} = $${index + 1}`);
            clauses.push('updated_at = NOW()');
            await client.query(`UPDATE ${table} SET ${clauses.join(', ')} WHERE ${tableId} = $${updates.length + 1}`, [...updates.map(([key]) => body[key]), relationId]);
          }
          await client.query('COMMIT');
          return send(res, 200, { ok: true });
        }
        if (req.method === 'DELETE' && id) {
          let removed;
          if (kind === 'workers') {
            removed = await client.query('DELETE FROM users u USING health_workers h WHERE u.user_id = h.user_id AND h.worker_id = $1 RETURNING u.full_name, u.supabase_user_id', [id]);
          } else {
            removed = await client.query('DELETE FROM users WHERE user_id = $1 AND role = \'patient\' RETURNING full_name, supabase_user_id', [id]);
          }
          if (!removed.rowCount) { await client.query('ROLLBACK'); return send(res, 404, { error: 'Record not found.' }); }
          await client.query('INSERT INTO activity_logs (actor_user_id, actor_name, action, category, details) VALUES ($1,$2,$3,$4,$5)', [user.user_id, user.full_name, `Deleted ${kind === 'workers' ? 'health worker' : 'user'}: ${removed.rows[0].full_name}`, 'Account Management', `Deleted record ${id}`]);
          await client.query('COMMIT');
          if (removed.rows[0].supabase_user_id) {
            const { adminClient } = supabaseClients();
            const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(removed.rows[0].supabase_user_id);
            if (deleteAuthError) console.error('Supabase Auth account cleanup failed:', deleteAuthError.message);
          }
          return send(res, 200, { deleted: true });
        }
        await client.query('ROLLBACK');
        return send(res, 405, { error: 'Method not allowed.' });
      } catch (error) {
        await client.query('ROLLBACK');
        if (supabaseAuthUserId) {
          const { adminClient } = supabaseClients();
          await adminClient.auth.admin.deleteUser(supabaseAuthUserId).catch(() => {});
        }
        if (error.code === '23505') return send(res, 409, { error: 'An account with this email already exists.' });
        throw error;
      } finally { client.release(); }
    }
    if (pathname === '/api/auth/session' && req.method === 'GET') return user ? send(res, 200, { user }) : send(res, 401, { error: 'Sign in required.' });
    if (pathname === '/api/bootstrap' && req.method === 'GET') return user ? send(res, 200, await loadSnapshot(user)) : send(res, 401, { error: 'Sign in required.' });
    if (pathname === '/api/records/PublicInquiries' && req.method === 'POST') {
      const inquiry = getBody(req).record || getBody(req);
      if (!String(inquiry.first_name || '').trim() || !String(inquiry.email || '').trim() || !String(inquiry.message || '').trim()) return send(res, 400, { error: 'Name, email, and message are required.' });
      const result = await mutate(req, user, 'PublicInquiries');
      return send(res, result.status, result.body);
    }
    const match = pathname.match(/^\/api\/records\/([A-Za-z]+)(?:\/(\d+))?$/);
    if (match) {
      if (!user) return send(res, 401, { error: 'Sign in required.' });
      const table = match[1];
      const id = match[2];
      const record = getBody(req).record || getBody(req);
      const result = await mutate(req, user, table, id);
      if (result.status >= 200 && result.status < 300) {
        if (table === 'Appointments' && req.method === 'POST') {
          const patient = await pool.query('SELECT user_id FROM patients WHERE patient_id = $1', [result.body.record.patient_id]);
          if (patient.rows[0]) await bestEffort(() => sendRegisteredEmail(patient.rows[0].user_id, { subject: 'Appointment request received', text: 'Your appointment request was received. Sign in to HIVeLink to review its current status.' }));
        }
        if (table === 'Appointments' && req.method === 'PATCH' && record.status) await bestEffort(() => notifyPatientRecord(table, id, 'Appointment status updated', `Your appointment status is now ${record.status}. Sign in to HIVeLink for details.`));
        if (table === 'MedicationRequests' && req.method === 'POST') {
          await logActivity(user, 'Submitted medication request', 'Medication Requests', `Medication request #${result.body.record.request_id} submitted for patient ID #${result.body.record.patient_id}.`);
          const patient = await pool.query('SELECT user_id FROM patients WHERE patient_id = $1', [result.body.record.patient_id]);
          if (patient.rows[0]) await bestEffort(() => sendRegisteredEmail(patient.rows[0].user_id, { subject: 'Medication request received', text: 'Your medication request was received. Sign in to HIVeLink to review its current status.' }));
        }
        if (table === 'MedicationRequests' && req.method === 'PATCH' && record.status) {
          await logActivity(user, `Updated medication request: ${record.status}`, 'Medication Requests', `Medication request #${id} status changed to ${record.status}.`);
          await bestEffort(() => notifyPatientRecord(table, id, 'Medication request updated', `Your medication request status is now ${record.status}. Sign in to HIVeLink for details.`));
        }
        if (table === 'ChatMessages' && req.method === 'POST') await bestEffort(() => notifyChatCounterparty(result.body.record.chat_session_id, user.role));
      }
      return send(res, result.status, result.body);
    }
    return send(res, 404, { error: 'API route not found.' });
  } catch (error) {
    console.error('API request failed:', error.message);
    return send(res, 500, { error: 'The request could not be completed.' });
  }
};
