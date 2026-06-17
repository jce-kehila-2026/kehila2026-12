import { ArrowRight } from 'lucide-react';
import '../../features/public/styles/public-sections.css';
import '../styles/public-cta-button.css';

export default function PublicCtaButton({
  children,
  className = '',
  showArrow = true,
  block = false,
  type = 'button',
  ...props
}) {
  const classes = [
    'public-button',
    'public-button--primary',
    'public-cta-button',
    block ? 'public-button--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {children}
      {showArrow ? (
        <ArrowRight size={16} strokeWidth={2.5} className="public-button__arrow" aria-hidden="true" />
      ) : null}
    </button>
  );
}
