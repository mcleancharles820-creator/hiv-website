import './App.css';
import { CircleUser } from 'lucide-react';
import { useEffect, useState } from 'react';
import db from './services/databaseService';
import { clearChatRealtimeSession, setChatRealtimeSession, subscribeToChatChanges } from './services/chatRealtime';

function scrollPageToTop() {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function formatDateTime(value, fallback = 'Not recorded') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

const resources = [
  {
    number: '01',
    title: 'Know your status',
    text: 'Testing is the only way to know. Most results are ready quickly, and confidential options are available.',
    action: 'Find a test',
  },
  {
    number: '02',
    title: 'Treatment works',
    text: 'With the right treatment, people living with HIV can live long, healthy lives. Undetectable means untransmittable.',
    action: 'Understand U=U',
  },
  {
    number: '03',
    title: 'Prevention is personal',
    text: 'Condoms, PrEP, PEP, and regular testing can all help. Choose the tools that feel right for you.',
    action: 'Explore prevention',
  },
];

const guestKnowledge = [
  ['What is HIV?', 'HIV is a virus that affects the immune system. With effective treatment, people living with HIV can live long, healthy lives.'],
  ['What is AIDS?', 'AIDS is the most advanced stage of HIV infection. Treatment helps prevent HIV from progressing to AIDS.'],
  ['U=U', 'When a person on treatment has an undetectable viral load, they do not transmit HIV through sex.'],
];

const medicationCatalog = [
  { id: 'art', name: 'Antiretroviral therapy', detail: 'HIV treatment · Take only as prescribed', stock: 'In stock' },
  { id: 'prep', name: 'PrEP', detail: 'HIV prevention medication · Ask a health worker', stock: 'In stock' },
  { id: 'pep', name: 'PEP', detail: 'Post-exposure medication · Urgent care required', stock: 'Out of stock' },
  { id: 'opportunistic', name: 'Preventive care medication', detail: 'For infection prevention · Prescription required', stock: 'Out of stock' },
];

function GuestHub({ onExit, patientMode = false, onPrivatePage, onAccount, initialPage = 'home', profileName = 'Your account' }) {
  const firstPage = initialPage === 'information' ? 'knowledge' : initialPage;
  const [page, setPage] = useState(firstPage);

  useEffect(() => {
    scrollPageToTop();
  }, [page]);

  const navigate = (nextPage) => {
    setPage(nextPage);
    scrollPageToTop();
  };

  const pageContent = {
    home: <section className="guest-hero guest-page"><div><p className="eyebrow"><span className="pulse-dot" /> Public information and support</p><h1>Start with<br /><span>what you know.</span></h1><p>Clear HIV and AIDS information, local testing guidance, and trusted ways to help in Odiongan and beyond.</p><button className="primary-button" onClick={() => navigate('knowledge')}>Explore the essentials <span>↓</span></button></div><figure className="guest-hero-image"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Healthcare professional speaking with a patient" /><figcaption>Care starts with a conversation.</figcaption></figure></section>,
    knowledge: <section className="guest-knowledge guest-page" id="guest-knowledge"><div className="guest-section-intro"><p className="eyebrow">HIV / AIDS 101</p><h1>Knowledge<br /><i>without stigma.</i></h1><p>Reliable basics can make the next decision feel a little clearer.</p></div><div className="knowledge-grid">{guestKnowledge.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p></article>)}</div></section>,
    testing: <section className="guest-testing guest-page" id="guest-testing"><div className="guest-section-intro"><p className="eyebrow">Find your next step</p><h1>Testing and<br /><i>treatment.</i></h1><p>Testing is confidential. Treatment is available, and early care makes a difference.</p><a className="text-button" href="https://www.google.com/maps/search/health+center+Odiongan+Romblon+Philippines" target="_blank" rel="noreferrer">Open in Google Maps ↗</a>{patientMode && <button className="primary-button patient-testing-button" onClick={() => onPrivatePage('appointments')}>Book an appointment <span>↗</span></button>}</div><div className="map-wrap"><iframe title="Map of Odiongan, Romblon, Philippines" src="https://www.openstreetmap.org/export/embed.html?bbox=121.970%2C12.380%2C122.025%2C12.425&layer=mapnik&marker=12.401%2C121.990" /><p className="map-caption"><strong>Odiongan, Romblon</strong><span>Search for the nearest Rural Health Unit or hospital before visiting.</span></p></div><div className="testing-facilities"><div className="facility-heading"><p className="eyebrow">Local care contacts</p><h2>Care to<br /><i>contact first.</i></h2><p>Call ahead and ask about HIV testing, treatment referral, and current clinic schedules.</p></div><div className="facility-list"><a href="https://www.google.com/maps/search/Rural+Health+Unit+Odiongan+Romblon" target="_blank" rel="noreferrer"><strong>Rural Health Unit</strong><span>Odiongan, Romblon · Find on map ↗</span></a><a href="https://www.google.com/maps/search/Romblon+Provincial+Hospital+Odiongan" target="_blank" rel="noreferrer"><strong>Romblon Provincial Hospital</strong><span>Romblon · Find on map ↗</span></a></div></div><div className="testing-notes"><div><span>01</span><h2>Where to begin</h2><p>Visit your local Rural Health Unit, municipal health office, or a hospital and ask about confidential HIV testing.</p></div><div><span>02</span><h2>Where to get treated</h2><p>Ask a health worker about referral to an HIV treatment hub. They can guide you to care, medicines, and follow-up.</p></div><div><span>03</span><h2>Need urgent help?</h2><p>PEP may prevent HIV after a recent exposure and works best as soon as possible. Visit a health facility or emergency department.</p></div></div></section>,
    donate: <section className="guest-donate guest-page" id="guest-donate"><div><p className="eyebrow">Support the work</p><h1>Help care<br /><i>travel further.</i></h1><p>Refer someone to a trusted organization or support programs providing HIV testing, treatment, and dignity.</p></div><div className="org-list"><a href="https://www.pamf.org.ph/" target="_blank" rel="noreferrer"><span>Philippine HIV & AIDS Support House</span><small>Community support and referrals ↗</small></a><a href="https://www.aidsdatahub.org/" target="_blank" rel="noreferrer"><span>AIDS Data Hub</span><small>HIV information and regional resources ↗</small></a><a href="https://www.globalfund.org/en/donate/" target="_blank" rel="noreferrer"><span>The Global Fund</span><small>Donate to end AIDS, TB, and malaria ↗</small></a></div></section>,
  };

  return <div className="guest-hub">
    <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
    <header className="site-header guest-header"><button className="brand brand-button" onClick={() => navigate('home')} aria-label="HIVeLink home"><span>HIVeLink</span></button><nav className="nav-links" aria-label={patientMode ? 'Patient navigation' : 'Guest navigation'}><button className={page === 'home' ? 'guest-nav-link active' : 'guest-nav-link'} onClick={() => navigate('home')}>Home</button><button className={page === 'knowledge' ? 'guest-nav-link active' : 'guest-nav-link'} onClick={() => navigate('knowledge')}>Information</button><button className={page === 'testing' ? 'guest-nav-link active' : 'guest-nav-link'} onClick={() => navigate('testing')}>Testing</button><button className={page === 'donate' ? 'guest-nav-link active' : 'guest-nav-link'} onClick={() => navigate('donate')}>Donate</button>{patientMode && <button className="guest-nav-link" onClick={() => onPrivatePage('care')}>Care</button>}</nav>{patientMode ? <div className="patient-header-actions"><span className="profile-name">{profileName}</span><button className="profile-icon" type="button" aria-label={`Open ${profileName}'s care dashboard`} title="Open care dashboard" onClick={onAccount}><CircleUser aria-hidden="true" className="profile-icon-glyph" color="currentColor" size={18} strokeWidth={1.6} /></button><button className="sign-out-button" onClick={onExit}>Sign out</button></div> : <button className="guest-auth-link" onClick={onExit}>Log in / Sign up <span>↗</span></button>}</header>
    <main key={page} id="guest-top" className="route-transition">{pageContent[page]}</main><footer><span className="footer-brand">HIVeLink</span><span>{patientMode ? 'Private patient view' : 'Public guest view · No account required'}</span><button className="footer-back" onClick={() => navigate('home')}>Back to home ↑</button></footer>
  </div>;
}

