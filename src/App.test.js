import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import db from './services/databaseService';

beforeEach(() => {
  jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  db.resetToDefault();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the sign in entry screen', () => {
  render(<App />);
  expect(screen.queryByRole('link', { name: /hivelink/i })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /good to see you/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /patient \/ user/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /health worker/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /admin/i })).toBeInTheDocument();
});

test('blocks un-registered accounts from logging in with an error message', () => {
  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'unregistered@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/account not found/i);
});

test('guest view shows only public awareness resources', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /continue as guest/i }));

  expect(screen.getByRole('button', { name: /hivelink home/i })).toHaveTextContent('HIVeLink');
  expect(document.querySelector('.brand-mark')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Information' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Testing' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Donate' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log in \/ sign up/i })).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Information' }));
  expect(screen.getByRole('heading', { name: /knowledge without stigma/i })).toBeInTheDocument();
  expect(screen.queryByTitle(/map of odiongan/i)).not.toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Testing' }));
  expect(screen.getByRole('heading', { name: /testing and treatment/i })).toBeInTheDocument();
  expect(screen.getByTitle(/map of odiongan/i)).toBeInTheDocument();
  expect(screen.getByText(/^rural health unit$/i)).toBeInTheDocument();
  expect(screen.getByText(/romblon provincial hospital/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /book an appointment/i })).not.toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Donate' }));
  expect(screen.getByRole('heading', { name: /help care travel further/i })).toBeInTheDocument();
  expect(screen.queryByText(/my care plan/i)).not.toBeInTheDocument();
});

test('guest users can return to authentication', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /continue as guest/i }));
  userEvent.click(screen.getByRole('button', { name: /log in \/ sign up/i }));
  expect(screen.getByRole('heading', { name: /good to see you/i })).toBeInTheDocument();
});

test('shows all requested registration fields', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /new here\? sign up/i }));

  expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^age$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^gender/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument();
  expect(screen.getByText(/terms/i)).toBeInTheDocument();
});

test('signup terms and privacy links open readable legal notices', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /new here\? sign up/i }));

  userEvent.click(screen.getByRole('button', { name: /terms of use/i }));
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Terms of Use');
  expect(screen.getByText(/not a medical provider/i)).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: /^close$/i }));

  userEvent.click(screen.getByRole('button', { name: /privacy notice/i }));
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Privacy Notice');
  expect(screen.getByText(/do not submit real patient or sensitive health information/i)).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('admin email service sends a registered user ID to the backend', async () => {
  const previousApiMode = db.useApi;
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ sent: true }),
  });
  db.useApi = true;

  try {
    await expect(db.sendAccountEmail(42, 'Account update', 'Please review your account.')).resolves.toEqual({ sent: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/email', expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify({ userId: 42, subject: 'Account update', message: 'Please review your account.' }),
    }));
  } finally {
    db.useApi = previousApiMode;
  }
});

test('admin can email a registered account from the user list', async () => {
  const previousApiMode = db.useApi;
  db.registerUser({ fullName: 'Admin User', email: 'mail.admin@example.com', password: 'securePassword123', role: 'admin' });
  db.registerUser({ fullName: 'Mail Recipient', email: 'mail.recipient@example.com', password: 'securePassword123', role: 'patient' });
  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'admin');
  userEvent.type(screen.getByLabelText(/email address/i), 'mail.admin@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'securePassword123');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  db.useApi = true;
  userEvent.click(screen.getByRole('button', { name: 'Users' }));

  const recipientCard = screen.getByText('Mail Recipient').closest('article');
  userEvent.click(within(recipientCard).getByRole('button', { name: /send email/i }));
  userEvent.type(screen.getByLabelText(/^subject$/i), 'Care update');
  userEvent.type(screen.getByLabelText(/^message$/i), 'Please sign in to review your care update.');

  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ sent: true }) });
  try {
    userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^send email/i }));
    expect(await screen.findByRole('heading', { name: /email delivered/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/email', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ userId: db.getTable('Users').find((user) => user.email === 'mail.recipient@example.com').user_id, subject: 'Care update', message: 'Please sign in to review your care update.' }),
    }));
  } finally {
    db.useApi = previousApiMode;
  }
});

