import './ReportBarList.css';

/**
 * Shared horizontal bar-chart used by both the Reports page (full lists) and
 * the Dashboard homepage summary cards (pass `maxRows` to show only the top
 * N). `rows` is `[{ label, value }]`, already sorted by the caller.
 */
export default function ReportBarList({ rows, emptyLabel, maxRows, tone = 'purple' }) {
  const visibleRows = maxRows ? rows.slice(0, maxRows) : rows;

  if (visibleRows.length === 0) {
    return <p className="admin-report-bars-empty">{emptyLabel}</p>;
  }

  const maxValue = Math.max(1, ...visibleRows.map((row) => row.value));

  return (
    <div className={`admin-report-bars admin-report-bars--${tone}`}>
      {visibleRows.map((row) => (
        <div className="admin-report-bar-row" key={row.label}>
          <span className="admin-report-bar-label" title={row.label}>{row.label}</span>
          <span className="admin-report-bar-track">
            <span
              className="admin-report-bar-fill"
              style={{ width: `${(row.value / maxValue) * 100}%` }}
            />
          </span>
          <span className="admin-report-bar-value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