function AuthScreen({ onEnter }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [role, setRole] = useState('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    if (!legalDocument) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setLegalDocument(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [legalDocument]);

  useEffect(() => {
    scrollPageToTop();
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const form = event.currentTarget;
    const password = form.elements.password.value;
    const email = form.elements.email.value;

    if (mode === 'register') {
      if (password.toLowerCase() === email.trim().toLowerCase()) {
        setError('Password cannot be the same as your email address.');
        setIsSubmitting(false);
        return;
      }

      if (password !== form.elements.confirmPassword.value) {
        setError('Passwords do not match. Please check them and try again.');
        setIsSubmitting(false);
        return;
      }

      const firstName = form.elements.firstName.value.trim();
      const lastName = form.elements.lastName.value.trim();
      const age = form.elements.age && form.elements.age.value ? parseInt(form.elements.age.value, 10) : null;
      const dateOfBirth = form.elements.dateOfBirth ? form.elements.dateOfBirth.value : null;
      const gender = form.elements.gender ? form.elements.gender.value : null;
      const contactNumber = form.elements.contactNumber ? form.elements.contactNumber.value : null;
      const termsAccepted = form.elements.terms ? form.elements.terms.checked : true;

      const registration = db.registerUser({ firstName, lastName, email, password, role, age, dateOfBirth, gender, contactNumber, termsAccepted });
      const registered = db.useApi ? await registration : registration;

      if (registered.verificationRequired || registered.verificationPending) {
        setVerificationEmail(email.trim());
        setVerificationMessage(registered.error || 'We sent a verification link. Open it before signing in.');
        setIsSubmitting(false);
        return;
      }

      if (registered.error) {
        setError(registered.error);
        setIsSubmitting(false);
        return;
      }

      onEnter(registered.user?.role || role, false, registered);
    } else {
      const authentication = db.login({ email, password, role });
      const auth = db.useApi ? await authentication : authentication;
      if (auth.error) {
        if (db.useApi && /verify your email/i.test(auth.error)) {
          setVerificationEmail(email.trim());
          setVerificationMessage(auth.error);
          setIsSubmitting(false);
          return;
        }
        setError(auth.error);
        setIsSubmitting(false);
        return;
      }
      onEnter(auth.user?.role || role, false, auth);
    }
  };

  const resendVerification = async () => {
    setResendingVerification(true);
    const result = await db.resendVerificationEmail(verificationEmail);
    setVerificationMessage(result.error || result.message || 'If this account needs verification, a new link has been sent.');
    setResendingVerification(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-message"><p className="eyebrow"><span className="pulse-dot" /> A judgment-free place to start</p><h1>Care begins<br /><span>with you.</span></h1><p>Clear information and compassionate support, whenever you need it.</p></div>
        <div className="auth-stamp">Your health.<br /><strong>Your pace.</strong></div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel-top"><span>WELCOME</span><span>01 / 01</span></div>
        <div key={mode} className="auth-form-wrap route-transition">
          <div className="auth-page-label"><span>{verificationEmail ? 'VERIFY EMAIL' : mode === 'login' ? 'LOG IN' : 'SIGN UP'}</span><span>01 / 01</span></div>
          <h2>{verificationEmail ? <>Check your<br /><i>email.</i></> : mode === 'login' ? <>Good to<br /><i>see you.</i></> : <>Make space<br /><i>for care.</i></>}</h2>
          <p className="auth-intro">{verificationEmail ? `We sent a verification link to ${verificationEmail}. Verify your address, then return here to sign in.` : mode === 'login' ? 'Sign in to keep your support journey in one private place.' : 'Create an account to save resources and connect with support.'}</p>
          {verificationEmail ? <div className="verification-prompt">
            <p className="verification-address">{verificationEmail}</p>
            {verificationMessage && <p className="verification-feedback" role="status">{verificationMessage}</p>}
            <button className="primary-button" type="button" onClick={resendVerification} disabled={resendingVerification}>{resendingVerification ? 'Sending...' : 'Resend verification email'} <span>↗</span></button>
            <button className="auth-switch" type="button" onClick={() => { setVerificationEmail(''); setVerificationMessage(''); setMode('login'); setRole('patient'); setError(''); }}>Back to sign in</button>
          </div> : <>
          <form key={mode} className={`auth-form ${mode === 'register' ? 'registration-form' : ''}`} onSubmit={handleSubmit} autoComplete="off">
            {mode === 'register' && <div className="field-row registration-name-row"><label>First Name<input name="firstName" required type="text" autoComplete="given-name" placeholder="First name" /></label><label>Last Name<input name="lastName" required type="text" autoComplete="family-name" placeholder="Last name" /></label></div>}
            <label>Email Address<input name="email" required type="email" autoComplete="off" placeholder="you@example.com" /></label>
            {mode === 'login' && !db.useApi && <label>Account type<select name="role" value={role} onChange={(event) => setRole(event.target.value)} required><option value="patient">Patient / User</option><option value="health-worker">Health Worker</option><option value="admin">Admin</option></select></label>}
            {mode === 'register' && <div className="field-row"><label>Age<input name="age" required type="number" min="13" max="120" placeholder="Age" /></label><label>Date of Birth<input name="dateOfBirth" required type="date" /></label></div>}
            {mode === 'register' && <label>Gender<select name="gender" defaultValue="" required><option value="" disabled>Select an option</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option><option>Self-describe</option></select></label>}
            <label>Password<input name="password" required minLength={mode === 'register' ? 12 : undefined} type="password" autoComplete="new-password" placeholder="Enter your password" /></label>
            {mode === 'register' && <label>Confirm Password<input name="confirmPassword" required type="password" autoComplete="new-password" placeholder="Re-enter your password" /></label>}
            {mode === 'register' && <label>Contact Number <span className="optional">(optional)</span><input name="contactNumber" type="tel" autoComplete="off" placeholder="Your contact number" /></label>}
            {mode === 'register' && <label className="consent"><input name="terms" required type="checkbox" /><span>I agree to the <button type="button" className="legal-link" onClick={() => setLegalDocument('terms')}>Terms of Use</button> and have read the <button type="button" className="legal-link" onClick={() => setLegalDocument('privacy')}>Privacy Notice</button>.</span></label>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create my account'} <span>↗</span></button>
          </form>
          {mode === 'login' && <button className="forgot-link">Forgot your password?</button>}
          <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setRole('patient'); setError(''); }}>{mode === 'login' ? 'New here? Sign up' : 'Already have an account? Log in'} <span>↗</span></button>
          <div className="guest-divider"><span>or</span></div>
          <button className="guest-button" onClick={() => onEnter('patient', true)}>Continue as guest <span>→</span></button>
          <p className="privacy-note">Your information is treated with care and never shared without your permission.</p>
          </>}
        </div>
      </div>
      {legalDocument && <div className="modal-backdrop legal-backdrop" role="presentation" onClick={() => setLegalDocument(null)}>
        <section className="legal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-title" onClick={(event) => event.stopPropagation()}>
          <button className="close-button" type="button" onClick={() => setLegalDocument(null)} aria-label="Close legal information">×</button>
          <p className="eyebrow">HIVeLink · Account information</p>
          <h2 id="legal-title">{legalDocument === 'terms' ? 'Terms of Use' : 'Privacy Notice'}</h2>
          {legalDocument === 'terms' ? <div className="legal-copy">
            <p><strong>Use of this service.</strong> HIVeLink provides educational information and tools for communicating about support, appointments, and care. By creating an account, you agree to use the service lawfully and provide information that is accurate to the best of your knowledge.</p>
            <p><strong>Not medical care.</strong> This website is not a medical provider and does not diagnose, treat, or replace advice from a licensed health professional. Do not use chat or appointment requests for emergencies. Contact local emergency services or a qualified clinician when urgent help is needed.</p>
            <p><strong>Your account.</strong> Keep your sign-in details private and tell the service administrator if you believe your account has been accessed without permission. Access may be suspended to protect users or maintain the service.</p>
            <p><strong>Respectful use.</strong> Do not use HIVeLink to threaten, harass, impersonate, or unlawfully access another person’s information. Do not submit information about another person unless you are authorized to do so.</p>
            <p><strong>Availability and changes.</strong> Features may change or be unavailable. Information on the site may not always reflect current clinic schedules, medication stock, or local guidance; confirm these directly with a health professional or facility.</p>
            <p><strong>Questions.</strong> For account or service questions, contact the organization operating HIVeLink. These terms are a plain-language service notice and are not a substitute for legal advice or a complete legal agreement.</p>
          </div> : <div className="legal-copy">
            <p><strong>Information we collect.</strong> Depending on how you use HIVeLink, this can include your name, email, contact details, date of birth, account credentials, appointment and medication requests, messages, and information you choose to share with a health worker.</p>
            <p><strong>How it is used.</strong> Information is used to create and secure your account, provide requested platform features, coordinate support, and maintain service operations. Do not enter information you are not comfortable sharing.</p>
            <p><strong>Email notifications.</strong> HIVeLink may email your registered address about account setup, appointment or medication request status, or a new private-chat message. Chat message text and clinical notes are not included in those automatic notifications. Administrators may also send account-related messages to the email address on file.</p>
            <p><strong>Storage and access.</strong> When the production API is configured, account and service records are stored in the operator’s database and can be accessed by authorized staff according to their role. Administrators and assigned health workers may see information needed for their responsibilities.</p>
            <p><strong>Security and limits.</strong> Reasonable technical safeguards are used, but no internet service can guarantee absolute security. Do not use this site for emergency communication. Contact the operator promptly if you suspect unauthorized access.</p>
            <p><strong>Your choices.</strong> You may choose what information to provide, except fields required for an account or feature. To request access, correction, or deletion, contact the organization operating HIVeLink.</p>
            <p><strong>Important status notice.</strong> HIVeLink is still being prepared for public operation. Do not submit real patient or sensitive health information until the operator has completed appropriate security, privacy, and legal reviews and has published contact details for privacy requests.</p>
          </div>}
          <button type="button" className="primary-button legal-close" onClick={() => setLegalDocument(null)}>Close</button>
        </section>
      </div>}
    </div>
  );
}

function StatusBadge({ status, type, label }) {
  if (!status) return null;
  const statusStr = String(status);
  const normalized = statusStr.toLowerCase().replace(/[^a-z0-9]/g, '-');

  let variant = 'neutral';
  if (type) {
    variant = type;
  } else if (['active', 'stable', 'confirmed', 'completed', 'approved', 'verified', 'available', 'dispensed', 'in-stock', 'active-care-plan', 'active-member'].includes(normalized)) {
    variant = 'success';
  } else if (['pending', 'requested', 'needs-followup', 'needs-follow-up', 'busy', 'needs-information'].includes(normalized)) {
    variant = 'warning';
  } else if (['inactive', 'cancelled', 'out-of-stock', 'offline', 'danger'].includes(normalized)) {
    variant = 'danger';
  } else if (['open', 'in-progress', 'rescheduled', 'new-referral'].includes(normalized)) {
    variant = 'info';
  } else if (['on-leave', 'closed'].includes(normalized)) {
    variant = 'neutral';
  }

  return (
    <span className={`status-badge status-${variant} status-${normalized}`}>
      <span className="status-dot" />
      <span>{label || statusStr}</span>
    </span>
  );
}

function ServicesAvailedView({ servicesAvailed, emptyMessage = 'No services availed yet.' }) {
  const [filterCategory, setFilterCategory] = useState('all');

  const allServices = servicesAvailed?.servicesList || [];
  const appointmentsCount = servicesAvailed?.appointments?.length || 0;
  const medicationsCount = servicesAvailed?.medicationRequests?.length || 0;
  const chatsCount = servicesAvailed?.chatSessions?.length || 0;
  const groupsCount = servicesAvailed?.supportGroups?.length || 0;
  const totalCount = allServices.length;

  const filtered = filterCategory === 'all'
    ? allServices
    : allServices.filter((s) => {
        if (filterCategory === 'appointments') return s.category.includes('Appointment');
        if (filterCategory === 'medications') return s.category.includes('Medication');
        if (filterCategory === 'chats') return s.category.includes('Chat');
        if (filterCategory === 'groups') return s.category.includes('Group');
        return true;
      });

  return (
    <div className="services-availed-container">
      <div className="services-metric-bar">
        <div className="services-metric-tile">
          <span>Total Availed</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="services-metric-tile">
          <span>Appointments</span>
          <strong>{appointmentsCount}</strong>
        </div>
        <div className="services-metric-tile">
          <span>Medications</span>
          <strong>{medicationsCount}</strong>
        </div>
        <div className="services-metric-tile">
          <span>Support Chats</span>
          <strong>{chatsCount}</strong>
        </div>
        <div className="services-metric-tile">
          <span>Support Groups</span>
          <strong>{groupsCount}</strong>
        </div>
      </div>

      <div className="category-filter-bar">
        <button
          type="button"
          className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          All Services <span className="chip-count">{totalCount}</span>
        </button>
        <button
          type="button"
          className={`filter-chip ${filterCategory === 'appointments' ? 'active' : ''}`}
          onClick={() => setFilterCategory('appointments')}
        >
          Appointments <span className="chip-count">{appointmentsCount}</span>
        </button>
        <button
          type="button"
          className={`filter-chip ${filterCategory === 'medications' ? 'active' : ''}`}
          onClick={() => setFilterCategory('medications')}
        >
          Medications <span className="chip-count">{medicationsCount}</span>
        </button>
        <button
          type="button"
          className={`filter-chip ${filterCategory === 'chats' ? 'active' : ''}`}
          onClick={() => setFilterCategory('chats')}
        >
          Support Chats <span className="chip-count">{chatsCount}</span>
        </button>
        <button
          type="button"
          className={`filter-chip ${filterCategory === 'groups' ? 'active' : ''}`}
          onClick={() => setFilterCategory('groups')}
        >
          Groups <span className="chip-count">{groupsCount}</span>
        </button>
      </div>

      <div className="services-availed-wrap">
        {filtered.length ? (
          filtered.map((service) => (
            <article className="service-availed-item" key={service.id}>
              <div className="service-availed-header">
                <div>
                  <span className="service-availed-category">{service.category}</span>
                  <h3 className="service-availed-title">{service.name}</h3>
                </div>
                <StatusBadge status={service.status} type={service.statusType} />
              </div>
              <p className="service-availed-details">{service.details}</p>
              <div className="service-availed-meta">
                <span>Date: <strong>{service.date}</strong></span>
                <span>{service.time}</span>
                <span>Recorded: <strong>{formatDateTime(service.raw?.created_at || service.raw?.requested_at || service.raw?.last_updated || service.raw?.joinedAt)}</strong></span>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-records">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

function PatientDashboard({ currentUser, currentPatient, onPublicHub, onSignOut }) {
  const [, setDbVersion] = useState(0);
  const [page, setPage] = useState('home');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    return db.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  const activeUserId = currentUser?.user_id;
  const activeUser = (activeUserId ? db.findById('Users', activeUserId) : null) || currentUser || { full_name: 'Your Account', email: '', contact_number: '' };
  const patientRecord = currentPatient || (activeUserId ? db.getTable('Patients').find((p) => p.user_id === activeUserId) : null) || db.getTable('Patients')[0] || { patient_id: null, user_id: activeUserId };
  const activePatientId = patientRecord.patient_id;

  const profileName = activeUser.full_name || 'Your Account';
  const appointments = activePatientId ? db.getTable('Appointments').filter((a) => a.patient_id === activePatientId) : [];
  const medications = activePatientId ? db.getTable('MedicationRequests').filter((m) => m.patient_id === activePatientId) : [];
  const chats = activePatientId ? db.getTable('ChatSessions').filter((c) => c.patient_id === activePatientId) : [];
  const joinedGroups = activePatientId ? db.getTable('SupportGroupMembers').filter((sgm) => sgm.patient_id === activePatientId) : [];

  const navigate = (nextPage) => {
    setPage(nextPage);
    setEditing(null);
    scrollPageToTop();
  };

  const handleSaveForm = (record) => {
    if (record.type === 'profile') {
      if (activeUser.user_id) {
        db.update('Users', activeUser.user_id, {
          full_name: record.name,
          email: record.email,
          contact_number: record.phone,
        });
      }
    } else if (record.type === 'appointment') {
      if (record.id) {
        db.update('Appointments', record.id, {
          appointment_date: record.date,
          appointment_time: record.time,
          appointment_type: record.appointmentType,
          status: record.status || 'Requested',
        });
      } else {
        db.bookAppointment({
          patient_id: activePatientId || 1,
          appointment_date: record.date,
          appointment_time: record.time,
          appointment_type: record.appointmentType,
          status: record.status || 'Requested',
        });
      }
    } else if (record.type === 'medication') {
      if (record.id) {
        db.update('MedicationRequests', record.id, {
          medication_name: record.name,
          dosage: record.dosage,
          schedule: record.schedule,
          availability: record.availability || 'In stock',
        });
      } else {
        db.requestMedication({
          patient_id: activePatientId || 1,
          medication_name: record.name,
          dosage: record.dosage,
          schedule: record.schedule,
          availability: record.availability || 'In stock',
        });
      }
    }
    setEditing(null);
  };

  const servicesAvailed = db.getUserServicesAvailed(activeUserId || activePatientId);

  const isTestingEnabled = db.getTable('PlatformServices').find((s) => s.service_key === 'testing_referrals')?.is_enabled ?? true;
  const isTreatmentEnabled = db.getTable('PlatformServices').find((s) => s.service_key === 'treatment_referrals')?.is_enabled ?? true;
  const isChatEnabled = db.getTable('PlatformServices').find((s) => s.service_key === 'chat_support')?.is_enabled ?? true;
  const isMedicationRequestsEnabled = db.getTable('PlatformServices').find((s) => s.service_key === 'medication_requests')?.is_enabled ?? false;

  const content = {
    home: <section className="patient-public-home"><p className="eyebrow"><span className="pulse-dot" /> Patient public view</p><h1>Start with<br /><i>what you know.</i></h1><p className="dashboard-intro">Clear HIV and AIDS information, local testing guidance, and trusted ways to support the community.</p><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Healthcare professional speaking with a patient" /></section>,
    care: <PagePanel eyebrow="Private care tools" title={<>Care, all in<br /><i>one place.</i></>}><div className="care-grid"><PatientAction title="Services availed" text="View all your booked appointments, medications, and support." action={() => navigate('services')} /><PatientAction title="Private chat" text={isChatEnabled ? "Ask questions in a confidential support thread." : "Private chat support is currently unavailable."} action={() => navigate('chat')} /><PatientAction title="Medication" text={isMedicationRequestsEnabled ? "Keep your treatment details in one place." : "Medication availability guide."} action={() => navigate('medication')} /><PatientAction title="Support groups" text="Join a community that understands your experience." action={() => navigate('support')} /></div></PagePanel>,
    services: <PagePanel eyebrow="Your care history" title={<>Services<br /><i>availed.</i></>}><ServicesAvailedView servicesAvailed={servicesAvailed} emptyMessage="You have not availed any services yet. Book an appointment or request medication to get started." /></PagePanel>,
    information: <PagePanel eyebrow="HIV information" title={<>Care starts<br /><i>with clarity.</i></>}><div className="patient-info-grid"><article><span>01</span><h2>Know your status</h2><p>Testing is the only way to know. Confidential testing and treatment are available.</p></article><article><span>02</span><h2>Treatment works</h2><p>With the right treatment, people living with HIV can live long, healthy lives.</p></article><article><span>03</span><h2>U=U</h2><p>An undetectable viral load means HIV is not transmitted through sex.</p></article></div><div className="profile-card"><div><span>FULL NAME</span><strong>{activeUser.full_name}</strong></div><div><span>EMAIL ADDRESS</span><strong>{activeUser.email}</strong></div><div><span>CONTACT NUMBER</span><strong>{activeUser.contact_number || 'Not provided'}</strong></div><div><span>ACCOUNT STATUS</span><div><StatusBadge status={activeUser.is_active !== false ? 'Active' : 'Inactive'} /></div></div><div><span>CARE STATUS</span><div><StatusBadge status={patientRecord.care_status || 'Active care plan'} /></div></div><div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', gridColumn: '1 / -1' }}><button className="primary-button" onClick={() => setEditing({ type: 'profile', name: activeUser.full_name, email: activeUser.email, phone: activeUser.contact_number || '' })}>Edit profile <span>↗</span></button><button className="text-button" onClick={() => navigate('services')}>View availed services ↗</button></div></div></PagePanel>,
    testing: <PagePanel eyebrow="Find your next step" title={<>Testing and<br /><i>treatment.</i></>}><div className="patient-testing-intro"><p>Testing is confidential. Treatment is available, and early care makes a difference.</p><a className="text-button" href="https://www.google.com/maps/search/health+center+Odiongan+Romblon+Philippines" target="_blank" rel="noreferrer">Open in Google Maps ↗</a></div>{!isTestingEnabled && <p className="form-error" style={{ margin: '16px 0' }}>HIV testing referrals are currently offline.</p>}<div className="map-wrap patient-map"><iframe title="Map of Odiongan, Romblon, Philippines" src="https://www.openstreetmap.org/export/embed.html?bbox=121.970%2C12.380%2C122.025%2C12.425&layer=mapnik&marker=12.401%2C121.990" /><p className="map-caption"><strong>Odiongan, Romblon</strong><span>Search for the nearest Rural Health Unit or hospital before visiting.</span></p></div><div className="testing-notes patient-testing-notes"><div><span>01</span><h2>Where to begin</h2><p>Visit your local Rural Health Unit, municipal health office, or hospital and ask about confidential HIV testing.</p></div><div><span>02</span><h2>Where to get treated</h2><p>{isTreatmentEnabled ? 'Ask a health worker about referral to an HIV treatment hub, medicines, and follow-up care.' : 'Treatment referral service is currently offline.'}</p></div></div>{isTestingEnabled ? <button className="primary-button panel-action" onClick={() => navigate('appointments')}>Book an appointment <span>↗</span></button> : <p className="empty-records">Appointment booking is currently unavailable.</p>}</PagePanel>,
    appointments: <PagePanel eyebrow="Care schedule" title={<>Book an<br /><i>appointment.</i></>}><button className="primary-button panel-action" onClick={() => setEditing({ type: 'appointment', date: '', time: '', appointmentType: 'HIV care consultation', status: 'Requested' })}>Book appointment <span>+</span></button><RecordList items={appointments} empty="No appointments yet." render={(item) => <><div><strong>{item.appointment_type || item.appointmentType}</strong><span>{item.appointment_date || item.date} · {item.appointment_time || item.time}</span></div><StatusBadge status={item.status || 'Requested'} /><RecordActions onEdit={() => setEditing({ type: 'appointment', id: item.appointment_id || item.id, date: item.appointment_date || item.date, time: item.appointment_time || item.time, appointmentType: item.appointment_type || item.appointmentType, status: item.status })} onDelete={() => db.delete('Appointments', item.appointment_id || item.id)} /></>} /></PagePanel>,
    medication: <PagePanel eyebrow="Treatment support" title={<>Medication<br /><i>availability.</i></>}><p className="medication-note">Choose from the medication list below. Stock status is provided for guidance; confirm your prescription and availability with a health worker before visiting.</p>{!isMedicationRequestsEnabled && <p className="form-error" style={{ margin: '12px 0' }}>Online medication requests are currently unavailable. Contact your clinic directly.</p>}<div className="medication-catalog">{medicationCatalog.map((medication) => <article className="medication-option" key={medication.id}><div><strong>{medication.name}</strong><span>{medication.detail}</span></div><em className={medication.stock === 'In stock' ? 'status-available' : 'status-unavailable'}>{medication.stock}</em>{medication.stock === 'In stock' && isMedicationRequestsEnabled ? <button className="card-link" onClick={() => setEditing({ type: 'medication', name: medication.name, dosage: '', schedule: '', availability: medication.stock })}>Request medication <span>↗</span></button> : <span className="unavailable-label">{!isMedicationRequestsEnabled ? 'Service unavailable' : 'Currently unavailable'}</span>}</article>)}</div><h2 className="medication-record-heading">Your medication records</h2><div className="medication-list"><RecordList items={medications} empty="No medication records yet." render={(item) => <><div><strong>{item.medication_name || item.name}</strong><span>{item.dosage} · {item.schedule}</span></div><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><StatusBadge status={item.status || 'Pending'} /><em className={(item.availability || 'In stock') === 'In stock' ? 'status-available' : 'status-unavailable'}>{item.availability || 'In stock'}</em></div><RecordActions onEdit={() => setEditing({ type: 'medication', id: item.request_id || item.id, name: item.medication_name || item.name, dosage: item.dosage, schedule: item.schedule, availability: item.availability })} onDelete={() => db.delete('MedicationRequests', item.request_id || item.id)} /></>} /></div></PagePanel>,
    chat: <PagePanel eyebrow="Confidential support" title={<>Private<br /><i>conversation.</i></>}><ChatMessenger patientId={activePatientId} userId={activeUser.user_id} ticket={chats[0] || { status: 'Open' }} onUpdate={(preview) => { if (chats[0]) { db.update('ChatSessions', chats[0].chat_session_id || chats[0].id, { preview, last_updated: new Date().toISOString() }); } }} /></PagePanel>,
    support: <PagePanel eyebrow="Community care" title={<>You belong<br /><i>here.</i></>}><div className="support-groups"><SupportGroup name="Living Positive" detail="Peer connection · Weekly online circle" /><SupportGroup name="Island Care Circle" detail="Local support · Romblon community" /><SupportGroup name="Young Advocates" detail="Peer support · Ages 18–29" /></div></PagePanel>,
    donate: <PagePanel eyebrow="Trusted referrals" title={<>Support that<br /><i>reaches further.</i></>}><div className="org-list patient-org-list"><a href="https://www.globalfund.org/en/donate/" target="_blank" rel="noreferrer"><span>The Global Fund</span><small>Donate to end AIDS, TB, and malaria ↗</small></a><a href="https://www.pamf.org.ph/" target="_blank" rel="noreferrer"><span>Philippine HIV & AIDS Support House</span><small>Community support and referrals ↗</small></a></div></PagePanel>,
    account: <PagePanel eyebrow="Your account" title={<>Your care<br /><i>dashboard.</i></>}><div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}><StatusBadge status={activeUser.is_active !== false ? 'Active' : 'Inactive'} label={`Account: ${activeUser.is_active !== false ? 'Active' : 'Inactive'}`} /><StatusBadge status={patientRecord.care_status || 'Active care plan'} label={`Care status: ${patientRecord.care_status || 'Active care plan'}`} /></div><div className="dashboard-tiles"><DashboardTile label="Services availed" value={`${servicesAvailed.totalCount} total`} detail="Review all care history" /><DashboardTile label="Upcoming appointment" value={appointments[0] ? `${appointments[0].appointment_date || appointments[0].date} · ${appointments[0].appointment_time || appointments[0].time}` : 'Nothing scheduled'} detail={appointments[0]?.appointment_type || appointments[0]?.appointmentType || 'Book your first visit'} /><DashboardTile label="Private chat notifications" value={`${chats.length || 1} open ${chats.length === 1 ? 'conversation' : 'conversations'}`} detail="View your support messages" /><DashboardTile label="Support groups joined" value={`${joinedGroups.length} groups`} detail="Find a community to join" /><DashboardTile label="Medications ordered" value={`${medications.length} ${medications.length === 1 ? 'record' : 'records'}`} detail="Review your treatment records" /></div><h2 className="quick-heading">Quick actions</h2><div className="care-grid"><PatientAction title="View availed services" text="Check statuses of all appointments, medications, and support." action={() => navigate('services')} /><PatientAction title="Book appointment" text="Schedule time with a health worker." action={() => navigate('appointments')} /><PatientAction title="Start private chat" text="Send a confidential question." action={() => navigate('chat')} /><PatientAction title="Manage medication" text="Update your treatment records." action={() => navigate('medication')} /></div></PagePanel>,
  };

  if (['home', 'information', 'testing', 'donate'].includes(page)) {
    return <GuestHub patientMode initialPage={page} profileName={profileName} onExit={onSignOut} onPrivatePage={navigate} onAccount={() => navigate('account')} />;
  }

  return (
    <div className="patient-shell">
      <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
      <header className="site-header guest-header patient-header">
        <button className="brand brand-button" onClick={() => navigate('home')} aria-label="HIVeLink home"><span>HIVeLink</span></button>
        <nav className="nav-links" aria-label="Patient navigation">
          {[['home', 'Home'], ['information', 'Information'], ['testing', 'Testing'], ['donate', 'Donate'], ['care', 'Care']].map(([key, label]) => (
            <button className={`guest-nav-link ${page === key ? 'active' : ''}`} key={key} onClick={() => navigate(key)}>{label}</button>
          ))}
        </nav>
        <div className="patient-header-actions">
          <span className="profile-name">{profileName}</span>
          <button className={`profile-icon ${page === 'account' ? 'active' : ''}`} type="button" aria-label={`Open ${profileName}'s care dashboard`} aria-current={page === 'account' ? 'page' : undefined} onClick={() => navigate('account')} title="Open care dashboard">
            <CircleUser aria-hidden="true" className="profile-icon-glyph" color="currentColor" size={18} strokeWidth={1.6} />
          </button>
          <button className="sign-out-button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <main key={page} className="patient-main route-transition">{content[page]}</main>
      <footer>
        <span className="footer-brand">HIVeLink</span>
        <button className="patient-public-link" onClick={onPublicHub}>Public awareness hub ↗</button>
        <button className="footer-back" onClick={() => navigate('home')}>Back to top ↑</button>
      </footer>
      {editing && <PatientForm data={editing} onClose={() => setEditing(null)} onSave={handleSaveForm} />}
    </div>
  );
}

function PatientAction({ title, text, action }) { return <article className="dashboard-card"><span>+</span><h2>{title}</h2><p>{text}</p><button className="card-link" aria-label={`Open ${title}`} onClick={action}>Open <span>↗</span></button></article>; }

function ChatMessenger({ ticket, onUpdate, userId, patientId }) {
  const [, setDbVersion] = useState(0);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  const chatSessionId = ticket?.chat_session_id || ticket?.id;
  const unreadIncomingCount = db.getTable('ChatMessages').filter((message) => (
    message.chat_session_id === chatSessionId && message.sender_role === 'worker' && !message.is_read
  )).length;

  useEffect(() => {
    if (chatSessionId) db.markChatRead(chatSessionId, 'patient');
  }, [chatSessionId, unreadIncomingCount]);

  const assignedWorker = ticket?.worker_id ? db.findById('HealthWorkers', ticket.worker_id) : null;
  const assignedWorkerUser = assignedWorker ? db.findById('Users', assignedWorker.user_id) : db.getTable('Users').find((u) => u.role === 'health-worker');
  const workerDisplayName = assignedWorkerUser?.full_name || 'Health Worker Support';
  const workerAvatarInitial = workerDisplayName.charAt(0) || 'H';

  const messages = db.getTable('ChatMessages')
    .filter((m) => !ticket?.chat_session_id || m.chat_session_id === ticket.chat_session_id)
    .map((m) => ({
      id: m.message_id || m.id,
      from: m.sender_role === 'worker' ? 'worker' : 'you',
      text: m.message_text || m.text,
      time: m.sent_at ? formatDateTime(m.sent_at) : (m.time || 'Not recorded'),
      isRead: Boolean(m.is_read),
    }));

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSendError('');
    const result = await db.sendChatMessage({
      chat_session_id: ticket?.chat_session_id || ticket?.id || 1,
      sender_user_id: userId || 1,
      sender_role: 'patient',
      message_text: text,
    });
    if (result?.error) {
      setSendError(result.error);
      return;
    }
    if (onUpdate && !db.useApi) onUpdate(text);
    setDraft('');
  };

  const isChatEnabled = db.getTable('PlatformServices').find((s) => s.service_key === 'chat_support')?.is_enabled ?? true;

  return (
    <div className="messenger">
      <div className="messenger-header">
        <span className="worker-avatar">{workerAvatarInitial}</span>
        <div><strong>{workerDisplayName}</strong><span>Health worker · Available for support</span></div>
        <em>{isChatEnabled ? (ticket?.status || 'Open') : 'Offline'}</em>
      </div>
      {!isChatEnabled && <p className="form-error" style={{ margin: '12px 16px' }}>Private chat support is currently disabled by administrator.</p>}
      <div className="message-list">
        {messages.length ? messages.map((message) => (
          <div className={`message-row ${message.from === 'you' ? 'from-you' : ''}`} key={message.id}>
            <div className="message-bubble">
              <p>{message.text}</p>
              <time>{message.time}{message.from === 'you' ? ` · ${message.isRead ? 'Read' : 'Sent'}` : ''}</time>
            </div>
          </div>
        )) : <p className="empty-records">No messages yet. Send a message to start confidential support.</p>}
      </div>
      {sendError && <p className="form-error chat-error" role="alert">{sendError}</p>}
      <form className="message-compose" onSubmit={sendMessage}>
        <input disabled={!isChatEnabled} aria-label="Message health worker" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={isChatEnabled ? "Write a private message..." : "Chat is currently offline"} />
        <button disabled={!isChatEnabled} className="primary-button" type="submit" aria-label="Send message">Send <span>↗</span></button>
      </form>
      <div className="ticket-actions"><span>Private chat ticket</span></div>
    </div>
  );
}

function HealthWorkerChatInbox({ userId }) {
  const [, setDbVersion] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => db.subscribe(() => setDbVersion((version) => version + 1)), []);

  const messages = db.getTable('ChatMessages');
  const sessions = db.getTable('ChatSessions').map((session) => {
    const patient = db.findById('Patients', session.patient_id);
    const patientUser = patient ? db.findById('Users', patient.user_id) : null;
    const sessionMessages = messages.filter((message) => message.chat_session_id === session.chat_session_id);
    return {
      ...session,
      patientName: patientUser?.full_name || 'Patient',
      messages: sessionMessages,
      unreadCount: sessionMessages.filter((message) => message.sender_role === 'patient' && !message.is_read).length,
    };
  }).sort((left, right) => new Date(right.last_updated || 0) - new Date(left.last_updated || 0));
  const activeSession = sessions.find((session) => session.chat_session_id === activeChatId) || sessions[0] || null;
  const chatEnabled = db.getTable('PlatformServices').find((service) => service.service_key === 'chat_support')?.is_enabled ?? true;

  useEffect(() => {
    if (activeSession?.chat_session_id) db.markChatRead(activeSession.chat_session_id, 'health-worker');
  }, [activeSession?.chat_session_id, activeSession?.unreadCount]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeSession) return;
    setError('');
    const result = await db.sendChatMessage({
      chat_session_id: activeSession.chat_session_id,
      sender_user_id: userId,
      sender_role: 'worker',
      message_text: text,
    });
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDraft('');
  };

  const setConversationStatus = async (status) => {
    if (!activeSession) return;
    const result = await db.update('ChatSessions', activeSession.chat_session_id, { status });
    if (result?.error) setError(result.error);
  };

  return (
    <section className="chat-inbox" aria-label="Assigned patient conversations">
      <div className="chat-inbox-list">
        <h2>Conversations</h2>
        {sessions.length ? sessions.map((session) => (
          <button type="button" key={session.chat_session_id} className={`chat-inbox-item ${activeSession?.chat_session_id === session.chat_session_id ? 'active' : ''}`} onClick={() => setActiveChatId(session.chat_session_id)}>
            <span className="chat-inbox-item-top"><strong>{session.patientName}</strong>{session.unreadCount > 0 && <span className="chat-unread-count">{session.unreadCount}</span>}</span>
            <span>{session.preview || session.subject || 'Private conversation'}</span>
            <small>{session.status || 'Open'}</small>
          </button>
        )) : <p className="empty-records">No assigned patient conversations yet.</p>}
      </div>
      {activeSession ? <div className="chat-inbox-thread">
        <header className="chat-inbox-header">
          <div><h2>{activeSession.patientName}</h2><p>{activeSession.subject || 'Private support conversation'}</p></div>
          <label>Conversation status<select aria-label="Conversation status" value={activeSession.status || 'Open'} onChange={(event) => setConversationStatus(event.target.value)}><option>Open</option><option>Pending</option><option>Closed</option><option>Resolved</option></select></label>
        </header>
        <div className="message-list">
          {activeSession.messages.length ? activeSession.messages.map((message) => {
            const fromWorker = message.sender_role === 'worker';
            return <div className={`message-row ${fromWorker ? 'from-you' : ''}`} key={message.message_id}>
              <div className="message-bubble"><p>{message.message_text}</p><time>{formatDateTime(message.sent_at)}{fromWorker ? ` · ${message.is_read ? 'Read' : 'Sent'}` : ''}</time></div>
            </div>;
          }) : <p className="empty-records">No messages yet. Send a reply to start the conversation.</p>}
        </div>
        {error && <p className="form-error chat-error" role="alert">{error}</p>}
        <form className="message-compose" onSubmit={sendMessage}>
          <input disabled={!chatEnabled} aria-label="Reply to patient" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={chatEnabled ? 'Write a private reply...' : 'Chat support is currently offline'} />
          <button disabled={!chatEnabled || !draft.trim()} className="primary-button" type="submit">Reply <span>↗</span></button>
        </form>
      </div> : <div className="chat-inbox-empty"><p>Select a conversation to view messages.</p></div>}
    </section>
  );
}
function DashboardTile({ label, value, detail }) { return <article className="dashboard-tile"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function PagePanel({ eyebrow, title, children }) { return <><p className="eyebrow"><span className="pulse-dot" /> {eyebrow}</p><h1>{title}</h1><div className="patient-panel-content">{children}</div></>; }
function RecordList({ items, empty, render }) { return <div className="record-list">{items.length ? items.map((item, index) => <article key={item.appointment_id || item.request_id || item.user_id || item.id || index}>{render(item)}</article>) : <p className="empty-records">{empty}</p>}</div>; }
function confirmDeleteAction(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}

function RecordActions({ onEdit, onDelete }) { return <div className="record-actions"><button onClick={onEdit}>Edit</button><button onClick={() => confirmDeleteAction('Are you sure you want to delete this record?', onDelete)}>Delete</button></div>; }
function SupportGroup({ name, detail }) { return <article className="support-group"><div><h2>{name}</h2><p>{detail}</p></div><button className="card-link">Join group <span>↗</span></button></article>; }
function PatientForm({ data, onClose, onSave }) {
  const [record, setRecord] = useState(data);
  const fields = record.type === 'profile'
    ? [['name', 'Full name', 'text', 'Your full name'], ['email', 'Email address', 'email', 'you@example.com'], ['phone', 'Contact number', 'tel', 'Your contact number']]
    : record.type === 'appointment'
      ? [['date', 'Date', 'date', 'YYYY-MM-DD'], ['time', 'Time', 'text', 'e.g. 10:00 AM'], ['appointmentType', 'Appointment type', 'text', 'HIV care consultation']]
      : record.type === 'medication'
        ? [['name', 'Medication name', 'text', 'e.g. Antiretroviral therapy'], ['dosage', 'Dosage', 'text', 'e.g. 1 tablet daily'], ['schedule', 'Schedule', 'text', 'e.g. Daily at bedtime']]
        : record.type === 'worker-patient'
          ? [['name', 'Patient name', 'text', 'Patient full name'], ['detail', 'Care details', 'text', 'Care plan details']]
          : [['subject', 'Subject', 'text', 'Subject'], ['preview', 'Message', 'text', 'Write a message...']];

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="patient-form" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close form">×</button>
        <p className="eyebrow">{record.id || record.appointment_id || record.request_id ? 'Edit record' : 'New record'}</p>
        <h2>{record.type === 'appointment' ? 'Book appointment' : record.type === 'medication' ? 'Request medication' : record.type === 'chat' ? 'Start private chat' : record.type === 'worker-patient' ? 'Patient details' : 'Edit profile'}</h2>
        <form onSubmit={(event) => { event.preventDefault(); onSave(record); }}>
          {fields.map(([key, label, type = 'text', placeholder = '']) => (
            <label key={key}>
              {label}
              <input
                required={key !== 'phone'}
                type={type}
                value={record[key] || ''}
                placeholder={placeholder}
                onChange={(event) => setRecord({ ...record, [key]: event.target.value })}
              />
            </label>
          ))}
          <button className="primary-button" type="submit">Save record <span>↗</span></button>
        </form>
      </div>
    </div>
  );
}

function AdminConfirmDeleteModal({ title, message, onConfirm, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="patient-form" style={{ maxWidth: '440px' }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close dialog">×</button>
        <p className="eyebrow">Confirm Action</p>
        <h2 style={{ fontSize: '32px', marginBottom: '14px' }}>{title || 'Delete Record'}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={onConfirm}>Confirm Delete <span>↗</span></button>
        </div>
      </div>
    </div>
  );
}

function AdminUserDetailModal({ user, onClose, onEdit, onDelete, canDelete = true }) {
  const [activeTab, setActiveTab] = useState('services');
  const freshUser = db.getUsersListDetailed().find((u) => u.userId === (user.userId || user.id)) || user;
  const servicesAvailed = db.getUserServicesAvailed(freshUser.userId || freshUser.id);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="detail-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close inspection">×</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <p className="eyebrow" style={{ margin: 0 }}>User Profile & Care History</p>
          <StatusBadge status={user.accountStatus} label={`Account: ${user.accountStatus}`} />
          <StatusBadge status={user.careStatus} label={`Care: ${user.careStatus}`} />
        </div>
        <h2 style={{ fontSize: '38px', margin: '8px 0 4px' }}>{user.fullName}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>{user.email} · Registered {formatDateTime(user.registeredAt, 'Not recorded')}</p>

        <div className="modal-tabs">
          <button type="button" className={`modal-tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
            Services Availed ({servicesAvailed.totalCount})
          </button>
          <button type="button" className={`modal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Personal & Demographics
          </button>
          <button type="button" className={`modal-tab-btn ${activeTab === 'clinical' ? 'active' : ''}`} onClick={() => setActiveTab('clinical')}>
            Clinical & Notes
          </button>
        </div>

        {activeTab === 'services' && (
          <ServicesAvailedView servicesAvailed={servicesAvailed} emptyMessage="This user has not availed any platform services yet." />
        )}

        {activeTab === 'overview' && (
          <div className="admin-entity-details-grid" style={{ border: 0, padding: 0 }}>
            <div className="admin-detail-item"><span className="admin-detail-label">Full Name</span><strong className="admin-detail-value">{user.fullName}</strong></div>
            <div className="admin-detail-item"><span className="admin-detail-label">Email Address</span><strong className="admin-detail-value">{user.email}</strong></div>
            <div className="admin-detail-item"><span className="admin-detail-label">Contact Phone</span><strong className="admin-detail-value">{user.contactNumber}</strong></div>
            <div className="admin-detail-item"><span className="admin-detail-label">Age</span><strong className="admin-detail-value">{user.age} years old</strong></div>
            <div className="admin-detail-item"><span className="admin-detail-label">Date of Birth</span><strong className="admin-detail-value">{user.dateOfBirth}</strong></div>
            <div className="admin-detail-item"><span className="admin-detail-label">Gender</span><strong className="admin-detail-value">{user.gender}</strong></div>
            <div className="admin-detail-item"><span className="admin-detail-label">Account Status</span><div><StatusBadge status={user.accountStatus} /></div></div>
            <div className="admin-detail-item"><span className="admin-detail-label">Care Plan Status</span><div><StatusBadge status={user.careStatus} /></div></div>
          </div>
        )}

        {activeTab === 'clinical' && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div className="admin-entity-details-grid" style={{ border: 0, padding: 0 }}>
              <div className="admin-detail-item"><span className="admin-detail-label">Preferred Facility</span><strong className="admin-detail-value">{user.preferredFacilityName}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Assigned Health Worker</span><strong className="admin-detail-value">{user.assignedWorkerName}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Emergency Contact</span><strong className="admin-detail-value">{user.emergencyContact}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Emergency Phone</span><strong className="admin-detail-value">{user.emergencyPhone}</strong></div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '16px 18px' }}>
              <span className="admin-detail-label" style={{ display: 'block', marginBottom: '6px' }}>Clinical / Medical Notes</span>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{user.medicalNotes}</p>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line)', marginTop: '28px', paddingTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {canDelete && <button type="button" className="admin-btn admin-btn-danger" onClick={() => onDelete(user.userId, user.fullName)}>Delete User</button>}
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => onEdit(user)}>Edit User Profile <span>↗</span></button>
        </div>
      </div>
    </div>
  );
}

function AdminHealthWorkerDetailModal({ worker, onClose, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="detail-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close inspection">×</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <p className="eyebrow" style={{ margin: 0 }}>Health Worker Profile</p>
          <StatusBadge status={worker.availabilityStatus} />
          <StatusBadge status={worker.verificationStatus} />
          <StatusBadge status={worker.accountStatus} />
        </div>
        <h2 style={{ fontSize: '38px', margin: '8px 0 4px' }}>{worker.fullName}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>{worker.specialty} · {worker.primaryFacilityName}</p>

        <div className="modal-tabs">
          <button type="button" className={`modal-tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            Worker Profile & Facility
          </button>
          <button type="button" className={`modal-tab-btn ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
            Assigned Patients ({worker.assignedPatientsCount})
          </button>
        </div>

        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div className="admin-entity-details-grid" style={{ border: 0, padding: 0 }}>
              <div className="admin-detail-item"><span className="admin-detail-label">Full Name</span><strong className="admin-detail-value">{worker.fullName}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Email Address</span><strong className="admin-detail-value">{worker.email}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Contact Phone</span><strong className="admin-detail-value">{worker.contactNumber}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Specialty</span><strong className="admin-detail-value">{worker.specialty}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">License Number</span><strong className="admin-detail-value">{worker.licenseNumber}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Primary Facility</span><strong className="admin-detail-value">{worker.primaryFacilityName}</strong></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Availability</span><div><StatusBadge status={worker.availabilityStatus} /></div></div>
              <div className="admin-detail-item"><span className="admin-detail-label">Verification</span><div><StatusBadge status={worker.verificationStatus} /></div></div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '16px 18px' }}>
              <span className="admin-detail-label" style={{ display: 'block', marginBottom: '6px' }}>Bio / Summary</span>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{worker.bioSummary}</p>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {worker.assignedPatients && worker.assignedPatients.length ? (
              worker.assignedPatients.map((p) => (
                <div key={p.patientId} style={{ background: '#fff', border: '1px solid var(--line)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{p.name}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '12px', display: 'block' }}>Patient ID: #{p.patientId}</span>
                  </div>
                  <StatusBadge status={p.careStatus} />
                </div>
              ))
            ) : (
              <p className="empty-records">No patients currently assigned to this health worker.</p>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line)', marginTop: '28px', paddingTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button type="button" className="admin-btn admin-btn-danger" onClick={() => onDelete(worker.workerId, worker.fullName)}>Delete Health Worker</button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => onEdit(worker)}>Edit Worker Profile <span>↗</span></button>
        </div>
      </div>
    </div>
  );
}

function AdminUserFormModal({ user, onClose, onSave }) {
  const isEdit = Boolean(user?.userId || user?.id);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.full_name || '',
    email: user?.email || '',
    password: '',
    contactNumber: user?.contactNumber || user?.phone || user?.contact_number || '',
    age: user?.age || '',
    dateOfBirth: user?.dateOfBirth || user?.date_of_birth || '',
    gender: user?.gender || 'Woman',
    careStatus: user?.careStatus || 'Active care plan',
    preferredFacilityId: user?.preferredFacilityId || 1,
    assignedWorkerId: user?.assignedWorkerId || '',
    emergencyContact: user?.emergencyContact || '',
    emergencyPhone: user?.emergencyPhone || '',
    medicalNotes: user?.medicalNotes || '',
    isActive: user?.accountStatus !== 'Inactive',
  });
  const [error, setError] = useState('');

  const facilities = db.getTable('TestingFacilities');
  const workers = db.getTable('HealthWorkers').map((w) => {
    const u = db.findById('Users', w.user_id);
    return { id: w.worker_id, name: u?.full_name || `Worker #${w.worker_id}` };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Please provide full name and email.');
      return;
    }
    if (!isEdit && !formData.password.trim()) {
      setError('Password is required when creating a new user.');
      return;
    }

    if (isEdit) {
      const pending = db.adminUpdateUser(user.userId || user.id, formData);
      const result = db.useApi ? await pending : pending;
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const pending = db.adminCreateUser(formData);
      const result = db.useApi ? await pending : pending;
      if (result.error) {
        setError(result.error);
        return;
      }
    }
    onSave();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="patient-form" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close form">×</button>
        <p className="eyebrow">{isEdit ? 'Edit User Record' : 'Create New User / Patient'}</p>
        <h2>{isEdit ? 'Update user' : 'Add new user'}</h2>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Full Name
            <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full name" />
          </label>
          <label>Email Address
            <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@example.com" />
          </label>
          {!isEdit && (
            <label>Password
              <input required minLength={12} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Create password" />
            </label>
          )}
          <div className="field-row">
            <label>Age
              <input type="number" min="13" max="120" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Age" />
            </label>
            <label>Date of Birth
              <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
            </label>
          </div>
          <div className="field-row">
            <label>Gender
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option>Woman</option>
                <option>Man</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
                <option>Self-describe</option>
              </select>
            </label>
            <label>Contact Phone
              <input type="tel" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} placeholder="+63 900 000 0000" />
            </label>
          </div>
          <div className="field-row">
            <label>Care Status
              <select value={formData.careStatus} onChange={(e) => setFormData({ ...formData, careStatus: e.target.value })}>
                <option value="Active care plan">Active care plan</option>
                <option value="Stable">Stable</option>
                <option value="New referral">New referral</option>
                <option value="Needs follow-up">Needs follow-up</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label>Account Status
              <select value={formData.isActive ? 'Active' : 'Inactive'} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="field-row">
            <label>Preferred Facility
              <select value={formData.preferredFacilityId} onChange={(e) => setFormData({ ...formData, preferredFacilityId: e.target.value })}>
                {facilities.map((f) => <option key={f.facility_id} value={f.facility_id}>{f.name}</option>)}
              </select>
            </label>
            <label>Assigned Health Worker
              <select value={formData.assignedWorkerId} onChange={(e) => setFormData({ ...formData, assignedWorkerId: e.target.value })}>
                <option value="">Unassigned</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
          </div>
          <div className="field-row">
            <label>Emergency Contact
              <input type="text" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} placeholder="Contact person" />
            </label>
            <label>Emergency Phone
              <input type="tel" value={formData.emergencyPhone} onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })} placeholder="Emergency phone" />
            </label>
          </div>
          <label>Medical & Care Notes
            <textarea rows="3" value={formData.medicalNotes} onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })} placeholder="Medical notes, care plan details..." style={{ width: '100%', background: '#fffaf0', border: '1px solid var(--line)', padding: '10px', color: 'var(--ink)' }} />
          </label>
          <button className="primary-button" type="submit" style={{ marginTop: '14px' }}>Save User Record <span>↗</span></button>
        </form>
      </div>
    </div>
  );
}