test('API signup waits for email verification and supports resending the link', async () => {
  const previousApiMode = db.useApi;
  db.useApi = true;
  const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
    if (url === '/api/auth/session') return { ok: false, json: async () => ({ error: 'Sign in required.' }) };
    if (url === '/api/auth/register') return { ok: true, json: async () => ({ verificationRequired: true, email: 'verify@example.com' }) };
    if (url === '/api/auth/resend-verification') return { ok: true, json: async () => ({ ok: true, message: 'If the account needs verification, a new link has been sent.' }) };
    throw new Error(`Unexpected request: ${url}`);
  });

  try {
    render(<App />);
    userEvent.click(screen.getByRole('button', { name: /new here\? sign up/i }));
    userEvent.type(screen.getByLabelText(/first name/i), 'Verify');
    userEvent.type(screen.getByLabelText(/last name/i), 'Account');
    userEvent.type(screen.getByLabelText(/email address/i), 'verify@example.com');
    userEvent.type(screen.getByLabelText(/^age$/i), '30');
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1996-01-01' } });
    userEvent.selectOptions(screen.getByLabelText(/^gender/i), 'Woman');
    userEvent.type(screen.getByLabelText(/^password$/i), 'securePass1234');
    userEvent.type(screen.getByLabelText(/confirm password/i), 'securePass1234');
    userEvent.click(screen.getByRole('checkbox'));
    userEvent.click(screen.getByRole('button', { name: /create my account/i }));

    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /your care dashboard/i })).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: /resend verification email/i }));
    expect(await screen.findByText(/if the account needs verification/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/resend-verification', expect.objectContaining({ method: 'POST' }));
  } finally {
    db.useApi = previousApiMode;
  }
});

test('switching from sign in to sign up clears entered credentials and account type', () => {
  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'admin');
  userEvent.type(screen.getByLabelText(/^password$/i), 'secret-password');
  userEvent.click(screen.getByRole('button', { name: /new here\? sign up/i }));

  expect(screen.getByLabelText(/email address/i)).toHaveValue('');
  expect(screen.getByLabelText(/^password$/i)).toHaveValue('');
  userEvent.click(screen.getByRole('button', { name: /already have an account\? log in/i }));
  expect(screen.getByLabelText(/account type/i)).toHaveValue('patient');
  expect(screen.getByLabelText(/email address/i)).toHaveValue('');
});

test('navigating between guest pages scrolls smoothly', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /continue as guest/i }));
  window.scrollTo.mockClear();

  userEvent.click(screen.getByRole('button', { name: 'Information' }));

  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  expect(screen.getByRole('main')).toHaveClass('route-transition');
});

test('registered patient can log in, view dashboard, and create an appointment record', () => {
  db.registerUser({
    fullName: 'Morgan Lee',
    email: 'morgan@example.com',
    password: 'password',
    role: 'patient',
  });

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'morgan@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  expect(screen.getByRole('heading', { name: /start with what you know/i })).toBeInTheDocument();
  expect(screen.getByText('Morgan Lee')).toBeInTheDocument();
  const patientProfileButton = screen.getByRole('button', { name: /open .*care dashboard/i });
  expect(patientProfileButton).toBeInTheDocument();
  expect(patientProfileButton.querySelector('svg')).not.toBeNull();
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Care' })).toBeInTheDocument();
  userEvent.click(patientProfileButton);
  expect(screen.getByRole('heading', { name: /your care dashboard/i })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Home' }));
  userEvent.click(screen.getByRole('button', { name: 'Testing' }));
  userEvent.click(screen.getByRole('button', { name: /book an appointment/i }));
  userEvent.click(screen.getByRole('button', { name: /^book appointment/i }));
  fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: '2026-09-20' } });
  userEvent.type(screen.getByLabelText(/^time$/i), '2:00 PM');
  userEvent.click(screen.getByRole('button', { name: /save record/i }));

  expect(screen.getByText('2026-09-20 · 2:00 PM')).toBeInTheDocument();
});

