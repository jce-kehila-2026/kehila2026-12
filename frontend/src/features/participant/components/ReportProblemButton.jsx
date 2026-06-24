import { useEffect, useState } from 'react';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '../../admin/context/AdminContext';
import { useParticipantLocale } from '../context/ParticipantLocaleContext';
import { createBugReport, BUG_REPORT_CATEGORIES } from '../services/bugReportService';
import './ReportProblemButton.css';

/**
 * Header "Report a problem" button (sits next to the notifications bell) plus a
 * lightweight modal. Self-contained: manages its own open/submit state, captures
 * the current route/locale automatically, and writes a bugReports doc attributed
 * to the signed-in user.
 */
export default function ReportProblemButton() {
  const { t, lang } = useParticipantLocale();
  const { currentUser } = useAdmin();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('bug');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  // Close on Escape while the dialog is open.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const openModal = () => {
    setCategory('bug');
    setMessage('');
    setStatus('idle');
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || status === 'submitting') return;
    setStatus('submitting');
    try {
      await createBugReport({
        message,
        category,
        route: location.pathname,
        locale: lang,
        reporterName: currentUser?.displayName || '',
      });
      setStatus('success');
    } catch (err) {
      console.error('Bug report failed:', err);
      setStatus('error');
    }
  };

  const categoryLabels = {
    bug: t('reportCatBug'),
    visual: t('reportCatVisual'),
    content: t('reportCatContent'),
    performance: t('reportCatPerformance'),
    other: t('reportCatOther'),
  };

  return (
    <>
      <button
        type="button"
        className="pd-header-icon-btn"
        aria-label={t('reportProblem')}
        title={t('reportProblem')}
        onClick={openModal}
      >
        <BugReportOutlinedIcon />
      </button>

      {open && (
        <div className="report-modal__overlay" role="presentation" onClick={closeModal}>
          <div
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('reportTitle')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="report-modal__header">
              <div className="report-modal__heading">
                <h2>{t('reportTitle')}</h2>
                <p>{t('reportSubtitle')}</p>
              </div>
              <button
                type="button"
                className="report-modal__close"
                aria-label={t('reportCancel')}
                onClick={closeModal}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            {status === 'success' ? (
              <div className="report-modal__success">
                <p>{t('reportSuccess')}</p>
                <button type="button" className="report-modal__submit" onClick={closeModal}>
                  {t('reportDone')}
                </button>
              </div>
            ) : (
              <form className="report-modal__form" onSubmit={handleSubmit}>
                <label className="report-modal__field">
                  <span>{t('reportCategoryLabel')}</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {BUG_REPORT_CATEGORIES.map((key) => (
                      <option key={key} value={key}>{categoryLabels[key]}</option>
                    ))}
                  </select>
                </label>

                <label className="report-modal__field">
                  <span>{t('reportMessageLabel')}</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t('reportMessagePlaceholder')}
                    rows={5}
                    maxLength={5000}
                    required
                  />
                </label>

                {status === 'error' && (
                  <p className="report-modal__error">{t('reportError')}</p>
                )}

                <div className="report-modal__actions">
                  <button type="button" className="report-modal__cancel" onClick={closeModal}>
                    {t('reportCancel')}
                  </button>
                  <button
                    type="submit"
                    className="report-modal__submit"
                    disabled={!message.trim() || status === 'submitting'}
                  >
                    {status === 'submitting' ? t('reportSubmitting') : t('reportSubmit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
