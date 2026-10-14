const PATIENT_GENDER_OPTIONS = Object.freeze(['Male', 'Female', 'Other']);
const HEALTH_WORKER_GENDER_OPTIONS = Object.freeze(['Male', 'Female']);

function isAllowedGender(value, accountType = 'patient') {
  const options = accountType === 'health-worker' ? HEALTH_WORKER_GENDER_OPTIONS : PATIENT_GENDER_OPTIONS;
  return options.includes(value);
}

module.exports = { PATIENT_GENDER_OPTIONS, HEALTH_WORKER_GENDER_OPTIONS, isAllowedGender };