test('patient appointment deletion waits for confirmation', () => {
  const registered = db.registerUser({
    fullName: 'Morgan Lee',
    email: 'morgan@example.com',
    password: 'password',
    role: 'patient',
  });
  const appointment = db.bookAppointment({
    patient_id: registered.patient.patient_id,
    appointment_date: '2026-10-15',
    appointment_time: '9:00 AM',
    appointment_type: 'Care consultation',
  });
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'morgan@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Testing' }));
  userEvent.click(screen.getByRole('button', { name: /book an appointment/i }));
  userEvent.click(screen.getByRole('button', { name: 'Delete' }));

  expect(confirmSpy).toHaveBeenCalled();
  expect(db.findById('Appointments', appointment.appointment_id)).not.toBeNull();

  confirmSpy.mockReturnValue(true);
  userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(db.findById('Appointments', appointment.appointment_id)).toBeNull();
});

test('health worker support-group removal waits for confirmation', () => {
  db.registerUser({
    fullName: 'Dr. Evelyn Garcia',
    email: 'evelyn@risinghiv.org',
    password: 'password',
    role: 'health-worker',
  });
  const groupCount = db.getTable('SupportGroups').length;
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'health-worker');
  userEvent.type(screen.getByLabelText(/email address/i), 'evelyn@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Groups' }));
  userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

  expect(confirmSpy).toHaveBeenCalled();
  expect(db.getTable('SupportGroups')).toHaveLength(groupCount);

  confirmSpy.mockReturnValue(true);
  userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
  expect(db.getTable('SupportGroups')).toHaveLength(groupCount - 1);
});

test('patient public pages match the guest experience', () => {
  db.registerUser({
    fullName: 'Morgan Lee',
    email: 'morgan@example.com',
    password: 'password',
    role: 'patient',
  });

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'morgan@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  expect(screen.getByRole('heading', { name: /start with what you know/i })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Information' }));
  expect(screen.getByRole('heading', { name: /knowledge without stigma/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
});

test('patient private chat works as a health worker messenger', async () => {
  db.registerUser({
    fullName: 'Elena Santos',
    email: 'elena.worker@risinghiv.org',
    password: 'password',
    role: 'health-worker',
  });
  db.registerUser({
    fullName: 'Morgan Lee',
    email: 'morgan@example.com',
    password: 'password',
    role: 'patient',
  });

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'morgan@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Care' }));
  userEvent.click(screen.getByRole('button', { name: /open private chat/i }));

  expect(screen.getByText('Elena Santos')).toBeInTheDocument();
  expect(screen.getByText(/health worker · available/i)).toBeInTheDocument();
  userEvent.type(screen.getByLabelText(/message health worker/i), 'I have a question.');
  userEvent.click(screen.getByRole('button', { name: /send message/i }));
  expect(await screen.findByText('I have a question.')).toBeInTheDocument();
});

test('patient chat recreates a missing session before sending a message', async () => {
  const patient = db.registerUser({
    fullName: 'Morgan Lee',
    email: 'morgan@example.com',
    password: 'password',
    role: 'patient',
  });
  const session = db.getTable('ChatSessions').find((item) => item.patient_id === patient.patient.patient_id);
  db.delete('ChatSessions', session.chat_session_id);

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'morgan@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Care' }));
  userEvent.click(screen.getByRole('button', { name: /open private chat/i }));
  userEvent.type(screen.getByLabelText(/message health worker/i), 'I have a question.');
  userEvent.click(screen.getByRole('button', { name: /send message/i }));

  expect(await screen.findByText('I have a question.')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(db.getTable('ChatSessions')).toHaveLength(1);
  expect(db.getTable('ChatMessages')).toHaveLength(1);
});

test('API chat session recovery refreshes the signed-in patient snapshot', async () => {
  const previousApiMode = db.useApi;
  const session = { chat_session_id: 73, patient_id: 12, status: 'Open' };
  db.useApi = true;
  const fetchMock = jest.spyOn(global, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => ({ session }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ChatSessions: [session] }) });

  try {
    await expect(db.ensurePatientChatSession(12, 999)).resolves.toEqual(session);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/chat/session', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ preferredChatSessionId: 999 }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/bootstrap', expect.objectContaining({ credentials: 'same-origin' }));
  } finally {
    db.useApi = previousApiMode;
  }
});

