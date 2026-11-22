import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  MdAccessTime,
  MdAdd,
  MdCalendarToday,
  MdCancel,
  MdCheckCircle,
  MdEditCalendar,
  MdGroups,
  MdLocalOffer,
  MdOutlinePersonOutline,
  MdRemove,
  MdShield,
  MdSportsCricket,
  MdStar,
  MdTimelapse,
  MdTimer,
} from 'react-icons/md';
import { Navigate, useNavigate } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import type { Hold, Offer, Price } from '@shared/api/types';
import { hoursText, phoneText, rupees, shortDate, shortRange } from '@shared/lib/format';
import { clock, isWeekend, useSecondsLeft } from '@shared/lib/time';
import { NOTE_MAX, nameError, sanitizeCode, sanitizeName } from '@shared/lib/validation';
import { Button, Loading, cx } from '@shared/ui/core';
import { Modal } from '@shared/ui/Modal';
import { PriceBreakdown } from '@shared/ui/PriceBreakdown';
import { useToast } from '@shared/ui/Toast';

import { api } from '../api';
import { GalleryScene } from '../components/art';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { rating } from '../content';
import { useOffers, useVenue } from '../hooks';
import { loadGuest, useCustomer } from '../session';
import { loadHold, loadOfferCode, saveHold, saveOfferCode } from './checkout-state';

const HOLD_SECONDS = 8 * 60;

export const HoldBanner = ({ secondsLeft, total }: { secondsLeft: number; total: number }) => (
  <div className={cx('hold-banner', secondsLeft < 120 && 'urgent')} role="timer" aria-live="off">
    <div className="row">
      <MdTimer aria-hidden /> {secondsLeft < 120 ? 'Hurry! Your slots are about to be released' : 'We are holding your slots'}
      <span className="clock">{clock(secondsLeft)}</span>
    </div>
    <div className="bar">
      <i style={{ width: `${Math.max(0, Math.min(100, (secondsLeft / total) * 100))}%` }} />
    </div>
  </div>
);

export const BookingSummaryCard = ({ date, startHour, hours, pitchName, action }: { date: string; startHour: number; hours: number; pitchName: string; action?: React.ReactNode }) => {
  const venue = useVenue();
  return (
    <div className="card pad" style={{ padding: 14 }}>
      <div className="row" style={{ '--gap': '12px' } as React.CSSProperties}>
        <span className="venue-thumb" style={{ width: 68, height: 68 }}>
          <GalleryScene variant="lights" />
        </span>
        <div>
          <strong style={{ display: 'block', fontSize: 17, fontWeight: 500 }}>{venue.data?.name ?? 'The Riverside Cricket Box'}</strong>
          <span className="small muted">M. G. Road, {venue.data?.city ?? 'Porbandar'}</span>
          <div style={{ marginTop: 4 }}>
            <span className="badge star">
              <MdStar aria-hidden /> {rating.score}
            </span>
          </div>
        </div>
      </div>
      <div className="info-grid">
        <div>
          <small>
            <MdCalendarToday aria-hidden /> Date
          </small>
          <strong>{shortDate(date)}</strong>
        </div>
        <div>
          <small>
            <MdAccessTime aria-hidden /> Time ({hoursText(hours)})
          </small>
          <strong>{shortRange(startHour, hours)}</strong>
        </div>
        <div>
          <small>
            <MdSportsCricket aria-hidden /> Pitch
          </small>
          <strong>{pitchName}</strong>
        </div>
      </div>
      {action && <div style={{ textAlign: 'right', marginTop: 16 }}>{action}</div>}
    </div>
  );
};

export const PolicyCard = () => (
  <div className="card pad">
    <div className="card-head">
      <MdShield aria-hidden /> Cancellation policy
    </div>
    <div className="policy-row">
      <MdCheckCircle color="#138a57" aria-hidden />
      <span>24+ hours before</span>
      <span>100% refund</span>
    </div>
    <div className="policy-row">
      <MdTimelapse color="#b36b00" aria-hidden />
      <span>6+ hours before</span>
      <span>50% refund</span>
    </div>
    <div className="policy-row">
      <MdCancel color="#e23d2e" aria-hidden />
      <span>Less than 6 hours before</span>
      <span>No refund</span>
    </div>
    <p className="tiny muted" style={{ marginTop: 10 }}>
      Refunds go back to your original payment method in 3-5 working days.
    </p>
  </div>
);

// Client-side hint only (shown greyed out); the server checks every rule when the code is applied.
const offerProblem = (offer: Offer, hold: Hold): string | null => {
  if (hold.hours.length < offer.minHours) return `${offer.code} needs at least ${hoursText(offer.minHours)} of booking.`;
  if (offer.weekdaysOnly && isWeekend(hold.date)) return `${offer.code} is valid on weekdays only (Mon-Fri).`;
  return null;
};

