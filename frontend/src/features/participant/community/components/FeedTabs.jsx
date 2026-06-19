import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function FeedTabs({ activeTab, onTabChange, tabs = [] }) {
  const { t } = useParticipantLocale();
  return (
    <div className="community-feed-tabs" role="tablist" aria-label={t('feedFiltersAria')}>
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
          {tab.labelKey ? t(tab.labelKey) : tab.label}
        </button>
      ))}
    </div>
  );
}