test('patient medication page shows availability status', () => {
  db.registerUser({
    fullName: 'Morgan Lee',
    email: 'morgan@example.com',
    password: 'password',
    role: 'patient',
  });

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'morgan@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Care' }));
  userEvent.click(screen.getByRole('button', { name: /open medication/i }));
  expect(screen.getAllByText('Antiretroviral therapy').length).toBeGreaterThan(0);
  expect(screen.getAllByText('In stock').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Out of stock').length).toBeGreaterThan(0);
  expect(screen.queryByLabelText(/availability/i)).not.toBeInTheDocument();
});

test('health worker gets a care management workspace', () => {
  db.registerUser({
    fullName: 'Dr. Evelyn Garcia',
    email: 'evelyn@risinghiv.org',
    password: 'password',
    role: 'health-worker',
  });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'health-worker');
  userEvent.type(screen.getByLabelText(/email address/i), 'evelyn@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  expect(screen.getByRole('heading', { name: /care that connects/i })).toBeInTheDocument();
  expect(screen.getByText('Dr. Evelyn Garcia')).toBeInTheDocument();
  const workerProfileButton = screen.getByRole('button', { name: /open Dr\. Evelyn Garcia's overview/i });
  expect(workerProfileButton.querySelector('svg')).not.toBeNull();
  expect(workerProfileButton).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: 'Patients' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Appointments' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Medications' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Patients' }));
  expect(screen.getByRole('heading', { name: /patients and chats/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /open Dr\. Evelyn Garcia's overview/i })).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('button', { name: 'Groups' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: /open Dr\. Evelyn Garcia's overview/i }));
  expect(screen.getByRole('heading', { name: /care that connects/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /open Dr\. Evelyn Garcia's overview/i })).toHaveAttribute('aria-current', 'page');
});

test('health worker inbox shows assigned unread chats, marks messages read, and supports replies/status changes', () => {
  const worker = db.registerUser({
    fullName: 'Dr. Evelyn Garcia',
    email: 'evelyn.chat@risinghiv.org',
    password: 'password',
    role: 'health-worker',
  });
  const unreadPatient = db.registerUser({
    fullName: 'Alex Unread',
    email: 'alex.unread@example.com',
    password: 'password',
    role: 'patient',
  });
  db.update('Patients', unreadPatient.patient.patient_id, { assigned_worker_id: worker.worker.worker_id });
  const unreadChat = db.getTable('ChatSessions').find((session) => session.patient_id === unreadPatient.patient.patient_id);
  db.update('ChatSessions', unreadChat.chat_session_id, { worker_id: worker.worker.worker_id });
  const unreadMessage = db.sendChatMessage({ chat_session_id: unreadChat.chat_session_id, sender_user_id: unreadPatient.user.user_id, sender_role: 'patient', message_text: 'I have a private question.' });
  db.update('ChatSessions', unreadChat.chat_session_id, { last_updated: '2026-01-01T00:00:00.000Z' });

  const patient = db.registerUser({
    fullName: 'Taylor Patient',
    email: 'taylor.chat@example.com',
    password: 'password',
    role: 'patient',
  });
  db.update('Patients', patient.patient.patient_id, { assigned_worker_id: worker.worker.worker_id });
  const chat = db.getTable('ChatSessions').find((session) => session.patient_id === patient.patient.patient_id);
  db.update('ChatSessions', chat.chat_session_id, { worker_id: worker.worker.worker_id });
  db.sendChatMessage({ chat_session_id: chat.chat_session_id, sender_user_id: patient.user.user_id, sender_role: 'patient', message_text: 'I would like to ask about my appointment.' });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'health-worker');
  userEvent.type(screen.getByLabelText(/email address/i), 'evelyn.chat@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Chats' }));

  expect(screen.getByRole('heading', { name: /conversation inbox/i })).toBeInTheDocument();
  expect(screen.getAllByText('Taylor Patient').length).toBeGreaterThan(0);
  expect(screen.getByText('Alex Unread')).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getAllByText('I would like to ask about my appointment.').length).toBeGreaterThan(0);

  userEvent.type(screen.getByLabelText(/reply to patient/i), 'I can help with that.');
  userEvent.click(screen.getByRole('button', { name: /^reply/i }));
  userEvent.selectOptions(screen.getByLabelText(/conversation status/i), 'Resolved');

  expect(screen.getAllByText('I can help with that.').length).toBeGreaterThan(0);
  expect(db.findById('ChatSessions', chat.chat_session_id).status).toBe('Resolved');
  expect(db.findById('ChatMessages', unreadMessage.message_id).is_read).toBe(false);
  expect(db.getTable('ChatMessages').find((message) => message.chat_session_id === chat.chat_session_id && message.sender_role === 'patient').is_read).toBe(true);
});

test('admin can assign a patient to a health worker', () => {
  db.registerUser({ fullName: 'Admin Manager', email: 'assign.admin@example.com', password: 'securePassword123', role: 'admin' });
  const worker = db.registerUser({ fullName: 'Dr. Assigned', email: 'assigned.worker@example.com', password: 'securePassword123', role: 'health-worker' });
  const patient = db.registerUser({ fullName: 'Patient To Assign', email: 'patient.assign@example.com', password: 'securePassword123', role: 'patient' });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'admin');
  userEvent.type(screen.getByLabelText(/email address/i), 'assign.admin@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'securePassword123');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Users' }));
  const patientCard = screen.getByText('Patient To Assign').closest('article');
  userEvent.click(within(patientCard).getByRole('button', { name: 'Edit' }));
  userEvent.selectOptions(screen.getByLabelText(/assigned health worker/i), String(worker.worker.worker_id));
  userEvent.click(screen.getByRole('button', { name: /save user record/i }));

  expect(db.findById('Patients', patient.patient.patient_id).assigned_worker_id).toBe(worker.worker.worker_id);
});