export const Checkout = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const customer = useCustomer();
  const venue = useVenue();
  const offers = useOffers();
  const hold = useMemo(loadHold, []);
  const secondsLeft = useSecondsLeft(hold?.expiresAt);
  const guest = loadGuest();

  const [players, setPlayers] = useState(10);
  const [notes, setNotes] = useState('');
  const [name, setName] = useState(customer?.visitor.name || guest?.name || '');
  const [codeInput, setCodeInput] = useState('');
  const [applied, setApplied] = useState<{ code: string; price: Price } | null>(null);
  const [codeError, setCodeError] = useState<string>();
  const [nameProblem, setNameError] = useState<string>();

  const sorted = hold ? [...hold.hours].sort((a, b) => a - b) : [];
  const basePrice = useQuery({
    queryKey: ['price', hold?.date, sorted.join(',')],
    queryFn: () => api.price({ hours: sorted.length, date: hold!.date, startHour: sorted[0] }),
    enabled: !!hold,
  });

  const applyCode = useMutation({
    mutationFn: (code: string) => api.price({ hours: sorted.length, date: hold!.date, startHour: sorted[0], offerCode: code }),
    onSuccess: (price, code) => {
      setApplied({ code: code.toUpperCase(), price });
      setCodeError(undefined);
      saveOfferCode(code.toUpperCase());
      toast.show(`${code.toUpperCase()} applied. You save ₹${price.discount}.`);
    },
    onError: (error) => {
      setCodeError(errorMessage(error));
      setApplied(null);
    },
  });

  useEffect(() => {
    const preset = loadOfferCode();
    if (hold && preset) applyCode.mutate(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useMutation({
    mutationFn: () =>
      api.createBooking({
        holdId: hold!.holdId,
        customerName: name.trim(),
        players,
        notes: notes.trim() || undefined,
        offerCode: applied?.code,
      }),
    onSuccess: (booking) => {
      saveHold(null);
      saveOfferCode(null);
      navigate(`/checkout/payment/${booking.id}`, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.status === 410 || error.status === 404)) {
        saveHold(null);
        toast.error(error.status === 410 ? 'Your hold has expired. Please pick your slots again.' : 'This hold was already used. Please pick your slots again.');
        navigate('/book', { replace: true });
        return;
      }
      toast.error(errorMessage(error));
    },
  });

  const release = useMutation({
    mutationFn: () => api.releaseHold(hold!.holdId),
    onSettled: () => {
      saveHold(null);
      navigate(`/book?date=${hold?.date ?? ''}`);
    },
  });

  if (!customer) return <Navigate to="/auth?from=/checkout/summary" replace />;
  if (!hold) return <Navigate to="/book" replace />;

  const expired = secondsLeft === 0;
  const price = applied?.price ?? basePrice.data;
  const pitchName = venue.data?.pitches.find((p) => p.id === hold.pitchId)?.name ?? 'Main Box';

  const proceed = () => {
    const problem = nameError(name);
    if (problem) {
      setNameError(problem);
      document.getElementById('your-details')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setNameError(undefined);
    create.mutate();
  };

  const payButton = (
    <Button variant="primary" size="lg" block loading={create.isPending} disabled={expired || !price} onClick={proceed}>
      Proceed to pay {price ? `• ${rupees(price.total)}` : ''}
    </Button>
  );

  return (
    <CheckoutLayout step={2} title="Review booking" onBack={() => release.mutate()}>
      <div className="two-col">
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Review booking
          </h1>
          {secondsLeft !== null && <HoldBanner secondsLeft={secondsLeft} total={HOLD_SECONDS} />}
          <BookingSummaryCard
            date={hold.date}
            startHour={sorted[0]}
            hours={sorted.length}
            pitchName={pitchName}
            action={
              <button type="button" className="link" onClick={() => release.mutate()} disabled={release.isPending}>
                <MdEditCalendar size={20} aria-hidden /> Change date or slots
              </button>
            }
          />

          <div className="card pad">
            <div className="card-head">
              <MdGroups aria-hidden /> Who is playing?
            </div>
            <div className="row between">
              <span style={{ fontSize: 16 }}>Number of players</span>
              <div className="counter">
                <button type="button" onClick={() => setPlayers((p) => Math.max(1, p - 1))} disabled={players <= 1} aria-label="Fewer players">
                  <MdRemove />
                </button>
                <div className="value" aria-live="polite">
                  <strong>{players}</strong>
                  <span>players</span>
                </div>
                <button type="button" onClick={() => setPlayers((p) => Math.min(30, p + 1))} disabled={players >= 30} aria-label="More players">
                  <MdAdd />
                </button>
              </div>
            </div>
            <label className="field" style={{ marginTop: 18 }}>
              <span className="field-label">Note for the venue (optional)</span>
              <textarea className="textarea" placeholder="e.g. We will bring our own stumps" maxLength={NOTE_MAX} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, NOTE_MAX))} />
              <span className="field-hint" style={{ textAlign: 'right' }}>
                {notes.length}/{NOTE_MAX}
              </span>
            </label>
          </div>

          <div className="card pad">
            <div className="card-head">
              <MdLocalOffer aria-hidden /> Offers &amp; coupons
            </div>
            <label className="field">
              <span className="field-label">Have a coupon code?</span>
              <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
                <input
                  className="input grow"
                  placeholder="Enter code"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(sanitizeCode(e.target.value));
                    setCodeError(undefined);
                  }}
                  aria-invalid={!!codeError}
                />
                <Button variant="outline" style={{ height: 54, paddingInline: 26 }} loading={applyCode.isPending} onClick={() => (codeInput.trim() ? applyCode.mutate(codeInput.trim()) : setCodeError('Enter a coupon code.'))}>
                  Apply
                </Button>
              </div>
              {codeError && <span className="field-error">{codeError}</span>}
            </label>
            {offers.data && offers.data.length > 0 && (
              <div style={{ marginTop: 14 }}>
                {offers.data.map((o) => {
                  const problem = offerProblem(o, hold);
                  const isApplied = applied?.code === o.code;
                  return (
                    <div key={o.id} className={cx('coupon', problem && 'disabled', isApplied && 'applied')}>
                      <div className="grow">
                        <span className="code">{o.code}</span>
                        <span className="label">{o.label}</span>
                        <p>{problem ?? o.description}</p>
                      </div>
                      {isApplied ? (
                        <button
                          type="button"
                          className="link apply"
                          onClick={() => {
                            setApplied(null);
                            saveOfferCode(null);
                          }}
                        >
                          Remove
                        </button>
                      ) : (
                        <button type="button" className="link apply" disabled={!!problem || applyCode.isPending} onClick={() => applyCode.mutate(o.code)} style={problem ? { color: '#8a9791', cursor: 'not-allowed' } : undefined}>
                          Apply
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <PolicyCard />

          <div className="card pad" id="your-details">
            <div className="card-head">
              <MdOutlinePersonOutline aria-hidden /> Your details
            </div>
            <p style={{ marginBottom: 14 }}>Pay online to confirm. We will SMS this number.</p>
            <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
              <label className="field">
                <span className="field-label">Full name</span>
                <input className="input" autoComplete="name" value={name} maxLength={80} onChange={(e) => { setName(sanitizeName(e.target.value)); setNameError(undefined); }} aria-invalid={!!nameProblem} />
                {nameProblem && <span className="field-error">{nameProblem}</span>}
              </label>
              <label className="field">
                <span className="field-label">Mobile number</span>
                <span className="input-group">
                  <span className="prefix">+91</span>
                  <input className="input" value={customer.visitor.phone} disabled />
                </span>
                <span className="field-hint">Your login number {phoneText(customer.visitor.phone)}. Log out from Profile to use another.</span>
              </label>
            </div>
          </div>
        </div>

        <aside className="sticky-side">
          <div className="card summary-card">
            <h3>Price details</h3>
            {price ? <PriceBreakdown price={price} /> : <Loading />}
          </div>
          <div style={{ marginTop: 16 }}>{payButton}</div>
          <p className="side-note">Next: pay online to confirm</p>
        </aside>
      </div>

      <div className="mobile-bar">
        <span className="grow">
          <strong className="block">{price ? rupees(price.total) : '…'}</strong>
          <span style={{ color: '#c8f23a', fontSize: 13 }}>Total payable</span>
        </span>
        <Button variant="primary" size="lg" loading={create.isPending} disabled={expired || !price} onClick={proceed}>
          Proceed to pay
        </Button>
      </div>

      <Modal
        open={expired}
        locked
        onClose={() => undefined}
        title="Your hold has expired"
        subtitle="We released your slots so others could book. They may still be free."
        footer={
          <Button
            variant="primary"
            onClick={() => {
              saveHold(null);
              navigate(`/book?date=${hold.date}`, { replace: true });
            }}
          >
            Choose slots again
          </Button>
        }
      >
        <p className="muted small">Slots are held for 8 minutes while you review your booking.</p>
      </Modal>
    </CheckoutLayout>
  );
};
