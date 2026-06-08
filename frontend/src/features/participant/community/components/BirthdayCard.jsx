import { useRef, useState } from 'react';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import { birthdayMessages } from '../communityMockData';

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

export default function BirthdayCard({ birthdayUsers = [] }) {
  const todaysBirthdayUsers = getTodaysBirthdayUsers(birthdayUsers);
  const birthdayUser = todaysBirthdayUsers[0];
  const [selectedMessage, setSelectedMessage] = useState('');
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [sentBirthdayWish, setSentBirthdayWish] = useState(false);
  const [birthdayWishError, setBirthdayWishError] = useState('');
  const customMessageRef = useRef(null);

  const handleReadyMessageClick = (message) => {
    setSelectedMessage(message);
    setShowCustomMessage(true);
    setCustomMessage(message);
    setSentBirthdayWish(false);
    setBirthdayWishError('');
  };

  const handleCustomMessageClick = () => {
    setShowCustomMessage(true);
    setSelectedMessage('');
    setSentBirthdayWish(false);
    setBirthdayWishError('');
    window.requestAnimationFrame(() => customMessageRef.current?.focus());
  };

  const handleCustomMessageChange = (event) => {
    setCustomMessage(event.target.value);
    setSelectedMessage('');
    setSentBirthdayWish(false);
    setBirthdayWishError('');
  };

  const handleSendBirthdayWish = () => {
    const message = customMessage.trim();

    if (!message) {
      setBirthdayWishError('Please choose or write a birthday message.');
      setSentBirthdayWish(false);
      return;
    }

    setCustomMessage('');
    setSelectedMessage('');
    setSentBirthdayWish(true);
    setBirthdayWishError('');
  };

  if (!birthdayUser) {
    return (
      <section className="birthday-empty-state" aria-label="Birthday celebration">
        <span className="birthday-empty-state__icon" aria-hidden="true">
          <CakeOutlinedIcon fontSize="small" />
        </span>
        <div>
          <strong>No birthdays today</strong>
          <p>Birthday celebrations will appear here when someone is celebrating.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="birthday-card" aria-labelledby="birthday-card-title">
      <div className="birthday-card__header">
        <span className="birthday-card__icon" aria-hidden="true">
          <CakeOutlinedIcon />
        </span>
        <div className="birthday-card__heading">
          <span>Today’s Birthday</span>
          <h2 id="birthday-card-title">{birthdayUser.name}</h2>
          <p>Send a kind wish and make her day brighter.</p>
        </div>
      </div>

      <div className="birthday-card__messages" aria-label="Ready-made birthday wishes">
        {birthdayMessages.map((message) => (
          <button
            className={selectedMessage === message ? 'is-selected' : ''}
            type="button"
            onClick={() => handleReadyMessageClick(message)}
            key={message}
          >
            {message}
          </button>
        ))}
      </div>
      <button className="birthday-card__custom" type="button" onClick={handleCustomMessageClick}>
        Write your own message
      </button>
      {(showCustomMessage || birthdayWishError) && (
        <div className="birthday-card__custom-area">
          <textarea
            aria-describedby={birthdayWishError ? 'birthday-card-error' : undefined}
            aria-label="Birthday wish message"
            aria-invalid={Boolean(birthdayWishError)}
            className="birthday-card__textarea"
            ref={customMessageRef}
            value={customMessage}
            onChange={handleCustomMessageChange}
            rows="3"
            placeholder="Write a warm birthday message..."
          />
          {birthdayWishError && (
            <p className="birthday-card__error" id="birthday-card-error" role="alert">
              {birthdayWishError}
            </p>
          )}
        </div>
      )}
      <button
        className="birthday-card__send"
        type="button"
        onClick={handleSendBirthdayWish}
      >
        Send Birthday Wishes
      </button>
      {sentBirthdayWish && (
        <p className="birthday-card__success" aria-live="polite">
          Birthday wish submitted successfully.
        </p>
      )}
    </section>
  );
}