test('health worker can claim an unassigned patient and access their chat', async () => {
  const worker = db.registerUser({ fullName: 'Dr. Self Assign', email: 'self.assign@example.com', password: 'securePassword123', role: 'health-worker' });
  const patient = db.registerUser({ fullName: 'Claimable Patient', email: 'claim.patient@example.com', password: 'securePassword123', role: 'patient' });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'health-worker');
  userEvent.type(screen.getByLabelText(/email address/i), 'self.assign@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'securePassword123');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Patients' }));
  expect(screen.getByText(/no patients are currently assigned to you/i)).toBeInTheDocument();
  userEvent.click(await screen.findByRole('button', { name: /assign to me/i }));
  expect(await screen.findByRole('status')).toHaveTextContent(/claimable patient is now assigned to you/i);

  expect(db.findById('Patients', patient.patient.patient_id).assigned_worker_id).toBe(worker.worker.worker_id);
  userEvent.click(screen.getByRole('button', { name: 'Chats' }));
  expect(screen.getByRole('heading', { name: /conversation inbox/i })).toBeInTheDocument();
  expect(screen.getAllByText('Claimable Patient').length).toBeGreaterThan(0);
});

test('admin gets platform management pages and service toggles', () => {
  db.registerUser({
    fullName: 'Platform Admin',
    email: 'admin@risinghiv.org',
    password: 'password',
    role: 'admin',
  });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'admin');
  userEvent.type(screen.getByLabelText(/email address/i), 'admin@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  expect(screen.getByRole('heading', { name: /keep care connected/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Health workers' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Services' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Activity logs' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reports' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Services' }));
  const serviceToggle = screen.getByRole('button', { name: /medication requests unavailable/i });
  expect(serviceToggle).toHaveAttribute('aria-pressed', 'false');
  userEvent.click(serviceToggle);
  expect(serviceToggle).toHaveAttribute('aria-pressed', 'true');
});

