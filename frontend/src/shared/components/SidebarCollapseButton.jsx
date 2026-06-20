import { ChevronLeft, ChevronRight } from 'lucide-react';
import './SidebarCollapseButton.css';

export default function SidebarCollapseButton({
  collapsed = false,
  onClick,
  expandLabel,
  collapseLabel,
  id,
}) {
  return (
    <button
      type="button"
      className="participant-sidebar-collapse-btn"
      onClick={onClick}
      id={id}
      aria-label={collapsed ? expandLabel : collapseLabel}
      aria-expanded={!collapsed}
    >
      <span className="participant-sidebar-collapse-btn__icon" aria-hidden="true">
        {collapsed ? <ChevronRight size={15} strokeWidth={2.25} /> : <ChevronLeft size={15} strokeWidth={2.25} />}
      </span>
    </button>
  );
}
