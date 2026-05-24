export default function FeedTabs({ activeTab, onTabChange, tabs = [] }) {
  return (
    <div className="community-feed-tabs" role="tablist" aria-label="Community feed filters">
      {tabs.map((tab) => (
        <button
          aria-controls="community-feed-panel"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? 'is-active' : undefined}
          id={`community-feed-tab-${tab.id}`}
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
