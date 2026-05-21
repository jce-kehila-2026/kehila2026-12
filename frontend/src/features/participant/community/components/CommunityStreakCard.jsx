export default function CommunityStreakCard({ isAtRisk = false, streakCount = 0 }) {
  return (
    <section className="community-streak-card" aria-label="Community streak">
      <span className="community-streak-card__icon" aria-hidden="true">
        {isAtRisk ? '⏳' : '✨'}
      </span>
      <div>
        <span>Your streak</span>
        <strong>{streakCount} days</strong>
        <p>Stay active and support the community</p>
      </div>
    </section>
  );
}