function AdminHealthWorkerFormModal({ worker, onClose, onSave }) {
  const isEdit = Boolean(worker?.workerId || worker?.id);
  const [formData, setFormData] = useState({
    fullName: worker?.fullName || worker?.name || '',
    email: worker?.email || '',
    password: '',
    contactNumber: worker?.contactNumber || worker?.phone || '',
    specialty: worker?.specialty || (isEdit ? 'HIV care support' : ''),
    licenseNumber: worker?.licenseNumber || '',
    primaryFacilityId: worker?.primaryFacilityId || 1,
    verificationStatus: worker?.verificationStatus || (worker?.isVerified ? 'Verified' : 'Pending Verification'),
    availabilityStatus: worker?.availabilityStatus || (worker?.isAvailable ? 'Available' : 'On Leave'),
    bioSummary: worker?.bioSummary || '',
    isActive: worker?.accountStatus !== 'Inactive',
  });
  const [error, setError] = useState('');

  const facilities = db.getTable('TestingFacilities');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Please provide full name and email.');
      return;
    }
    if (!isEdit && !formData.password.trim()) {
      setError('Password is required when creating a new health worker.');
      return;
    }

    const payload = {
      ...formData,
      isVerified: formData.verificationStatus === 'Verified',
      isAvailable: formData.availabilityStatus === 'Available',
    };

    if (isEdit) {
      const pending = db.adminUpdateHealthWorker(worker.workerId || worker.id, payload);
      const result = db.useApi ? await pending : pending;
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const pending = db.adminCreateHealthWorker(payload);
      const result = db.useApi ? await pending : pending;
      if (result.error) {
        setError(result.error);
        return;
      }
    }
    onSave();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="patient-form" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close form">×</button>
        <p className="eyebrow">{isEdit ? 'Edit Health Worker Record' : 'Add New Health Worker'}</p>
        <h2>{isEdit ? 'Update worker' : 'Add health worker'}</h2>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Full Name
            <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full name" />
          </label>
          <label>Email Address
            <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="worker@risinghiv.org" />
          </label>
          {!isEdit && (
            <label>Password
              <input required minLength={12} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Create password" />
            </label>
          )}
          <div className="field-row">
            <label>Specialty
              <input required type="text" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} placeholder="e.g. HIV Care Specialist" />
            </label>
            <label>License Number
              <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="e.g. PRC-0098765" />
            </label>
          </div>
          <div className="field-row">
            <label>Primary Facility
              <select value={formData.primaryFacilityId} onChange={(e) => setFormData({ ...formData, primaryFacilityId: e.target.value })}>
                {facilities.map((f) => <option key={f.facility_id} value={f.facility_id}>{f.name}</option>)}
              </select>
            </label>
            <label>Contact Phone
              <input type="tel" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} placeholder="+63 900 000 0000" />
            </label>
          </div>
          <div className="field-row">
            <label>Availability Status
              <select value={formData.availabilityStatus} onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="On Leave">On Leave</option>
                <option value="Offline">Offline</option>
              </select>
            </label>
            <label>Verification Status
              <select value={formData.verificationStatus} onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}>
                <option value="Verified">Verified</option>
                <option value="Pending Verification">Pending Verification</option>
              </select>
            </label>
          </div>
          <label>Account Status
            <select value={formData.isActive ? 'Active' : 'Inactive'} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <label>Bio & Clinical Experience
            <textarea rows="3" value={formData.bioSummary} onChange={(e) => setFormData({ ...formData, bioSummary: e.target.value })} placeholder="Professional bio, clinical experience..." style={{ width: '100%', background: '#fffaf0', border: '1px solid var(--line)', padding: '10px', color: 'var(--ink)' }} />
          </label>
          <button className="primary-button" type="submit" style={{ marginTop: '14px' }}>Save Health Worker <span>↗</span></button>
        </form>
      </div>
    </div>
  );
}