test('patient navbar keeps the selected page after leaving Care', () => {
  db.registerUser({
    fullName: 'Morgan Lee',
    email: 'morgan@example.com',
    password: 'password',
    role: 'patient',
  });

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'morgan@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
  userEvent.click(screen.getByRole('button', { name: 'Care' }));
  expect(screen.getByRole('heading', { name: /care, all in one place/i })).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Information' }));
  expect(screen.getByRole('heading', { name: /knowledge without stigma/i })).toBeInTheDocument();
});

test('encodes registered user into the database and loads their personalized dashboard', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /new here\? sign up/i }));

  userEvent.type(screen.getByLabelText(/first name/i), 'Jordan');
  userEvent.type(screen.getByLabelText(/last name/i), 'Taylor');
  userEvent.type(screen.getByLabelText(/email address/i), 'jordan@testdomain.org');
  userEvent.type(screen.getByLabelText(/^age$/i), '29');
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1997-04-15' } });
  userEvent.selectOptions(screen.getByLabelText(/^gender/i), 'Woman');
  userEvent.type(screen.getByLabelText(/^password$/i), 'securePass123');
  userEvent.type(screen.getByLabelText(/confirm password/i), 'securePass123');
  userEvent.type(screen.getByLabelText(/contact number/i), '+63 912 345 6789');
  userEvent.click(screen.getByLabelText(/i agree to the/i));

  userEvent.click(screen.getByRole('button', { name: /create my account/i }));

  // Verifies personalized dashboard loaded from newly registered DB profile
  expect(screen.getByText('Jordan Taylor')).toBeInTheDocument();
  expect(db.getTable('Users').find((user) => user.email === 'jordan@testdomain.org').full_name).toBe('Jordan Taylor');
});

