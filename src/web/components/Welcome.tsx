import { type FormEvent, type ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { nameError, phoneError, sanitizeName, sanitizePhone } from '@shared/lib/validation';

import { api } from '../api';
import { customerSession, LOGIN_WITH_OTP, loadGuest, saveGuest, useCustomer } from '../session';
import { Logo } from './art';

// First-visit welcome screen (name + mobile). With simple login this also signs the customer in;
// with OTP login the details only pre-fill login and checkout.
export const WelcomeGate = ({ children }: { children: ReactNode }) => {
  const customer = useCustomer();
  // Payment links open straight to the pay page.
  const onPayLink = /^\/pay\/od/i.test(useLocation().pathname);
  const [guest, setGuest] = useState(loadGuest);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);

  if (guest || customer || onPayLink) return <>{children}</>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const p = phone;
    const next = { name: nameError(name), phone: phoneError(p) };
    setErrors(next);
    if (next.name || next.phone) return;
    const value = { name: name.trim(), phone: p };
    if (!LOGIN_WITH_OTP) {
      setBusy(true);
      try {
        const session = await api.simpleLogin(value.name, value.phone);
        customerSession.set({ token: session.token, visitor: session.visitor });
      } catch {
        // Server unreachable: let them browse; booking asks them to log in again.
      } finally {
        setBusy(false);
      }
    }
    saveGuest(value);
    setGuest(value);
  };

  return (
    <main className="welcome">
      <form className="welcome-inner" onSubmit={submit} noValidate>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo />
        </div>
        <h1>Welcome to The Riverside Cricket Box</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Enter your name and mobile number to browse slots and book. We will remember you on this device.
        </p>
        <div className="stack" style={{ '--gap': '16px', marginTop: 24, textAlign: 'left' } as React.CSSProperties}>
          <label className="field">
            <span className="field-label">Full name</span>
            <input className="input filled" placeholder="Your name" autoComplete="name" value={name} maxLength={80} onChange={(e) => setName(sanitizeName(e.target.value))} aria-invalid={!!errors.name} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="field">
            <span className="field-label">Mobile number</span>
            <span className="input-group">
              <span className="prefix">+91</span>
              <input className="input" type="tel" inputMode="numeric" placeholder="10-digit mobile" autoComplete="tel-national" value={phone} maxLength={10} onChange={(e) => setPhone(sanitizePhone(e.target.value))} aria-invalid={!!errors.phone} />
            </span>
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>
          <button type="submit" className="btn primary lg block" disabled={busy} aria-busy={busy || undefined}>
            {busy && <span className="spinner sm" aria-hidden />} Continue
          </button>
          <p className="tiny muted center">
            {LOGIN_WITH_OTP
              ? 'We use these to fill in your booking faster. You confirm your number with a one-time code when you book.'
              : 'Your bookings and tickets are linked to this mobile number.'}
          </p>
        </div>
      </form>
    </main>
  );
};
