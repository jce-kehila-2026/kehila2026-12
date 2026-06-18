import { useEffect, useRef, useState } from 'react';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function PostOverflowMenu({
  isOwnPost = false,
  isReportedByCurrentUser = false,
  onDeletePost,
  onEditPost,
  onReportPost,
  post,
  reportFeedbackId,
}) {
  const { t } = useParticipantLocale();
  const postMenuRef = useRef(null);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const postMenuId = `community-post-menu-${post.id}`;

  useEffect(() => {
    if (!isPostMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!postMenuRef.current?.contains(event.target)) {
        setIsPostMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isPostMenuOpen]);

  const handlePostMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsPostMenuOpen(false);
    }
  };

  const handleReportFromMenu = () => {
    if (isOwnPost || isReportedByCurrentUser) return;
    setIsPostMenuOpen(false);
    onReportPost();
  };

  const handleEditFromMenu = () => {
    if (!isOwnPost) return;
    setIsPostMenuOpen(false);
    onEditPost();
  };

  const handleDeleteFromMenu = () => {
    if (!isOwnPost) return;
    setIsPostMenuOpen(false);
    onDeletePost();
  };

  return (
    <div className="community-page-post__menu" ref={postMenuRef} onKeyDown={handlePostMenuKeyDown}>
      <button
        aria-controls={postMenuId}
        aria-expanded={isPostMenuOpen}
        aria-haspopup="menu"
        aria-label={t('openActionsAria').replace('{author}', post.author)}
        className="community-page-post__more"
        type="button"
        onClick={() => setIsPostMenuOpen((isOpen) => !isOpen)}
      >
        <MoreHorizOutlinedIcon fontSize="small" />
      </button>
      {isPostMenuOpen && (
        <div className="community-page-post__menu-popover" id={postMenuId} role="menu">
          {isOwnPost ? (
            <>
              <button
                className="community-page-post__menu-item"
                onClick={handleEditFromMenu}
                role="menuitem"
                type="button"
              >
                {t('editPostTitle')}
              </button>
              <button
                className="community-page-post__menu-item"
                onClick={handleDeleteFromMenu}
                role="menuitem"
                type="button"
              >
                {t('deletePost')}
              </button>
            </>
          ) : (
            <button
              aria-describedby={reportFeedbackId}
              className="community-page-post__menu-item"
              disabled={isReportedByCurrentUser}
              onClick={handleReportFromMenu}
              role="menuitem"
              type="button"
            >
              {isReportedByCurrentUser ? t('reported') : t('reportPost')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