function AdminServiceFormModal({ service, onClose, onSave }) {
  const isEdit = Boolean(service?.id);
  const [formData, setFormData] = useState({
    name: service?.name || '',
    service_key: service?.service_key || '',
    detail: service?.detail || '',
    is_enabled: service ? Boolean(service.enabled ?? service.is_enabled) : true,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Service name is required.');
      return;
    }
    if (isEdit) {
      const pending = db.adminUpdateService(service.id, formData);
      if (db.useApi) await pending;
    } else {
      const pending = db.adminCreateService(formData);
      if (db.useApi) await pending;
    }
    onSave();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="patient-form" style={{ maxWidth: '520px' }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close form">×</button>
        <p className="eyebrow">{isEdit ? 'Edit Platform Service' : 'Add Platform Service'}</p>
        <h2>{isEdit ? 'Update service' : 'New service'}</h2>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Service Name
            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Online Prescription Refills" />
          </label>
          <label>Service Key
            <input type="text" value={formData.service_key} onChange={(e) => setFormData({ ...formData, service_key: e.target.value })} placeholder="e.g. online_refills" />
          </label>
          <label>Description / Details
            <textarea rows="3" value={formData.detail} onChange={(e) => setFormData({ ...formData, detail: e.target.value })} placeholder="Describe what this service offers..." style={{ width: '100%', background: '#fffaf0', border: '1px solid var(--line)', padding: '10px', color: 'var(--ink)' }} />
          </label>
          <label className="consent" style={{ marginTop: '10px' }}>
            <input type="checkbox" checked={formData.is_enabled} onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })} />
            <span>Enable this service immediately for patients</span>
          </label>
          <button className="primary-button" type="submit" style={{ marginTop: '16px' }}>Save Platform Service <span>↗</span></button>
        </form>
      </div>
    </div>
  );
}

