import { Link } from 'react-router-dom';
import { usePublicLocale } from '../context/PublicLocaleContext';

const HEADING_STYLE = {
  fontSize: '1.3rem',
  color: '#151126',
  borderBottom: '2px solid #e5e7eb',
  paddingBottom: '0.4rem',
};
const LABEL_STYLE = { fontWeight: 700 };
const ROW_STYLE = { display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' };
const ADAPTATION_KEYS = [
  'a11yAdapt1', 'a11yAdapt2', 'a11yAdapt3', 'a11yAdapt4', 'a11yAdapt5',
  'a11yAdapt6', 'a11yAdapt7', 'a11yAdapt8', 'a11yAdapt9', 'a11yAdapt10',
];

export default function AccessibilityStatementPage() {
  const { t, direction, lang } = usePublicLocale();

  return (
    <div
      dir={direction}
      lang={lang}
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#111',
        lineHeight: 1.8,
      }}
    >
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/public"
          style={{ color: '#1a56a0', textDecoration: 'underline', fontSize: '0.9rem' }}
        >
          ← {t('a11yBackHome')}
        </Link>
      </nav>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#151126' }}>
        {t('a11yTitle')}
      </h1>
      <p style={{ color: '#555', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {t('a11yLastUpdated')}
      </p>

      <section aria-labelledby="intro-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="intro-heading" style={HEADING_STYLE}>{t('a11yIntroHeading')}</h2>
        <p>{t('a11yIntroP1')}</p>
        <p>{t('a11yIntroP2')}</p>
      </section>

      <section aria-labelledby="level-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="level-heading" style={HEADING_STYLE}>{t('a11yLevelHeading')}</h2>
        <p>{t('a11yLevelP1')}</p>
        <p>{t('a11yLevelP2')}</p>
      </section>

      <section aria-labelledby="adaptations-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="adaptations-heading" style={HEADING_STYLE}>{t('a11yAdaptHeading')}</h2>
        <ul style={{ paddingInlineStart: '1.5rem', lineHeight: 2 }}>
          {ADAPTATION_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="limits-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="limits-heading" style={HEADING_STYLE}>{t('a11yLimitsHeading')}</h2>
        <p>{t('a11yLimitsP')}</p>
      </section>

      <section aria-labelledby="coordinator-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="coordinator-heading" style={HEADING_STYLE}>{t('a11yCoordHeading')}</h2>
        <p>{t('a11yCoordIntro')}</p>
        <address style={{ fontStyle: 'normal', backgroundColor: '#f9fafb', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <dl style={{ margin: 0, display: 'grid', gap: '0.5rem' }}>
            <div style={ROW_STYLE}>
              <dt style={LABEL_STYLE}>{t('a11yLabelName')}</dt>
              <dd style={{ margin: 0 }}>{t('a11yCoordNamePlaceholder')}</dd>
            </div>
            <div style={ROW_STYLE}>
              <dt style={LABEL_STYLE}>{t('a11yLabelEmail')}</dt>
              <dd style={{ margin: 0 }}>
                <a href="mailto:[accessibility@she-na.org.il]" style={{ color: '#1a56a0' }}>
                  [accessibility@she-na.org.il]
                </a>
              </dd>
            </div>
            <div style={ROW_STYLE}>
              <dt style={LABEL_STYLE}>{t('a11yLabelPhone')}</dt>
              <dd style={{ margin: 0 }}>
                <a href="tel:[+972-XX-XXXXXXX]" style={{ color: '#1a56a0' }}>
                  [+972-XX-XXXXXXX]
                </a>
              </dd>
            </div>
          </dl>
        </address>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555' }}>
          {t('a11yResponseCommitment')}
        </p>
      </section>

      <section aria-labelledby="legal-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="legal-heading" style={HEADING_STYLE}>{t('a11yLegalHeading')}</h2>
        <p>{t('a11yLegalP')}</p>
      </section>

      <p style={{ fontSize: '0.85rem', color: '#777', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        © {new Date().getFullYear()} SHE-NA. {t('a11yFooterUpdated')}
      </p>
    </div>
  );
}
