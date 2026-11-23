import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useMemo, useRef, useState } from 'react';
import { LuArrowRight, LuCircleAlert, LuLock, LuMail, LuMessageSquare, LuMinus, LuPhone, LuPlus, LuUser, LuUsers } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import { phoneText, rupees } from '@shared/lib/format';
import { useSecondsLeft } from '@shared/lib/time';
import { emailError, nameError, NOTE_MAX, sanitizeName } from '@shared/lib/validation';
import { Button, cx } from '@shared/ui/core';
import { useToast } from '@shared/ui/Toast';

import { api } from '../api';
import { ArenaHeader, HoldTimer, PriceError, PriceLines, PriceSkeleton, SlotFacts } from '../components/booking';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { useVenue } from '../hooks';
import { customerSession, loadGuest, useCustomer } from '../session';
import { HOLD_SECONDS, HoldExpiredModal, useHoldPrice } from './Checkout';
import { loadHold, loadOfferCode, saveHold, saveOfferCode } from './checkout-state';

const MAX_PLAYERS = 30;
type Errors = Partial<Record<'name' | 'email' | 'players', string>>;

// Step 4: who is playing. Creates the pending booking, then goes to payment.
export const Details = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const customer = useCustomer();
  const venue = useVenue();
  const hold = useMemo(loadHold, []);
  const offerCode = useMemo(loadOfferCode, []);
  const secondsLeft = useSecondsLeft(hold?.expiresAt);
  const price = useHoldPrice(hold, offerCode);
  const guest = loadGuest();

  const [name, setName] = useState(customer?.visitor.name || guest?.name || '');
  const [email, setEmail] = useState(customer?.visitor.email ?? '');
  const [players, setPlayers] = useState('12');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (): Errors => {
    const n = Number(players);
    return {
      name: nameError(name),
      email: email.trim() ? emailError(email) : undefined,
      players: !players.trim() || !Number.isInteger(n) || n < 1 || n > MAX_PLAYERS ? `Enter a number of players from 1 to ${MAX_PLAYERS}.` : undefined,
    };
  };

  const create = useMutation({
    mutationFn: async () => {
      const v = customer!.visitor;
      const nextEmail = email.trim() || null;
      // Save email (and a missing name) to the profile so receipts and future bookings use them.
      if (nextEmail !== (v.email ?? null) || !v.name) {
        const updated = await api.updateMe({ email: nextEmail, ...(!v.name && { name: name.trim() }) });
        customerSession.update({ visitor: updated });
      }
      return api.createBooking({ holdId: hold!.holdId, customerName: name.trim(), players: Number(players), notes: notes.trim() || undefined, offerCode: offerCode ?? undefined });
    },
    onSuccess: (booking) => {
      saveHold(null);
      saveOfferCode(null);
      navigate(`/checkout/payment/${booking.id}`, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 410 || error.status === 404)) {
        saveHold(null);
        toast.error('Your hold has expired. Please pick your slots again.');
        navigate(`/book?date=${hold?.date ?? ''}&step=time`, { replace: true });
        return;
      }
      toast.error(errorMessage(error));
    },
  });

  if (!customer) return <Navigate to="/auth?from=/checkout/details" replace />;
  if (!hold) return <Navigate to="/book" replace />;

  const sorted = [...hold.hours].sort((a, b) => a - b);
  const expired = secondsLeft === 0;
  const v = venue.data;
  const shownErrors: Errors = submitted ? validate() : errors;
  const errorCount = Object.values(shownErrors).filter(Boolean).length;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const found = validate();
    setErrors(found);
    setSubmitted(true);
    const first = (['name', 'email', 'players'] as const).find((k) => found[k]);
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    create.mutate();
  };

  const step = (delta: number) => {
    const n = Math.min(MAX_PLAYERS, Math.max(1, (Number(players) || 0) + delta));
    setPlayers(String(n));
  };

  return (
    <CheckoutLayout step={4} title="Your details" onBack={() => navigate('/checkout/summary')}>
      <div className="bk-layout">
        <div className="bk-main-col">
          <div className="bk-head">
            <h1>Your Details</h1>
            <p>We'll send the confirmation and ticket to your mobile number.</p>
          </div>
          {secondsLeft !== null && <HoldTimer secondsLeft={secondsLeft} total={HOLD_SECONDS} />}

          {submitted && errorCount > 0 && (
            <div className="bk-errors" role="alert">
              <LuCircleAlert aria-hidden />
              <span>
                Please fix {errorCount === 1 ? 'the highlighted field' : `${errorCount} highlighted fields`} to continue.
              </span>
            </div>
          )}

          <form ref={formRef} className="bk-card bk-form" onSubmit={submit} noValidate>
            <label className={cx('bk-field', shownErrors.name && 'invalid')}>
              <span className="bk-label">Full name</span>
              <span className="bk-input">
                <LuUser aria-hidden />
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="e.g. Rohan Patel"
                  maxLength={80}
                  value={name}
                  aria-invalid={!!shownErrors.name}
                  onChange={(e) => setName(sanitizeName(e.target.value))}
                />
              </span>
              {shownErrors.name && <span className="field-error">{shownErrors.name}</span>}
            </label>

            <label className="bk-field">
              <span className="bk-label">Mobile number</span>
              <span className="bk-input locked">
                <LuPhone aria-hidden />
                <input value={phoneText(customer.visitor.phone)} readOnly aria-readonly />
                <LuLock className="end" aria-hidden />
              </span>
              <span className="field-hint">Your login number. Booking SMS and your ticket go to this number.</span>
            </label>

            <label className={cx('bk-field', shownErrors.email && 'invalid')}>
              <span className="bk-label">
                Email address <em>Optional</em>
              </span>
              <span className="bk-input">
                <LuMail aria-hidden />
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  aria-invalid={!!shownErrors.email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                />
              </span>
              {shownErrors.email ? <span className="field-error">{shownErrors.email}</span> : <span className="field-hint">For your payment receipt.</span>}
            </label>

            <div className={cx('bk-field', shownErrors.players && 'invalid')}>
              <span className="bk-label" id="players-label">
                Number of players
              </span>
              <div className="bk-players">
                <div className="bk-stepper" role="group" aria-labelledby="players-label">
                  <button type="button" onClick={() => step(-1)} disabled={Number(players) <= 1} aria-label="Fewer players">
                    <LuMinus />
                  </button>
                  <span className="bk-input">
                    <LuUsers aria-hidden />
                    <input
                      name="players"
                      inputMode="numeric"
                      value={players}
                      aria-labelledby="players-label"
                      aria-invalid={!!shownErrors.players}
                      onChange={(e) => setPlayers(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    />
                  </span>
                  <button type="button" onClick={() => step(1)} disabled={Number(players) >= MAX_PLAYERS} aria-label="More players">
                    <LuPlus />
                  </button>
                </div>
                <div className="bk-quick" aria-label="Quick picks">
                  {[6, 10, 12, 16].map((n) => (
                    <button key={n} type="button" aria-pressed={players === String(n)} onClick={() => setPlayers(String(n))}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {shownErrors.players ? (
                <span className="field-error">{shownErrors.players}</span>
              ) : (
                <span className="field-hint">The box is set up for 6-a-side. Extra players may be charged at the venue.</span>
              )}
            </div>

            <label className="bk-field">
              <span className="bk-label">
                Special requests <em>Optional</em>
              </span>
              <span className="bk-input area">
                <LuMessageSquare aria-hidden />
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={NOTE_MAX}
                  placeholder="e.g. We'd like to rent 2 bats"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, NOTE_MAX))}
                />
              </span>
              <span className="field-hint right">
                {notes.length}/{NOTE_MAX}
              </span>
            </label>
            <button type="submit" hidden />
          </form>
        </div>

        <aside className="bk-aside">
          <div className="bk-card bk-sum">
            <h3>Your game</h3>
            <ArenaHeader name={v?.name ?? 'The Riverside Cricket Box'} sub={v?.pitches.find((p) => p.id === hold.pitchId)?.name ?? 'Main Box'} />
            <SlotFacts slot={{ date: hold.date, startHour: sorted[0], hours: sorted.length }} compact />
            {price.data ? <PriceLines price={price.data} /> : price.isError ? <PriceError onRetry={() => void price.refetch()} /> : <PriceSkeleton />}
            <Button variant="primary" size="lg" block loading={create.isPending} disabled={expired || !price.data} onClick={() => submit()}>
              Continue to payment <LuArrowRight aria-hidden />
            </Button>
            <p className="bk-note">
              <LuLock aria-hidden /> Your details are only shared with the arena.
            </p>
          </div>
        </aside>
      </div>

      <div className="bk-bar">
        <span className="grow">
          <strong>{price.data ? rupees(price.data.total) : '…'}</strong>
          <small>Total payable</small>
        </span>
        <Button variant="primary" size="lg" loading={create.isPending} disabled={expired || !price.data} onClick={() => submit()}>
          Continue to pay <LuArrowRight aria-hidden />
        </Button>
      </div>

      <HoldExpiredModal open={expired} date={hold.date} />
    </CheckoutLayout>
  );
};
