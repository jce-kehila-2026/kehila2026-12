import './AdminPageHeader.css';

export default function AdminPageHeader({ title, subtitle, actions, children, className = '' }) {
  return (
    <header className={`admin-page-header${className ? ` ${className}` : ''}`}>
      <div className="admin-page-header__content">
        <h1 className="admin-page-title">{title}</h1>
        {subtitle ? <p className="admin-page-subtitle">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  );
}
