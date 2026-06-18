import { useEffect, useMemo, useState } from 'react';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { sendBirthdayWish } from '../services/communityService';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';
import { getParticipantCommunityContent } from '../../i18n/participantUiTranslations';

const getBirthdayMonthDay = (birthday) => {
  if (typeof birthday !== 'string') return null;

  const dateParts = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateParts) {
    const year = Number(dateParts[1]);
    const month = Number(dateParts[2]);
    const day = Number(dateParts[3]);
    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() === year
      && parsedDate.getMonth() === month - 1
      && parsedDate.getDate() === day
    ) {
      return { month, day };
    }
  }

  const parsedDate = new Date(birthday);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return {
    month: parsedDate.getMonth() + 1,
    day: parsedDate.getDate(),
  };
};

const getTodaysBirthdayUsers = (users = [], today = new Date()) => users.filter((user) => {
  const birthdayMonthDay = getBirthdayMonthDay(user?.birthday);

  if (!birthdayMonthDay) return false;

  return birthdayMonthDay.month === today.getMonth() + 1
    && birthdayMonthDay.day === today.getDate();
});

const getTodayStorageKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const readSentBirthdayWishIds = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') return [];

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export default function BirthdayCard({
  birthdayUsers = [],
  localUserId = '',
  localUserName = '',
}) {
  const { t, locale } = useParticipantLocale();
  const birthdayMessages = getParticipantCommunityContent(locale).birthdayMessages;
  const sentStorageKey = `community-birthday-wishes:${localUserId || 'guest'}:${getTodayStorageKey()}`;
  const todaysBirthdayUsers = useMemo(() => getTodaysBirthdayUsers(birthdayUsers), [birthdayUsers]);
  const [sentBirthdayUserIds, setSentBirthdayUserIds] = useState(() => (
    readSentBirthdayWishIds(sentStorageKey)
  ));
  const [activeBirthdayIndex, setActiveBirthdayIndex] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [birthdayWishError, setBirthdayWishError] = useState('');
  const [isSendingBirthdayWish, setIsSendingBirthdayWish] = useState(false);
  const visibleBirthdayUsers = todaysBirthdayUsers.filter((user) => (
    user?.id && !sentBirthdayUserIds.includes(user.id)
  ));
  const birthdayUser = visibleBirthdayUsers[activeBirthdayIndex];
  const hasBirthdayNavigation = visibleBirthdayUsers.length > 1;

  useEffect(() => {
    setSentBirthdayUserIds(readSentBirthdayWishIds(sentStorageKey));
  }, [sentStorageKey]);

  useEffect(() => {
    setActiveBirthdayIndex((currentIndex) => {
      if (visibleBirthdayUsers.length === 0) return 0;
      return Math.min(currentIndex, visibleBirthdayUsers.length - 1);
    });
  }, [visibleBirthdayUsers.length]);

  useEffect(() => {
    setSelectedMessage('');
    setBirthdayWishError('');
    setIsSendingBirthdayWish(false);
  }, [birthdayUser?.id]);

  const handleReadyMessageClick = (message) => {
    setSelectedMessage(message);
    setBirthdayWishError('');
  };

  const handleBirthdayNavigation = (direction) => {
    setActiveBirthdayIndex((currentIndex) => {
      if (visibleBirthdayUsers.length <= 1) return currentIndex;

      return (currentIndex + direction + visibleBirthdayUsers.length) % visibleBirthdayUsers.length;
    });
  };

  const handleSendBirthdayWish = async () => {
    if (!selectedMessage) {
      setBirthdayWishError(t('birthdayChooseMessage'));
      return;
    }

    if (!birthdayUser?.id || isSendingBirthdayWish) return;

    setIsSendingBirthdayWish(true);

    try {
      await sendBirthdayWish({
        recipientId: birthdayUser.id,
        senderId: localUserId,
        senderName: localUserName,
        message: selectedMessage,
      });

      const nextSentBirthdayUserIds = [...new Set([...sentBirthdayUserIds, birthdayUser.id])];
      setSentBirthdayUserIds(nextSentBirthdayUserIds);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(sentStorageKey, JSON.stringify(nextSentBirthdayUserIds));
        } catch {
          // The wish was already sent; blocked storage should not make the UI report a failed send.
        }
      }

      setSelectedMessage('');
      setBirthdayWishError('');
    } catch {
      setBirthdayWishError(t('birthdayWishSendError'));
    } finally {
      setIsSendingBirthdayWish(false);
    }
  };

  if (!birthdayUser) {
    return null;
  }

  return (
    <section className="birthday-card" aria-labelledby="birthday-card-title">
      {hasBirthdayNavigation && (
        <div className="birthday-card__nav" aria-label={t('birthdayNavAria')}>
          <button
            type="button"
            onClick={() => handleBirthdayNavigation(-1)}
            aria-label={t('birthdayPrev')}
          >
            <ArrowBackIosNewIcon />
          </button>
          <span>
            {activeBirthdayIndex + 1}
            {' '}
            /
            {' '}
            {visibleBirthdayUsers.length}
          </span>
          <button
            type="button"
            onClick={() => handleBirthdayNavigation(1)}
            aria-label={t('birthdayNext')}
          >
            <ArrowForwardIosIcon />
          </button>
        </div>
      )}

      <div className="birthday-card__header">
        <span className="birthday-card__icon" aria-hidden="true">
          <CakeOutlinedIcon />
        </span>
        <div className="birthday-card__heading">
          <h2 id="birthday-card-title">{birthdayUser.name}</h2>
          <p>{t('birthdayItsHerDay')}</p>
        </div>
      </div>

      <div className="birthday-card__messages" aria-label={t('readyWishesAria')}>
        {birthdayMessages.map((message) => (
          <button
            className={selectedMessage === message ? 'is-selected' : ''}
            type="button"
            onClick={() => handleReadyMessageClick(message)}
            key={message}
          >
            <span className="birthday-card__message-icon" aria-hidden="true">
              {selectedMessage === message ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </span>
            <span>{message}</span>
          </button>
        ))}
      </div>
      {birthdayWishError && (
        <p className="birthday-card__error" id="birthday-card-error" role="alert">
          {birthdayWishError}
        </p>
      )}
      <button
        className="birthday-card__send"
        type="button"
        onClick={handleSendBirthdayWish}
        disabled={isSendingBirthdayWish}
      >
        {isSendingBirthdayWish ? t('birthdaySending') : t('birthdaySendWish')}
      </button>
    </section>
  );
}
