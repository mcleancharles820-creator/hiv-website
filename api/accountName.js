function getFullNameFromParts(body = {}) {
  const nameParts = [body.firstName, body.middleName, body.lastName].map((part) => String(part || '').trim());
  if (nameParts.some((part) => !part)) return { error: 'First, middle, and last names are required.' };

  const fullName = nameParts.join(' ');
  if (fullName.length > 150) return { error: 'The full name must be 150 characters or fewer.' };
  return { fullName };
}

module.exports = getFullNameFromParts;
