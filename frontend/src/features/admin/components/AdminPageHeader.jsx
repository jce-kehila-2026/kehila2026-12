import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './AdminPageHeader.css';

export default function AdminPageHeader({ title, subtitle, actions, children, className = '' }) {
  const [topbarTarget, setTopbarTarget] = useState(null);

  useEffect(() => {
    setTopbarTarget(document.getElementById('admin-topbar-page-header'));
  }, []);

  const header = (
    <header className={`admin-page-header admin-page-header--topbar${className ? ` ${className}` : ''}`}>
      <div className="admin-page-header__content">
        <h1 className="admin-page-title">{title}</h1>
        {subtitle ? <p className="admin-page-subtitle">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  );

  if (topbarTarget) {
    return createPortal(header, topbarTarget);
  }

  return header;
}
