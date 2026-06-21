import { useCallback, useEffect } from 'react';
import { computeReminderPickerPopoverStyle } from './reminderPickerPosition';

/**
 * @param {{
 *   isOpen: boolean,
 *   portal: boolean,
 *   rootRef: import('react').RefObject<HTMLElement|null>,
 *   panelRef: import('react').RefObject<HTMLElement|null>,
 *   setPanelStyle: (style: import('react').CSSProperties) => void,
 *   compact?: boolean,
 *   estimatedHeight?: number,
 * }} options
 */
export default function useReminderPickerPortalPosition({
  isOpen,
  portal,
  rootRef,
  panelRef,
  setPanelStyle,
  compact = false,
  estimatedHeight,
}) {
  const updatePanelPosition = useCallback(() => {
    if (!portal || !rootRef.current) return;

    const anchorRect = rootRef.current.getBoundingClientRect();
    const measuredHeight = panelRef.current?.getBoundingClientRect().height;

    setPanelStyle(computeReminderPickerPopoverStyle(anchorRect, {
      compact,
      estimatedHeight,
      measuredHeight,
    }));
  }, [compact, estimatedHeight, panelRef, portal, rootRef, setPanelStyle]);

  useEffect(() => {
    if (!isOpen || !portal) return undefined;

    updatePanelPosition();

    const frameId = window.requestAnimationFrame(() => {
      updatePanelPosition();
    });

    const handleLayoutChange = () => updatePanelPosition();
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [isOpen, portal, updatePanelPosition]);

  return updatePanelPosition;
}