test('blocks registration when password is the same as the email address', () => {
  render(<App />);
  userEvent.click(screen.getByRole('button', { name: /new here\? sign up/i }));

  userEvent.type(screen.getByLabelText(/first name/i), 'Taylor');
  userEvent.type(screen.getByLabelText(/last name/i), 'Swift');
  userEvent.type(screen.getByLabelText(/email address/i), 'taylor@example.com');
  userEvent.type(screen.getByLabelText(/^age$/i), '30');
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1995-12-13' } });
  userEvent.selectOptions(screen.getByLabelText(/^gender/i), 'Woman');
  userEvent.type(screen.getByLabelText(/^password$/i), 'taylor@example.com');
  userEvent.type(screen.getByLabelText(/confirm password/i), 'taylor@example.com');
  userEvent.click(screen.getByLabelText(/i agree to the/i));

  userEvent.click(screen.getByRole('button', { name: /create my account/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/password cannot be the same as your email address/i);
});

test('admin dashboard starts with all data and metrics at 0', () => {
  db.registerUser({
    fullName: 'System Admin',
    email: 'admin.zero@risinghiv.org',
    password: 'securePassword99',
    role: 'admin',
  });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'admin');
  userEvent.type(screen.getByLabelText(/email address/i), 'admin.zero@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'securePassword99');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  expect(screen.getByRole('heading', { name: /keep care connected/i })).toBeInTheDocument();
  // Overview tiles should show 0 for patients, 0 for workers, 0 for appointments, 0 for chats
  expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(4);
  expect(screen.getByText(/new administrator registered/i)).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Reports' }));
  expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(4);
});

test('admin can perform full CRUD on users, see full user info, and inspect availed services with statuses', () => {
  db.registerUser({
    fullName: 'System Admin',
    email: 'admin.crud@risinghiv.org',
    password: 'securePassword99',
    role: 'admin',
  });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'admin');
  userEvent.type(screen.getByLabelText(/email address/i), 'admin.crud@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'securePassword99');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  userEvent.click(screen.getByRole('button', { name: 'Users' }));

  // 1. CREATE USER VIA ADMIN MODAL
  userEvent.click(screen.getByRole('button', { name: /^add user/i }));
  expect(screen.getByRole('heading', { name: /add new user/i })).toBeInTheDocument();

  userEvent.type(screen.getByLabelText(/full name/i), 'Alex Rivera');
  userEvent.type(screen.getByLabelText(/email address/i), 'alex.rivera@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'pass12345');
  userEvent.type(screen.getByLabelText(/^age$/i), '28');
  userEvent.type(screen.getByLabelText(/contact phone/i), '+63 918 111 2222');
  userEvent.selectOptions(screen.getByLabelText(/care status/i), 'Active care plan');
  userEvent.click(screen.getByRole('button', { name: /save user record/i }));

  expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
  expect(screen.getByText(/alex\.rivera@example\.com/i)).toBeInTheDocument();

  // Book an appointment for this newly created patient so they have an availed service
  const alexUser = db.getTable('Users').find((u) => u.email === 'alex.rivera@example.com');
  const alexPatient = db.getTable('Patients').find((p) => p.user_id === alexUser.user_id);
  db.bookAppointment({
    patient_id: alexPatient.patient_id,
    appointment_date: '2026-10-15',
    appointment_time: '9:00 AM',
    appointment_type: 'Confidential HIV Screening',
    status: 'Confirmed',
  });

  // 2. READ & INSPECT USER AND AVAILED SERVICES WITH STATUS
  userEvent.click(screen.getByRole('button', { name: /view details & services/i }));
  const userModal = screen.getByRole('dialog');
  expect(within(userModal).getByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument();
  expect(within(userModal).getByText(/services availed/i)).toBeInTheDocument();
  expect(within(userModal).getByText(/confidential hiv screening/i)).toBeInTheDocument();
  expect(within(userModal).getByText('Confirmed')).toBeInTheDocument();

  // Switch to personal demographics tab
  userEvent.click(within(userModal).getByRole('button', { name: /personal & demographics/i }));
  expect(within(userModal).getByText('28 years old')).toBeInTheDocument();
  expect(within(userModal).getByText('+63 918 111 2222')).toBeInTheDocument();

  // 3. UPDATE USER
  userEvent.click(within(userModal).getByRole('button', { name: /edit user profile/i }));
  const editModal = screen.getByRole('dialog');
  expect(within(editModal).getByRole('heading', { name: /update user/i })).toBeInTheDocument();
  userEvent.clear(within(editModal).getByLabelText(/full name/i));
  userEvent.type(within(editModal).getByLabelText(/full name/i), 'Alex Rivera Updated');
  userEvent.selectOptions(within(editModal).getByLabelText(/care status/i), 'Stable');
  userEvent.click(within(editModal).getByRole('button', { name: /save user record/i }));

  expect(screen.getByText('Alex Rivera Updated')).toBeInTheDocument();

  // 4. DELETE USER
  userEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
  const deleteModal = screen.getByRole('dialog');
  expect(within(deleteModal).getByRole('heading', { name: /delete user account/i })).toBeInTheDocument();
  userEvent.click(within(deleteModal).getByRole('button', { name: /confirm delete/i }));

  expect(screen.queryByText('Alex Rivera Updated')).not.toBeInTheDocument();
});

test('admin can perform full CRUD on health workers, see full worker details, and view their workload & availability status', () => {
  db.registerUser({
    fullName: 'System Admin',
    email: 'admin.worker@risinghiv.org',
    password: 'securePassword99',
    role: 'admin',
  });

  render(<App />);
  userEvent.selectOptions(screen.getByLabelText(/account type/i), 'admin');
  userEvent.type(screen.getByLabelText(/email address/i), 'admin.worker@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'securePassword99');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  userEvent.click(screen.getByRole('button', { name: 'Health workers' }));

  // 1. CREATE HEALTH WORKER VIA ADMIN MODAL
  userEvent.click(screen.getByRole('button', { name: /^add health worker/i }));
  expect(screen.getByRole('heading', { name: /add health worker/i })).toBeInTheDocument();

  userEvent.type(screen.getByLabelText(/full name/i), 'Dr. Maria Clara');
  userEvent.type(screen.getByLabelText(/email address/i), 'maria.clara@risinghiv.org');
  userEvent.type(screen.getByLabelText(/^password$/i), 'workerPass789');
  userEvent.type(screen.getByLabelText(/specialty/i), 'Infectious Disease Specialist');
  userEvent.type(screen.getByLabelText(/license number/i), 'PRC-99887766');
  userEvent.selectOptions(screen.getByLabelText(/availability status/i), 'Available');
  userEvent.selectOptions(screen.getByLabelText(/verification status/i), 'Verified');
  userEvent.type(screen.getByLabelText(/bio & clinical experience/i), 'Over 10 years of community health leadership.');
  userEvent.click(screen.getByRole('button', { name: /save health worker/i }));

  expect(screen.getByText('Dr. Maria Clara')).toBeInTheDocument();
  expect(screen.getByText(/infectious disease specialist/i)).toBeInTheDocument();

  // 2. READ & INSPECT WORKER DETAILS AND WORKLOAD
  userEvent.click(screen.getByRole('button', { name: /view details & workload/i }));
  const workerModal = screen.getByRole('dialog');
  expect(within(workerModal).getByRole('heading', { name: 'Dr. Maria Clara' })).toBeInTheDocument();
  expect(within(workerModal).getByText('PRC-99887766')).toBeInTheDocument();
  expect(within(workerModal).getByText(/over 10 years of community health leadership/i)).toBeInTheDocument();

  // 3. UPDATE HEALTH WORKER
  userEvent.click(within(workerModal).getByRole('button', { name: /edit worker profile/i }));
  const editWorkerModal = screen.getByRole('dialog');
  expect(within(editWorkerModal).getByRole('heading', { name: /update worker/i })).toBeInTheDocument();
  userEvent.selectOptions(within(editWorkerModal).getByLabelText(/availability status/i), 'On Leave');
  userEvent.click(within(editWorkerModal).getByRole('button', { name: /save health worker/i }));

  // 4. DELETE HEALTH WORKER
  userEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);
  const deleteWorkerModal = screen.getByRole('dialog');
  expect(within(deleteWorkerModal).getByRole('heading', { name: /delete health worker/i })).toBeInTheDocument();
  userEvent.click(within(deleteWorkerModal).getByRole('button', { name: /confirm delete/i }));

  expect(screen.queryByText('Dr. Maria Clara')).not.toBeInTheDocument();
});

test('patient can view all services they have availed with their respective status badges', () => {
  const registered = db.registerUser({
    fullName: 'Jordan Patient',
    email: 'jordan.services@example.com',
    password: 'password123',
    role: 'patient',
  });

  const patientId = registered.patient.patient_id;

  // Patient avails multiple services:
  db.bookAppointment({
    patient_id: patientId,
    appointment_date: '2026-11-20',
    appointment_time: '11:00 AM',
    appointment_type: 'Comprehensive Care Consult',
    status: 'Confirmed',
  });

  db.requestMedication({
    patient_id: patientId,
    medication_name: 'Antiretroviral therapy (ART)',
    dosage: '1 tablet daily',
    schedule: 'Nightly at bedtime',
    availability: 'In stock',
    status: 'Approved',
  });

  render(<App />);
  userEvent.type(screen.getByLabelText(/email address/i), 'jordan.services@example.com');
  userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
  userEvent.click(screen.getByRole('button', { name: /^sign in/i }));

  // Open Account / Care dashboard
  const profileButton = screen.getByRole('button', { name: /open .*care dashboard/i });
  userEvent.click(profileButton);

  // Both Account status and Care status are visible
  expect(screen.getByText(/account: active/i)).toBeInTheDocument();
  expect(screen.getByText(/care status: active care plan/i)).toBeInTheDocument();

  // Navigate to Availed Services view
  userEvent.click(screen.getByRole('button', { name: /view availed services/i }));
  expect(screen.getByRole('heading', { name: /services availed/i })).toBeInTheDocument();

  // Check metrics & service items
  expect(screen.getByText(/comprehensive care consult/i)).toBeInTheDocument();
  expect(screen.getByText('Confirmed')).toBeInTheDocument();

  expect(screen.getByText(/antiretroviral therapy \(art\)/i)).toBeInTheDocument();
  expect(screen.getByText('Approved')).toBeInTheDocument();
});




