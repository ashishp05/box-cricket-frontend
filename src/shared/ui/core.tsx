import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
  useState,
} from 'react';

import type { IconType } from 'react-icons';
import { MdBolt, MdCheckCircle, MdCheckCircleOutline, MdClose, MdErrorOutline, MdInfoOutline } from 'react-icons/md';

import { errorMessage } from '../api/client';
import type { BookingStatus } from '../api/types';
import { statusLabel } from '../lib/format';

const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'danger-outline' | 'default';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  loading?: boolean;
}

export const Button = ({
  variant = 'default',
  size = 'md',
  block,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={cx('btn', variant !== 'default' && variant, size !== 'md' && size, block && 'block', className)}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading && <span className="spinner sm" aria-hidden />}
    {children}
  </button>
);

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export const Field = ({ label, hint, error, children }: FieldProps) => {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children(id, describedBy)}
      {error ? (
        <span className="field-error" id={`${id}-err`} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="field-hint" id={`${id}-hint`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
};

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  prefix?: string;
};

export const InputField = ({ label, hint, error, prefix, className, ...rest }: InputFieldProps) => (
  <Field label={label} hint={hint} error={error}>
    {(id, describedBy) =>
      prefix ? (
        <div className="input-group">
          <span className="prefix">{prefix}</span>
          <input id={id} className={cx('input', className)} aria-invalid={!!error} aria-describedby={describedBy} {...rest} />
        </div>
      ) : (
        <input id={id} className={cx('input', className)} aria-invalid={!!error} aria-describedby={describedBy} {...rest} />
      )
    }
  </Field>
);

export const PasswordField = ({ label, hint, error, ...rest }: Omit<InputFieldProps, 'type' | 'prefix'>) => {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <div className="input-group">
          <input
            id={id}
            className="input"
            type={visible ? 'text' : 'password'}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...rest}
          />
          <span className="suffix">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setVisible(v => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
            >
              {visible ? 'Hide' : 'Show'}
            </button>
          </span>
        </div>
      )}
    </Field>
  );
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; hint?: ReactNode; error?: string };

export const SelectField = ({ label, hint, error, children, ...rest }: SelectFieldProps) => (
  <Field label={label} hint={hint} error={error}>
    {(id, describedBy) => (
      <select id={id} className="select" aria-invalid={!!error} aria-describedby={describedBy} {...rest}>
        {children}
      </select>
    )}
  </Field>
);

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode; error?: string };

export const TextareaField = ({ label, hint, error, ...rest }: TextareaFieldProps) => (
  <Field label={label} hint={hint} error={error}>
    {(id, describedBy) => <textarea id={id} className="textarea" aria-invalid={!!error} aria-describedby={describedBy} {...rest} />}
  </Field>
);

export const Spinner = ({ small }: { small?: boolean }) => <span className={cx('spinner', small && 'sm')} role="status" aria-label="Loading" />;

export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="center-block muted">
    <Spinner />
    <span className="small">{label}</span>
  </div>
);

export const Skeleton = ({ height = 16, width = '100%' }: { height?: number; width?: number | string }) => (
  <div className="skeleton" style={{ height, width }} aria-hidden />
);

type Tone = 'info' | 'warning' | 'danger' | 'success' | 'lime';
const toneClass: Record<Tone, string> = { info: '', warning: 'amber', danger: 'danger', success: 'success', lime: 'lime' };
const toneIcon: Record<Tone, IconType> = { info: MdInfoOutline, warning: MdErrorOutline, danger: MdErrorOutline, success: MdCheckCircleOutline, lime: MdBolt };

export const Banner = ({ tone = 'info', children, onClose }: { tone?: Tone; children: ReactNode; onClose?: () => void }) => {
  const Icon = toneIcon[tone];
  return (
    <div className={cx('banner', toneClass[tone])} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon aria-hidden />
      <div className="grow">{children}</div>
      {onClose && (
        <button type="button" className="close" onClick={onClose} aria-label="Dismiss">
          <MdClose size={20} />
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({
  art,
  title,
  children,
  action,
}: {
  art?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="center-block">
    {art}
    <h3 style={{ fontSize: 24 }}>{title}</h3>
    {children && <p className="muted" style={{ maxWidth: 420, marginTop: -4 }}>{children}</p>}
    {action}
  </div>
);

export const ErrorState = ({ error, onRetry, title = 'Something went wrong' }: { error: unknown; onRetry?: () => void; title?: string }) => (
  <EmptyState title={title} action={onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}>
    {errorMessage(error)}
  </EmptyState>
);

const statusTone: Record<BookingStatus, string> = {
  pending: 'amber',
  upcoming: '',
  completed: 'neutral',
  cancelled: 'danger',
};

export const StatusBadge = ({ status }: { status: BookingStatus }) => (
  <span className={cx('badge', statusTone[status])}>
    {status === 'upcoming' && <MdCheckCircle aria-hidden />}
    {statusLabel[status]}
  </span>
);

export const Badge = ({ tone, children }: { tone?: 'amber' | 'danger' | 'info' | 'neutral'; children: ReactNode }) => (
  <span className={cx('badge', tone)}>{children}</span>
);

export { cx };
