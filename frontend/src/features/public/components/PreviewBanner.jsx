/**
 * Admin CMS preview bar. Rendered (fixed, bottom of viewport) on every public
 * page whenever `?preview=1` is active, so preview mode stays visible while
 * navigating between public sections/pages — not just on the home page.
 * Styles live in features/public/styles/PublicHomePage.css (.public-preview-banner),
 * which every public page imports.
 */
export default function PreviewBanner() {
  return (
    <div className="public-preview-banner" role="banner">
      <span className="public-preview-banner__label">⚙ Preview mode</span>
      <a className="public-preview-banner__back" href="/admin/cms">
        ← Back to Admin
      </a>
    </div>
  );
}
