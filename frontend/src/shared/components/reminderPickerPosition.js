export const REMINDER_PICKER_OFFSET = 6;
export const REMINDER_PICKER_VIEWPORT_PADDING = 16;
export const REMINDER_PICKER_COMPACT_WIDTH = 248;
export const REMINDER_PICKER_DEFAULT_WIDTH = 268;
export const REMINDER_PICKER_Z_INDEX = 10001;

/**
 * @param {DOMRect} anchorRect
 * @param {{
 *   compact?: boolean,
 *   estimatedHeight?: number,
 *   measuredHeight?: number,
 * }} options
 * @returns {import('react').CSSProperties}
 */
export function computeReminderPickerPopoverStyle(anchorRect, options = {}) {
  const {
    compact = false,
    estimatedHeight = compact ? 180 : 260,
    measuredHeight,
  } = options;

  const panelHeight = measuredHeight || estimatedHeight;
  const minWidth = compact ? REMINDER_PICKER_COMPACT_WIDTH : REMINDER_PICKER_DEFAULT_WIDTH;
  const panelWidth = compact ? REMINDER_PICKER_COMPACT_WIDTH : Math.max(anchorRect.width, minWidth);

  let left = anchorRect.left;
  const top = anchorRect.bottom + REMINDER_PICKER_OFFSET;

  if (left + panelWidth > window.innerWidth - REMINDER_PICKER_VIEWPORT_PADDING) {
    left = Math.max(
      REMINDER_PICKER_VIEWPORT_PADDING,
      window.innerWidth - panelWidth - REMINDER_PICKER_VIEWPORT_PADDING,
    );
  }

  const maxTop = window.innerHeight - REMINDER_PICKER_VIEWPORT_PADDING - panelHeight;
  const resolvedTop = Math.min(top, Math.max(REMINDER_PICKER_VIEWPORT_PADDING, maxTop));

  return {
    position: 'fixed',
    top: `${resolvedTop}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
    zIndex: REMINDER_PICKER_Z_INDEX,
  };
}
