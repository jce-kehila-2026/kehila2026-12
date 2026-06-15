import { useEffect, useMemo, useRef, useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import sheNaLogo from '../../../assets/she-na-logo.png';
import { usePublicLocale } from '../context/PublicLocaleContext';

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
const DONATION_DETAILS = [
  { labelKey: 'donationOrgNumber', value: '580791747' },
  { labelKey: 'donationBank', value: 'מזרחי טפחות' },
  { labelKey: 'donationBranch', value: '511' },
  { labelKey: 'donationAccount', value: '324262' },
];
// TODO: Replace with the real organization donation API/payment link.
const DONATION_PAYMENT_URL = 'https://example.com/donation-payment-link';

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

export default function DonationModal({ isOpen, onClose }) {
  const { t, direction } = usePublicLocale();
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState(() => getInitialFieldErrors());
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const closeButtonRef = useRef(null);
  const titleId = useMemo(() => 'donation-modal-title', []);
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
      nextErrors.firstName = t('joinErrFirstName');
    }

    if (!formValues.lastName.trim()) {
      nextErrors.lastName = t('joinErrLastName');
    }

    if (!getLocalPhoneDigits(formValues.phone, phoneCountry)) {
      nextErrors.phone = t('joinErrPhone');
    } else if (!isValidPhoneForCountry(formValues.phone, phoneCountry)) {
      nextErrors.phone = t('joinErrPhoneInvalid');
    }

    if (!formValues.email.trim() || !isValidEmail(formValues.email)) {
      nextErrors.email = t('joinErrEmail');
    }

    setFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      setSubmitState({ status: 'error', message: t('joinErrIncomplete') });
      return;
    }

    setSubmitState({ status: 'submitting', message: '' });
    setSubmitState({ status: 'success', message: t('joinSuccess') });
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
        dir={direction}
      >
        <button
          className="join-modal__close"
          type="button"
          aria-label={t('donationCloseAria')}
          onClick={onClose}
          ref={closeButtonRef}
        >
          ×
        </button>

        <div className="join-modal__header">
          <img className="join-modal__logo" src={sheNaLogo} alt="She-Na" />
          <div>
            <h2 id={titleId}>{t('donationThanksTitle')}</h2>
            <p>{t('donationThanksBody')}</p>
          </div>
        </div>

        {hasSubmitted ? (
          <div className="join-modal__success" role="status">
            <strong>{submitState.message}</strong>
            <button className="public-button public-button--primary join-modal__done" type="button" onClick={onClose}>
              {t('joinClose')}
            </button>
          </div>
        ) : (
          <form className="join-modal__form" onSubmit={handleSubmit} noValidate>
            <div className="join-modal__body join-modal__body--donation">
              <section className="join-modal__section donation-card">
                <div className="donation-card__header">
                  <p className="donation-card__kicker">{t('donationDirectKicker')}</p>
                  <h3 className="donation-card__title">{t('donationOrgName')}</h3>
                </div>

                <dl className="donation-card__details">
                  {DONATION_DETAILS.map((detail) => (
                    <div className="donation-card__detail" key={detail.labelKey}>
                      <dt>{t(detail.labelKey)}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="donation-card__cta">
                  <p>{t('donationPreferCard')}</p>
                  <a
                    className="public-button public-button--primary donation-card__button"
                    href={DONATION_PAYMENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('donationCardButton')}
                  </a>
                </div>
              </section>

              <section className="join-modal__section join-modal__section--card join-modal__donation-contact">
                <h3>{t('donationContactTitle')}</h3>
                <div className="join-modal__grid join-modal__grid--volunteer">
                  <div className="join-modal__field">
                    <label htmlFor="donation-first-name">
                      {t('joinFirstName')} <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="donation-first-name"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formValues.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                      required
                      aria-invalid={fieldErrors.firstName ? 'true' : undefined}
                      aria-describedby={fieldErrors.firstName ? 'donation-first-name-error' : undefined}
                    />
                    {fieldErrors.firstName ? (
                      <small className="join-modal__field-error" id="donation-first-name-error">
                        {fieldErrors.firstName}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="donation-last-name">
                      {t('joinLastName')} <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="donation-last-name"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={formValues.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                      required
                      aria-invalid={fieldErrors.lastName ? 'true' : undefined}
                      aria-describedby={fieldErrors.lastName ? 'donation-last-name-error' : undefined}
                    />
                    {fieldErrors.lastName ? (
                      <small className="join-modal__field-error" id="donation-last-name-error">
                        {fieldErrors.lastName}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="donation-phone">
                      {t('joinPhone')} <span className="join-modal__required">*</span>
                    </label>
                    <small>{t('joinPhoneHint')}</small>
                    <PhoneInput
                      country={phoneCountry.countryCode || DEFAULT_PHONE_COUNTRY.countryCode}
                      value={formValues.phone.replace(/^\+/, '')}
                      onChange={(phone, country) => updatePhone(phone, country)}
                      onBlur={() => {
                        if (getLocalPhoneDigits(formValues.phone, phoneCountry) && !isValidPhoneForCountry(formValues.phone, phoneCountry)) {
                          setFieldErrors((currentErrors) => ({
                            ...currentErrors,
                            phone: t('joinErrPhoneInvalid'),
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
                        id: 'donation-phone',
                        name: 'phone',
                        required: true,
                        autoComplete: 'tel',
                        dir: 'ltr',
                        'aria-invalid': fieldErrors.phone ? 'true' : undefined,
                        'aria-describedby': fieldErrors.phone ? 'donation-phone-error' : undefined,
                      }}
                    />
                    {fieldErrors.phone ? (
                      <small className="join-modal__field-error" id="donation-phone-error">
                        {fieldErrors.phone}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="donation-email">
                      {t('joinEmail')} <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="donation-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formValues.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      required
                      aria-invalid={fieldErrors.email ? 'true' : undefined}
                      aria-describedby={fieldErrors.email ? 'donation-email-error' : undefined}
                    />
                    {fieldErrors.email ? (
                      <small className="join-modal__field-error" id="donation-email-error">
                        {fieldErrors.email}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field join-modal__field--wide">
                    <label htmlFor="donation-message">{t('donationMessage')}</label>
                    <textarea
                      id="donation-message"
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
                  {t('joinCancel')}
                </button>
                <button className="public-button public-button--primary join-modal__submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('joinSubmitting') : t('donationSubmit')}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
