import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import './CalendarPage.css';
import '../participant/home/ParticipantDashboardHome.css';
import CalendarNoteModal from './CalendarNoteModal';
import { useAdmin } from '../admin/context/AdminContext';
import { useParticipantLocale } from '../participant/context/ParticipantLocaleContext';
import { createCalendarNote, deleteCalendarNoteById, getCalendarData } from './calendarService';

const TODAY_KEY = toDateKey(new Date());
const TIME_SLOTS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
// Indexed by Date.getDay(); resolved to localized labels via participant t().
const WEEKDAY_KEYS = ['daySunShort', 'dayMonShort', 'dayTueShort', 'dayWedShort', 'dayThuShort', 'dayFriShort', 'daySatShort'];
const CALENDAR_VIEWS = ['month', 'week', 'day'];
const INTL_LOCALE_BY_LANG = { he: 'he-IL', ar: 'ar', en: 'en' };

const itemTypeKeys = {
  event: 'itemEvent',
  registration: 'itemRegistration',
  appointment: 'itemAppointment',
  note: 'itemNote',
};

const viewLabelKeys = { month: 'viewMonth', week: 'viewWeek', day: 'viewDay' };

function getCalendarCategory(item) {
  if (item.type === 'appointment') return 'appointment';
  if (item.type === 'note') return 'note';
  return 'workshop';
}

function getMiniCalendarCategories(items) {
  const categories = [];

  items.forEach((item) => {
    const category = getCalendarCategory(item);
    if (!categories.includes(category)) {
      categories.push(category);
    }
  });

  return categories;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function getStartOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return start;
}

function formatMonthTitle(date, intlLocale = 'en') {
  return new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric' }).format(date);
}

function formatDayNumber(date, intlLocale = 'en') {
  return new Intl.DateTimeFormat(intlLocale, { day: '2-digit' }).format(date);
}

function buildWeekDays(startDate, intlLocale = 'en') {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      key: toDateKey(date),
      dayKey: WEEKDAY_KEYS[date.getDay()],
      dayNumber: formatDayNumber(date, intlLocale),
    };
  });
}

function buildMonthDays(activeDate) {
  const firstOfMonth = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
  const daysInMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  return [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ id: `blank-${index}`, isBlank: true })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(activeDate.getFullYear(), activeDate.getMonth(), index + 1);
      return {
        id: toDateKey(date),
        date,
        day: index + 1,
        key: toDateKey(date),
      };
    }),
  ];
}

function buildMonthGrid(activeDate) {
  const firstOfMonth = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
  const daysInMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0).getDate();
  const weeksInMonth = Math.ceil((firstOfMonth.getDay() + daysInMonth) / 7);
  const gridStart = getStartOfWeek(firstOfMonth);

  return Array.from({ length: weeksInMonth * 7 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      day: date.getDate(),
      key: toDateKey(date),
      isCurrentMonth: date.getMonth() === activeDate.getMonth(),
    };
  });
}

function getHour(time) {
  return Number(time.split(':')[0]);
}

function CalendarItem({ item, onDeleteNote, isDeletingNote = false }) {
  const { t } = useParticipantLocale();
  const isNote = item.type === 'note';
  const isAppointment = item.type === 'appointment';
  const badges = isNote
    ? [t('itemNote')]
    : isAppointment
      ? [t('itemAppointment'), t('itemRegistration')]
      : [item.registered ? t('itemRegistration') : t(itemTypeKeys[item.type] ?? 'itemEvent')];
  const detailText = isNote ? item.content : isAppointment ? item.description : '';
  const handleDeleteClick = (event) => {
    event.stopPropagation();
    onDeleteNote(item);
  };

  return (
    <article className={`calendar-item calendar-item--${item.type}`}>
      {/* Card layout: compact badges, clamped content, then anchored time to prevent overlap in the daily sidebar. */}
      <div className="calendar-item__meta">
        {badges.map((badge) => (
          <span key={badge}>{badge}</span>
        ))}
      </div>
      <div className="calendar-item__body">
        <div className="calendar-item__title-row">
          <h3>{item.title}</h3>
          {isNote ? (
            <button
              type="button"
              className="calendar-item__delete-btn"
              onClick={handleDeleteClick}
              disabled={isDeletingNote}
            >
              {t('delete')}
            </button>
          ) : null}
        </div>
        {detailText && <p>{detailText}</p>}
      </div>
      {!isNote && (
        <time className="calendar-item__time">
          {item.startTime} - {item.endTime}
        </time>
      )}
    </article>
  );
}