function RoleDashboard({ role, onPublicHub }) {
  const dashboards = {
    patient: { label: 'Patient / User space', title: <>Your care,<br /><i>your pace.</i></>, intro: 'Keep your resources, questions, and support options close at hand.', cards: [['My care plan', 'View appointments, treatment notes, and personal health milestones.'], ['Private support', 'Connect with a trained support person whenever you need guidance.'], ['Saved resources', 'Return to the HIV information that matters most to you.']] },
    'health-worker': { label: 'Health Worker workspace', title: <>Care that<br /><i>connects.</i></>, intro: 'Support patients with trusted information, referrals, and follow-up care.', cards: [['Patient support', 'Review assigned conversations and respond to care requests.'], ['Resource library', 'Share accurate, stigma-free HIV education with your patients.'], ['Referral follow-up', 'Track referrals and make sure no one loses their next step.']] },
    admin: { label: 'Admin workspace', title: <>Build a<br /><i>safer system.</i></>, intro: 'Keep the platform, people, and support network working well together.', cards: [['Platform overview', 'Monitor activity, service availability, and support response times.'], ['User management', 'Manage patient and health worker access with care and accountability.'], ['Reports & insights', 'Review anonymized trends to improve community support.']] },
  };
  const dashboard = dashboards[role];

  return <div className="dashboard-shell"><header className="dashboard-header"><a className="brand" href="#dashboard"><span>HIVeLink</span></a><span className="role-badge">{dashboard.label}</span><button className="header-action" onClick={onPublicHub}>Public awareness hub <span>↗</span></button></header><main className="dashboard-main" id="dashboard"><p className="eyebrow"><span className="pulse-dot" /> Secure workspace</p><h1>{dashboard.title}</h1><p className="dashboard-intro">{dashboard.intro}</p><div className="dashboard-cards">{dashboard.cards.map(([title, text], index) => <article className="dashboard-card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p><button className="card-link">Open workspace <span>↗</span></button></article>)}</div></main></div>;
}

function HealthWorkerDashboard({ currentUser, currentWorker, onPublicHub, onSignOut }) {
  const [, setDbVersion] = useState(0);
  const [page, setPage] = useState('overview');
  const [patientEditor, setPatientEditor] = useState(null);
  const [inspectingUser, setInspectingUser] = useState(null);

  useEffect(() => {
    return db.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  const workerUser = currentUser || { full_name: 'Health Worker' };
  const profileName = workerUser.full_name || 'Health Worker';
  const workerRecord = currentWorker || db.getTable('HealthWorkers').find((w) => w.user_id === currentUser?.user_id) || db.getTable('HealthWorkers')[0] || { worker_id: 1, is_available: true, specialty: 'HIV care support' };

  const allPatients = db.getUsersListDetailed();
  const workerPatients = allPatients;

  const requests = db.getTable('MedicationRequests').map((r) => {
    const p = db.findById('Patients', r.patient_id);
    const u = p ? db.findById('Users', p.user_id) : null;
    return {
      id: r.request_id,
      patient: u?.full_name || 'Patient',
      medication: r.medication_name,
      status: r.status,
      dosage: r.dosage,
      schedule: r.schedule,
    };
  });

  const appointments = db.getTable('Appointments').map((a) => {
    const p = db.findById('Patients', a.patient_id);
    const u = p ? db.findById('Users', p.user_id) : null;
    const facility = a.facility_id ? db.findById('TestingFacilities', a.facility_id) : null;
    return {
      id: a.appointment_id,
      patient: u?.full_name || 'Patient',
      date: a.appointment_date,
      time: a.appointment_time,
      type: a.appointment_type,
      facilityName: facility?.name || 'Local Health Facility',
      status: a.status || 'Confirmed',
    };
  });

  const groups = db.getTable('SupportGroups').map((g) => ({
    id: g.group_id,
    name: g.name,
    members: g.member_count || 0,
    schedule: g.schedule,
  }));

  const navigate = (nextPage) => { setPage(nextPage); scrollPageToTop(); };
  const updateRequest = (id, status) => db.update('MedicationRequests', id, { status });
  const updateAppointment = (id, status) => db.update('Appointments', id, { status });
  const removeGroup = (id) => confirmDeleteAction('Are you sure you want to remove this support group?', () => db.delete('SupportGroups', id));
  const savePatient = (patient) => {
    if (patient.id || patient.patient_id || patient.userId) {
      const pid = patient.patient_id || patient.id;
      db.update('Patients', pid, { care_status: patient.status || patient.careStatus || 'Stable', medical_notes: patient.detail || patient.medicalNotes });
      if (patient.user_id || patient.userId) db.update('Users', patient.user_id || patient.userId, { full_name: patient.name || patient.fullName });
    } else if (!db.useApi) {
      db.adminCreateUser({ fullName: patient.name || 'New Patient', email: `patient.${Date.now()}@example.com`, careStatus: patient.status || 'Active care plan' });
    }
    setPatientEditor(null);
  };

  const toggleAvailability = () => {
    if (workerRecord.worker_id) {
      db.update('HealthWorkers', workerRecord.worker_id, { is_available: !workerRecord.is_available });
    }
  };

  const latestMessage = db.getTable('ChatMessages').filter((m) => m.sender_role === 'patient').at(-1)?.message_text || '';

  const content = {
    overview: <><p className="eyebrow"><span className="pulse-dot" /> Health worker overview</p><h1>Care that<br /><i>connects.</i></h1><p className="dashboard-intro">Support patients with trusted information, treatment follow-up, and compassionate care.</p><div className="dashboard-tiles worker-tiles"><DashboardTile label="Patients needing care" value={`${workerPatients.length} active`} detail="View patient support" /><DashboardTile label="Medication requests" value={`${requests.filter((r) => r.status === 'Pending').length} pending`} detail="Review requests" /><DashboardTile label="Today’s appointments" value={`${appointments.length} scheduled`} detail="Open schedule" /><DashboardTile label="Support groups" value={`${groups.length} managed`} detail="Manage groups" /></div><h2 className="quick-heading">Quick actions</h2><div className="care-grid"><PatientAction title="Open patient chats" text="Respond to confidential patient questions." action={() => navigate('chat')} /><PatientAction title="Review medication" text="Process medication requests and updates." action={() => navigate('medications')} /><PatientAction title="Manage appointments" text="Confirm and organize patient visits." action={() => navigate('appointments')} /></div></>,
    chat: <PagePanel eyebrow="Private patient support" title={<>Conversation<br /><i>inbox.</i></>}><HealthWorkerChatInbox userId={workerUser.user_id} /></PagePanel>,
    patientsChats: <PagePanel eyebrow="Patient care and private support" title={<>Patients and<br /><i>chats.</i></>}><div className="worker-list">{workerPatients.map((patient) => <article key={patient.userId || patient.id}><div><strong>{patient.fullName || patient.name}</strong><span>{patient.email} · {patient.medicalNotes || patient.detail}{patient.userId === 1 && latestMessage ? ` · “${latestMessage}”` : ''} · <strong style={{ color: 'var(--coral)', fontWeight: 400 }}>{patient.servicesAvailedCount || 0} services availed</strong></span></div><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><StatusBadge status={patient.careStatus || patient.status} /><StatusBadge status={patient.accountStatus || 'Active'} /></div><div className="worker-actions"><button type="button" className="card-link" onClick={() => setInspectingUser(patient)}>View Services ↗</button><button className="card-link" onClick={() => setPatientEditor({ type: 'worker-patient', ...patient, id: patient.patientId, user_id: patient.userId, name: patient.fullName })}>Edit</button></div></article>)}</div>{db.useApi && <p className="admin-note">Patients create their own accounts; assigned patients appear here for care management.</p>}</PagePanel>,
    medications: <PagePanel eyebrow="Treatment support" title={<>Medication<br /><i>requests.</i></>}><div className="worker-list">{requests.map((request) => <article key={request.id}><div><strong>{request.medication}</strong><span>Requested by {request.patient} · {request.dosage} · {request.schedule}</span></div><StatusBadge status={request.status} /><div className="worker-actions"><button className="card-link" onClick={() => updateRequest(request.id, 'Approved')}>Approve</button><button className="card-link" onClick={() => updateRequest(request.id, 'Needs information')}>Request info</button></div></article>)}</div></PagePanel>,
    appointments: <PagePanel eyebrow="Care schedule" title={<>Manage<br /><i>appointments.</i></>}><div className="worker-list">{appointments.map((appointment) => <article key={appointment.id}><div><strong>{appointment.patient}</strong><span>{appointment.date} · {appointment.time} · {appointment.type} ({appointment.facilityName})</span></div><StatusBadge status={appointment.status} /><div className="worker-actions"><button className="card-link" onClick={() => updateAppointment(appointment.id, 'Completed')}>Mark Completed</button><button className="card-link" onClick={() => updateAppointment(appointment.id, 'Cancelled')}>Cancel</button></div></article>)}</div></PagePanel>,
    groups: <PagePanel eyebrow="Community care" title={<>Support<br /><i>groups.</i></>}><button className="primary-button panel-action" onClick={() => db.insert('SupportGroups', { name: 'New support group', detail: 'Community peer circle', schedule: 'Set a schedule', member_count: 0, is_active: true })}>Create group <span>+</span></button><div className="worker-list">{groups.map((group) => <article key={group.id}><div><strong>{group.name}</strong><span>{group.members} members · {group.schedule}</span></div><button className="card-link">Edit <span>↗</span></button><button className="record-delete" onClick={() => removeGroup(group.id)}>Remove</button></article>)}</div></PagePanel>,
  };

  return (
    <div className="patient-shell">
      <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
      <header className="site-header guest-header patient-header">
        <button className="brand brand-button" onClick={() => navigate('overview')} aria-label="HIVeLink home"><span>HIVeLink</span></button>
        <nav className="nav-links worker-nav" aria-label="Health worker navigation">{[['patientsChats', 'Patients'], ['chat', 'Chats'], ['appointments', 'Appointments'], ['medications', 'Medications'], ['groups', 'Groups']].map(([key, label]) => <button className={`guest-nav-link ${page === key ? 'active' : ''}`} key={key} onClick={() => navigate(key)}>{label}</button>)}</nav>
        <div className="patient-header-actions">
          <StatusBadge status={workerRecord.is_available ? 'Available' : 'On Leave'} />
          <button type="button" className="text-button" style={{ fontSize: '10px' }} onClick={toggleAvailability}>Toggle {workerRecord.is_available ? 'On Leave' : 'Available'}</button>
          <span className="profile-name">{profileName}</span>
          <button className={`profile-icon ${page === 'overview' ? 'active' : ''}`} type="button" aria-label={`Open ${profileName}'s overview`} aria-current={page === 'overview' ? 'page' : undefined} title="Open overview" onClick={() => navigate('overview')}><CircleUser aria-hidden="true" className="profile-icon-glyph" color="currentColor" size={18} strokeWidth={1.6} /></button>
          <button className="sign-out-button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>
      <main key={page} className="patient-main route-transition">{content[page]}</main>
      <footer><span className="footer-brand">HIVeLink</span><button className="patient-public-link" onClick={onPublicHub}>Public awareness hub ↗</button><button className="footer-back" onClick={() => navigate('overview')}>Back to top ↑</button></footer>
      {patientEditor && <PatientForm data={patientEditor} onClose={() => setPatientEditor(null)} onSave={savePatient} />}
      {inspectingUser && <AdminUserDetailModal user={inspectingUser} canDelete={false} onClose={() => setInspectingUser(null)} onEdit={(u) => { setInspectingUser(null); setPatientEditor({ type: 'worker-patient', ...u, id: u.patientId, user_id: u.userId, name: u.fullName }); }} />}
    </div>
  );
}

function AdminEmailModal({ user, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSending(true);
    const result = await db.sendAccountEmail(user.userId, subject, message);
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="patient-form email-compose-modal" role="dialog" aria-modal="true" aria-labelledby="email-compose-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close email composer">×</button>
        {sent ? <>
          <p className="eyebrow">Message sent</p>
          <h2 id="email-compose-title">Email delivered</h2>
          <p>A message was sent to {user.email}.</p>
          <button className="primary-button" type="button" onClick={onClose}>Done</button>
        </> : <>
          <p className="eyebrow">Registered account</p>
          <h2 id="email-compose-title">Email {user.fullName}</h2>
          <p className="email-recipient">To: {user.email}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <form onSubmit={handleSubmit}>
            <label>Subject<input required maxLength="160" value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
            <label>Message<textarea required maxLength="5000" rows="7" value={message} onChange={(event) => setMessage(event.target.value)} /></label>
            <button className="primary-button" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send email'} <span>↗</span></button>
          </form>
        </>}
      </section>
    </div>
  );
}

function AdminDashboard({ onPublicHub, onSignOut }) {
  const [, setDbVersion] = useState(0);
  const [page, setPage] = useState('overview');
  const [activeModal, setActiveModal] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userCareFilter, setUserCareFilter] = useState('all');
  const [userAccountFilter, setUserAccountFilter] = useState('all');
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerAvailabilityFilter, setWorkerAvailabilityFilter] = useState('all');
  const [workerVerificationFilter, setWorkerVerificationFilter] = useState('all');
  const [verificationNotice, setVerificationNotice] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  const detailedUsers = db.getUsersListDetailed();
  const detailedWorkers = db.getHealthWorkersListDetailed();

  const services = db.getTable('PlatformServices').map((s) => ({
    id: s.service_id,
    name: s.name,
    service_key: s.service_key,
    detail: s.detail,
    enabled: Boolean(s.is_enabled),
  }));

  const logs = db.getTable('ActivityLogs').map((l) => ({
    id: l.log_id,
    action: l.action,
    actor: l.actor_name,
    time: formatDateTime(l.created_at, 'Not recorded'),
  }));

  const navigate = (nextPage) => { setPage(nextPage); scrollPageToTop(); };
  const toggleService = (id) => {
    const target = db.findById('PlatformServices', id);
    if (target) db.update('PlatformServices', id, { is_enabled: !target.is_enabled });
  };
  const removeUser = (id) => db.adminDeleteUser(id);
  const removeWorker = (id) => db.adminDeleteHealthWorker(id);
  const addUser = () => setActiveModal({ type: 'create-user' });
  const addWorker = () => setActiveModal({ type: 'create-worker' });
  const resendUserVerification = async (userId) => {
    const result = await db.resendVerificationForUser(userId);
    setVerificationNotice(result.error || result.message || 'Verification email sent.');
  };

  const appointmentsCount = db.getTable('Appointments').length;
  const openChatsCount = db.getTable('ChatSessions').filter((c) => c.status === 'Open').length;

  const filteredUsers = detailedUsers.filter((u) => {
    const matchesSearch = !userSearch.trim() || u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesCare = userCareFilter === 'all' || u.careStatus === userCareFilter;
    const matchesAccount = userAccountFilter === 'all' || u.accountStatus === userAccountFilter;
    return matchesSearch && matchesCare && matchesAccount;
  });

  const filteredWorkers = detailedWorkers.filter((w) => {
    const matchesSearch = !workerSearch.trim() || w.fullName.toLowerCase().includes(workerSearch.toLowerCase()) || w.email.toLowerCase().includes(workerSearch.toLowerCase()) || w.specialty.toLowerCase().includes(workerSearch.toLowerCase());
    const matchesAvailability = workerAvailabilityFilter === 'all' || w.availabilityStatus === workerAvailabilityFilter;
    const matchesVerification = workerVerificationFilter === 'all' || w.verificationStatus === workerVerificationFilter;
    return matchesSearch && matchesAvailability && matchesVerification;
  });

  const content = {
    overview: <><p className="eyebrow"><span className="pulse-dot" /> Admin overview</p><h1>Keep care<br /><i>connected.</i></h1><p className="dashboard-intro">Monitor the HIVeLink platform, its people, services, and support activity.</p><div className="dashboard-tiles admin-tiles"><DashboardTile label="Total users" value={detailedUsers.length} detail="Registered patients" /><DashboardTile label="Health workers" value={detailedWorkers.length} detail="Active care team" /><DashboardTile label="Monthly appointments" value={appointmentsCount} detail="This month" /><DashboardTile label="Active chat sessions" value={openChatsCount} detail="Currently open" /></div><div className="admin-overview-grid"><section><h2>Platform activity</h2><div className="activity-bars"><span style={{ height: '0%' }} /><span style={{ height: '0%' }} /><span style={{ height: '0%' }} /><span style={{ height: '0%' }} /><span style={{ height: '0%' }} /><span style={{ height: '0%' }} /><span style={{ height: '0%' }} /></div><div className="activity-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></section><section><h2>Recent activity</h2><div className="recent-list">{logs.length ? logs.map((log) => <div key={log.id}><strong>{log.action}</strong><span>{log.actor} · {log.time}</span></div>) : <p className="empty-records">No recent activity.</p>}</div></section></div></>,
    users: (
      <PagePanel eyebrow="Account management" title={<>Registered<br /><i>users.</i></>}>
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <input className="admin-search-input" type="search" placeholder="Search patients by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
          </div>
          <div className="admin-filters">
            <select className="admin-filter-select" value={userCareFilter} onChange={(e) => setUserCareFilter(e.target.value)}>
              <option value="all">All Care Statuses</option>
              <option value="Active care plan">Active care plan</option>
              <option value="Stable">Stable</option>
              <option value="New referral">New referral</option>
              <option value="Needs follow-up">Needs follow-up</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select className="admin-filter-select" value={userAccountFilter} onChange={(e) => setUserAccountFilter(e.target.value)}>
              <option value="all">All Accounts</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button className="primary-button panel-action" style={{ margin: 0 }} onClick={addUser}>Add user <span>+</span></button>
          </div>
        </div>

        {filteredUsers.length ? (
          <div className="admin-list-wrap">
            {filteredUsers.map((user) => (
              <article className="admin-entity-card" key={user.userId}>
                <div className="admin-entity-header">
                  <div className="admin-entity-title-wrap">
                    <h3 className="admin-entity-title">{user.fullName}</h3>
                    <span className="admin-entity-subtitle">{user.email} · {user.contactNumber}</span>
                  </div>
                  <div className="admin-entity-badges">
                    <StatusBadge status={user.accountStatus} label={`Account: ${user.accountStatus}`} />
                    <StatusBadge status={user.emailVerified ? 'Verified' : 'Pending verification'} type={user.emailVerified ? 'success' : 'warning'} label={`Email: ${user.emailVerified ? 'Verified' : 'Pending verification'}`} />
                    <StatusBadge status={user.careStatus} label={`Care: ${user.careStatus}`} />
                  </div>
                </div>

                <div className="admin-entity-details-grid">
                  <div className="admin-detail-item"><span className="admin-detail-label">Demographics</span><span className="admin-detail-value">{user.age !== 'N/A' ? `${user.age} yrs` : 'Age N/A'} · {user.gender}</span></div>
                  <div className="admin-detail-item"><span className="admin-detail-label">Preferred Facility</span><span className="admin-detail-value">{user.preferredFacilityName}</span></div>
                  <div className="admin-detail-item"><span className="admin-detail-label">Assigned Worker</span><span className="admin-detail-value">{user.assignedWorkerName}</span></div>
                  <div className="admin-detail-item"><span className="admin-detail-label">Registered</span><span className="admin-detail-value">{formatDateTime(user.registeredAt, 'Not recorded')}</span></div>
                </div>

                <div className="admin-entity-footer">
                  <span className="admin-services-summary-pill">
                    <strong>{user.servicesAvailedCount}</strong> services availed ({user.servicesAvailed?.appointments?.length || 0} apts · {user.servicesAvailed?.medicationRequests?.length || 0} meds · {user.servicesAvailed?.chatSessions?.length || 0} chats · {user.servicesAvailed?.supportGroups?.length || 0} groups)
                  </span>
                  <div className="admin-card-actions">
                    <button type="button" className="admin-btn" onClick={() => setActiveModal({ type: 'view-user', user })}>View Details & Services ↗</button>
                    {db.useApi && <button type="button" className="admin-btn" onClick={() => setActiveModal({ type: 'email-user', user })}>Send email</button>}
                    {db.useApi && !user.emailVerified && <button type="button" className="admin-btn" onClick={() => resendUserVerification(user.userId)}>Resend verification</button>}
                    <button type="button" className="admin-btn" onClick={() => setActiveModal({ type: 'edit-user', user })}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger record-delete" onClick={() => setActiveModal({ type: 'confirm-delete', title: 'Delete User Account', message: `Are you sure you want to delete ${user.fullName} (${user.email})? All associated records will be permanently removed.`, onConfirm: () => { removeUser(user.userId); setActiveModal(null); } })}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-records">No registered users matching criteria.</p>
        )}
        {verificationNotice && <p className="form-status" role="status">{verificationNotice}</p>}
      </PagePanel>
    ),
    workers: (
      <PagePanel eyebrow="Care team management" title={<>Health<br /><i>workers.</i></>}>
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <input className="admin-search-input" type="search" placeholder="Search workers by name, specialty, or email..." value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} />
          </div>
          <div className="admin-filters">
            <select className="admin-filter-select" value={workerAvailabilityFilter} onChange={(e) => setWorkerAvailabilityFilter(e.target.value)}>
              <option value="all">All Availability</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="On Leave">On Leave</option>
              <option value="Offline">Offline</option>
            </select>
            <select className="admin-filter-select" value={workerVerificationFilter} onChange={(e) => setWorkerVerificationFilter(e.target.value)}>
              <option value="all">All Verification</option>
              <option value="Verified">Verified</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
            <button className="primary-button panel-action" style={{ margin: 0 }} onClick={addWorker}>Add health worker <span>+</span></button>
          </div>
        </div>

        {filteredWorkers.length ? (
          <div className="admin-list-wrap">
            {filteredWorkers.map((worker) => (
              <article className="admin-entity-card" key={worker.workerId}>
                <div className="admin-entity-header">
                  <div className="admin-entity-title-wrap">
                    <h3 className="admin-entity-title">{worker.fullName}</h3>
                    <span className="admin-entity-subtitle">{worker.specialty} · {worker.email}</span>
                  </div>
                  <div className="admin-entity-badges">
                    <StatusBadge status={worker.emailVerified ? 'Verified' : 'Pending verification'} type={worker.emailVerified ? 'success' : 'warning'} label={`Email: ${worker.emailVerified ? 'Verified' : 'Pending verification'}`} />
                    <StatusBadge status={worker.availabilityStatus} />
                    <StatusBadge status={worker.verificationStatus} />
                    <StatusBadge status={worker.accountStatus} />
                  </div>
                </div>

                <div className="admin-entity-details-grid">
                  <div className="admin-detail-item"><span className="admin-detail-label">Primary Facility</span><span className="admin-detail-value">{worker.primaryFacilityName}</span></div>
                  <div className="admin-detail-item"><span className="admin-detail-label">License Number</span><span className="admin-detail-value">{worker.licenseNumber}</span></div>
                  <div className="admin-detail-item"><span className="admin-detail-label">Contact Phone</span><span className="admin-detail-value">{worker.contactNumber}</span></div>
                  <div className="admin-detail-item"><span className="admin-detail-label">Active Workload</span><span className="admin-detail-value">{worker.assignedPatientsCount} patients · {worker.appointmentsCount} apts</span></div>
                </div>

                <div className="admin-entity-footer">
                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{worker.bioSummary}</span>
                  <div className="admin-card-actions">
                    <button type="button" className="admin-btn" onClick={() => setActiveModal({ type: 'view-worker', worker })}>View Details & Workload ↗</button>
                    {db.useApi && !worker.emailVerified && <button type="button" className="admin-btn" onClick={() => resendUserVerification(worker.userId)}>Resend verification</button>}
                    <button type="button" className="admin-btn" onClick={() => setActiveModal({ type: 'edit-worker', worker })}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-danger record-delete" onClick={() => setActiveModal({ type: 'confirm-delete', title: 'Delete Health Worker', message: `Are you sure you want to delete health worker ${worker.fullName}?`, onConfirm: () => { removeWorker(worker.workerId); setActiveModal(null); } })}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-records">No health workers matching criteria.</p>
        )}
      </PagePanel>
    ),
    services: (
      <PagePanel eyebrow="Platform controls" title={<>Available<br /><i>services.</i></>}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <p className="admin-note" style={{ margin: 0 }}>Turn services on or off for the platform. Patients will only see services marked available.</p>
          <button className="primary-button" onClick={() => setActiveModal({ type: 'create-service' })}>Add service <span>+</span></button>
        </div>
        <div className="service-list">
          {services.map((service) => (
            <article key={service.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '16px', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <strong>{service.name}</strong>
                  <StatusBadge status={service.enabled ? 'Available' : 'Unavailable'} />
                </div>
                <span>{service.detail} · <small style={{ color: 'var(--muted)' }}>key: {service.service_key}</small></span>
              </div>
              <button
                className={`service-toggle ${service.enabled ? 'enabled' : ''}`}
                aria-label={`${service.name} ${service.enabled ? 'available' : 'unavailable'}`}
                aria-pressed={service.enabled}
                onClick={() => toggleService(service.id)}
              >
                <span>{service.enabled ? 'Available' : 'Unavailable'}</span>
                <i />
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="admin-btn" onClick={() => setActiveModal({ type: 'edit-service', service })}>Edit</button>
                <button type="button" className="admin-btn admin-btn-danger" onClick={() => setActiveModal({ type: 'confirm-delete', title: 'Delete Platform Service', message: `Are you sure you want to delete platform service "${service.name}"?`, onConfirm: () => { db.adminDeleteService(service.id); setActiveModal(null); } })}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </PagePanel>
    ),
    logs: <PagePanel eyebrow="Audit trail" title={<>Activity<br /><i>logs.</i></>}><AdminList items={logs} render={(log) => <><div><strong>{log.action}</strong><span>{log.actor}</span></div><em>{log.time}</em></>} /></PagePanel>,
    reports: <PagePanel eyebrow="Platform insights" title={<>Reports and<br /><i>insights.</i></>}><div className="report-grid"><DashboardTile label="New registrations" value={detailedUsers.length} detail="Across all services" /><DashboardTile label="Completed referrals" value={0} detail="Across all services" /><DashboardTile label="Avg. response time" value={0} detail="Chat support" /><DashboardTile label="Service uptime" value={0} detail="Last 30 days" /></div><button className="primary-button" onClick={() => window.print()}>Print report <span>↗</span></button></PagePanel>,
    settings: <PagePanel eyebrow="System administration" title={<>System<br /><i>settings.</i></>}><div className="settings-list"><label>Platform name<input defaultValue="HIVeLink" /></label><label>Support email<input type="email" defaultValue="support@risinghiv.org" /></label><label className="setting-check"><input type="checkbox" defaultChecked /> Require approval for new health workers</label><label className="setting-check"><input type="checkbox" defaultChecked /> Enable activity logging</label><button className="primary-button">Save settings <span>↗</span></button></div></PagePanel>,
  };

  return (
    <div className="patient-shell">
      <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
      <header className="site-header guest-header patient-header">
        <button className="brand brand-button" onClick={() => navigate('overview')} aria-label="HIVeLink home"><span>HIVeLink</span></button>
        <nav className="nav-links worker-nav" aria-label="Admin navigation">{[['overview', 'Overview'], ['users', 'Users'], ['workers', 'Health workers'], ['services', 'Services'], ['logs', 'Activity logs'], ['reports', 'Reports'], ['settings', 'Settings']].map(([key, label]) => <button className={`guest-nav-link ${page === key ? 'active' : ''}`} key={key} onClick={() => navigate(key)}>{label}</button>)}</nav>
        <div className="patient-header-actions"><button className="sign-out-button" onClick={onSignOut}>Sign out</button></div>
      </header>
      <main key={page} className="patient-main route-transition">{content[page]}</main>
      <footer><span className="footer-brand">HIVeLink</span><button className="patient-public-link" onClick={onPublicHub}>Public awareness hub ↗</button><button className="footer-back" onClick={() => navigate('overview')}>Back to top ↑</button></footer>

      {activeModal?.type === 'view-user' && <AdminUserDetailModal user={activeModal.user} onClose={() => setActiveModal(null)} onEdit={(u) => setActiveModal({ type: 'edit-user', user: u })} onDelete={(id, name) => setActiveModal({ type: 'confirm-delete', title: 'Delete User Account', message: `Are you sure you want to delete ${name}?`, onConfirm: () => { removeUser(id); setActiveModal(null); } })} />}
      {activeModal?.type === 'create-user' && <AdminUserFormModal onClose={() => setActiveModal(null)} onSave={() => setActiveModal(null)} />}
      {activeModal?.type === 'edit-user' && <AdminUserFormModal user={activeModal.user} onClose={() => setActiveModal(null)} onSave={() => setActiveModal(null)} />}
      {activeModal?.type === 'email-user' && <AdminEmailModal user={activeModal.user} onClose={() => setActiveModal(null)} />}
      {activeModal?.type === 'view-worker' && <AdminHealthWorkerDetailModal worker={activeModal.worker} onClose={() => setActiveModal(null)} onEdit={(w) => setActiveModal({ type: 'edit-worker', worker: w })} onDelete={(id, name) => setActiveModal({ type: 'confirm-delete', title: 'Delete Health Worker', message: `Are you sure you want to delete ${name}?`, onConfirm: () => { removeWorker(id); setActiveModal(null); } })} />}
      {activeModal?.type === 'create-worker' && <AdminHealthWorkerFormModal onClose={() => setActiveModal(null)} onSave={() => setActiveModal(null)} />}
      {activeModal?.type === 'edit-worker' && <AdminHealthWorkerFormModal worker={activeModal.worker} onClose={() => setActiveModal(null)} onSave={() => setActiveModal(null)} />}
      {activeModal?.type === 'create-service' && <AdminServiceFormModal onClose={() => setActiveModal(null)} onSave={() => setActiveModal(null)} />}
      {activeModal?.type === 'edit-service' && <AdminServiceFormModal service={activeModal.service} onClose={() => setActiveModal(null)} onSave={() => setActiveModal(null)} />}
      {activeModal?.type === 'confirm-delete' && <AdminConfirmDeleteModal title={activeModal.title} message={activeModal.message} onConfirm={activeModal.onConfirm} onClose={() => setActiveModal(null)} />}
    </div>
  );
}

function AdminList({ items, render }) { return <div className="worker-list admin-list">{items.map((item) => <article key={item.id}>{render(item)}</article>)}</div>; }

function App() {
  const [activeResource, setActiveResource] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sent, setSent] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (db.useApi) {
      db.restoreSession().then((session) => {
        if (!mounted || !session) return;
        setCurrentUser(session.user);
        setCurrentPatient(session.patient);
        setCurrentWorker(session.worker);
        setUserRole(session.user.role);
        setHasEntered(true);
      }).catch(() => {});
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!db.useApi || !hasEntered || isGuest) return undefined;
    let mounted = true;
    let unsubscribe;
    subscribeToChatChanges(() => {
      db.refresh().catch((error) => console.error('Could not refresh chat data:', error.message));
    }).then((stop) => {
      if (mounted) unsubscribe = stop;
      else stop();
    }).catch((error) => console.error('Could not subscribe to Supabase Realtime:', error.message));
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [hasEntered, isGuest]);

  useEffect(() => {
    scrollPageToTop();
  }, [hasEntered, isGuest, userRole]);

  const openSupport = () => {
    setSent(false);
    setShowForm(true);
  };

  const signOut = () => {
    if (db.useApi) db.logout().catch(() => {});
    if (db.useApi) clearChatRealtimeSession().catch(() => {});
    setCurrentUser(null);
    setCurrentPatient(null);
    setCurrentWorker(null);
    setHasEntered(false);
    setIsGuest(false);
    setUserRole('patient');
  };

  const openPublicHub = () => setIsGuest(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const firstName = form.elements[0]?.value || 'Anonymous';
    const email = form.elements[1]?.value || '';
    const message = form.elements[2]?.value || '';
    db.insert('PublicInquiries', {
      first_name: firstName,
      email,
      message,
      status: 'New',
    });
    setSent(true);
  };

  if (!hasEntered) {
    return (
      <AuthScreen
        onEnter={async (role, guest = false, authData = null) => {
          if (authData?.realtimeSession) {
            try { await setChatRealtimeSession(authData.realtimeSession); }
            catch (error) { console.error('Could not initialize chat Realtime:', error.message); }
          }
          setUserRole(role);
          setIsGuest(guest);
          if (authData) {
            setCurrentUser(authData.user || null);
            setCurrentPatient(authData.patient || null);
            setCurrentWorker(authData.worker || null);
          }
          setHasEntered(true);
        }}
      />
    );
  }

  if (isGuest) {
    return <GuestHub onExit={signOut} />;
  }

  if (userRole === 'health-worker') {
    return (
      <HealthWorkerDashboard
        currentUser={currentUser}
        currentWorker={currentWorker}
        onPublicHub={openPublicHub}
        onSignOut={signOut}
      />
    );
  }

  if (userRole === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onPublicHub={openPublicHub}
        onSignOut={signOut}
      />
    );
  }

  if (userRole === 'patient') {
    return (
      <PatientDashboard
        currentUser={currentUser}
        currentPatient={currentPatient}
        onPublicHub={openPublicHub}
        onSignOut={signOut}
      />
    );
  }

  if (userRole !== 'patient') {
    return <RoleDashboard role={userRole} onPublicHub={() => setUserRole('patient')} />;
  }

  return (
    <div className="app-shell">
      <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="HIVeLink home"><span>HIVeLink</span></a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#learn">Learn</a><a href="#resources">Resources</a><a href="#community">Community</a>
        </nav>
        <button className="header-action" onClick={openSupport}>Talk to someone <span aria-hidden="true">↗</span></button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="pulse-dot" /> A judgment-free place to start</p>
            <h1>Knowledge<br /><span>is care.</span></h1>
            <p className="hero-text">Clear, current information about HIV. Real support for every step, every question, and every person.</p>
            <div className="hero-actions"><a className="primary-button" href="#learn">Start exploring <span>↓</span></a><button className="text-button" onClick={openSupport}>I need support <span>↗</span></button></div>
          </div>
          <figure className="hero-art"><img src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1100&q=85" alt="Healthcare worker preparing a medical consultation" /><figcaption>Support, without judgment.</figcaption></figure>
        </section>

        <section className="stat-strip" aria-label="HIV facts">
          <div><strong>01</strong><span>HIV is manageable<br />with treatment.</span></div><div><strong>02</strong><span>Undetectable means<br />untransmittable.</span></div><div><strong>03</strong><span>Everyone deserves<br />care without stigma.</span></div>
        </section>

        <section className="learn-section" id="learn">
          <div className="section-heading"><p className="eyebrow">The essentials</p><h2>Start with what<br /><i>matters.</i></h2><p>There is no wrong door. Begin with the question that is on your mind.</p></div>
          <div className="resource-list" id="resources">
            {resources.map((resource, index) => <article className={`resource-card ${activeResource === index ? 'is-active' : ''}`} key={resource.number}>
              <div className="resource-number">{resource.number}</div><div><h3>{resource.title}</h3><p>{resource.text}</p>{activeResource === index && <p className="resource-detail">We can help you find a local, confidential next step at your own pace.</p>}<button className="card-link" onClick={() => setActiveResource(activeResource === index ? null : index)}>{activeResource === index ? 'Close details' : resource.action} <span>↗</span></button></div>
            </article>)}
          </div>
        </section>

        <section className="community-section" id="community"><div className="community-quote"><span className="quote-mark">“</span><blockquote>You are more than<br />a diagnosis.</blockquote><p>Support starts with being seen, heard, and met with respect.</p></div><div className="community-panel"><p className="eyebrow">A private conversation</p><h2>Questions are<br /><i>welcome here.</i></h2><p>Our support team can help you sort through testing, treatment, prevention, or just a difficult day.</p><button className="primary-button light-button" onClick={openSupport}>Reach out <span>↗</span></button></div></section>
      </main>

      <footer><span className="footer-brand">HIVeLink</span><span>Made for more informed, connected lives.</span><a href="#top">Back to top ↑</a></footer>

      {showForm && <div className="modal-backdrop" role="presentation" onClick={() => setShowForm(false)}><div className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setShowForm(false)} aria-label="Close support form">×</button>{sent ? <div className="success-state"><span className="success-icon">✓</span><h2>We received your note.</h2><p>Someone from our support team will respond with care. You are not alone in this.</p><button className="primary-button" onClick={() => setShowForm(false)}>Done</button></div> : <><p className="eyebrow">Confidential support</p><h2 id="support-title">What is on<br /><i>your mind?</i></h2><p className="modal-intro">Leave a note and a trained support person will get back to you. No question is too small.</p><form onSubmit={handleSubmit}><label>Your first name<input required type="text" /></label><label>Your email<input required type="email" /></label><label>How can we help?<textarea required placeholder="Share only what feels comfortable." rows="3" /></label><button className="primary-button" type="submit">Send privately <span>↗</span></button></form></>}</div></div>}
    </div>
  );
}

export default App;
