import { useState } from 'react';
import { birthdayMessages } from '../communityMockData';

export default function BirthdayCard() {
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

  return (
    <section className="birthday-card" aria-label="Birthday celebration">
      <div className="birthday-card__header">
        <span className="birthday-card__icon" aria-hidden="true">
          🎂
        </span>
        <div>
          <span>Community celebration</span>
          <h2>Today is Sara’s birthday!</h2>
        </div>
      </div>
      <p>Would you like to send her a kind message?</p>
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
      {sentBirthdayWish && <p className="birthday-card__success">Birthday wishes ready to send.</p>}
    </section>
  );
}