function CalendarPill({ item }) {
  return (
    <span className={`calendar-pill calendar-pill--${item.type}`}>
      <strong>{item.title}</strong>
      <small>
        {item.startTime} - {item.endTime}
      </small>
    </span>
  );
}

export default function CalendarPage({ variant = 'standalone', darkMode = false }) {
  const { t, lang } = useParticipantLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';
  const { currentUser, effectiveUID, loading: authLoading } = useAdmin();
  const calendarUser = useMemo(
    () => (currentUser ? { uid: effectiveUID || currentUser.uid, email: currentUser.email } : null),
    [currentUser, effectiveUID],
  );
  const [selectedDate, setSelectedDate] = useState(TODAY_KEY);
  const [calendarView, setCalendarView] = useState('month');
  const [calendarData, setCalendarData] = useState({ events: [], appointments: [], notes: [] });
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [calendarError, setCalendarError] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteIds, setDeletingNoteIds] = useState(() => new Set());
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const datePickerId = useId();
  const timePickerId = useId();
  const [calendarReloadKey, setCalendarReloadKey] = useState(0);
  const [noteForm, setNoteForm] = useState({
    title: '',
    date: TODAY_KEY,
    time: '10:00',
    content: '',
  });

  useEffect(() => {
    let ignore = false;

    async function loadCalendarData() {
      if (authLoading) return;

      setLoadingCalendar(true);
      setCalendarError('');

      try {
        const data = await getCalendarData(calendarUser);

        if (!ignore) {
          setCalendarData(data);
        }
      } catch (error) {
        console.error('Failed to load calendar data:', error);

        if (!ignore) {
          setCalendarError(t('calErrorLoad'));
          setCalendarData({ events: [], appointments: [], notes: [] });
        }
      } finally {
        if (!ignore) {
          setLoadingCalendar(false);
        }
      }
    }

    loadCalendarData();

    return () => {
      ignore = true;
    };
  }, [authLoading, calendarReloadKey, calendarUser]);

  const activeDate = useMemo(() => fromDateKey(selectedDate), [selectedDate]);
  const activeWeekStart = useMemo(() => getStartOfWeek(activeDate), [activeDate]);
  const weekDays = useMemo(() => buildWeekDays(activeWeekStart, intlLocale), [activeWeekStart, intlLocale]);
  const monthDays = useMemo(() => buildMonthDays(activeDate), [activeDate]);
  const monthGridDays = useMemo(() => buildMonthGrid(activeDate), [activeDate]);
  const calendarItems = useMemo(
    () => [
      ...calendarData.events,
      ...calendarData.appointments,
      ...calendarData.notes,
    ],
    [calendarData],
  );

  const miniCalendarCategoriesByDate = useMemo(() => {
    return calendarItems.reduce((days, item) => {
      if (!item.date) return days;

      const currentItems = days[item.date] || [];
      return {
        ...days,
        [item.date]: [...currentItems, item],
      };
    }, {});
  }, [calendarItems]);

  const registeredItems = calendarItems.filter((item) => item.registered || item.type === 'appointment');
  const selectedDateItems = calendarItems.filter((item) => item.date === selectedDate);
  const selectedDateLabel = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(activeDate);
  const noteModalError = noteModalOpen ? calendarError : '';

  const handleDeleteCalendarNote = useCallback(async (item) => {
    console.log('DELETE CLICKED', item);
    if (!item || item.type !== 'note' || !item.id || !calendarUser?.uid) {
      console.error('DELETE FAILED', new Error('Missing note item, note id, or user uid'));
      return;
    }

    setDeletingNoteIds((current) => {
      const next = new Set(current);
      next.add(item.id);
      return next;
    });

    try {
      await deleteCalendarNoteById(calendarUser, item.id);
      setCalendarData((current) => ({
        ...current,
        notes: current.notes.filter((note) => note.id !== item.id),
      }));
      console.log('DELETE SUCCESS', item.id);
    } catch (error) {
      console.error('DELETE FAILED', error);
    } finally {
      setDeletingNoteIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }, [calendarUser]);

  function handleSelectDate(dateKey, nextView = calendarView) {
    setSelectedDate(dateKey);
    setNoteForm((current) => ({ ...current, date: dateKey }));
    setCalendarView(nextView);
  }

  function changeVisibleDate(amount) {
    const nextDate = new Date(activeDate);

    if (calendarView === 'month') {
      nextDate.setMonth(nextDate.getMonth() + amount);
    } else if (calendarView === 'week') {
      nextDate.setDate(nextDate.getDate() + amount * 7);
    } else {
      nextDate.setDate(nextDate.getDate() + amount);
    }

    handleSelectDate(toDateKey(nextDate));
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setNoteForm((current) => ({ ...current, [name]: value }));
  }

  function openNoteModal() {
    setCalendarError('');
    setNoteModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setCalendarError('');

    const trimmedTitle = noteForm.title.trim();
    const trimmedContent = noteForm.content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setCalendarError(t('calNoteRequired'));
      return;
    }

    if (!calendarUser?.uid) {
      setCalendarError(t('calSignInRequired'));
      return;
    }

    const optimisticNote = {
      id: `local-note-${Date.now()}`,
      title: trimmedTitle,
      type: 'note',
      date: noteForm.date,
      startTime: noteForm.time,
      endTime: (() => {
        const end = new Date(`2026-01-01T${noteForm.time}`);
        end.setMinutes(end.getMinutes() + 30);
        return end.toTimeString().slice(0, 5);
      })(),
      content: trimmedContent,
      registered: false,
    };

    setCalendarData((current) => ({
      ...current,
      notes: [...current.notes, optimisticNote],
    }));
    setSelectedDate(noteForm.date);
    setNoteForm({
      title: '',
      date: noteForm.date,
      time: noteForm.time,
      content: '',
    });
    setNoteModalOpen(false);
    setScheduleOpen(false);

    try {
      setSavingNote(true);
      const savedNote = await createCalendarNote(calendarUser, {
        ...noteForm,
        title: trimmedTitle,
        content: trimmedContent,
      });

      setCalendarData((current) => ({
        ...current,
        notes: current.notes.map((note) => (note.id === optimisticNote.id ? savedNote : note)),
      }));
    } catch (error) {
      console.error('Failed to save calendar note:', error);
      setCalendarError(t('calNoteNotSaved').replace('{error}', error.code || error.message || 'unknown error'));
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <main className={`calendar-page calendar-page--${variant}`} dir="ltr">
      <section className="calendar-shell">
        <header className="calendar-hero">
          <div>
            <div className="calendar-brand" aria-label="She-Na">
              <span className="calendar-brand__mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="calendar-brand__text">SHENA</span>
            </div>
            <span className="calendar-kicker">{t('calKicker')}</span>
            <h1>{t('calMyCalendar')}</h1>
            <p>{t('calSubtitle')}</p>
          </div>
          <div className="calendar-summary" aria-label={t('calSummaryAria')}>
            <div>
              <strong>{calendarData.events.length}</strong>
              <span>{t('summaryUpcoming')}</span>
            </div>
            <div>
              <strong>{registeredItems.length}</strong>
              <span>{t('summaryRegistered')}</span>
            </div>
            <div>
              <strong>{calendarData.notes.length}</strong>
              <span>{t('summaryNotes')}</span>
            </div>
          </div>
        </header>

        {calendarError && !loadingCalendar && (
          <div className="calendar-status calendar-status--error">
            <span>{calendarError}</span>
            <button type="button" onClick={() => setCalendarReloadKey((current) => current + 1)}>
              {t('calRetry')}
            </button>
          </div>
        )}

        <div className="calendar-layout">
          <aside className="calendar-sidebar" aria-label={t('calOverviewAria')}>
            <section className="calendar-card mini-calendar">
              <div className="card-heading">
                <h2>{formatMonthTitle(activeDate, intlLocale)}</h2>
                <span>{t('calMonthView')}</span>
              </div>

              <div className="mini-calendar__weekdays">
                {WEEKDAY_KEYS.map((key) => (
                  <span key={key}>{t(key)}</span>
                ))}
              </div>

              <div className="mini-calendar__grid">
                {monthDays.map((day) => {
                  if (day.isBlank) {
                    return (
                      <span key={day.id} className="mini-calendar__day mini-calendar__day--blank" />
                    );
                  }

                  const dayCategories = getMiniCalendarCategories(miniCalendarCategoriesByDate[day.key] || []);

                  return (
                    <button
                      key={day.id}
                      type="button"
                      className={`mini-calendar__day${selectedDate === day.key ? ' is-selected' : ''}${dayCategories.length ? ' has-item' : ''}`}
                      onClick={() => handleSelectDate(day.key)}
                    >
                      <span className="mini-calendar__day-number">{day.day}</span>
                      {dayCategories.length > 0 && (
                        <span className="mini-calendar__dots" aria-hidden="true">
                          {dayCategories.map((category) => (
                            <span className={`mini-calendar__dot mini-calendar__dot--${category}`} key={category} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="calendar-card selected-day-card">
              <div className="card-heading">
                <h2>{selectedDateLabel}</h2>
                <span>{t('calItemsCount').replace('{n}', String(selectedDateItems.length))}</span>
              </div>
              {selectedDateItems.length > 0 ? (
                <div className="selected-day-list">
                  {selectedDateItems.map((item) => (
                    <CalendarItem
                      key={item.id}
                      item={item}
                      onDeleteNote={handleDeleteCalendarNote}
                      isDeletingNote={deletingNoteIds.has(item.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="empty-state">{t('calNoItemsDate')}</p>
              )}
            </section>
          </aside>

          <section className="calendar-card calendar-board" aria-label={t('calBoardAria')}>
            <div className="calendar-board__toolbar">
              <div className="calendar-view-toggle" aria-label={t('calViewAria')}>
                {CALENDAR_VIEWS.map((view) => (
                  <button
                    type="button"
                    className={calendarView === view ? 'is-active' : ''}
                    onClick={() => setCalendarView(view)}
                    key={view}
                  >
                    {t(viewLabelKeys[view])}
                  </button>
                ))}
              </div>

              {/* Add Note moved from the left sidebar note card; openNoteModal keeps the existing note creation flow. */}
              <button
                type="button"
                className="calendar-board__add-note"
                aria-haspopup="dialog"
                onClick={openNoteModal}
              >
                <span aria-hidden="true">+</span>
                {t('calAddNote')}
              </button>

              <div className="calendar-board__actions">
                <button type="button" aria-label={t('calPrev')} onClick={() => changeVisibleDate(-1)}>
                  {'<'}
                </button>
                <button type="button" aria-label={t('calNext')} onClick={() => changeVisibleDate(1)}>
                  {'>'}
                </button>
              </div>
            </div>

            {calendarView === 'month' && (
              <div className="month-calendar">
                <div className="month-calendar__weekdays">
                  {WEEKDAY_KEYS.map((key) => (
                    <span key={key}>{t(key)}</span>
                  ))}
                </div>
                <div className="month-calendar__grid">
                  {monthGridDays.map((day) => {
                    const items = calendarItems.filter((item) => item.date === day.key);
                    return (
                      <button
                        type="button"
                        className={`month-calendar__day${day.isCurrentMonth ? '' : ' is-muted'}${
                          selectedDate === day.key ? ' is-selected' : ''
                        }`}
                        onClick={() => handleSelectDate(day.key, 'day')}
                        key={day.key}
                      >
                        <span className="month-calendar__date">{day.day}</span>
                        <span className="month-calendar__items">
                          {items.slice(0, 2).map((item) => (
                            <CalendarPill key={item.id} item={item} />
                          ))}
                          {items.length > 2 && <small className="month-calendar__more">{t('calMore').replace('{n}', String(items.length - 2))}</small>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {calendarView === 'week' && (
              <div className="weekly-calendar__scroll">
                <div className="weekly-calendar__grid">
                  <div className="weekly-calendar__corner" />
                  {weekDays.map((day) => (
                    <button
                      type="button"
                      key={day.key}
                      className={`weekly-calendar__day${selectedDate === day.key ? ' is-selected' : ''}`}
                      onClick={() => handleSelectDate(day.key, 'day')}
                    >
                      <strong>{day.dayNumber}</strong>
                      <span>{t(day.dayKey)}</span>
                    </button>
                  ))}

                  {TIME_SLOTS.map((slot) => (
                    <div className="weekly-calendar__row" key={slot}>
                      <div className="weekly-calendar__time">{slot}</div>
                      {weekDays.map((day) => {
                        const items = calendarItems.filter(
                          (item) => item.date === day.key && getHour(item.startTime) === getHour(slot),
                        );

                        return (
                          <div className="weekly-calendar__cell" key={`${day.key}-${slot}`}>
                            {items.length > 0 ? (
                              items.map((item) => (
                                <CalendarItem
                                  key={item.id}
                                  item={item}
                                  onDeleteNote={handleDeleteCalendarNote}
                                  isDeletingNote={deletingNoteIds.has(item.id)}
                                />
                              ))
                            ) : (
                              <span className="weekly-calendar__empty" aria-hidden="true" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {calendarView === 'day' && (
              <div className="day-calendar">
                <div className="day-calendar__summary">
                  <h3>{selectedDateLabel}</h3>
                  <span>{t('calItemsCount').replace('{n}', String(selectedDateItems.length))}</span>
                </div>
                <div className="day-calendar__timeline">
                  {TIME_SLOTS.map((slot) => {
                    const items = selectedDateItems.filter((item) => getHour(item.startTime) === getHour(slot));
                    return (
                      <div className="day-calendar__slot" key={slot}>
                        <time>{slot}</time>
                        <div>
                          {items.length > 0 ? (
                            items.map((item) => (
                              <CalendarItem
                                key={item.id}
                                item={item}
                                onDeleteNote={handleDeleteCalendarNote}
                                isDeletingNote={deletingNoteIds.has(item.id)}
                              />
                            ))
                          ) : (
                            <span className="day-calendar__empty">{t('calNoItems')}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loadingCalendar && !calendarError && calendarItems.length === 0 && (
              <p className="empty-state empty-state--wide">{t('calNoItemsYet')}</p>
            )}
          </section>
        </div>
      </section>

      <CalendarNoteModal
        open={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setScheduleOpen(false);
        }}
        noteForm={noteForm}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        savingNote={savingNote}
        scheduleOpen={scheduleOpen}
        onScheduleOpenChange={setScheduleOpen}
        onDateChange={(nextDate) => setNoteForm((current) => ({ ...current, date: nextDate }))}
        onTimeChange={(nextTime) => setNoteForm((current) => ({ ...current, time: nextTime }))}
        datePickerId={datePickerId}
        timePickerId={timePickerId}
        errorMessage={noteModalError}
        darkMode={darkMode}
      />
    </main>
  );
}
