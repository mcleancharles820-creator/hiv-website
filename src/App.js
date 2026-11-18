import './App.css';
import { CircleUser } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AdminSupportGroupSupervisor, PatientSupportGroupPanel, SupervisorSupportGroupPanel } from './components/SupportGroupPanel';
import AppointmentRequestForm from './components/AppointmentRequestForm';
import db from './services/databaseService';
import { clearChatRealtimeSession, setChatRealtimeSession, subscribeToChatChanges } from './services/chatRealtime';
import { consumePasswordRecoveryToken, isPasswordRecoveryRedirect } from './services/passwordRecovery';
import { consumeEmailVerificationToken } from './services/emailVerification';

function scrollPageToTop() {
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function formatDateTime(value, fallback = 'Not recorded') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function composeFullName(firstName, middleName, lastName) {
  return [firstName, middleName, lastName].map((part) => String(part || '').trim()).join(' ');
}

function normalizeGender(value) {
  return ({
    Woman: 'Female',
    Man: 'Male',
    LGBT: 'Lesbian, Gay, Bisexual, and Transgender',
    'Non-binary': 'Other',
    'Self-describe': 'Other',
    'Self-described': 'Other',
  })[value] || value || '';
}

function PasswordInput({ id, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="password-input-wrap">
      <input id={id} {...inputProps} type={isVisible ? 'text' : 'password'} />
      <button
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
        className="password-visibility-toggle"
        onClick={() => setIsVisible((visible) => !visible)}
        type="button"
      >
        {isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

function PasswordField({ label, id, ...inputProps }) {
  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <PasswordInput id={id} {...inputProps} />
    </div>
  );
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

const promotionalContent = [
  {
    kind: 'video',
    title: 'HIV basics: testing, prevention, and living with HIV',
    description: 'A CDC overview of testing, prevention, and living well with HIV.',
    image: '/promotional-testing.svg',
    videoId: 'JY1qi3bf-Os',
    publisher: 'Centers for Disease Control and Prevention',
  },
  {
    kind: 'video',
    title: 'HIV prevention',
    description: 'Learn about practical tools that can help prevent HIV.',
    image: '/promotional-prevention.svg',
    videoId: 'f6umofGzPpc',
    publisher: 'Centers for Disease Control and Prevention',
  },
  {
    kind: 'video',
    title: 'HIV basics',
    description: 'A short introduction to HIV and the basics of care.',
    image: '/promotional-testing.svg',
    videoId: '12vTnXekJu8',
    publisher: 'Centers for Disease Control and Prevention',
  },
  {
    kind: 'video',
    title: 'PEP: prevention after a possible exposure',
    description: 'Learn why PEP is time-sensitive and how to seek help quickly.',
    image: '/promotional-prevention.svg',
    videoId: 'hsgQNimo7o0',
    publisher: 'Centers for Disease Control and Prevention',
  },
  {
    kind: 'video',
    title: 'Get the facts, talk about HIV',
    description: 'A CDC awareness clip encouraging informed and open conversations.',
    image: '/promotional-treatment.svg',
    videoId: '0uh5NLKX5ag',
    publisher: 'Centers for Disease Control and Prevention',
  },
  {
    kind: 'video',
    title: 'Reasons to get tested for HIV',
    description: 'A CDC testing campaign clip about knowing your status.',
    image: '/promotional-testing.svg',
    videoId: 'arkOjDaOE_c',
    publisher: 'Centers for Disease Control and Prevention',
  },
  {
    kind: 'image',
    title: 'Treatment works',
    description: 'Learn how HIV treatment supports long, healthy lives and helps prevent transmission.',
    image: '/promotional-treatment.svg',
    href: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids',
    action: 'Treatment and U=U',
  },
  {
    kind: 'image',
    title: 'Prevention is personal',
    description: 'Explore practical prevention options and choose what works for you.',
    image: '/promotional-prevention.svg',
    href: 'https://www.cdc.gov/hiv/prevention/index.html',
    action: 'Prevention options',
  },
];

function PromotionalMediaGallery() {
  const [activePromo, setActivePromo] = useState(null);

  useEffect(() => {
    if (!activePromo) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActivePromo(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activePromo]);

  return (
    <section className="promo-section" aria-labelledby="promo-heading">
      <div className="section-heading">
        <p className="eyebrow">Watch and learn</p>
        <h2 id="promo-heading">Videos and<br /><i>visual guides.</i></h2>
        <p>Watch trusted educational videos here, then explore visual guides and practical information.</p>
      </div>
      <div className="promo-media-grid">
        {promotionalContent.map((item) => (
          <button
            className="promo-media-card"
            key={item.title}
            type="button"
            aria-label={`${item.kind === 'video' ? 'Watch' : 'View'}: ${item.title}`}
            onClick={() => setActivePromo(item)}
          >
            <span className="promo-media-kind">{item.kind === 'video' ? 'Watch video' : 'Visual guide'}</span>
            <div className="promo-media-image">
              <img src={item.kind === 'video' ? `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` : item.image} alt="" loading="lazy" />
              <span className="promo-media-play" aria-hidden="true">{item.kind === 'video' ? '▶' : '+'}</span>
            </div>
            <div className="promo-media-copy">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="promo-media-action">{item.kind === 'video' ? 'Play in HIVeLink' : 'Open visual guide'} <span aria-hidden="true">→</span></span>
            </div>
          </button>
        ))}
      </div>
      {activePromo && <PromotionalPreviewDialog activePromo={activePromo} onClose={() => setActivePromo(null)} />}
    </section>
  );
}

function PromotionalPreviewDialog({ activePromo, onClose }) {
  return (
    <div className="modal-backdrop promo-preview-backdrop" role="presentation" onClick={onClose}>
      <section className="promo-preview-modal" role="dialog" aria-modal="true" aria-labelledby="promo-preview-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Close image preview">×</button>
        {activePromo.kind === 'video'
          ? <div className="promo-video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${activePromo.videoId}?autoplay=1&rel=0`} title={activePromo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
          : <img src={activePromo.image} alt={activePromo.title} />}
        <p className="eyebrow">HIVeLink · {activePromo.kind === 'video' ? `Video · ${activePromo.publisher}` : 'Related information'}</p>
        <h2 id="promo-preview-title">{activePromo.title}</h2>
        <p>{activePromo.description}</p>
        {activePromo.kind === 'image' && <a className="primary-button" href={activePromo.href} target="_blank" rel="noreferrer">{activePromo.action} <span aria-hidden="true">↗</span></a>}
      </section>
    </div>
  );
}

const guestKnowledge = [
  {
    title: 'What is HIV?',
    text: 'HIV is a virus that attacks the immune system. Treatment can control the virus and help people live long, healthy lives.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'WHO: HIV and AIDS',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids',
  },
  {
    title: 'What is AIDS?',
    text: 'AIDS is the most advanced stage of HIV infection. Effective treatment helps most people with HIV avoid progressing to AIDS.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'WHO: HIV and AIDS',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids',
  },
  {
    title: 'How HIV can be transmitted',
    text: 'HIV can be transmitted through certain body fluids, including blood, semen, vaginal fluids, rectal fluids, and breast milk.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: About HIV',
    sourceUrl: 'https://www.cdc.gov/hiv/about/index.html',
  },
  {
    title: 'How HIV is not transmitted',
    text: 'HIV does not spread through everyday contact such as hugging, shaking hands, sharing food, or using the same toilet.',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: About HIV',
    sourceUrl: 'https://www.cdc.gov/hiv/about/index.html',
  },
  {
    title: 'HIV testing',
    text: 'Testing is the only way to know your HIV status. Different tests have different window periods, so ask a health worker whether and when to retest.',
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: HIV testing',
    sourceUrl: 'https://www.cdc.gov/hiv/testing/index.html',
  },
  {
    title: 'Starting treatment',
    text: 'Antiretroviral therapy (ART) is recommended for everyone with HIV. Take medicines as prescribed and keep follow-up visits with your care team.',
    image: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'WHO: HIV and AIDS',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids',
  },
  {
    title: 'U=U',
    text: 'When a person taking HIV treatment maintains an undetectable viral load, they do not transmit HIV to sexual partners.',
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: HIV treatment',
    sourceUrl: 'https://www.cdc.gov/hiv/treatment/index.html',
  },
  {
    title: 'PrEP',
    text: 'Pre-exposure prophylaxis (PrEP) is medicine for people who do not have HIV that can help prevent HIV. A health worker can discuss whether it fits your needs.',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: PrEP',
    sourceUrl: 'https://www.cdc.gov/hiv/prevention/prep.html',
  },
  {
    title: 'PEP is time-sensitive',
    text: 'Post-exposure prophylaxis (PEP) is emergency medicine after a possible exposure. It must be started as soon as possible and within 72 hours. Seek care right away.',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: PEP',
    sourceUrl: 'https://www.cdc.gov/hiv/prevention/pep.html',
  },
  {
    title: 'Condoms and prevention',
    text: 'Using condoms correctly and consistently can reduce the risk of HIV and some other sexually transmitted infections. Prevention choices can be combined.',
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: HIV prevention',
    sourceUrl: 'https://www.cdc.gov/hiv/prevention/index.html',
  },
  {
    title: 'HIV treatment and ART',
    text: 'Antiretroviral therapy (ART) controls HIV. Taking treatment as prescribed and keeping follow-up appointments helps protect your health. A health worker can help find a treatment plan that works for you.',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'HIV.gov: HIV treatment',
    sourceUrl: 'https://www.hiv.gov/hiv-basics/staying-in-hiv-care/hiv-treatment/hiv-treatment-overview',
  },
  {
    title: 'What to expect from testing',
    text: 'A health worker can explain the test, how results are shared, and whether you may need another test after a window period. You can ask questions before deciding what to do next.',
    image: 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: HIV testing',
    sourceUrl: 'https://www.cdc.gov/hiv/testing/index.html',
  },
  {
    title: 'Confidential care',
    text: 'You can ask a clinic how your information is protected and who can access it. If you have concerns, talk privately with a health worker before sharing details.',
    image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'Philippine HIV and AIDS Policy Act',
    sourceUrl: 'https://lawphil.net/statutes/repacts/ra2018/ra_11166_2018.html',
  },
  {
    title: 'HIV and pregnancy',
    text: 'With appropriate treatment and care, people living with HIV can have healthy pregnancies and greatly reduce the chance of passing HIV to their baby. Seek guidance from a qualified care team.',
    image: 'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'WHO: HIV and AIDS',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids',
  },
  {
    title: 'Mental health and support',
    text: 'An HIV diagnosis can bring many emotions. Peer support, counseling, trusted friends, and health workers can help; choose support that feels safe for you.',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'WHO: HIV and AIDS',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids',
  },
  {
    title: 'Sexual health check-ins',
    text: 'Regular conversations with a health worker can help you choose prevention, testing, and care options that fit your circumstances and preferences.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'CDC: HIV prevention',
    sourceUrl: 'https://www.cdc.gov/hiv/prevention/index.html',
  },
  {
    title: 'Your questions matter',
    text: 'You deserve respectful, judgment-free support. A health worker can help you understand testing, prevention, treatment, or your next step.',
    image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&w=900&q=80',
    sourceLabel: 'WHO: HIV and AIDS',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids',
  },
];

const guestKnowledgeDetails = {
  'What is HIV?': 'HIV mainly affects CD4 cells, which help the body fight infections. Antiretroviral therapy (ART) lowers the amount of virus in the body and protects the immune system. There is no cure yet, but treatment can make HIV a manageable long-term condition.',
  'What is AIDS?': 'AIDS is diagnosed when HIV has significantly weakened the immune system or certain serious illnesses occur. It is not inevitable: taking HIV treatment and receiving ongoing care can prevent HIV from progressing to this stage.',
  'How HIV can be transmitted': 'Transmission requires specific body fluids to enter the bloodstream or reach susceptible tissue, such as through sex, sharing injection equipment, or during pregnancy, birth, or breastfeeding. Effective prevention options are available, and a health worker can help identify what fits your situation.',
  'How HIV is not transmitted': 'HIV is not spread by air or water, insects, hugging, handshakes, sharing dishes, or ordinary social contact. You can safely study, work, eat, and spend time with someone living with HIV.',
  'HIV testing': 'HIV tests look for antibodies, antigens, or the virus itself. The time before a test can reliably detect HIV depends on the test, so a health worker can explain the window period and whether follow-up testing is recommended.',
  'Starting treatment': 'ART uses a combination of medicines to suppress HIV. A care team can explain the regimen, possible side effects, and how to fit doses into daily life. Do not stop or change treatment without speaking with your provider.',
  'U=U': 'Undetectable means the amount of HIV in blood is below the level measured by standard tests while treatment is working. People who maintain an undetectable viral load do not transmit HIV through sex. Regular care and viral-load monitoring confirm that treatment remains effective.',
  PrEP: 'PrEP is for people who do not have HIV and may have an ongoing chance of exposure. A provider will test for HIV before PrEP is started and arrange follow-up tests and other checks while you use it. PrEP prevents HIV but does not prevent other sexually transmitted infections.',
  'PEP is time-sensitive': 'PEP is a short course of HIV medicines after a possible exposure. It should be started as soon as possible and no later than 72 hours after exposure, and is usually taken for 28 days. Seek urgent medical care rather than waiting for symptoms.',
  'Condoms and prevention': 'Condoms can reduce the chance of HIV and some other sexually transmitted infections when used correctly and consistently. They can be used alongside other prevention options such as PrEP, testing, and treatment that maintains an undetectable viral load.',
  'HIV treatment and ART': 'ART is recommended for everyone diagnosed with HIV and is usually taken every day. Taking it consistently helps suppress the virus, protect the immune system, and support long-term health. Your provider can help if access, side effects, or a changing routine makes treatment difficult.',
  'What to expect from testing': 'Before testing, you can ask what type of test is used, when and how results will be shared, and what happens after a result. A reactive screening test is followed by additional testing to confirm the diagnosis. Your provider can discuss the right timing based on possible exposure.',
  'Confidential care': 'You can ask a clinic who can see your records, how results are communicated, and what privacy protections apply. In the Philippines, Republic Act No. 11166 protects the confidentiality of HIV-related information, subject to the law and its specific exceptions.',
  'HIV and pregnancy': 'HIV treatment during pregnancy and coordinated care before and after birth can greatly reduce the chance of passing HIV to a baby. Individual plans depend on a person’s health and circumstances, so work with qualified HIV and maternal-health providers.',
  'Mental health and support': 'People respond to an HIV diagnosis in different ways, and support can help with stress, relationships, and staying engaged in care. Options may include counseling, peer groups, trusted people, or a health worker; choose what feels safe and respectful to you.',
  'Sexual health check-ins': 'Regular, judgment-free conversations can help you review testing, prevention, contraception, and other sexual-health needs. You can tell a provider what matters to you and ask about options without being pressured into a particular choice.',
  'Your questions matter': 'You can ask for information in plain language, request time to think, and bring someone you trust to an appointment if you wish. A health worker can help you understand your options and decide on a next step that works for you.',
};

const knowledgeFlow = [
  { type: 'topic', index: 0 },
  { type: 'media', index: 0 },
  { type: 'topic', index: 1 },
  { type: 'media', index: 2 },
  { type: 'topic', index: 5 },
  { type: 'media', index: 1 },
  { type: 'topic', index: 6 },
  { type: 'topic', index: 2 },
  { type: 'media', index: 3 },
  { type: 'topic', index: 3 },
  { type: 'topic', index: 7 },
  { type: 'topic', index: 8 },
  { type: 'media', index: 5 },
  { type: 'topic', index: 4 },
  { type: 'topic', index: 9 },
  { type: 'topic', index: 10 },
  { type: 'topic', index: 11 },
  { type: 'topic', index: 12 },
  { type: 'topic', index: 13 },
  { type: 'media', index: 4 },
  { type: 'topic', index: 14 },
  { type: 'topic', index: 15 },
  { type: 'topic', index: 16 },
];

function KnowledgeInformationGrid({ className = '' }) {
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [activePromo, setActivePromo] = useState(null);

  useEffect(() => {
    if (!activePromo) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActivePromo(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activePromo]);

  return (
    <div className={`knowledge-flow ${className}`.trim()}>
      {knowledgeFlow.map(({ type, index }) => {
        if (type === 'media') {
          const item = promotionalContent[index];
          return (
            <article className={`knowledge-flow-item knowledge-flow-media ${item.kind === 'video' ? 'is-video' : 'is-image'}`} key={`media-${item.title}`}>
              <button
                className="knowledge-media-button"
                type="button"
                aria-label={`${item.kind === 'video' ? 'Watch' : 'View'}: ${item.title}`}
                onClick={() => setActivePromo(item)}
              >
                <span className="knowledge-media-visual">
                  <img src={item.kind === 'video' ? `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` : item.image} alt="" loading="lazy" decoding="async" />
                  {item.kind === 'video' && <span className="knowledge-media-play" aria-hidden="true">▶</span>}
                </span>
                <span className="knowledge-media-copy">
                  <span className="knowledge-topic-label">{item.kind === 'video' ? 'WATCH · CDC' : 'RELATED READING'}</span>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <span className="knowledge-media-action">{item.kind === 'video' ? 'Play video' : 'Open related information'} <span aria-hidden="true">→</span></span>
                </span>
              </button>
            </article>
          );
        }

        const item = guestKnowledge[index];
        const isExpanded = expandedTopic === index;
        const detailId = `knowledge-detail-${index}`;
        return (
          <article className="knowledge-flow-item knowledge-flow-topic" id={`knowledge-entry-${index}`} key={`topic-${item.title}`}>
            <div className="knowledge-topic-image">
              <img src={item.image} alt={`Illustrative healthcare scene about ${item.title}`} width="900" height="506" loading="lazy" decoding="async" />
            </div>
            <div className="knowledge-topic-copy">
              <p className="knowledge-topic-label">HIV INFORMATION</p>
              <h2 className="knowledge-topic-heading">
                <button type="button" aria-expanded={isExpanded} aria-controls={detailId} onClick={() => setExpandedTopic(isExpanded ? null : index)}>
                  {item.title}<span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                </button>
              </h2>
              <p>{item.text}</p>
              <p className="knowledge-topic-detail" id={detailId} hidden={!isExpanded}>{guestKnowledgeDetails[item.title]}</p>
              <button className="knowledge-expand-button" type="button" aria-expanded={isExpanded} aria-controls={detailId} onClick={() => setExpandedTopic(isExpanded ? null : index)}>
                {isExpanded ? 'Show less' : 'Read more'} <span aria-hidden="true">{isExpanded ? '−' : '↓'}</span>
              </button>
              <nav className="knowledge-entry-sources" aria-label={`Sources for ${item.title}`}>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Information source: ${item.sourceLabel}`}>{item.sourceLabel} ↗</a>
                <a href={item.image} target="_blank" rel="noreferrer" aria-label={`Photo source on Unsplash for ${item.title}`}>Photo source (Unsplash) ↗</a>
              </nav>
            </div>
          </article>
        );
      })}
      {activePromo && <PromotionalPreviewDialog activePromo={activePromo} onClose={() => setActivePromo(null)} />}
    </div>
  );
}

const patientPrivateNavItems = [
  ['chat', 'Private Chat'],
  ['support', 'Support Groups'],
];

function UserNavbar({ page, userCode, onNavigate, onSignOut }) {
  const items = [['home', 'Home'], ['information', 'Information'], ['testing', 'Testing'], ...patientPrivateNavItems];
  return (
    <header className="site-header user-header patient-header">
      <button className="brand brand-button" onClick={() => onNavigate('home')} aria-label="HIVeLink home"><span>HIVeLink</span></button>
      <nav className="nav-links" aria-label="Patient navigation">
        {items.map(([key, label]) => (
          <button className={`guest-nav-link ${page === key ? 'active' : ''}`} key={key} onClick={() => onNavigate(key)} aria-current={page === key ? 'page' : undefined}>{label}</button>
        ))}
      </nav>
      <div className="patient-header-actions">
        <span className="profile-name">UIC {userCode || 'Unavailable'}</span>
        <button className={`profile-icon ${page === 'account' ? 'active' : ''}`} type="button" aria-label={`Open UIC ${userCode || ''} care dashboard`} aria-current={page === 'account' ? 'page' : undefined} onClick={() => onNavigate('account')} title="Open care dashboard">
          <CircleUser aria-hidden="true" className="profile-icon-glyph" color="currentColor" size={18} strokeWidth={1.6} />
        </button>
        <button className="sign-out-button" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  );
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeToMinutes(value) {
  const time = String(value || '').trim();
  const twentyFourHour = time.match(/^(?:([01]\d|2[0-3])):([0-5]\d)$/);
  if (twentyFourHour) return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
  const twelveHour = time.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (!twelveHour) return Number.MAX_SAFE_INTEGER;
  const hour = (Number(twelveHour[1]) % 12) + (twelveHour[3].toUpperCase() === 'PM' ? 12 : 0);
  return hour * 60 + Number(twelveHour[2]);
}

function formatAppointmentTime(value) {
  const time = String(value || '');
  const match = time.match(/^(?:([01]\d|2[0-3])):([0-5]\d)$/);
  if (!match) return time;
  return new Date(2000, 0, 1, Number(match[1]), Number(match[2])).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function FacilityMap() {
  const mapElement = useRef(null);

  useEffect(() => {
    const mapNode = mapElement.current;
    let map;
    let cancelled = false;
    const initializeMap = () => {
      if (cancelled || !mapNode || !window.L || mapNode.dataset.mapReady) return;
      mapNode.dataset.mapReady = 'true';
      map = window.L.map(mapNode, { scrollWheelZoom: false }).setView([12.3973, 121.983], 14);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      [
        { name: 'Odiongan Rural Health Unit', address: '9XXJ+WXX, JP Laurel St, Odiongan, Romblon', position: [12.39998, 121.98136] },
        { name: 'Romblon Provincial Hospital', address: 'Liwanag, Odiongan, Romblon', position: [12.39459, 121.98408] },
      ].forEach(({ name, address, position }) => {
        window.L.circleMarker(position, { color: '#a8182c', fillColor: '#d21f3c', fillOpacity: 1, radius: 8, weight: 3 })
          .addTo(map)
          .bindTooltip(name, { permanent: true, direction: 'top', offset: [0, -7], className: 'facility-map-label' })
          .bindPopup(`<strong>${name}</strong><br />${address}`);
      });
      map.fitBounds([[12.39459, 121.98136], [12.39998, 121.98408]], { padding: [65, 65] });
    };
    if (window.L) {
      initializeMap();
    } else {
      let stylesheet = document.querySelector('link[data-leaflet-styles]');
      if (!stylesheet) {
        stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        stylesheet.dataset.leafletStyles = 'true';
        document.head.appendChild(stylesheet);
      }
      let script = document.querySelector('script[data-leaflet-script]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.dataset.leafletScript = 'true';
        document.body.appendChild(script);
      }
      script.addEventListener('load', initializeMap, { once: true });
    }

    return () => {
      cancelled = true;
      if (map) map.remove();
      if (mapNode) delete mapNode.dataset.mapReady;
    };
  }, []);

  return <div className="facility-map" ref={mapElement} role="application" aria-label="Map with pins for Odiongan Rural Health Unit and Romblon Provincial Hospital" />;
}

function GuestHub({ onExit, patientMode = false, appointmentsEnabled = true, onPrivatePage, onAccount, initialPage = 'home', userCode = '' }) {
  const firstPage = initialPage === 'information' ? 'knowledge' : initialPage;
  const [page, setPage] = useState(firstPage);

  const navigate = (nextPage) => {
    setPage(nextPage);
    scrollPageToTop();
  };

  const pageContent = {
    home: <><section className="guest-hero guest-page"><div><p className="eyebrow"><span className="pulse-dot" /> Welcome to HIVeLink</p><h1>Care and support,<br /><span>at your pace.</span></h1><p>HIVeLink brings trusted HIV information, local testing guidance, appointment requests, and supportive connections together in one welcoming place. You can explore public resources without an account, or sign in to access patient services.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate('knowledge')}>Explore information <span>→</span></button><button className="text-button" onClick={() => navigate('testing')}>Find local care ↗</button></div></div><figure className="guest-hero-image"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Healthcare professional speaking with a patient" width="1100" height="688" /><figcaption>A welcoming place to learn and find support.</figcaption></figure></section><section className="guest-offerings" aria-labelledby="guest-offerings-heading"><div className="guest-section-intro"><p className="eyebrow">What you can do here</p><h2 id="guest-offerings-heading">A clear next<br /><i>step forward.</i></h2></div><div className="guest-offerings-grid"><button type="button" onClick={() => navigate('knowledge')}><span>INFORMATION</span><strong>Learn with confidence</strong><p>Explore HIV basics, prevention, testing, treatment, and videos from trusted health organizations.</p></button><button type="button" onClick={() => navigate('testing')}><span>LOCAL CARE</span><strong>Find nearby services</strong><p>See local testing and treatment contacts in Odiongan and find the next place to ask for help.</p></button><div><span>PATIENT SERVICES</span><strong>Manage care privately</strong><p>Registered patients can request appointments, review service history, and connect with support.</p></div><div><span>SUPPORT</span><strong>Talk with someone</strong><p>Use private support options and community resources when you are ready.</p></div></div></section></>,
    knowledge: (
      <section className="guest-knowledge guest-page" id="guest-knowledge">
        <div className="guest-section-intro">
          <p className="eyebrow">HIV / AIDS information</p>
          <h1>Knowledge<br /><i>without stigma.</i></h1>
          <p>Clear, practical information to help you learn at your own pace. These resources support learning and do not replace advice from a qualified health worker.</p>
        </div>
        <div>
          <KnowledgeInformationGrid />
          <p className="knowledge-photo-credit">Illustrative photos from Unsplash. Each photo links to its image source. See the <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash License ↗</a>.</p>
        </div>
      </section>
    ),
    testing: <section className="guest-testing guest-page" id="guest-testing"><div className="guest-section-intro"><p className="eyebrow">Find your next step</p><h1>Testing and<br /><i>treatment.</i></h1><p>Testing is confidential. Treatment is available, and early care makes a difference.</p><a className="text-button" href="https://www.google.com/maps/dir/?api=1&origin=12.39998%2C121.98136&destination=12.39459,121.98408" target="_blank" rel="noreferrer">Open in Google Maps ↗</a>{patientMode && (appointmentsEnabled ? <button className="primary-button patient-testing-button" onClick={() => onPrivatePage('appointments')}>Request an appointment <span>↗</span></button> : <p className="form-error patient-testing-button" role="status">Online appointment requests are currently unavailable. Contact your clinic directly.</p>)}</div><div className="map-wrap"><FacilityMap /><p className="map-caption"><strong>Odiongan, Romblon</strong><span>OpenStreetMap with both facilities marked. Select a pin for its name.</span></p></div><div className="testing-facilities"><div className="facility-heading"><p className="eyebrow">Local care contacts</p><h2>Care to<br /><i>contact first.</i></h2><p>Call ahead and ask about HIV testing, treatment referral, and current clinic schedules.</p></div><div className="facility-list"><a href="https://www.google.com/maps/search/?api=1&query=9XXJ%2BWXX%2C+JP+Laurel+St%2C+Odiongan%2C+Romblon" target="_blank" rel="noreferrer"><strong>Rural Health Unit</strong><span>9XXJ+WXX, JP Laurel St, Odiongan, Romblon · Find on map ↗</span></a><a href="https://www.google.com/maps/search/?api=1&query=Romblon+Provincial+Hospital+Liwanag+Odiongan" target="_blank" rel="noreferrer"><strong>Romblon Provincial Hospital</strong><span>Barangay Liwanag, Odiongan · Find on map ↗</span></a></div></div><div className="testing-notes"><div><span>01</span><h2>Where to begin</h2><p>Visit your local Rural Health Unit, municipal health office, or a hospital and ask about confidential HIV testing.</p></div><div><span>02</span><h2>Where to get treated</h2><p>Ask a health worker about referral to an HIV treatment hub. They can guide you to care, medicines, and follow-up.</p></div><div><span>03</span><h2>Need urgent help?</h2><p>PEP may prevent HIV after a recent exposure and works best as soon as possible. Visit a health facility or emergency department.</p></div></div></section>,
  };

  const guestNavItems = [['home', 'Home'], ['knowledge', 'Information'], ['testing', 'Testing']];

  return <div className={patientMode ? 'patient-shell guest-hub patient-guest-hub' : 'guest-hub'}>
    <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
    {patientMode ? <UserNavbar page={page === 'knowledge' ? 'information' : page} userCode={userCode} onNavigate={(nextPage) => {
      if (nextPage === 'home' || nextPage === 'information' || nextPage === 'testing') navigate(nextPage === 'information' ? 'knowledge' : nextPage);
      else onPrivatePage(nextPage);
    }} onSignOut={onExit} /> : <GuestNavbar page={page} items={guestNavItems} onNavigate={navigate} onSignIn={onExit} />}
    <main key={page} id="guest-top">{pageContent[page]}</main><footer><span className="footer-brand">HIVeLink</span><span>{patientMode ? 'Private patient view' : 'Public guest view · No account required'}</span><button className="footer-back" onClick={() => navigate('home')}>Back to home ↑</button></footer>
  </div>;
}

function GuestNavbar({ page, items, onNavigate, onSignIn }) {
  return (
    <header className="site-header guest-header">
      <button className="brand brand-button" onClick={() => onNavigate('home')} aria-label="HIVeLink home"><span>HIVeLink</span></button>
      <nav className="nav-links" aria-label="Guest navigation">
        {items.map(([key, label]) => <button className={`guest-nav-link ${page === key ? 'active' : ''}`} key={key} onClick={() => onNavigate(key)} aria-current={page === key ? 'page' : undefined}>{label}</button>)}
      </nav>
      <button className="guest-auth-link" onClick={onSignIn}>Log in / Sign up <span>↗</span></button>
    </header>
  );
}

function AuthScreen({ onEnter, onPasswordRecoveryComplete }) {
  const [mode, setMode] = useState(() => (isPasswordRecoveryRedirect() ? 'reset' : 'login'));
  const [error, setError] = useState('');
  const [role, setRole] = useState('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [emailVerificationStatus, setEmailVerificationStatus] = useState('');
  const [verificationAccessToken, setVerificationAccessToken] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const recoveryTokenHandled = useRef(false);
  const verificationTokenHandled = useRef(false);

  useEffect(() => {
    if (!isPasswordRecoveryRedirect() || recoveryTokenHandled.current) return;
    recoveryTokenHandled.current = true;
    const token = consumePasswordRecoveryToken();
    if (token) setRecoveryToken(token);
    else setError('This password reset link is invalid or has expired. Request a new link and try again.');
  }, []);

  useEffect(() => {
    if (verificationTokenHandled.current) return;
    const verification = consumeEmailVerificationToken();
    if (!verification) return;
    verificationTokenHandled.current = true;
    setEmailVerificationStatus('processing');
    if (!verification.accessToken) {
      setEmailVerificationStatus('failed');
      setVerificationMessage('This verification link is invalid or has expired. Request a new verification email and try again.');
      return;
    }

    setVerificationAccessToken(verification.accessToken);
    db.confirmEmailVerification(verification.accessToken).then((result) => {
      if (result.email) setVerificationEmail(result.email);
      if (result.emailVerified && result.emailSent) {
        setEmailVerificationStatus('sent');
        setVerificationMessage('Your email is verified. We sent your UIC to this address. Use it with your password to sign in.');
      } else {
        setEmailVerificationStatus('failed');
        setVerificationMessage(result.error || 'Your email could not be verified. Request a new verification email and try again.');
      }
    }).catch((verificationError) => {
      setEmailVerificationStatus('failed');
      setVerificationMessage(verificationError.message || 'We could not verify your email. Please try again.');
    });
  }, []);

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
    setResetMessage('');
    setIsSubmitting(true);
    const form = event.currentTarget;

    try {
      if (mode === 'forgot') {
        const email = form.elements.email.value.trim();
        const result = await db.requestPasswordReset(email);
        if (result.error) {
          setError(result.error);
          return;
        }
        setResetEmail(email);
        setResetMessage(result.message || 'If an active account exists for that email, a password reset link has been sent.');
        setMode('forgot-sent');
        return;
      }

      if (mode === 'reset') {
        const password = form.elements.password.value;
        const confirmPassword = form.elements.confirmPassword.value;
        if (password.length < 12) {
          setError('Choose a password with at least 12 characters.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please check them and try again.');
          return;
        }
        if (!recoveryToken) {
          setError('This password reset link is invalid or has expired. Request a new link and try again.');
          return;
        }

        const result = await db.confirmPasswordReset({ accessToken: recoveryToken, password });
        if (result.error) {
          setError(result.error);
          return;
        }
        setRecoveryToken('');
        setMode('reset-complete');
        onPasswordRecoveryComplete?.();
        return;
      }

      const password = form.elements.password?.value || '';
      const email = mode === 'login'
        ? (role === 'patient' ? '' : form.elements.email.value.trim())
        : form.elements.email.value.trim();
      const uic = mode === 'login' && role === 'patient' ? form.elements.uic.value.trim().toUpperCase() : '';
      if (mode === 'register') {
        if (password.toLowerCase() === email.trim().toLowerCase()) {
          setError('Password cannot be the same as your email address.');
          return;
        }
        if (password !== form.elements.confirmPassword.value) {
          setError('Passwords do not match. Please check them and try again.');
          return;
        }

        const firstName = form.elements.firstName.value.trim();
        const middleName = form.elements.middleName.value.trim();
        const lastName = form.elements.lastName.value.trim();
        if (!firstName || !middleName || !lastName) {
          setError('First, middle, and last names are required.');
          return;
        }
        const fullName = composeFullName(firstName, middleName, lastName);
        if (fullName.length > 150) {
          setError('Your full name must be 150 characters or fewer.');
          return;
        }
        const age = form.elements.age && form.elements.age.value ? parseInt(form.elements.age.value, 10) : null;
        const dateOfBirth = form.elements.dateOfBirth ? form.elements.dateOfBirth.value : null;
        const birthOrder = form.elements.birthOrder ? parseInt(form.elements.birthOrder.value, 10) : null;
        const gender = form.elements.gender ? form.elements.gender.value : null;
        const contactNumber = form.elements.contactNumber ? form.elements.contactNumber.value : null;
        const termsAccepted = form.elements.terms ? form.elements.terms.checked : true;

        const registration = db.registerUser({ fullName, firstName, middleName, lastName, email, password, role, age, dateOfBirth, birthOrder, gender, contactNumber, termsAccepted });
        const registered = db.useApi ? await registration : registration;
        if (registered.verificationRequired || registered.verificationPending) {
          setVerificationEmail(email.trim());
          setEmailVerificationStatus('pending');
          setVerificationMessage(registered.error || 'We sent a verification link. Open it before signing in.');
          return;
        }
        if (registered.error) {
          setError(registered.error);
          return;
        }
        onEnter(registered.user?.role || role, false, registered);
        return;
      }

      const authentication = db.login({ uic, email, password, role });
      const auth = db.useApi ? await authentication : authentication;
      if (auth.error) {
        if (db.useApi && /verify your email/i.test(auth.error)) {
          setVerificationEmail(email.trim());
          setEmailVerificationStatus('pending');
          setVerificationMessage(auth.error);
          return;
        }
        setError(auth.error);
        return;
      }
      onEnter(auth.user?.role || role, false, auth);
    } catch (submitError) {
      setError(submitError.message || 'We could not complete that request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    setResendingVerification(true);
    const result = await db.resendVerificationEmail(verificationEmail);
    setVerificationMessage(result.error || result.message || 'If this account needs verification, a new link has been sent.');
    setResendingVerification(false);
  };

  const resendUicEmail = async () => {
    if (!verificationAccessToken) return;
    setResendingVerification(true);
    const result = await db.confirmEmailVerification(verificationAccessToken);
    if (result.email) setVerificationEmail(result.email);
    setEmailVerificationStatus(result.emailVerified && result.emailSent ? 'sent' : 'failed');
    setVerificationMessage(result.error || result.message || (result.emailSent
      ? 'Your email is verified. We sent your UIC to this address. Use it with your password to sign in.'
      : 'Your UIC email could not be sent. Please try again.'));
    setResendingVerification(false);
  };

  const returnToSignIn = () => {
    setMode('login');
    setRole('patient');
    setError('');
    setResetMessage('');
    setVerificationEmail('');
    setVerificationMessage('');
    setEmailVerificationStatus('');
    setVerificationAccessToken('');
  };
  const recoveryMode = ['forgot', 'forgot-sent', 'reset', 'reset-complete'].includes(mode);

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-message"><p className="eyebrow"><span className="pulse-dot" /> A judgment-free place to start</p><h1>Care begins<br /><span>with you.</span></h1><p>You deserve care, respect, and support. We are here to help you take the next step at your own pace.</p></div>
        <div className="auth-stamp">Your health.<br /><strong>Your pace.</strong></div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel-top"><span>WELCOME</span><span>01 / 01</span></div>
        <div key={mode} className="auth-form-wrap route-transition">
          <div className="auth-page-label"><span>{verificationEmail ? 'VERIFY EMAIL' : mode === 'login' ? 'LOG IN' : mode === 'register' ? 'SIGN UP' : 'PASSWORD RECOVERY'}</span><span>01 / 01</span></div>
          <h2>{emailVerificationStatus ? emailVerificationStatus === 'sent' ? <>Your email<br /><i>is verified.</i></> : <>Check your<br /><i>email.</i></> : mode === 'forgot-sent' ? <>Check your<br /><i>email.</i></> : mode === 'reset' ? <>Choose a new<br /><i>password.</i></> : mode === 'reset-complete' ? <>Password<br /><i>updated.</i></> : mode === 'forgot' ? <>Reset your<br /><i>password.</i></> : mode === 'login' ? <>Good to<br /><i>see you.</i></> : <>Make space<br /><i>for care.</i></>}</h2>
          <p className="auth-intro">{emailVerificationStatus === 'sent' ? 'Your account is ready. Sign in with the UIC we emailed you and your password.' : emailVerificationStatus === 'processing' ? 'We are confirming your email address and sending your UIC.' : emailVerificationStatus === 'failed' ? 'Your email could not be fully confirmed or your UIC email could not be delivered. You can retry while this page is open.' : emailVerificationStatus === 'pending' ? `We sent a verification link to ${verificationEmail}. Verify your address to receive your UIC by email, then sign in.` : mode === 'forgot' ? 'Enter the email address associated with your account. We will send a secure password reset link if it matches an active account.' : mode === 'forgot-sent' ? `If an active account exists for ${resetEmail}, a password reset link has been sent.` : mode === 'reset' ? 'Create a new password to secure your account. Use at least 12 characters.' : mode === 'reset-complete' ? 'Your password has been changed. You can now log in with your new password.' : mode === 'login' ? (role === 'patient' ? 'Patients sign in with their Unique Identifier Code (UIC) and password. Administrators and health workers sign in with their email address and password.' : 'Administrators and health workers sign in with their registered email address and password.') : 'Create an account to save resources and connect with support. Your UIC will be generated from your first and last initials, birth order, and date of birth.'}</p>
          {emailVerificationStatus ? <div className="verification-prompt">
            {verificationEmail && <p className="verification-address">{verificationEmail}</p>}
            {verificationMessage && <p className="verification-feedback" role="status">{verificationMessage}</p>}
            {emailVerificationStatus === 'pending' && <button className="primary-button" type="button" onClick={resendVerification} disabled={resendingVerification}>{resendingVerification ? 'Sending...' : 'Resend verification email'} <span>↗</span></button>}
            {emailVerificationStatus === 'failed' && verificationAccessToken && <button className="primary-button" type="button" onClick={resendUicEmail} disabled={resendingVerification}>{resendingVerification ? 'Sending...' : 'Retry UIC email'} <span>↗</span></button>}
            {emailVerificationStatus !== 'processing' && <button className="auth-switch" type="button" onClick={returnToSignIn}>Back to log in</button>}
          </div> : mode === 'forgot-sent' ? <div className="verification-prompt">
            {resetMessage && <p className="verification-feedback" role="status">{resetMessage}</p>}
            <button className="primary-button" type="button" onClick={returnToSignIn}>Back to log in <span>↗</span></button>
          </div> : mode === 'reset-complete' ? <div className="verification-prompt">
            <p className="verification-feedback" role="status">Your password is ready. For your security, log in again with the new password.</p>
            <button className="primary-button" type="button" onClick={returnToSignIn}>Log in <span>↗</span></button>
          </div> : <>
          <form key={mode} className={`auth-form ${mode === 'register' ? 'registration-form' : ''}`} onSubmit={handleSubmit} autoComplete="off">
            {mode === 'register' && <div className="field-row registration-name-row"><label>First Name<input name="firstName" required type="text" autoComplete="given-name" placeholder="First name" /></label><label>Middle Name<input name="middleName" required type="text" autoComplete="additional-name" placeholder="Middle name" /></label><label>Last Name<input name="lastName" required type="text" autoComplete="family-name" placeholder="Last name" /></label></div>}
            {mode === 'login' && <label>Account type<select name="role" value={role} onChange={(event) => setRole(event.target.value)} required><option value="patient">Patient / User</option><option value="health-worker">Health Worker</option><option value="admin">Admin</option></select></label>}
            {mode === 'login' && role === 'patient' && <label>UIC (Unique Identifier Code)<input name="uic" required type="text" autoComplete="username" placeholder="e.g. AR-01-20000101-123" /></label>}
            {mode === 'login' && role !== 'patient' && <label>Email Address<input name="email" required type="email" autoComplete="username" placeholder="you@example.com" /></label>}
            {mode !== 'reset' && mode !== 'login' && <label>Email Address<input name="email" required type="email" autoComplete="email" defaultValue={mode === 'forgot' ? resetEmail : ''} placeholder="you@example.com" /></label>}
            {mode === 'register' && <div className="field-row"><label>Age<input name="age" required type="number" min="13" max="120" placeholder="Age" /></label><label>Date of Birth<input name="dateOfBirth" required type="date" /></label></div>}
            {mode === 'register' && <label>Birth order in family<input name="birthOrder" required type="number" min="1" max="50" placeholder="e.g. 1" /></label>}
            {mode === 'register' && <label>Gender<select name="gender" defaultValue="" required><option value="" disabled>Select an option</option><option>Male</option><option>Female</option><option>Lesbian, Gay, Bisexual, and Transgender</option><option>Prefer not to say</option></select></label>}
            {(mode === 'login' || mode === 'register') && <PasswordField id="auth-password" label="Password" name="password" required minLength={mode === 'register' ? 12 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" />}
            {(mode === 'reset' || mode === 'register') && <PasswordField id="auth-confirm-password" label={mode === 'reset' ? 'New Password' : 'Confirm Password'} name={mode === 'reset' ? 'password' : 'confirmPassword'} required minLength={12} autoComplete="new-password" placeholder={mode === 'reset' ? 'Create a new password' : 'Re-enter your password'} />}
            {mode === 'reset' && <PasswordField id="auth-confirm-new-password" label="Confirm New Password" name="confirmPassword" required minLength={12} autoComplete="new-password" placeholder="Re-enter your new password" />}
            {mode === 'register' && <label>Contact Number <span className="optional">(optional)</span><input name="contactNumber" type="tel" autoComplete="off" placeholder="Your contact number" /></label>}
            {mode === 'register' && <label className="consent"><input name="terms" required type="checkbox" /><span>I agree to the <button type="button" className="legal-link" onClick={() => setLegalDocument('terms')}>Terms of Use</button> and have read the <button type="button" className="legal-link" onClick={() => setLegalDocument('privacy')}>Privacy Notice</button>.</span></label>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log in' : mode === 'register' ? 'Create my account' : mode === 'forgot' ? 'Send reset link' : 'Save new password'} <span>↗</span></button>
          </form>
          {mode === 'login' && <button className="forgot-link" type="button" onClick={() => { setError(''); setResetMessage(''); setMode('forgot'); }}>Forgot your password?</button>}
          {recoveryMode ? <button className="auth-switch" type="button" onClick={returnToSignIn}>Back to log in <span>↗</span></button> : <>
            <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setRole('patient'); setError(''); }}>{mode === 'login' ? 'New here? Sign up' : 'Already have an account? Log in'} <span>↗</span></button>
            <div className="guest-divider"><span>or</span></div>
            <button className="guest-button" type="button" onClick={() => onEnter('patient', true)}>Continue as guest <span>→</span></button>
            <p className="privacy-note">Your information is treated with care and never shared without your permission.</p>
          </>} </>}
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
            <p><strong>Availability and changes.</strong> Features may change or be unavailable. Information on the site may not always reflect current clinic schedules or local guidance; confirm these directly with a health professional or facility.</p>
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

function ServicesAvailedView({ servicesAvailed, emptyMessage = 'No services availed yet.', includeMedications = false }) {
  const [filterCategory, setFilterCategory] = useState('all');

  const allServices = (servicesAvailed?.servicesList || []).filter((service) => includeMedications || !service.category.includes('Medication'));
  const appointmentsCount = servicesAvailed?.appointments?.length || 0;
  const chatsCount = servicesAvailed?.chatSessions?.length || 0;
  const groupsCount = servicesAvailed?.supportGroups?.length || 0;
  const totalCount = allServices.length;

  const filtered = filterCategory === 'all'
    ? allServices
    : allServices.filter((s) => {
        if (filterCategory === 'appointments') return s.category.includes('Appointment');
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
  const [appointmentActionError, setAppointmentActionError] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  const activeUserId = currentUser?.user_id;
  const activeUser = (activeUserId ? db.findById('Users', activeUserId) : null) || currentUser || { full_name: 'Your Account', email: '', contact_number: '' };
  const patientRecord = (activeUserId ? db.getTable('Patients').find((p) => p.user_id === activeUserId) : null) || currentPatient || db.getTable('Patients')[0] || { patient_id: null, user_id: activeUserId };
  const activePatientId = patientRecord.patient_id;

  const appointments = activePatientId ? db.getTable('Appointments')
    .filter((appointment) => Number(appointment.patient_id) === Number(activePatientId))
    .sort((a, b) => String(a.appointment_date || '').localeCompare(String(b.appointment_date || '')) || timeToMinutes(a.appointment_time) - timeToMinutes(b.appointment_time)) : [];
  const upcomingAppointment = appointments.find((appointment) => (
    !['cancelled', 'completed'].includes(String(appointment.status || '').toLowerCase())
    && String(appointment.appointment_date || '') >= localDateValue()
  ));
  const activeFacilities = db.getTable('TestingFacilities').filter((facility) => facility.is_active !== false);
  const chats = activePatientId ? db.getTable('ChatSessions').filter((c) => c.patient_id === activePatientId) : [];
  const activeSupportGroup = db.getTable('SupportGroups').find((group) => group.is_active) || null;
  const supportGroupMembership = activeSupportGroup
    ? db.getTable('SupportGroupMembers').find((membership) => Number(membership.group_id) === Number(activeSupportGroup.group_id)
      && (db.useApi || Number(membership.patient_id) === Number(activePatientId))) || null
    : null;
  const supportGroupMessages = activeSupportGroup
    ? db.getTable('SupportGroupMessages').filter((message) => Number(message.group_id) === Number(activeSupportGroup.group_id))
    : [];
  const joinedGroups = supportGroupMembership ? [supportGroupMembership] : [];

  const navigate = (nextPage) => {
    setPage(nextPage);
    setEditing(null);
    scrollPageToTop();
  };

  const handleSaveForm = async (record) => {
    let result;
    if (record.type === 'profile') {
      if (!activeUser.user_id) return { error: 'Your account could not be identified.' };
      result = await db.update('Users', activeUser.user_id, {
        full_name: record.name,
        email: record.email,
        contact_number: record.phone,
        gender: record.gender,
      });
    } else if (record.type === 'appointment') {
      if (!activePatientId) return { error: 'Your patient record could not be identified. Please sign in again.' };
      const appointmentFields = {
        facility_id: Number(record.facilityId),
        appointment_date: record.date,
        appointment_time: record.time,
        appointment_type: record.appointmentType,
        notes: record.notes || '',
        status: 'Requested',
      };
      result = record.appointment_id || record.id
        ? await db.update('Appointments', record.appointment_id || record.id, appointmentFields)
        : await db.bookAppointment({ patient_id: activePatientId, worker_id: null, ...appointmentFields });
    }
    if (result?.error) return result;
    if (!result) return { error: 'The change could not be saved. Please try again.' };
    if (record.type !== 'appointment') setEditing(null);
    return result;
  };

  const cancelAppointmentRequest = async (appointmentId) => {
    setAppointmentActionError('');
    const result = await db.update('Appointments', appointmentId, { status: 'Cancelled' });
    if (result?.error) setAppointmentActionError(result.error);
  };

  const servicesAvailed = db.getUserServicesAvailed(activeUserId || activePatientId);
  const patientServicesCount = (servicesAvailed.servicesList || []).filter((service) => !service.category.includes('Medication')).length;

  const isTestingEnabled = db.getTable('PlatformServices').find((s) => s.service_key === 'testing_referrals')?.is_enabled ?? true;
  const isTreatmentEnabled = db.getTable('PlatformServices').find((s) => s.service_key === 'treatment_referrals')?.is_enabled ?? true;
  const content = {
    home: <section className="patient-public-home"><p className="eyebrow"><span className="pulse-dot" /> Welcome to HIVeLink</p><h1>Care and support,<br /><i>at your pace.</i></h1><p className="dashboard-intro">Your private space to find trusted HIV information, explore local care, request appointments, review services, and connect with support.</p><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Healthcare professional speaking with a patient" /><div className="guest-offerings-grid patient-home-offerings"><button type="button" onClick={() => navigate('information')}><span>LEARN</span><strong>Trusted information</strong><p>Read practical guides and watch educational videos.</p></button><button type="button" onClick={() => navigate('testing')}><span>FIND CARE</span><strong>Local services</strong><p>Review testing locations and treatment guidance.</p></button><button type="button" onClick={() => navigate('appointments')}><span>MANAGE CARE</span><strong>Appointments</strong><p>Send a request to the care team and track its status.</p></button><button type="button" onClick={() => navigate('chat')}><span>CONNECT</span><strong>Support</strong><p>Find private chat and community support options.</p></button></div></section>,
    care: <PagePanel eyebrow="Private care tools" title={<>Care, all in<br /><i>one place.</i></>}><div className="care-grid care-summary-grid"><PatientAction title="Appointments" text="Book and manage visits with your care team." action={() => navigate('appointments')} /><PatientAction title="Services availed" text="Review your booked appointments and care history." action={() => navigate('services')} /></div></PagePanel>,
    services: <PagePanel eyebrow="Your care history" title={<>Services<br /><i>availed.</i></>}><ServicesAvailedView servicesAvailed={servicesAvailed} emptyMessage="You have not availed any services yet. Request an appointment or contact your care team to get started." /></PagePanel>,
    information: <PagePanel eyebrow="HIV information" title={<>Care starts<br /><i>with clarity.</i></>}><KnowledgeInformationGrid /><div className="profile-card"><div><span>UIC (UNIQUE IDENTIFIER CODE)</span><strong>{activeUser.uic || 'Not available'}</strong></div><div><span>FULL NAME</span><strong>{activeUser.full_name}</strong></div><div><span>EMAIL ADDRESS</span><strong>{activeUser.email}</strong></div><div><span>CONTACT NUMBER</span><strong>{activeUser.contact_number || 'Not provided'}</strong></div><div><span>ACCOUNT STATUS</span><div><StatusBadge status={activeUser.is_active !== false ? 'Active' : 'Inactive'} /></div></div><div><span>CARE STATUS</span><div><StatusBadge status={patientRecord.care_status || 'Active care plan'} /></div></div><div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', gridColumn: '1 / -1' }}><button className="primary-button" onClick={() => setEditing({ type: 'profile', name: activeUser.full_name, email: activeUser.email, phone: activeUser.contact_number || '', gender: normalizeGender(activeUser.gender) })}>Edit profile <span>↗</span></button><button className="text-button" onClick={() => navigate('services')}>View availed services ↗</button></div></div></PagePanel>,
    testing: <PagePanel eyebrow="Find your next step" title={<>Testing and<br /><i>treatment.</i></>}><div className="patient-testing-intro"><p>Testing is confidential. Treatment is available, and early care makes a difference.</p><a className="text-button" href="https://www.google.com/maps/dir/?api=1&origin=12.39998%2C121.98136&destination=12.39459,121.98408" target="_blank" rel="noreferrer">Open in Google Maps ↗</a>{isTestingEnabled && <button className="primary-button" onClick={() => navigate('appointments')}>Request an appointment</button>}</div>{!isTestingEnabled && <p className="form-error" style={{ margin: '16px 0' }}>HIV testing referrals are currently offline.</p>}<div className="map-wrap patient-map"><FacilityMap /><p className="map-caption"><strong>Odiongan, Romblon</strong><span>OpenStreetMap with both facilities marked. Select a pin for its name.</span></p></div><div className="testing-notes patient-testing-notes"><div><span>01</span><h2>Where to begin</h2><p>Visit your local Rural Health Unit, municipal health office, or hospital and ask about confidential HIV testing.</p></div><div><span>02</span><h2>Where to get treated</h2><p>{isTreatmentEnabled ? 'Ask a health worker about referral to an HIV treatment hub, medicines, and follow-up care.' : 'Treatment referral service is currently offline.'}</p></div></div></PagePanel>,
    appointments: <PagePanel eyebrow="Care schedule" title={<>Appointment<br /><i>requests.</i></>}>
      <div className="appointment-page-intro">
        <p>Choose a clinic and send your preferred visit details. An administrator will review, confirm, cancel, or reschedule the request.</p>
        {!isTestingEnabled && <p className="form-error" role="status">Appointment requests are currently unavailable. Please contact your clinic directly.</p>}
        {isTestingEnabled && !activeFacilities.length && <p className="form-error" role="status">No active clinics are accepting appointment requests right now.</p>}
        {!activePatientId && <p className="form-error" role="status">Your patient record is unavailable. Please sign in again before requesting an appointment.</p>}
      </div>
      <button className="primary-button panel-action" type="button" disabled={!isTestingEnabled || !activePatientId || activeFacilities.length === 0} onClick={() => setEditing({ type: 'appointment', date: '', time: '', appointmentType: '', facilityId: '', notes: '', status: 'Requested' })}>Request an appointment <span>+</span></button>
      {appointmentActionError && <p className="form-error" role="alert">{appointmentActionError}</p>}
      <RecordList items={appointments} empty="No appointment requests yet." render={(item) => {
        const facility = activeFacilities.find((entry) => Number(entry.facility_id) === Number(item.facility_id)) || db.findById('TestingFacilities', Number(item.facility_id));
        const status = item.status || 'Requested';
        const canUpdateRequest = ['requested', 'rescheduled'].includes(String(status).toLowerCase());
        return <>
          <div className="appointment-record-details">
            <strong>{item.appointment_type || item.appointmentType}</strong>
            <span>{item.appointment_date || item.date} · {formatAppointmentTime(item.appointment_time || item.time)}</span>
            <span>{facility?.name || 'Clinic details unavailable'}{facility?.operating_hours ? ` · ${facility.operating_hours}` : ''}</span>
            {item.notes && <small>{item.notes}</small>}
          </div>
          <StatusBadge status={status} />
          {canUpdateRequest ? <AppointmentRequestActions onEdit={() => setEditing({ type: 'appointment', appointment_id: item.appointment_id || item.id, date: item.appointment_date || item.date, time: item.appointment_time || item.time, appointmentType: item.appointment_type || item.appointmentType, facilityId: item.facility_id, notes: item.notes || '', status })} onCancel={() => cancelAppointmentRequest(item.appointment_id || item.id)} /> : <span className="appointment-locked-note">Contact your health worker to update this appointment.</span>}
        </>;
      }} />
    </PagePanel>,
    chat: <PagePanel eyebrow="Confidential support" title={<>Private<br /><i>conversation.</i></>}><ChatMessenger patientId={activePatientId} userId={activeUser.user_id} ticket={chats[0] || null} onUpdate={(preview) => { if (chats[0]?.chat_session_id) { db.update('ChatSessions', chats[0].chat_session_id, { preview, last_updated: new Date().toISOString() }); } }} /></PagePanel>,
    support: <PagePanel eyebrow="Private community care" title={<>You belong<br /><i>here.</i></>}><PatientSupportGroupPanel group={activeSupportGroup} membership={supportGroupMembership} messages={supportGroupMessages} localMode={!db.useApi} onJoin={(alias) => db.joinSupportGroup({ patientId: activePatientId, alias })} onLeave={() => db.leaveSupportGroup({ patientId: activePatientId })} onSend={(messageText) => db.sendSupportGroupMessage({ patientId: activePatientId, messageText })} onRefresh={() => db.refreshSupportGroupState().catch(() => false)} /></PagePanel>,
    account: <PagePanel eyebrow="Your account" title={<>Your care<br /><i>dashboard.</i></>}><div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}><StatusBadge status={activeUser.is_active !== false ? 'Active' : 'Inactive'} label={`Account: ${activeUser.is_active !== false ? 'Active' : 'Inactive'}`} /><StatusBadge status={patientRecord.care_status || 'Active care plan'} label={`Care status: ${patientRecord.care_status || 'Active care plan'}`} /></div><div className="profile-card"><div><span>UIC (UNIQUE IDENTIFIER CODE)</span><strong>{activeUser.uic || 'Not available'}</strong></div><div><span>FULL NAME</span><strong>{activeUser.full_name}</strong></div><div><span>EMAIL ADDRESS</span><strong>{activeUser.email}</strong></div></div><div className="dashboard-tiles"><DashboardTile label="Services availed" value={`${patientServicesCount} total`} detail="Review your care history" /><DashboardTile label="Upcoming appointment" value={upcomingAppointment ? `${upcomingAppointment.appointment_date} · ${formatAppointmentTime(upcomingAppointment.appointment_time)}` : 'Nothing scheduled'} detail={upcomingAppointment?.appointment_type || 'Book your first visit'} /><DashboardTile label="Private chat notifications" value={`${chats.length || 1} open ${chats.length === 1 ? 'conversation' : 'conversations'}`} detail="View your support messages" /><DashboardTile label="Support groups joined" value={`${joinedGroups.length} groups`} detail="Find a community to join" /></div><h2 className="quick-heading">Quick actions</h2><div className="care-grid"><PatientAction title="View availed services" text="Check appointment and support statuses." action={() => navigate('services')} /><PatientAction title="Book appointment" text="Schedule a visit with the care team." action={() => navigate('appointments')} /><PatientAction title="Edit profile" text="Update your contact details and gender selection." action={() => setEditing({ type: 'profile', name: activeUser.full_name, email: activeUser.email, phone: activeUser.contact_number || '', gender: normalizeGender(activeUser.gender) })} /></div></PagePanel>,
  };

  if (['home', 'information', 'testing'].includes(page)) {
    return <GuestHub patientMode appointmentsEnabled={isTestingEnabled} initialPage={page} userCode={activeUser.uic} onExit={onSignOut} onPrivatePage={navigate} onAccount={() => navigate('account')} />;
  }

  return (
    <div className="patient-shell">
      <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
      <UserNavbar page={page} userCode={activeUser.uic} onNavigate={navigate} onSignOut={onSignOut} />
      <main key={page} className="patient-main route-transition">{content[page]}</main>
      <footer>
        <span className="footer-brand">HIVeLink</span>
        <button className="patient-public-link" onClick={onPublicHub}>Public awareness hub ↗</button>
        <button className="footer-back" onClick={() => navigate('home')}>Back to top ↑</button>
      </footer>
      {editing?.type === 'appointment' && <AppointmentRequestForm facilities={activeFacilities} initialValue={editing} userCode={activeUser.uic} serviceEnabled={isTestingEnabled} patientAvailable={Boolean(activePatientId)} onSubmit={handleSaveForm} onClose={() => setEditing(null)} />}
      {editing && editing.type !== 'appointment' && <PatientForm data={editing} onClose={() => setEditing(null)} onSave={handleSaveForm} />}
    </div>
  );
}

function PatientAction({ title, text, action }) { return <article className="dashboard-card"><span>+</span><h2>{title}</h2><p>{text}</p><button className="card-link" aria-label={`Open ${title}`} onClick={action}>Open <span>↗</span></button></article>; }

function ChatMessenger({ ticket, onUpdate, userId, patientId }) {
  const [, setDbVersion] = useState(0);
  const [draft, setDraft] = useState('');
  const isChatEnabled = db.getTable('PlatformServices').find((service) => service.service_key === 'chat_support')?.is_enabled ?? true;
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  const chatSessionId = ticket?.chat_session_id;
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
    .filter((m) => chatSessionId && m.chat_session_id === chatSessionId)
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

    const session = await db.ensurePatientChatSession(patientId, chatSessionId);
    if (session?.error) {
      setSendError(session.error);
      return;
    }
    const sessionId = Number(session?.chat_session_id);
    if (!Number.isSafeInteger(sessionId) || sessionId < 1) {
      setSendError('No chat session is assigned to this conversation.');
      return;
    }

    const result = await db.sendChatMessage({
      chat_session_id: sessionId,
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
      patientName: patientUser?.uic ? `UIC ${patientUser.uic}` : 'Patient UIC unavailable',
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

function AppointmentRequestActions({ onEdit, onCancel }) { return <div className="record-actions"><button type="button" onClick={onEdit}>Update request</button><button type="button" onClick={() => confirmDeleteAction('Cancel this appointment request? The clinic will no longer treat it as an active request.', onCancel)}>Cancel request</button></div>; }
function PatientForm({ data, onClose, onSave }) {
  const [record, setRecord] = useState(data);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const result = await onSave(record);
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      onClose();
    } catch (error) {
      setSaveError(error?.message || 'The change could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const fields = record.type === 'profile'
    ? [['name', 'Full name', 'text', 'Your full name'], ['email', 'Email address', 'email', 'you@example.com'], ['phone', 'Contact number', 'tel', 'Your contact number'], ['gender', 'Gender', 'select']]
    : record.type === 'worker-patient'
      ? (db.useApi ? [['detail', 'Care details', 'text', 'Care plan details'], ['hasDoctorsPrescription', 'Doctor’s prescription is on file', 'checkbox'], ['medicationRequestEligible', 'Eligible for medication requests', 'checkbox']] : [['name', 'Patient name', 'text', 'Patient full name'], ['detail', 'Care details', 'text', 'Care plan details'], ['hasDoctorsPrescription', 'Doctor’s prescription is on file', 'checkbox'], ['medicationRequestEligible', 'Eligible for medication requests', 'checkbox']])
      : [['subject', 'Subject', 'text', 'Subject'], ['preview', 'Message', 'text', 'Write a message...']];

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="patient-form" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close form">×</button>
        <p className="eyebrow">{record.id || record.appointment_id || record.request_id ? 'Edit record' : 'New record'}</p>
        <h2>{record.type === 'chat' ? 'Start private chat' : record.type === 'worker-patient' ? 'Patient details' : 'Edit profile'}</h2>
        <form onSubmit={handleSubmit}>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          {fields.map(([key, label, type = 'text', placeholder = '']) => (
            <label key={key}>
              {label}
              {type === 'textarea' ? <textarea rows="3" maxLength={500} value={record[key] || ''} placeholder={placeholder} onChange={(event) => setRecord({ ...record, [key]: event.target.value })} /> : type === 'select' ? <select required value={record[key] || ''} onChange={(event) => setRecord({ ...record, [key]: event.target.value })}>
                <option value="" disabled>Select an option</option>
                <option>Male</option>
                <option>Female</option>
                <option>Lesbian, Gay, Bisexual, and Transgender</option>
                <option>Prefer not to say</option>
              </select> : <input
                required={type !== 'checkbox' && !['phone', 'notes', 'isRefill'].includes(key)}
                type={type}
                min={key === 'quantity' ? 1 : undefined}
                max={key === 'quantity' ? 1000 : undefined}
                step={key === 'quantity' ? 1 : undefined}
                maxLength={type === 'text' ? 150 : undefined}
                checked={type === 'checkbox' ? Boolean(record[key]) : undefined}
                disabled={key === 'medicationRequestEligible' && !record.hasDoctorsPrescription}
                value={type === 'checkbox' ? undefined : (record[key] ?? '')}
                placeholder={placeholder}
                onChange={(event) => {
                  if (type !== 'checkbox') {
                    setRecord({ ...record, [key]: event.target.value });
                    return;
                  }
                  const checked = event.target.checked;
                  setRecord({
                    ...record,
                    [key]: checked,
                    ...(key === 'hasDoctorsPrescription' && !checked ? { medicationRequestEligible: false } : {}),
                  });
                }}
              />}
            </label>
          ))}
          <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : (record.type === 'medication' ? 'Submit' : 'Save record')} <span>↗</span></button>
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
          <ServicesAvailedView servicesAvailed={servicesAvailed} emptyMessage="This user has not availed any platform services yet." includeMedications />
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
              <div className="admin-detail-item"><span className="admin-detail-label">Gender</span><strong className="admin-detail-value">{worker.gender}</strong></div>
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
    firstName: '',
    middleName: '',
    lastName: '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    contactNumber: user?.contactNumber || user?.phone || user?.contact_number || '',
    age: user?.age || '',
    dateOfBirth: user?.dateOfBirth || user?.date_of_birth || '',
    birthOrder: user?.birthOrder || user?.birth_order || '',
    gender: normalizeGender(user?.gender) || 'Female',
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
    return {
      id: w.worker_id,
      name: u?.full_name || `Worker #${w.worker_id}`,
      eligible: Boolean(w.is_verified) && Boolean(w.is_available) && u?.is_active !== false && u?.email_verified !== false,
    };
  }).filter((worker) => worker.eligible || Number(worker.id) === Number(formData.assignedWorkerId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    let fullName = formData.fullName.trim();
    if (!isEdit) {
      const nameParts = [formData.firstName, formData.middleName, formData.lastName].map((part) => part.trim());
      if (nameParts.some((part) => !part)) {
        setError('First, middle, and last names are required.');
        return;
      }
      fullName = composeFullName(...nameParts);
      if (fullName.length > 150) {
        setError('The full name must be 150 characters or fewer.');
        return;
      }
      if (formData.password.length < 12) {
        setError('Password must be at least 12 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please check them and try again.');
        return;
      }
    } else if (!fullName) {
      setError('Please provide a full name.');
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
      const pending = db.adminCreateUser({ ...formData, fullName });
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
          {isEdit ? <label>Full Name
            <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full name" />
          </label> : <div className="field-row registration-name-row admin-registration-name-row">
            <label>First Name<input required type="text" autoComplete="given-name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="First name" /></label>
            <label>Middle Name<input required type="text" autoComplete="additional-name" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} placeholder="Middle name" /></label>
            <label>Last Name<input required type="text" autoComplete="family-name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last name" /></label>
          </div>}
          <label>Email Address
            <input required type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@example.com" />
          </label>
          {!isEdit && <>
            <PasswordField id="admin-user-password" label="Password" required minLength={12} autoComplete="new-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Create password" />
            <PasswordField id="admin-user-confirm-password" label="Confirm Password" required minLength={12} autoComplete="new-password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Re-enter password" />
          </>}
          <div className="field-row">
            <label>Age
              <input type="number" min="13" max="120" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Age" />
            </label>
            <label>Date of Birth
              <input required={!isEdit} type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
            </label>
          </div>
          {!isEdit && <label>Birth order in family
            <input required type="number" min="1" max="50" value={formData.birthOrder} onChange={(e) => setFormData({ ...formData, birthOrder: e.target.value })} placeholder="e.g. 1" />
          </label>}
          <div className="field-row">
            <label>Gender
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option>Male</option>
                <option>Female</option>
                <option>Lesbian, Gay, Bisexual, and Transgender</option>
                <option>Prefer not to say</option>
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
    firstName: '',
    middleName: '',
    lastName: '',
    email: worker?.email || '',
    password: '',
    confirmPassword: '',
    gender: ['Male', 'Female'].includes(normalizeGender(worker?.gender)) ? normalizeGender(worker?.gender) : '',
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
    if (!formData.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    let fullName = formData.fullName.trim();
    if (!isEdit) {
      const nameParts = [formData.firstName, formData.middleName, formData.lastName].map((part) => part.trim());
      if (nameParts.some((part) => !part)) {
        setError('First, middle, and last names are required.');
        return;
      }
      fullName = composeFullName(...nameParts);
      if (fullName.length > 150) {
        setError('The full name must be 150 characters or fewer.');
        return;
      }
      if (formData.password.length < 12) {
        setError('Password must be at least 12 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please check them and try again.');
        return;
      }
    } else if (!fullName) {
      setError('Please provide a full name.');
      return;
    }

    const payload = {
      ...formData,
      fullName,
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
          {isEdit ? <label>Full Name
            <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full name" />
          </label> : <div className="field-row registration-name-row admin-registration-name-row">
            <label>First Name<input required type="text" autoComplete="given-name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="First name" /></label>
            <label>Middle Name<input required type="text" autoComplete="additional-name" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} placeholder="Middle name" /></label>
            <label>Last Name<input required type="text" autoComplete="family-name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last name" /></label>
          </div>}
          <label>Email Address
            <input required type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="worker@risinghiv.org" />
          </label>
          {!isEdit && <label>Gender
            <select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
              <option value="">Select an option</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </label>}
          {!isEdit && <>
            <PasswordField id="admin-worker-password" label="Password" required minLength={12} autoComplete="new-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Create password" />
            <PasswordField id="admin-worker-confirm-password" label="Confirm Password" required minLength={12} autoComplete="new-password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Re-enter password" />
          </>}
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
  const [claimablePatients, setClaimablePatients] = useState([]);
  const [assignmentNotice, setAssignmentNotice] = useState('');

  useEffect(() => {
    return db.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  const workerUser = currentUser || { full_name: 'Health Worker' };
  const profileName = workerUser.full_name || 'Health Worker';
  const workerRecord = currentWorker || db.getTable('HealthWorkers').find((w) => w.user_id === currentUser?.user_id) || db.getTable('HealthWorkers')[0] || { worker_id: 1, is_available: true, specialty: 'HIV care support' };

  const allPatients = db.getUsersListDetailed();
  const workerPatients = allPatients.filter((patient) => Number(patient.assignedWorkerId) === Number(workerRecord.worker_id));
  const assignedPatientIds = new Set(workerPatients.map((patient) => Number(patient.patientId)));

  useEffect(() => {
    if (page !== 'patientsChats') return undefined;
    let mounted = true;
    const loadClaimablePatients = () => {
      db.getClaimablePatients(workerRecord.worker_id).then((patients) => {
        if (mounted) setClaimablePatients(patients);
      });
    };
    loadClaimablePatients();
    const unsubscribe = db.subscribe(loadClaimablePatients);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [page, workerRecord.worker_id]);

  const requests = db.getTable('MedicationRequests')
    .filter((request) => assignedPatientIds.has(Number(request.patient_id)))
    .map((r) => {
      const p = db.findById('Patients', r.patient_id);
      const u = p ? db.findById('Users', p.user_id) : null;
      return {
        id: r.request_id,
        patient: u?.uic || 'Patient UIC unavailable',
        medication: r.medication_name,
        status: r.status,
        dosage: r.dosage,
        schedule: r.schedule,
        quantity: r.quantity_requested,
        isRefill: r.is_refill,
        notes: r.patient_notes,
      };
    });

  const appointments = db.getTable('Appointments')
    .filter((appointment) => assignedPatientIds.has(Number(appointment.patient_id)))
    .map((a) => {
      const p = db.findById('Patients', a.patient_id);
      const u = p ? db.findById('Users', p.user_id) : null;
      const facility = a.facility_id ? db.findById('TestingFacilities', a.facility_id) : null;
      return {
        id: a.appointment_id,
        patient: u?.uic || 'Patient UIC unavailable',
        date: a.appointment_date,
        time: a.appointment_time,
        type: a.appointment_type,
        notes: a.notes || '',
        facilityName: facility?.name || 'Local Health Facility',
        status: a.status || 'Requested',
      };
    });

  const supportGroup = db.getTable('SupportGroups').find((group) => group.is_active) || null;
  const supportGroupMessages = supportGroup
    ? db.getTable('SupportGroupMessages').filter((message) => Number(message.group_id) === Number(supportGroup.group_id))
    : [];

  const navigate = (nextPage) => { setPage(nextPage); scrollPageToTop(); };
  const updateRequest = async (id, status) => {
    const result = await db.update('MedicationRequests', id, { status });
    if (result?.error || db.useApi) return result;
    db.insert('ActivityLogs', {
      actor_user_id: workerUser.user_id || null,
      actor_name: workerUser.uic || 'Health Worker',
      action: `Updated medication request: ${status}`,
      category: 'Medication Requests',
      details: `Medication request #${id} status changed to ${status}.`,
    });
    return result;
  };
  const savePatient = async (patient) => {
    if (patient.id || patient.patient_id || patient.userId) {
      const pid = patient.patient_id || patient.id;
      const hasDoctorsPrescription = Boolean(patient.hasDoctorsPrescription);
      const result = await db.update('Patients', pid, {
        care_status: patient.status || patient.careStatus || 'Stable',
        medical_notes: patient.detail || patient.medicalNotes,
        has_doctors_prescription: hasDoctorsPrescription,
        medication_request_eligible: hasDoctorsPrescription && Boolean(patient.medicationRequestEligible),
      });
      if (result?.error) return result;
      if (!db.useApi && (patient.user_id || patient.userId)) db.update('Users', patient.user_id || patient.userId, { full_name: patient.name || patient.fullName });
    } else if (!db.useApi) {
      db.adminCreateUser({ fullName: patient.name || 'New Patient', email: `patient.${Date.now()}@example.com`, careStatus: patient.status || 'Active care plan' });
    }
    setPatientEditor(null);
  };

  const claimPatient = async (patient) => {
    setAssignmentNotice('');
    const result = await db.claimPatient(patient.patient_id || patient.patientId, workerRecord.worker_id);
    if (result?.error) {
      setAssignmentNotice(result.error);
      return;
    }
    setAssignmentNotice(`Patient UIC ${patient.uic || 'unavailable'} is now assigned to you.`);
  };

  const toggleAvailability = () => {
    if (workerRecord.worker_id) {
      db.update('HealthWorkers', workerRecord.worker_id, { is_available: !workerRecord.is_available });
    }
  };

  const latestMessage = db.getTable('ChatMessages').filter((m) => m.sender_role === 'patient').at(-1)?.message_text || '';

  const content = {
    overview: <><p className="eyebrow"><span className="pulse-dot" /> Health worker overview</p><h1>Care that<br /><i>connects.</i></h1><p className="dashboard-intro">Support patients with trusted information, treatment follow-up, and compassionate care.</p><div className="dashboard-tiles worker-tiles"><DashboardTile label="Patients needing care" value={`${workerPatients.length} active`} detail="View patient support" /><DashboardTile label="Medication requests" value={`${requests.filter((r) => r.status === 'Pending').length} pending`} detail="Review requests" /><DashboardTile label="Today’s appointments" value={`${appointments.length} scheduled`} detail="Open schedule" /><DashboardTile label="Support group" value={supportGroup ? '1 configured' : 'Unavailable'} detail="Supervise the group chat" /></div><h2 className="quick-heading">Quick actions</h2><div className="care-grid"><PatientAction title="Open patient chats" text="Respond to confidential patient questions." action={() => navigate('chat')} /><PatientAction title="Review medication" text="Process medication requests and updates." action={() => navigate('medications')} /><PatientAction title="Manage appointments" text="Confirm and organize patient visits." action={() => navigate('appointments')} /></div></>,
    chat: <PagePanel eyebrow="Private patient support" title={<>Conversation<br /><i>inbox.</i></>}><HealthWorkerChatInbox userId={workerUser.user_id} /></PagePanel>,
    patientsChats: <PagePanel eyebrow="Patient care and private support" title={<>Patients and<br /><i>chats.</i></>}>
      {assignmentNotice && <p className="form-status" role="status">{assignmentNotice}</p>}
      {claimablePatients.length > 0 && <section className="claimable-patients" aria-labelledby="claimable-heading"><div className="claimable-heading"><div><p className="eyebrow">Matching facility</p><h2 id="claimable-heading">Available patients</h2></div><span>{claimablePatients.length} unassigned</span></div><div className="worker-list">{claimablePatients.map((patient) => <article key={patient.patient_id}><div><strong>UIC {patient.uic || 'Unavailable'}</strong><span>{patient.care_status || 'Active care plan'}</span></div><button className="admin-btn admin-btn-primary" type="button" onClick={() => claimPatient(patient)}>Assign to me</button></article>)}</div></section>}
      <h2 className="quick-heading">Assigned patients</h2><div className="worker-list">{workerPatients.map((patient) => <article key={patient.userId || patient.id}><div><strong>UIC {patient.uic || 'Unavailable'}</strong><span>{patient.medicalNotes || patient.detail}{patient.userId === 1 && latestMessage ? ` · “${latestMessage}”` : ''} · <strong style={{ color: 'var(--coral)', fontWeight: 400 }}>{patient.servicesAvailedCount || 0} services availed</strong></span><span>Doctor’s prescription: {patient.hasDoctorsPrescription ? 'On file' : 'Not recorded'} · Medication request eligibility: {patient.medicationRequestEligible ? 'Eligible' : 'Not eligible'}</span></div><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><StatusBadge status={patient.careStatus || patient.status} /><StatusBadge status={patient.accountStatus || 'Active'} /></div><div className="worker-actions"><button type="button" className="card-link" onClick={() => setInspectingUser(patient)}>View Services ↗</button><button className="card-link" onClick={() => setPatientEditor({ type: 'worker-patient', ...patient, id: patient.patientId, user_id: patient.userId, name: patient.uic })}>Edit Care Plan</button></div></article>)}</div>{!workerPatients.length && <p className="empty-records">No patients are currently assigned to you.</p>}</PagePanel>,
    medications: <PagePanel eyebrow="Treatment support" title={<>Medication<br /><i>requests.</i></>}><div className="worker-list">{requests.map((request) => <article key={request.id}><div><strong>{request.medication}</strong><span>Requested by {request.patient} · {request.dosage} · {request.schedule} · Quantity: {request.quantity ?? 30}{request.isRefill ? ' · Refill' : ''}</span>{request.notes && <span>Patient note: {request.notes}</span>}</div><StatusBadge status={request.status} /><div className="worker-actions"><button className="card-link" onClick={() => updateRequest(request.id, 'Approved')}>Approve</button><button className="card-link" onClick={() => updateRequest(request.id, 'Needs information')}>Request info</button></div></article>)}</div>{!requests.length && <p className="empty-records">Medication requests from your assigned patients will appear here. Assign the patient to your care team to review their request.</p>}</PagePanel>,
    appointments: <PagePanel eyebrow="Care schedule" title={<>Manage<br /><i>appointments.</i></>}><div className="worker-list">{appointments.map((appointment) => {
          const status = String(appointment.status || 'Requested');
          return <article key={appointment.id}><div><strong>UIC {appointment.patient}</strong><span>{appointment.date} · {formatAppointmentTime(appointment.time)} · {appointment.type} ({appointment.facilityName})</span>{appointment.notes && <small className="appointment-worker-note">Patient note: {appointment.notes}</small>}</div><StatusBadge status={status} /><span className="appointment-locked-note">Appointment requests are processed by an administrator.</span></article>;
        })}</div>{!appointments.length && <p className="empty-records">No appointment requests are waiting for your review.</p>}</PagePanel>,
    groups: <PagePanel eyebrow="Supervised community care" title={<>One support<br /><i>group.</i></>}><SupervisorSupportGroupPanel group={supportGroup} messages={supportGroupMessages} localMode={!db.useApi} onSend={(messageText) => db.sendSupportGroupMessage({ patientId: workerUser.user_id, messageText, isSupervisor: true })} onRedact={(messageId) => db.redactSupportGroupMessage(messageId)} onRefresh={() => db.refreshSupportGroupState().catch(() => false)} /></PagePanel>,
  };

  return (
    <div className="patient-shell">
      <div className="topline"><span>WORLD AIDS DAY IS EVERY DAY</span><span className="topline-detail">Information. Care. Community.</span></div>
      <header className="site-header user-header patient-header">
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
  const [appointmentNotice, setAppointmentNotice] = useState('');
  const [appointmentWorkerSelection, setAppointmentWorkerSelection] = useState({});

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
    actor: db.findById('Users', l.actor_user_id)?.uic || l.actor_name,
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
  const updateAppointmentStatus = async (appointmentId, status) => {
    setAppointmentNotice('');
    try {
      const result = await db.update('Appointments', appointmentId, { status });
      if (result?.error) setAppointmentNotice(result.error);
      else if (!result) setAppointmentNotice('The appointment could not be updated. Please try again.');
    } catch (error) {
      setAppointmentNotice(error.message || 'The appointment could not be updated. Please try again.');
    }
  };
  const assignAndApproveAppointment = async (appointmentId) => {
    setAppointmentNotice('');
    const workerId = appointmentWorkerSelection[appointmentId];
    if (!workerId) {
      setAppointmentNotice('Select an available health worker before approving this request.');
      return;
    }
    const result = await db.assignAppointment(appointmentId, workerId);
    if (result?.error) setAppointmentNotice(result.error);
    else setAppointmentWorkerSelection((selections) => ({ ...selections, [appointmentId]: '' }));
  };
  const openAppointmentReschedule = (appointment) => setActiveModal({
    type: 'reschedule-appointment',
    appointment: {
      type: 'appointment',
      appointment_id: appointment.appointment_id || appointment.id,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      appointmentType: appointment.appointment_type,
      facilityId: appointment.facility_id,
      notes: appointment.notes || '',
    },
    uic: appointment.uic,
  });

  const appointmentsCount = db.getTable('Appointments').length;
  const activeAppointmentFacilities = db.getTable('TestingFacilities').filter((facility) => facility.is_active !== false);
  const adminAppointments = db.getTable('Appointments').map((appointment) => {
    const patient = db.getTable('Patients').find((entry) => Number(entry.patient_id) === Number(appointment.patient_id));
    const patientUser = patient ? db.findById('Users', patient.user_id) : null;
    const facility = db.findById('TestingFacilities', Number(appointment.facility_id));
    return {
      ...appointment,
      uic: patientUser?.uic || 'Unavailable',
      facilityName: facility?.name || 'Clinic details unavailable',
    };
  }).sort((left, right) => String(left.appointment_date || '').localeCompare(String(right.appointment_date || '')));
  const openChatsCount = db.getTable('ChatSessions').filter((c) => c.status === 'Open').length;
  const activeSupportGroup = db.getTable('SupportGroups').find((group) => group.is_active) || null;
  const eligibleSupportGroupWorkers = detailedWorkers.filter((worker) => worker.isVerified && worker.isAvailable && worker.emailVerified && worker.accountStatus === 'Active');

  const filteredUsers = detailedUsers.filter((u) => {
    const matchesSearch = !userSearch.trim() || u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.uic || '').toLowerCase().includes(userSearch.toLowerCase());
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
    appointments: (
      <PagePanel eyebrow="Administrator queue" title={<>Appointment<br /><i>requests.</i></>}>
        <p>Review patient requests by UIC. Confirm, cancel, or change the requested date and time.</p>
        {appointmentNotice && <p className="form-error" role="alert">{appointmentNotice}</p>}
        <div className="worker-list">
          {adminAppointments.map((appointment) => {
            const status = String(appointment.status || 'Requested');
            const isClosed = ['completed', 'cancelled'].includes(status.toLowerCase());
            const isConfirmed = status.toLowerCase() === 'confirmed';
            const appointmentId = appointment.appointment_id || appointment.id;
            const availableWorkers = db.getAvailableWorkersForAppointment(appointmentId);
            return (
              <article key={appointmentId}>
                <div>
                  <strong>UIC {appointment.uic}</strong>
                  <span>{appointment.appointment_date} · {formatAppointmentTime(appointment.appointment_time)} · {appointment.appointment_type} ({appointment.facilityName})</span>
                  {appointment.worker_id && <small className="appointment-worker-note">Assigned health worker: {db.findById('Users', db.findById('HealthWorkers', appointment.worker_id)?.user_id)?.full_name || 'Unavailable'}</small>}
                  {appointment.notes && <small className="appointment-worker-note">Patient note: {appointment.notes}</small>}
                </div>
                <StatusBadge status={status} />
                {!isClosed && (
                  <div className="worker-actions">
                    {!isConfirmed && (
                      <>
                        <select
                          className="admin-filter-select"
                          aria-label={`Health worker for appointment ${appointmentId}`}
                          value={appointmentWorkerSelection[appointmentId] || ''}
                          onChange={(event) => setAppointmentWorkerSelection((selections) => ({ ...selections, [appointmentId]: event.target.value }))}
                        >
                          <option value="">Select available health worker</option>
                          {availableWorkers.map((worker) => <option key={worker.workerId} value={worker.workerId}>{worker.fullName}</option>)}
                        </select>
                        <button type="button" className="card-link" disabled={!availableWorkers.length} onClick={() => assignAndApproveAppointment(appointmentId)}>Approve &amp; assign</button>
                        {!availableWorkers.length && <small>No verified, available health worker has an open slot at this clinic and time.</small>}
                      </>
                    )}
                    {isConfirmed && <button type="button" className="card-link" onClick={() => updateAppointmentStatus(appointmentId, 'Completed')}>Mark completed</button>}
                    <button type="button" className="card-link" onClick={() => openAppointmentReschedule(appointment)}>Reschedule</button>
                    <button type="button" className="card-link" onClick={() => updateAppointmentStatus(appointmentId, 'Cancelled')}>Cancel</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {!adminAppointments.length && <p className="empty-records">No appointment requests have been submitted.</p>}
      </PagePanel>
    ),
    users: (
      <PagePanel eyebrow="Account management" title={<>Registered<br /><i>users.</i></>}>
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <input className="admin-search-input" type="search" placeholder="Search users by UIC or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
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
                    <span className="admin-entity-subtitle">UIC {user.uic || 'Unavailable'} · {user.email} · {user.contactNumber}</span>
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
    supportGroup: <PagePanel eyebrow="Community safety" title={<>Private group<br /><i>supervision.</i></>}><AdminSupportGroupSupervisor group={activeSupportGroup} eligibleWorkers={eligibleSupportGroupWorkers} allWorkers={detailedWorkers} onAssign={(workerId) => db.assignSupportGroupSupervisor(workerId)} /></PagePanel>,
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
      <header className="site-header user-header patient-header">
        <button className="brand brand-button" onClick={() => navigate('overview')} aria-label="HIVeLink home"><span>HIVeLink</span></button>
        <nav className="nav-links worker-nav" aria-label="Admin navigation">{[['overview', 'Overview'], ['users', 'Users'], ['appointments', 'Appointments'], ['workers', 'Health workers'], ['supportGroup', 'Support group'], ['services', 'Services'], ['logs', 'Activity logs'], ['reports', 'Reports'], ['settings', 'Settings']].map(([key, label]) => <button className={`guest-nav-link ${page === key ? 'active' : ''}`} key={key} onClick={() => navigate(key)}>{label}</button>)}</nav>
        <div className="patient-header-actions"><button className="sign-out-button" onClick={onSignOut}>Sign out</button></div>
      </header>
      <main key={page} className="patient-main route-transition">{content[page]}</main>
      <footer><span className="footer-brand">HIVeLink</span><button className="patient-public-link" onClick={onPublicHub}>Public awareness hub ↗</button><button className="footer-back" onClick={() => navigate('overview')}>Back to top ↑</button></footer>

      {activeModal?.type === 'view-user' && <AdminUserDetailModal user={activeModal.user} onClose={() => setActiveModal(null)} onEdit={(u) => setActiveModal({ type: 'edit-user', user: u })} onDelete={(id, name) => setActiveModal({ type: 'confirm-delete', title: 'Delete User Account', message: `Are you sure you want to delete ${name}?`, onConfirm: () => { removeUser(id); setActiveModal(null); } })} />}
      {activeModal?.type === 'reschedule-appointment' && <AppointmentRequestForm facilities={activeAppointmentFacilities} initialValue={activeModal.appointment} userCode={activeModal.uic} onSubmit={async (record) => {
        const result = await db.update('Appointments', record.appointment_id, {
          facility_id: Number(record.facilityId),
          appointment_date: record.date,
          appointment_time: record.time,
          appointment_type: record.appointmentType,
          notes: record.notes || '',
          worker_id: null,
          status: 'Rescheduled',
        });
        return result?.error ? result : result || { error: 'The appointment could not be rescheduled. Please try again.' };
      }} onClose={() => setActiveModal(null)} />}
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => isPasswordRecoveryRedirect());

  useEffect(() => {
    let mounted = true;
    if (db.useApi && !isPasswordRecovery) {
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
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (!db.useApi || !hasEntered || isGuest) return undefined;
    let mounted = true;
    let unsubscribe;
    subscribeToChatChanges((payload) => {
      const refresh = payload?.table === 'support_group_messages' ? db.refreshSupportGroupState() : db.refresh();
      refresh.catch((error) => console.error('Could not refresh chat data:', error.message));
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
        onPasswordRecoveryComplete={() => setIsPasswordRecovery(false)}
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
          <PromotionalMediaGallery />
        </section>

        <section className="community-section" id="community"><div className="community-quote"><span className="quote-mark">“</span><blockquote>You are more than<br />a diagnosis.</blockquote><p>Support starts with being seen, heard, and met with respect.</p></div><div className="community-panel"><p className="eyebrow">A private conversation</p><h2>Questions are<br /><i>welcome here.</i></h2><p>Our support team can help you sort through testing, treatment, prevention, or just a difficult day.</p><button className="primary-button light-button" onClick={openSupport}>Reach out <span>↗</span></button></div></section>
      </main>

      <footer><span className="footer-brand">HIVeLink</span><span>Made for more informed, connected lives.</span><a href="#top">Back to top ↑</a></footer>

      {showForm && <div className="modal-backdrop" role="presentation" onClick={() => setShowForm(false)}><div className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setShowForm(false)} aria-label="Close support form">×</button>{sent ? <div className="success-state"><span className="success-icon">✓</span><h2>We received your note.</h2><p>Someone from our support team will respond with care. You are not alone in this.</p><button className="primary-button" onClick={() => setShowForm(false)}>Done</button></div> : <><p className="eyebrow">Confidential support</p><h2 id="support-title">What is on<br /><i>your mind?</i></h2><p className="modal-intro">Leave a note and a trained support person will get back to you. No question is too small.</p><form onSubmit={handleSubmit}><label>Your first name<input required type="text" /></label><label>Your email<input required type="email" /></label><label>How can we help?<textarea required placeholder="Share only what feels comfortable." rows="3" /></label><button className="primary-button" type="submit">Send privately <span>↗</span></button></form></>}</div></div>}
    </div>
  );
}

export default App;
