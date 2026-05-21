export default function CommunityStreakCard() {
  return (
    <section className="community-streak-card" aria-label="Community streak">
      <span className="community-streak-card__icon" aria-hidden="true">
        ✨
      </span>
      <div>
        <span>Your streak</span>
        <strong>5 days</strong>
        <p>Stay active and support the community</p>
      </div>
    </section>
  );
}
