import { useState } from 'react';
import { birthdayMessages } from '../communityMockData';

export default function BirthdayCard() {
  const [selectedMessage, setSelectedMessage] = useState('');
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [sentBirthdayWish, setSentBirthdayWish] = useState(false);
  const canSendBirthdayWish = selectedMessage || customMessage.trim();

  const handleReadyMessageClick = (message) => {
    setSelectedMessage(message);
    setSentBirthdayWish(false);
  };

  const handleCustomMessageClick = () => {
    setShowCustomMessage(true);
    setSelectedMessage('');
    setSentBirthdayWish(false);
  };

  const handleCustomMessageChange = (event) => {
    setCustomMessage(event.target.value);
    setSentBirthdayWish(false);
  };

  const handleSendBirthdayWish = () => {
    if (!canSendBirthdayWish) return;
    setSentBirthdayWish(true);
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
      {showCustomMessage && (
        <textarea
          className="birthday-card__textarea"
          value={customMessage}
          onChange={handleCustomMessageChange}
          rows="3"
          placeholder="Write a warm birthday message..."
        />
      )}
      <button
        className="birthday-card__send"
        type="button"
        disabled={!canSendBirthdayWish}
        onClick={handleSendBirthdayWish}
      >
        Send Birthday Wishes
      </button>
      {sentBirthdayWish && <p className="birthday-card__success">Birthday wishes ready to send.</p>}
    </section>
  );
}
