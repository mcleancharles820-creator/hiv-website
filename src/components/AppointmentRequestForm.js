import { useState } from 'react';
import './AppointmentRequestForm.css';

const visitReasons = [
  'HIV testing',
  'HIV treatment consultation',
  'PrEP consultation',
  'Routine follow-up',
  'Other',
];

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeInputValue(value = '') {
  const time = String(value || '').trim();
  if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return time;
  const twelveHour = time.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (!twelveHour) return '';
  let hour = Number(twelveHour[1]) % 12;
  if (twelveHour[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${twelveHour[2]}`;
}

function makeInitialRequest(value = {}) {
  return {
    facilityId: String(value.facilityId ?? value.facility_id ?? ''),
    appointmentType: value.appointmentType || value.appointment_type || '',
    date: value.date || value.appointment_date || '',
    time: timeInputValue(value.time || value.appointment_time || ''),
    notes: value.notes || '',
  };
}

export default function AppointmentRequestForm({
  facilities = [],
  initialValue = {},
  serviceEnabled = true,
  patientAvailable = true,
  onSubmit,
  onClose,
}) {
  const [request, setRequest] = useState(() => makeInitialRequest(initialValue));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const minDate = localDateValue();
  const reasons = [...new Set([initialValue.appointmentType || initialValue.appointment_type, ...visitReasons].filter(Boolean))];
  const isEditing = Boolean(initialValue.appointment_id || initialValue.id);
  const unavailable = !serviceEnabled || !patientAvailable || facilities.length === 0;

  const setField = (field, value) => {
    setRequest((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (request.date < minDate) {
      setError('Choose today or a future date for your appointment request.');
      return;
    }
    if (!request.facilityId || !request.appointmentType || !request.date || !request.time) {
      setError('Choose a clinic, visit reason, preferred date, and preferred time.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        ...initialValue,
        facilityId: Number(request.facilityId),
        appointmentType: request.appointmentType,
        date: request.date,
        time: request.time,
        notes: request.notes.trim(),
      });
      if (result?.error) {
        setError(result.error);
      } else if (result) {
        setSubmitted(true);
      } else {
        setError('Your request could not be saved. Please review the details and try again.');
      }
    } catch {
      setError('Your request could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      <section className="patient-form appointment-request-form" role="dialog" aria-modal="true" aria-labelledby="appointment-form-title" aria-describedby="appointment-form-intro">
        <button className="close-button" type="button" onClick={onClose} aria-label="Close appointment form" disabled={submitting}>×</button>
        {!submitted ? (
          <>
            <p className="eyebrow">{isEditing ? 'Update request' : 'Care schedule'}</p>
            <h2 id="appointment-form-title">{isEditing ? 'Update appointment request' : 'Request an appointment'}</h2>
            <p id="appointment-form-intro" className="appointment-request-intro">Choose the clinic and preferred time that work for you. A health worker will review the request and confirm or contact you about a different time.</p>
            {!serviceEnabled && <p className="form-error" role="status">Appointment requests are currently unavailable. Please contact your clinic directly.</p>}
            {!patientAvailable && <p className="form-error" role="status">Your patient record is unavailable, so this request cannot be submitted.</p>}
            {!facilities.length && <p className="form-error" role="status">No active clinics are available for appointment requests.</p>}
            <form onSubmit={submit}>
              <label htmlFor="appointment-facility">Clinic</label>
              <select id="appointment-facility" required value={request.facilityId} onChange={(event) => setField('facilityId', event.target.value)} disabled={unavailable || submitting} aria-describedby="appointment-clinic-help">
                <option value="" disabled>Choose a clinic</option>
                {facilities.map((facility) => (
                  <option key={facility.facility_id} value={String(facility.facility_id)}>{facility.name} · {facility.address}</option>
                ))}
              </select>
              <small id="appointment-clinic-help" className="appointment-field-help">
                {facilities.find((facility) => String(facility.facility_id) === request.facilityId)?.operating_hours
                  ? `Usual hours: ${facilities.find((facility) => String(facility.facility_id) === request.facilityId).operating_hours}.`
                  : 'Clinic hours are shown for guidance; the clinic will confirm availability.'}
              </small>

              <label htmlFor="appointment-reason">Visit reason</label>
              <select id="appointment-reason" required value={request.appointmentType} onChange={(event) => setField('appointmentType', event.target.value)} disabled={unavailable || submitting}>
                <option value="" disabled>Choose a visit reason</option>
                {reasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>

              <div className="appointment-time-fields">
                <label htmlFor="appointment-date">Preferred date
                  <input id="appointment-date" name="date" required type="date" min={minDate} value={request.date} onChange={(event) => setField('date', event.target.value)} disabled={unavailable || submitting} />
                </label>
                <label htmlFor="appointment-time">Preferred time
                  <input id="appointment-time" name="time" required type="time" step="900" value={request.time} onChange={(event) => setField('time', event.target.value)} disabled={unavailable || submitting} aria-describedby="appointment-time-help" />
                </label>
              </div>
              <small id="appointment-time-help" className="appointment-field-help">Your preferred time is a request, not a reserved slot. Availability is confirmed by the clinic.</small>

              <label htmlFor="appointment-notes">Additional note <span className="appointment-optional">Optional</span>
                <textarea id="appointment-notes" maxLength={500} rows={3} value={request.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Share anything the clinic should know before reviewing your request." disabled={unavailable || submitting} aria-describedby="appointment-notes-help" />
              </label>
              <small id="appointment-notes-help" className="appointment-field-help">Do not include urgent or highly sensitive details. Maximum 500 characters.</small>

              {error && <p className="form-error appointment-request-error" role="alert">{error}</p>}
              <p className="appointment-request-notice">This is an appointment request, not a confirmed booking. Its status will remain <strong>Requested</strong> until a health worker reviews it.</p>
              <div className="appointment-request-actions">
                <button className="text-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
                <button className="primary-button" type="submit" disabled={unavailable || submitting}>
                  {submitting ? 'Sending request…' : isEditing ? 'Save request' : 'Request appointment'} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="appointment-request-success">
            <p className="eyebrow">Request received</p>
            <h2 id="appointment-form-title">Your request is in.</h2>
            <p role="status">Your appointment has been submitted as <strong>Requested</strong>. A health worker will review it and confirm or reschedule it.</p>
            <button className="primary-button" type="button" onClick={onClose}>Return to appointments <span aria-hidden="true">↗</span></button>
          </div>
        )}
      </section>
    </div>
  );
}
