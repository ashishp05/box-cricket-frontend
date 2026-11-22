import { type FormEvent, type ReactNode, useState } from 'react';

import { nameError, phoneError, sanitizeName, sanitizePhone } from '@shared/lib/validation';

import { Logo } from './art';
import { loadGuest, saveGuest, useCustomer } from '../session';

// First-visit welcome screen (name + mobile), as on the original site. The details stay on this
// device and pre-fill login and checkout; logging in with an OTP is still required to book.
export const WelcomeGate = ({ children }: { children: ReactNode }) => {
  const customer = useCustomer();
  const [guest, setGuest] = useState(loadGuest);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  if (guest || customer) return <>{children}</>;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const p = phone;
    const next = { name: nameError(name), phone: phoneError(p) };
    setErrors(next);
    if (next.name || next.phone) return;
    const value = { name: name.trim(), phone: p };
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
          <button type="submit" className="btn primary lg block">
            Continue
          </button>
          <p className="tiny muted center">We use these to fill in your booking faster. You confirm your number with a one-time code when you book.</p>
        </div>
      </form>
    </main>
  );
};
