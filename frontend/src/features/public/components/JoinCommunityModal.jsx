import { useEffect, useMemo, useRef, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import sheNaLogo from '../../../assets/she-na-logo.png';
import { createJoinRequest } from '../services/joinRequestService';

const INITIAL_FORM = {
  readyToJoin: false,
  firstName: '',
  lastName: '',
  address: '',
  birthDate: '',
  cancerStory: '',
  consentToReceiveInfo: '',
  email: '',
  phone: '',
  whatsappNote: '',
};

const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/ExJKpKfcK1gl9Ka79xRASm';
const DEFAULT_PHONE_COUNTRY = {
  countryCode: 'il',
  dialCode: '972',
  format: '+... ..-...-....',
};
const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];
const HEBREW_WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

function getInitialFieldErrors() {
  return {
    readyToJoin: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    consentToReceiveInfo: '',
    email: '',
    phone: '',
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function formatDateForDisplay(value) {
  if (!isValidDateValue(value)) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function formatBirthDateText(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseBirthDateText(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }

  const [day, month, year] = value.split('/').map(Number);
  const normalizedValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return isValidDateValue(normalizedValue) ? normalizedValue : null;
}

function getMonthDays(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
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

export default function JoinCommunityModal({ isOpen, onClose }) {
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const [fieldErrors, setFieldErrors] = useState(() => getInitialFieldErrors());
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [isBirthPickerOpen, setIsBirthPickerOpen] = useState(false);
  const [birthDateText, setBirthDateText] = useState('');
  const [birthPickerView, setBirthPickerView] = useState('days');
  const closeButtonRef = useRef(null);
  const birthDateRef = useRef(null);
  const titleId = useMemo(() => 'join-community-modal-title', []);
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const minBirthDate = useMemo(() => {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    return toDateInputValue(minDate);
  }, []);
  const selectedBirthDate = isValidDateValue(formValues.birthDate) ? formValues.birthDate : today;
  const selectedBirthParts = selectedBirthDate.split('-').map(Number);
  const [visibleBirthYear, setVisibleBirthYear] = useState(selectedBirthParts[0]);
  const [visibleBirthMonth, setVisibleBirthMonth] = useState(selectedBirthParts[1] - 1);
  const isSubmitting = submitState.status === 'submitting';
  const hasSubmitted = submitState.status === 'success';
  const minBirthYear = Number(minBirthDate.slice(0, 4));
  const maxBirthYear = Number(today.slice(0, 4));
  const yearRangeStart = Math.max(minBirthYear, Math.min(visibleBirthYear - (visibleBirthYear % 12), maxBirthYear - 11));
  const birthYearRange = useMemo(
    () => Array.from({ length: 12 }, (_, index) => yearRangeStart + index).filter((year) => year >= minBirthYear && year <= maxBirthYear),
    [maxBirthYear, minBirthYear, yearRangeStart],
  );
  const birthCalendarDays = useMemo(() => {
    const daysInMonth = getMonthDays(visibleBirthYear, visibleBirthMonth);
    const firstDay = new Date(visibleBirthYear, visibleBirthMonth, 1).getDay();
    const emptyDays = Array.from({ length: firstDay }, () => null);
    const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    return [...emptyDays, ...monthDays];
  }, [visibleBirthMonth, visibleBirthYear]);

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
      setSubmitState({ status: 'idle', message: '' });
      setFieldErrors(getInitialFieldErrors());
      setPhoneCountry(DEFAULT_PHONE_COUNTRY);
      setIsBirthPickerOpen(false);
      setBirthDateText('');
      setBirthPickerView('days');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isBirthPickerOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!birthDateRef.current?.contains(event.target)) {
        setIsBirthPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isBirthPickerOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField(name, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (name === 'birthDate') {
        if (value && !isValidDateValue(value)) {
          nextErrors.birthDate = 'נא לבחור תאריך תקין';
        } else if (value && value > today) {
          nextErrors.birthDate = 'לא ניתן לבחור תאריך עתידי';
        } else if (value && value < minBirthDate) {
          nextErrors.birthDate = 'נא לבחור תאריך תקין';
        } else {
          nextErrors.birthDate = '';
        }
      } else if (name in nextErrors) {
        nextErrors[name] = '';
      }

      return nextErrors;
    });

    if (submitState.status === 'error') {
      setSubmitState({ status: 'idle', message: '' });
    }
  }

  function updatePhone(value, country) {
    const nextCountry = country || phoneCountry;
    setPhoneCountry(nextCountry);
    updateField('phone', normalizePhoneValue(value));
  }

  function selectBirthDate(day) {
    const value = `${visibleBirthYear}-${String(visibleBirthMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (value < minBirthDate || value > today) {
      return;
    }

    updateField('birthDate', value);
    setBirthDateText(formatDateForDisplay(value));
    setBirthPickerView('days');
    setIsBirthPickerOpen(false);
  }

  function openBirthPicker() {
    const typedDate = parseBirthDateText(birthDateText);
    const baseDate = typedDate || (isValidDateValue(formValues.birthDate) ? formValues.birthDate : today);
    const [year, month] = baseDate.split('-').map(Number);

    setVisibleBirthYear(year);
    setVisibleBirthMonth(month - 1);
    setBirthPickerView('days');
    setIsBirthPickerOpen(true);
  }

  function changeVisibleMonth(direction) {
    const nextDate = new Date(visibleBirthYear, visibleBirthMonth + direction, 1);
    const nextYear = Math.min(maxBirthYear, Math.max(minBirthYear, nextDate.getFullYear()));
    const nextMonth = nextYear === minBirthYear
      ? Math.max(Number(minBirthDate.slice(5, 7)) - 1, nextDate.getMonth())
      : nextYear === maxBirthYear
        ? Math.min(Number(today.slice(5, 7)) - 1, nextDate.getMonth())
        : nextDate.getMonth();

    setVisibleBirthYear(nextYear);
    setVisibleBirthMonth(nextMonth);
  }

  function selectVisibleMonth(monthIndex) {
    setVisibleBirthMonth(monthIndex);
    setBirthPickerView('days');
  }

  function selectVisibleYear(year) {
    const minMonth = Number(minBirthDate.slice(5, 7)) - 1;
    const maxMonth = Number(today.slice(5, 7)) - 1;

    setVisibleBirthYear(year);
    setVisibleBirthMonth((currentMonth) => {
      if (year === minBirthYear) {
        return Math.max(minMonth, currentMonth);
      }

      if (year === maxBirthYear) {
        return Math.min(maxMonth, currentMonth);
      }

      return currentMonth;
    });
    setBirthPickerView('days');
  }

  function validateBirthDateText(value) {
    if (!value.trim()) {
      updateField('birthDate', '');
      return '';
    }

    const normalizedValue = parseBirthDateText(value);

    if (!normalizedValue || normalizedValue < minBirthDate) {
      updateField('birthDate', '');
      return 'נא לבחור תאריך תקין';
    }

    if (normalizedValue > today) {
      updateField('birthDate', '');
      return 'לא ניתן לבחור תאריך עתידי';
    }

    updateField('birthDate', normalizedValue);
    setVisibleBirthYear(Number(normalizedValue.slice(0, 4)));
    setVisibleBirthMonth(Number(normalizedValue.slice(5, 7)) - 1);
    return '';
  }

  function updateBirthDateText(value) {
    const nextText = formatBirthDateText(value);
    setBirthDateText(nextText);
    setIsBirthPickerOpen(true);

    if (!nextText) {
      updateField('birthDate', '');
      return;
    }

    if (nextText.length === 10) {
      const error = validateBirthDateText(nextText);
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        birthDate: error,
      }));
    } else {
      updateField('birthDate', '');
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        birthDate: '',
      }));
    }
  }

  function validateForm() {
    const nextErrors = getInitialFieldErrors();

    if (!formValues.readyToJoin) {
      nextErrors.readyToJoin = 'נא לאשר הצטרפות';
    }

    if (!formValues.firstName.trim()) {
      nextErrors.firstName = 'נא למלא שם פרטי';
    }

    if (!formValues.lastName.trim()) {
      nextErrors.lastName = 'נא למלא שם משפחה';
    }

    const typedBirthDate = birthDateText.trim();
    const normalizedTypedBirthDate = typedBirthDate ? parseBirthDateText(typedBirthDate) : null;

    if (typedBirthDate && !normalizedTypedBirthDate) {
      nextErrors.birthDate = 'נא לבחור תאריך תקין';
    } else if (normalizedTypedBirthDate && normalizedTypedBirthDate > today) {
      nextErrors.birthDate = 'לא ניתן לבחור תאריך עתידי';
    } else if (normalizedTypedBirthDate && normalizedTypedBirthDate < minBirthDate) {
      nextErrors.birthDate = 'נא לבחור תאריך תקין';
    } else if (formValues.birthDate && !isValidDateValue(formValues.birthDate)) {
      nextErrors.birthDate = 'נא לבחור תאריך תקין';
    } else if (formValues.birthDate && formValues.birthDate > today) {
      nextErrors.birthDate = 'לא ניתן לבחור תאריך עתידי';
    } else if (formValues.birthDate && formValues.birthDate < minBirthDate) {
      nextErrors.birthDate = 'נא לבחור תאריך תקין';
    }

    if (!formValues.email.trim() || !isValidEmail(formValues.email)) {
      nextErrors.email = 'נא להזין כתובת אימייל תקינה';
    }

    if (!getLocalPhoneDigits(formValues.phone, phoneCountry)) {
      nextErrors.phone = 'נא להזין מספר טלפון';
    } else if (!isValidPhoneForCountry(formValues.phone, phoneCountry)) {
      nextErrors.phone = 'נא להזין מספר טלפון תקין';
    }

    if (!formValues.consentToReceiveInfo) {
      nextErrors.consentToReceiveInfo = 'נא לבחור האם תרצי לקבל מידע';
    }

    setFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      setSubmitState({ status: 'error', message: 'נא להשלים את השדות המסומנים' });
      return;
    }

    setSubmitState({ status: 'submitting', message: '' });

    try {
      await createJoinRequest(formValues);
      setSubmitState({ status: 'success', message: 'תודה! הפרטים נשלחו בהצלחה' });
      setFormValues(INITIAL_FORM);
      setBirthDateText('');
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: 'לא הצלחנו לשלוח את הטופס כרגע. נסי שוב בעוד רגע.',
      });
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="join-modal" role="presentation" onMouseDown={handleBackdropClick}>
      <section
        className="join-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir="rtl"
      >
        <button
          className="join-modal__close"
          type="button"
          aria-label="סגירת טופס ההצטרפות"
          onClick={onClose}
          ref={closeButtonRef}
        >
          <CloseRoundedIcon aria-hidden="true" />
        </button>

        <div className="join-modal__header">
          <img className="join-modal__logo" src={sheNaLogo} alt="She-Na" />
          <div>
            <h2 id={titleId}>טופס הצטרפות לעמותה</h2>
            <p>השאירי פרטים ונחזור אלייך בהקדם</p>
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
              <label className="join-modal__checkbox">
                <input
                  type="checkbox"
                  checked={formValues.readyToJoin}
                  onChange={(event) => updateField('readyToJoin', event.target.checked)}
                  required
                  aria-invalid={fieldErrors.readyToJoin ? 'true' : undefined}
                  aria-describedby={fieldErrors.readyToJoin ? 'join-ready-error' : undefined}
                />
                <span>
                  <strong>
                    <span>אני מאשרת הצטרפות לעמותה</span>
                    <span className="join-modal__required">*</span>
                  </strong>
                  <small>נשמח שתהיי חלק מאיתנו</small>
                  {fieldErrors.readyToJoin ? (
                    <small className="join-modal__field-error" id="join-ready-error">
                      {fieldErrors.readyToJoin}
                    </small>
                  ) : null}
                </span>
              </label>

              <section className="join-modal__section">
                <h3>פרטים אישיים</h3>
                <div className="join-modal__grid">
                  <div className="join-modal__field">
                    <label htmlFor="join-first-name">
                      שם פרטי <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="join-first-name"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={formValues.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                      required
                      aria-invalid={fieldErrors.firstName ? 'true' : undefined}
                      aria-describedby={fieldErrors.firstName ? 'join-first-name-error' : undefined}
                    />
                    {fieldErrors.firstName ? (
                      <small className="join-modal__field-error" id="join-first-name-error">
                        {fieldErrors.firstName}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="join-last-name">
                      שם משפחה <span className="join-modal__required">*</span>
                    </label>
                    <input
                      id="join-last-name"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={formValues.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                      required
                      aria-invalid={fieldErrors.lastName ? 'true' : undefined}
                      aria-describedby={fieldErrors.lastName ? 'join-last-name-error' : undefined}
                    />
                    {fieldErrors.lastName ? (
                      <small className="join-modal__field-error" id="join-last-name-error">
                        {fieldErrors.lastName}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="join-address">כתובת</label>
                    <small>אזור מגורים או כתובת מלאה</small>
                    <input
                      id="join-address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      value={formValues.address}
                      onChange={(event) => updateField('address', event.target.value)}
                    />
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="join-birth-date">תאריך לידה</label>
                    <small>יום / חודש / שנה</small>
                    <div className="join-modal__date" dir="rtl" ref={birthDateRef}>
                      <div className={`join-modal__date-control${fieldErrors.birthDate ? ' join-modal__date-control--error' : ''}`}>
                        <input
                          id="join-birth-date"
                          name="birthDate"
                          type="text"
                          inputMode="numeric"
                          autoComplete="bday"
                          placeholder="dd/mm/yyyy"
                          value={birthDateText}
                          onFocus={openBirthPicker}
                          onChange={(event) => updateBirthDateText(event.target.value)}
                          onBlur={() => {
                            const error = validateBirthDateText(birthDateText);
                            setFieldErrors((currentErrors) => ({
                              ...currentErrors,
                              birthDate: error,
                            }));
                          }}
                          aria-invalid={fieldErrors.birthDate ? 'true' : undefined}
                          aria-describedby={fieldErrors.birthDate ? 'join-birth-date-error' : undefined}
                        />
                        <button
                          className="join-modal__date-button"
                          type="button"
                          onClick={openBirthPicker}
                          aria-label="פתיחת בורר תאריך"
                          aria-expanded={isBirthPickerOpen}
                          aria-haspopup="dialog"
                        >
                          <span aria-hidden="true" />
                        </button>
                      </div>

                      {isBirthPickerOpen ? (
                        <div className="join-modal__date-popover" role="dialog" aria-label="בחירת תאריך לידה">
                          <div className="join-modal__date-header">
                            <button
                              type="button"
                              onClick={() => changeVisibleMonth(1)}
                              disabled={new Date(visibleBirthYear, visibleBirthMonth + 1, 1) > new Date(maxBirthYear, Number(today.slice(5, 7)) - 1, 1)}
                              aria-label="החודש הבא"
                            >
                              ›
                            </button>
                            <div className="join-modal__date-heading">
                              <button type="button" onClick={() => setBirthPickerView('months')}>
                                {HEBREW_MONTHS[visibleBirthMonth]}
                              </button>
                              <button type="button" onClick={() => setBirthPickerView('years')}>
                                {visibleBirthYear}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => changeVisibleMonth(-1)}
                              disabled={new Date(visibleBirthYear, visibleBirthMonth - 1, 1) < new Date(minBirthYear, Number(minBirthDate.slice(5, 7)) - 1, 1)}
                              aria-label="החודש הקודם"
                            >
                              ‹
                            </button>
                          </div>

                          {birthPickerView === 'years' ? (
                            <div className="join-modal__date-year-panel">
                              <div className="join-modal__date-range">
                                <button
                                  type="button"
                                  onClick={() => setVisibleBirthYear((currentYear) => Math.max(minBirthYear, currentYear - 12))}
                                  disabled={yearRangeStart <= minBirthYear}
                                  aria-label="שנים קודמות"
                                >
                                  ‹
                                </button>
                                <span>
                                  {birthYearRange[0]} - {birthYearRange[birthYearRange.length - 1]}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setVisibleBirthYear((currentYear) => Math.min(maxBirthYear, currentYear + 12))}
                                  disabled={yearRangeStart + 11 >= maxBirthYear}
                                  aria-label="שנים הבאות"
                                >
                                  ›
                                </button>
                              </div>
                              <div className="join-modal__date-options join-modal__date-options--years">
                                {birthYearRange.map((year) => (
                                  <button
                                    className={year === visibleBirthYear ? 'join-modal__date-option join-modal__date-option--selected' : 'join-modal__date-option'}
                                    key={year}
                                    type="button"
                                    onClick={() => selectVisibleYear(year)}
                                  >
                                    {year}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {birthPickerView === 'months' ? (
                            <div className="join-modal__date-options join-modal__date-options--months">
                              {HEBREW_MONTHS.map((monthName, index) => {
                                const monthValue = `${visibleBirthYear}-${String(index + 1).padStart(2, '0')}-01`;
                                const minMonthValue = minBirthDate.slice(0, 8) + '01';
                                const maxMonthValue = today.slice(0, 8) + '01';
                                const isDisabled = monthValue < minMonthValue || monthValue > maxMonthValue;

                                return (
                                  <button
                                    className={index === visibleBirthMonth ? 'join-modal__date-option join-modal__date-option--selected' : 'join-modal__date-option'}
                                    key={monthName}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => selectVisibleMonth(index)}
                                  >
                                    {monthName}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}

                          {birthPickerView === 'days' ? (
                            <>
                              <div className="join-modal__date-weekdays" aria-hidden="true">
                                {HEBREW_WEEKDAYS.map((weekday) => (
                                  <span key={weekday}>{weekday}</span>
                                ))}
                              </div>

                              <div className="join-modal__date-days">
                                {birthCalendarDays.map((day, index) => {
                                  if (!day) {
                                    return <span className="join-modal__date-empty" key={`empty-${index}`} />;
                                  }

                                  const value = `${visibleBirthYear}-${String(visibleBirthMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                  const isDisabled = value < minBirthDate || value > today;
                                  const isSelected = value === formValues.birthDate;

                                  return (
                                    <button
                                      className={isSelected ? 'join-modal__date-day join-modal__date-day--selected' : 'join-modal__date-day'}
                                      key={value}
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() => selectBirthDate(day)}
                                      aria-pressed={isSelected}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {fieldErrors.birthDate ? (
                      <small className="join-modal__field-error" id="join-birth-date-error">
                        {fieldErrors.birthDate}
                      </small>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="join-modal__section">
                <h3>קצת עלייך</h3>
                <div className="join-modal__field">
                  <label htmlFor="join-cancer-story">האם את מחלימה מסרטן?</label>
                  <small>נשמח שתכתבי לנו כמה מילים, רק אם מתאים לך</small>
                  <textarea
                    id="join-cancer-story"
                    name="cancerStory"
                    rows="4"
                    value={formValues.cancerStory}
                    onChange={(event) => updateField('cancerStory', event.target.value)}
                  />
                </div>
              </section>

              <section className="join-modal__section join-modal__section--card">
                <h3>יצירת קשר</h3>
                <div className="join-modal__grid">
                  <div className="join-modal__field">
                    <label htmlFor="join-email">
                      אימייל <span className="join-modal__required">*</span>
                    </label>
                    <small>נשלח לך עדכונים ודברים חשובים</small>
                    <input
                      id="join-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formValues.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      required
                      aria-invalid={fieldErrors.email ? 'true' : undefined}
                      aria-describedby={fieldErrors.email ? 'join-email-error' : undefined}
                    />
                    {fieldErrors.email ? (
                      <small className="join-modal__field-error" id="join-email-error">
                        {fieldErrors.email}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__field">
                    <label htmlFor="join-phone">
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
                        id: 'join-phone',
                        name: 'phone',
                        required: true,
                        autoComplete: 'tel',
                        dir: 'ltr',
                        'aria-invalid': fieldErrors.phone ? 'true' : undefined,
                        'aria-describedby': fieldErrors.phone ? 'join-phone-error' : undefined,
                      }}
                    />
                    {fieldErrors.phone ? (
                      <small className="join-modal__field-error" id="join-phone-error">
                        {fieldErrors.phone}
                      </small>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="join-modal__section join-modal__section--card join-modal__section--updates">
                <h3>עדכונים וקהילה</h3>
                <div className="join-modal__grid join-modal__updates-grid">
                  <div className="join-modal__updates-card join-modal__field">
                    <label htmlFor="join-consent-info">
                      הסכמה לקבלת מידע <span className="join-modal__required">*</span>
                    </label>
                    <small>עדכונים על סדנאות, מפגשים ופעילויות</small>
                    <select
                      id="join-consent-info"
                      name="consentToReceiveInfo"
                      value={formValues.consentToReceiveInfo}
                      onChange={(event) => updateField('consentToReceiveInfo', event.target.value)}
                      required
                      aria-invalid={fieldErrors.consentToReceiveInfo ? 'true' : undefined}
                      aria-describedby={fieldErrors.consentToReceiveInfo ? 'join-consent-info-error' : undefined}
                    >
                      <option value="" disabled>
                        בחרי תשובה
                      </option>
                      <option value="yes">כן, אשמח לקבל מידע</option>
                      <option value="not_now">לא כרגע</option>
                    </select>
                    {fieldErrors.consentToReceiveInfo ? (
                      <small className="join-modal__field-error" id="join-consent-info-error">
                        {fieldErrors.consentToReceiveInfo}
                      </small>
                    ) : null}
                  </div>

                  <div className="join-modal__updates-card join-modal__field join-modal__whatsapp">
                    <span className="join-modal__field-label">קהילת WhatsApp</span>
                    <small>הצטרפי לקהילה שלנו לעדכונים ופעילויות</small>
                    <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noreferrer">
                      הצטרפות ל-WhatsApp
                    </a>
                  </div>
                </div>

                <div className="join-modal__field join-modal__updates-note">
                  <label htmlFor="join-whatsapp-note">הערה קצרה</label>
                  <input
                    id="join-whatsapp-note"
                    name="whatsappNote"
                    type="text"
                    placeholder="אפשר להשאיר הערה קצרה"
                    value={formValues.whatsappNote}
                    onChange={(event) => updateField('whatsappNote', event.target.value)}
                  />
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
