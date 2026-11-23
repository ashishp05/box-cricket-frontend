import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { MdCheckCircle } from 'react-icons/md';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { errorMessage } from '@shared/api/client';
import { phoneText } from '@shared/lib/format';
import { nameError, phoneError, sanitizeName, sanitizePhone } from '@shared/lib/validation';
import { Banner, Button } from '@shared/ui/core';
import { OtpInput } from '@shared/ui/OtpInput';
import { useToast } from '@shared/ui/Toast';

import { api } from '../api';
import { BallMark } from '../components/art';
import { customerSession, LOGIN_WITH_OTP, loadGuest, useCustomer } from '../session';

type Step = 'phone' | 'code' | 'name';

// Only same-site paths are allowed as the return target.
const safeFrom = (from: string | null) => (from && from.startsWith('/') && !from.startsWith('//') ? from : '/bookings');

export const Auth = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const customer = useCustomer();
  const [params] = useSearchParams();
  const from = safeFrom(params.get('from'));
  const guest = loadGuest();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState(sanitizePhone(guest?.phone ?? ''));
  const [code, setCode] = useState('');
  const [name, setName] = useState(guest?.name ?? '');
  const [devCode, setDevCode] = useState<string>();
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [finishing, setFinishing] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (step !== 'code') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [step]);

  if (customer && !finishing && step !== 'name') return <Navigate to={from} replace />;

  const done = () => {
    void queryClient.invalidateQueries();
    toast.show('You are logged in.');
    navigate(from, { replace: true });
  };

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    const p = phone;
    const problem = phoneError(p);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const sent = await api.sendOtp(p);
      setPhone(p);
      setDevCode(sent.devCode);
      setResendAt(Date.now() + sent.resendAfter * 1000);
      setNow(Date.now());
      setCode('');
      setStep('code');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    setBusy(true);
    setError(undefined);
    setFinishing(true);
    try {
      const session = await api.verifyOtp(phone, value, guest?.name && !nameError(guest.name) ? guest.name.trim() : undefined);
      customerSession.set({ token: session.token, visitor: session.visitor });
      if (session.needsName) setStep('name');
      else done();
    } catch (err) {
      setFinishing(false);
      setError(errorMessage(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    const problem = nameError(name);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const visitor = await api.updateMe({ name: name.trim() });
      customerSession.update({ visitor });
      done();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  // Simple login: name + mobile, no SMS code.
  const simpleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const found = { name: nameError(name), phone: phoneError(phone) };
    setErrors(found);
    if (found.name || found.phone) return;
    setBusy(true);
    setError(undefined);
    setFinishing(true);
    try {
      const session = await api.simpleLogin(name.trim(), phone);
      customerSession.set({ token: session.token, visitor: session.visitor });
      done();
    } catch (err) {
      setFinishing(false);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container auth-grid">
      <div className="auth-promo">
        <BallMark size={56} />
        <h2>
          Your next match
          <br />
          is one tap away
        </h2>
        <ul>
          {['See live slots and exact prices', 'Hold your slot while you pay', 'Manage, reschedule or cancel anytime'].map((t) => (
            <li key={t}>
              <MdCheckCircle aria-hidden /> {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="card auth-card">
        <h1>{step === 'name' ? 'One last thing' : LOGIN_WITH_OTP ? 'Login or sign up' : 'Your Details'}</h1>
        <p className="muted" style={{ marginTop: 4 }}>
          {step === 'name' ? 'What name should we put on your bookings?' : LOGIN_WITH_OTP ? 'Takes 20 seconds. No password needed.' : 'Enter your name and mobile number to book and manage your games.'}
        </p>

        {!LOGIN_WITH_OTP && (
          <form className="stack" style={{ '--gap': '16px', marginTop: 22 } as React.CSSProperties} onSubmit={simpleLogin} noValidate>
            <label className="field">
              <span className="field-label">Full name</span>
              <input
                className="input"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                maxLength={80}
                onChange={(e) => {
                  setName(sanitizeName(e.target.value));
                  setErrors((x) => ({ ...x, name: undefined }));
                }}
                aria-invalid={!!errors.name}
                autoFocus
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>
            <label className="field">
              <span className="field-label">Mobile number</span>
              <span className="input-group">
                <span className="prefix">+91</span>
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="10-digit number"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => {
                    setPhone(sanitizePhone(e.target.value));
                    setErrors((x) => ({ ...x, phone: undefined }));
                  }}
                  aria-invalid={!!errors.phone}
                />
              </span>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
            {error && <Banner tone="danger">{error}</Banner>}
            <Button type="submit" variant="primary" size="lg" block loading={busy}>
              Continue
            </Button>
            <p className="tiny muted">By continuing you agree to our Terms of Use and Privacy Policy.</p>
          </form>
        )}

        {LOGIN_WITH_OTP && step === 'phone' && (
          <form className="stack" style={{ '--gap': '16px', marginTop: 22 } as React.CSSProperties} onSubmit={sendCode} noValidate>
            <label className="field">
              <span className="field-label">Mobile number</span>
              <span className="input-group">
                <span className="prefix">+91</span>
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="10-digit number"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => {
                    setPhone(sanitizePhone(e.target.value));
                    setError(undefined);
                  }}
                  aria-invalid={!!error}
                  autoFocus
                />
              </span>
              {error && <span className="field-error">{error}</span>}
            </label>
            <Button type="submit" variant="primary" size="lg" block loading={busy}>
              Get OTP
            </Button>
            <p className="tiny muted">By continuing you agree to our Terms of Use and Privacy Policy.</p>
          </form>
        )}

        {step === 'code' && (
          <form
            className="stack"
            style={{ '--gap': '16px', marginTop: 22 } as React.CSSProperties}
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
            noValidate
          >
            <div>
              <p className="muted" style={{ fontSize: 15 }}>
                Enter the 6-digit code sent to
              </p>
              <div className="row between" style={{ marginTop: 8 }}>
                <strong style={{ fontWeight: 500, fontSize: 16 }}>{phoneText(phone)}</strong>
                <button type="button" className="link" onClick={() => setStep('phone')}>
                  Change
                </button>
              </div>
            </div>
            <OtpInput
              value={code}
              invalid={!!error}
              disabled={busy}
              onChange={(next) => {
                setCode(next);
                setError(undefined);
                if (next.length === 6) void verify(next);
              }}
            />
            {error && (
              <span className="field-error" role="alert">
                {error}
              </span>
            )}
            <Button type="submit" variant="primary" size="lg" block loading={busy} disabled={code.length !== 6}>
              Verify & continue
            </Button>
            <p className="center small muted">
              {resendIn > 0 ? (
                `Resend OTP in ${resendIn}s`
              ) : (
                <button type="button" className="link" onClick={() => void sendCode()} disabled={busy}>
                  Resend OTP
                </button>
              )}
            </p>
            {devCode && <Banner>Test mode: SMS is not set up on the server, so your code is {devCode}.</Banner>}
          </form>
        )}

        {step === 'name' && (
          <form className="stack" style={{ '--gap': '16px', marginTop: 22 } as React.CSSProperties} onSubmit={saveName} noValidate>
            <label className="field">
              <span className="field-label">Full name</span>
              <input className="input" autoComplete="name" placeholder="Your name" value={name} maxLength={80} onChange={(e) => setName(sanitizeName(e.target.value))} autoFocus />
              {error && <span className="field-error">{error}</span>}
            </label>
            <Button type="submit" variant="primary" size="lg" block loading={busy}>
              Continue
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
