import { Link } from 'react-router-dom';

export default function AccessibilityStatementPage() {
  return (
    <div
      dir="rtl"
      lang="he"
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
          ← חזרה לדף הבית
        </Link>
      </nav>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#151126' }}>
        הצהרת נגישות
      </h1>
      <p style={{ color: '#555', marginBottom: '2rem', fontSize: '0.9rem' }}>
        עודכן לאחרונה: מאי 2026
      </p>

      {/* 1. מבוא */}
      <section aria-labelledby="intro-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="intro-heading" style={{ fontSize: '1.3rem', color: '#151126', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem' }}>
          מבוא
        </h2>
        <p>
          עמותת <strong>שי-נא (SHE-NA)</strong> מחויבת להנגשת אתר האינטרנט שלה לכלל הציבור, לרבות אנשים עם מוגבלויות.
          אנו שואפים לעמוד בדרישות תקן הנגישות הישראלי <strong>ת"י 5568</strong> ברמת התאמה <strong>AA</strong>,
          המבוסס על הנחיות <strong>WCAG 2.0</strong> של ארגון W3C.
        </p>
        <p>
          הצהרה זו חלה על האתר הציבורי של עמותת שי-נא, לרבות פורטל המשתתפות ופאנל הניהול.
        </p>
      </section>

      {/* 2. רמת נגישות */}
      <section aria-labelledby="level-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="level-heading" style={{ fontSize: '1.3rem', color: '#151126', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem' }}>
          רמת הנגישות
        </h2>
        <p>
          האתר עומד ברמת נגישות <strong>AA</strong> בהתאם לתקן <strong>ת"י 5568</strong> ולהנחיות <strong>WCAG 2.0 AA</strong>.
        </p>
        <p>
          הבדיקות בוצעו על גבי דפדפנים מובילים (Chrome, Firefox, Edge, Safari) ועל מגוון מכשירים, לרבות טלפונים ניידים.
        </p>
      </section>

      {/* 3. התאמות שבוצעו */}
      <section aria-labelledby="adaptations-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="adaptations-heading" style={{ fontSize: '1.3rem', color: '#151126', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem' }}>
          התאמות הנגישות שבוצעו
        </h2>
        <ul style={{ paddingRight: '1.5rem', lineHeight: 2 }}>
          <li>סרגל נגישות גלובלי הכולל: הגדלת טקסט, ניגודיות גבוהה, גווני אפור, הדגשת קישורים, פונט קריא ועצירת הבהובים.</li>
          <li>שמירת העדפות הנגישות של המשתמש/ת בדפדפן (localStorage) לשמירה בין ביקורים.</li>
          <li>תמיכה מלאה בכיוון טקסט מימין לשמאל (RTL) בעברית ובערבית.</li>
          <li>כל התמונות מכילות תיאורי טקסט חלופי (alt text).</li>
          <li>ניווט מלא במקלדת לכל רכיבי הממשק האינטראקטיביים.</li>
          <li>קישור "דילוג לתוכן המרכזי" בראש כל עמוד.</li>
          <li>שימוש בתגיות HTML סמנטיות (<code>main</code>, <code>nav</code>, <code>footer</code>, <code>section</code>, <code>h1</code>–<code>h6</code>).</li>
          <li>ניגודיות צבעים מינימלית של 4.5:1 בין טקסט לרקע.</li>
          <li>תמיכה בשינוי גודל טקסט עד 200% ללא אובדן תוכן.</li>
          <li>הגדרות <code>aria-label</code>, <code>aria-expanded</code> ו-<code>role</code> על כל הרכיבים האינטראקטיביים.</li>
        </ul>
      </section>

      {/* 4. מגבלות ידועות */}
      <section aria-labelledby="limits-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="limits-heading" style={{ fontSize: '1.3rem', color: '#151126', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem' }}>
          מגבלות ידועות
        </h2>
        <p>
          אנו ממשיכים לשפר את הנגישות ולטפל בפערים שנמצאו. אם נתקלת בבעיה, אנא פנה/י לרכז/ת הנגישות שלנו (ראה/י פרטים למטה).
        </p>
      </section>

      {/* 5. פרטי רכז נגישות */}
      <section aria-labelledby="coordinator-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="coordinator-heading" style={{ fontSize: '1.3rem', color: '#151126', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem' }}>
          פרטי רכז/ת נגישות
        </h2>
        <p>
          אם נתקלת בבעיית נגישות באתר או ברצונך לדווח על חוויה שאינה נגישה, ניתן לפנות לרכז/ת הנגישות שלנו:
        </p>
        <address style={{ fontStyle: 'normal', backgroundColor: '#f9fafb', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <dl style={{ margin: 0, display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
              <dt style={{ fontWeight: 700 }}>שם:</dt>
              <dd style={{ margin: 0 }}>[שם רכז/ת הנגישות]</dd>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
              <dt style={{ fontWeight: 700 }}>דוא"ל:</dt>
              <dd style={{ margin: 0 }}>
                <a href="mailto:[accessibility@she-na.org.il]" style={{ color: '#1a56a0' }}>
                  [accessibility@she-na.org.il]
                </a>
              </dd>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
              <dt style={{ fontWeight: 700 }}>טלפון:</dt>
              <dd style={{ margin: 0 }}>
                <a href="tel:[+972-XX-XXXXXXX]" style={{ color: '#1a56a0' }}>
                  [+972-XX-XXXXXXX]
                </a>
              </dd>
            </div>
          </dl>
        </address>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#555' }}>
          אנו מתחייבים להשיב לכל פנייה בנושא נגישות תוך <strong>7 ימי עסקים</strong>.
        </p>
      </section>

      {/* 6. בסיס חוקי */}
      <section aria-labelledby="legal-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="legal-heading" style={{ fontSize: '1.3rem', color: '#151126', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem' }}>
          בסיס חוקי
        </h2>
        <p>
          הצהרה זו נכתבה בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ"ח-1998, ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע"ג-2013.
        </p>
      </section>

      <p style={{ fontSize: '0.85rem', color: '#777', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        © {new Date().getFullYear()} SHE-NA. הצהרה זו עודכנה לאחרונה במאי 2026.
      </p>
    </div>
  );
}
