const MAX_ALIAS_LENGTH = 24;
const MAX_MESSAGE_LENGTH = 2000;

function normalized(value) {
  return String(value || '').trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function validateDisplayAlias(value, { fullName = '', email = '' } = {}) {
  const alias = String(value || '').trim().replace(/\s+/g, ' ');
  const length = Array.from(alias).length;
  if (length < 3 || length > MAX_ALIAS_LENGTH) return { error: `Choose a display alias between 3 and ${MAX_ALIAS_LENGTH} characters.` };
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(alias) || /\+?\d[\d\s().-]{6,}\d/.test(alias)) {
    return { error: 'Do not use an email address or phone number as your display alias.' };
  }
  if (!/^[A-Za-z0-9_. -]+$/.test(alias)) return { error: 'Use only letters, numbers, spaces, periods, underscores, or hyphens in your alias.' };
  const safeAlias = normalized(alias);
  if (['healthworker', 'groupsupervisor', 'supervisor'].includes(safeAlias)) {
    return { error: 'Choose an alias that cannot be mistaken for the health-worker supervisor.' };
  }
  const accountNameParts = String(fullName || '').split(/[^\p{L}\p{N}]+/u).filter((part) => part.length >= 3);
  const emailName = String(email).split('@')[0];
  const privateIdentityParts = [fullName, email, emailName, ...accountNameParts];
  if (safeAlias && privateIdentityParts.some((identity) => safeAlias === normalized(identity))) {
    return { error: 'Choose an alias that is different from your account name and email.' };
  }
  return { alias };
}

function validateGroupMessage(value) {
  const messageText = String(value || '').trim();
  if (!messageText) return { error: 'Write a message before sending.' };
  if (Array.from(messageText).length > MAX_MESSAGE_LENGTH) return { error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
  return { messageText };
}

function isEligibleSupervisor(worker, user) {
  return Boolean(worker && user
    && worker.is_verified === true
    && worker.is_available === true
    && user.role === 'health-worker'
    && user.is_active === true
    && user.email_verified === true);
}

module.exports = {
  MAX_ALIAS_LENGTH,
  MAX_MESSAGE_LENGTH,
  isEligibleSupervisor,
  validateDisplayAlias,
  validateGroupMessage,
};
