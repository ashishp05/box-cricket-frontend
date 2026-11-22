import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  // Block closing by backdrop/Escape, e.g. while a payment is processing.
  locked?: boolean;
}

export const Modal = ({ open, title, subtitle, onClose, children, footer, wide, locked }: ModalProps) => {
  const ref = useRef<HTMLDivElement>(null);
  // Latest close handler/lock without re-running the open effect (callers pass inline functions).
  const closeRef = useRef({ onClose, locked });
  useEffect(() => {
    closeRef.current = { onClose, locked };
  });

  // Runs only when the dialog opens or closes, so typing inside never steals focus back.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeRef.current.locked) closeRef.current.onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Focus the first field, else the dialog itself.
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    (first ?? ref.current)?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && !locked && onClose()}>
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} ref={ref} tabIndex={-1}>
        <div className="modal-head">
          <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
            <h3>{title}</h3>
            {subtitle && <p className="muted small">{subtitle}</p>}
          </div>
          {!locked && (
            <button type="button" className="btn ghost icon" onClick={onClose} aria-label="Close" data-close>
              ✕
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};
