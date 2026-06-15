import { useEffect, useMemo, useRef, useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import sheNaLogo from '../../../assets/she-na-logo.png';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  message: '',
};
const DEFAULT_PHONE_COUNTRY = {
  countryCode: 'il',
  dialCode: '972',
  format: '+... ..-...-....',
};

function getInitialFieldErrors() {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizePhoneValue(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function getPhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function getLocalPhoneDigits(phone, country) {
  const digits = getPhoneDigits(phone);
  const dialCode = String(country?.dialCode || '');

  return dialCode && digits.startsWith(dialCode) ? digits.slice(dialCode.length) : digits;
}

function isValidPhoneForCountry(phone, country) {
  const digits = getPhoneDigits(phone);
  const dialCode = String(country?.dialCode || '');
  const localDigits = getLocalPhoneDigits(phone, country);

  if (!digits || !dialCode || !digits.startsWith(dialCode) || !localDigits) {
    return false;
  }

  if (!/^\+\d{6,15}$/.test(phone)) {
    return false;
  }

  const expectedDigits = (country?.format?.match(/\./g) || []).length;

  if (!expectedDigits) {
    return digits.length >= dialCode.length + 4 && digits.length <= 15;
  }

  const minDigits = Math.max(dialCode.length + 4, expectedDigits - 1);
  const maxDigits = Math.min(15, expectedDigits + 2);

  return digits.length >= minDigits && digits.length <= maxDigits;
}

export default function VolunteerModal({ isOpen, onClose }) {
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState(() => getInitialFieldErrors());
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const closeButtonRef = useRef(null);
  const titleId = useMemo(() => 'volunteer-modal-title', []);
  const isSubmitting = submitState.status === 'submitting';
  const hasSubmitted = submitState.status === 'success';

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFormValues(INITIAL_FORM);
      setFieldErrors(getInitialFieldErrors());
      setSubmitState({ status: 'idle', message: '' });
      setPhoneCountry(DEFAULT_PHONE_COUNTRY);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField(name, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));

    if (name in fieldErrors) {
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        [name]: '',
      }));
    }

    if (submitState.status === 'error') {
      setSubmitState({ status: 'idle', message: '' });
    }
  }

  function updatePhone(value, country) {
    const nextCountry = country || phoneCountry;
    setPhoneCountry(nextCountry);
    updateField('phone', normalizePhoneValue(value));
  }

  function validateForm() {
    const nextErrors = getInitialFieldErrors();

    if (!formValues.firstName.trim()) {
      nextErrors.firstName = 'נא למלא שם פרטי';
    }

    if (!formValues.lastName.trim()) {
      nextErrors.lastName = 'נא למלא שם משפחה';
    }

    if (!getLocalPhoneDigits(formValues.phone, phoneCountry)) {
      nextErrors.phone = 'נא להזין מספר טלפון';
    } else if (!isValidPhoneForCountry(formValues.phone, phoneCountry)) {
      nextErrors.phone = 'נא להזין מספר טלפון תקין';
    }

    if (!formValues.email.trim() || !isValidEmail(formValues.email)) {
      nextErrors.email = 'נא להזין כתובת אימייל תקינה';
    }

    setFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      setSubmitState({ status: 'error', message: 'נא להשלים את השדות המסומנים' });
      return;
    }

    setSubmitState({ status: 'submitting', message: '' });
    setSubmitState({ status: 'success', message: 'תודה! הפרטים נשלחו בהצלחה' });
    setFormValues(INITIAL_FORM);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="join-modal" role="presentation" onMouseDown={handleBackdropClick}>
      <section
        className="join-modal__card join-modal__card--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir="rtl"
      >
        <button
          className="join-modal__close"
          type="button"
          aria-label="סגירת טופס ההתנדבות"
          onClick={onClose}
          ref={closeButtonRef}
        >
          ×
        </button>

        <div className="join-modal__header">
          <img className="join-modal__logo" src={sheNaLogo} alt="She-Na" />
          <div>
            <h2 id={titleId}>תודה!</h2>
            <p>
              נשמח שתצטרפי אלינו להתנדבות שמתאימה לך! כל אחת יכולה לתרום בדרך שלה, בזמן שלה.
              השאירי פרטים ונחזור אלייך למצוא את האפשרות הנכונה עבורך.
            </p>
          </div>
        </div>

        {hasSubmitted ? (
          <div className="join-modal__success" role="status">
            <strong>{submitState.message}</strong>
            <button className="public-button public-button--primary join-modal__done" type="button" onClick={onClose}>
              סגירה
            </button>
          </div>
        ) : (
          <form className="join-modal__form" onSubmit={handleSubmit} noValidate>
            <div className="join-modal__body">
              <section className="join-modal__section join-modal__section--card">
                <h3>פרטים להתנדבות</h3>
                <div className="join-modal__grid join-modal__grid--volunteer">
                  <div className="join-modal__field">
                    <label htmlFor="volunteer-first-name">
                      שם פרטי <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="volunteer-first-name"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formValues.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                      required
                      aria-invalid={fieldErrors.firstName ? 'true' : undefined}
                      aria-describedby={fieldErrors.firstName ? 'volunteer-first-name-error' : undefined}
                    />
                    {fieldErrors.firstName ? (
                      <small className="join-modal__field-error" id="volunteer-first-name-error">
                        {fieldErrors.firstName}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="volunteer-last-name">
                      שם משפחה <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="volunteer-last-name"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={formValues.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                      required
                      aria-invalid={fieldErrors.lastName ? 'true' : undefined}
                      aria-describedby={fieldErrors.lastName ? 'volunteer-last-name-error' : undefined}
                    />
                    {fieldErrors.lastName ? (
                      <small className="join-modal__field-error" id="volunteer-last-name-error">
                        {fieldErrors.lastName}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="volunteer-phone">
                      מספר טלפון <span className="join-modal__required">*</span>
                    </label>
                    <small>נשתמש בו רק ליצירת קשר ועדכונים חשובים</small>
                    <PhoneInput
                      country={phoneCountry.countryCode || DEFAULT_PHONE_COUNTRY.countryCode}
                      value={formValues.phone.replace(/^\+/, '')}
                      onChange={(phone, country) => updatePhone(phone, country)}
                      onBlur={() => {
                        if (getLocalPhoneDigits(formValues.phone, phoneCountry) && !isValidPhoneForCountry(formValues.phone, phoneCountry)) {
                          setFieldErrors((currentErrors) => ({
                            ...currentErrors,
                            phone: 'נא להזין מספר טלפון תקין',
                          }));
                        }
                      }}
                      enableSearch
                      countryCodeEditable={false}
                      jumpCursorToEnd
                      copyNumbersOnly
                      specialLabel=""
                      containerClass={`join-modal__phone${fieldErrors.phone ? ' join-modal__phone--error' : ''}`}
                      inputClass="join-modal__phone-input"
                      buttonClass="join-modal__phone-button"
                      dropdownClass="join-modal__phone-dropdown"
                      searchClass="join-modal__phone-search"
                      containerStyle={{ direction: 'ltr' }}
                      inputProps={{
                        id: 'volunteer-phone',
                        name: 'phone',
                        required: true,
                        autoComplete: 'tel',
                        dir: 'ltr',
                        'aria-invalid': fieldErrors.phone ? 'true' : undefined,
                        'aria-describedby': fieldErrors.phone ? 'volunteer-phone-error' : undefined,
                      }}
                    />
                    {fieldErrors.phone ? (
                      <small className="join-modal__field-error" id="volunteer-phone-error">
                        {fieldErrors.phone}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="volunteer-email">
                      דוא&quot;ל <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="volunteer-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formValues.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      required
                      aria-invalid={fieldErrors.email ? 'true' : undefined}
                      aria-describedby={fieldErrors.email ? 'volunteer-email-error' : undefined}
                    />
                    {fieldErrors.email ? (
                      <small className="join-modal__field-error" id="volunteer-email-error">
                        {fieldErrors.email}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field join-modal__field--wide">
                    <label htmlFor="volunteer-message">הודעה</label>
                    <textarea
                      id="volunteer-message"
                      name="message"
                      rows="4"
                      value={formValues.message}
                      onChange={(event) => updateField('message', event.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="join-modal__footer">
              {submitState.message ? (
                <p className={`join-modal__message join-modal__message--${submitState.status}`} role="alert">
                  {submitState.message}
                </p>
              ) : null}

              <div className="join-modal__actions">
                <button className="join-modal__cancel" type="button" onClick={onClose}>
                  ביטול
                </button>
                <button className="public-button public-button--primary join-modal__submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'שולחות...' : 'שליחה'}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
