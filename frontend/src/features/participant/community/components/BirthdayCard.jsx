import { useState } from 'react';
import { birthdayMessages, communityBirthdayUsers } from '../communityMockData';

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
  const todaysBirthdayUsers = getTodaysBirthdayUsers([
    ...birthdayUsers,
    ...communityBirthdayUsers,
  ]);
  const birthdayUser = todaysBirthdayUsers[0];
  const [selectedMessage, setSelectedMessage] = useState('');
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [sentBirthdayWish, setSentBirthdayWish] = useState(false);
  const [birthdayWishError, setBirthdayWishError] = useState('');

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
        No birthdays today
      </section>
    );
  }

  return (
    <section className="birthday-card" aria-label="Birthday celebration">
      <div className="birthday-card__header">
        <span className="birthday-card__icon" aria-hidden="true">
          🎂
        </span>
        <div>
          <span>Community celebration</span>
          <h2>Today is {birthdayUser.name}’s birthday!</h2>
        </div>
      </div>
      <p>Would you like to send {birthdayUser.name} a kind message?</p>
      <div className="birthday-card__messages">
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
        Write Your Own Message
      </button>
      {(showCustomMessage || birthdayWishError) && (
        <>
          <textarea
            aria-describedby={birthdayWishError ? 'birthday-card-error' : undefined}
            aria-invalid={Boolean(birthdayWishError)}
            className="birthday-card__textarea"
            value={customMessage}
            onChange={handleCustomMessageChange}
            rows="3"
            placeholder="Write a warm birthday message..."
          />
          {birthdayWishError && (
            <p className="birthday-card__error" id="birthday-card-error">
              {birthdayWishError}
            </p>
          )}
        </>
      )}
      <button
        className="birthday-card__send"
        type="button"
        onClick={handleSendBirthdayWish}
      >
        Send Birthday Wishes
      </button>
      {sentBirthdayWish && <p className="birthday-card__success">Birthday wish submitted successfully.</p>}
    </section>
  );
}
