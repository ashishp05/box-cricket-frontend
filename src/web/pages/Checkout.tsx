import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { LuArrowRight, LuCalendarClock, LuCircleCheck, LuReceipt, LuShieldCheck, LuTag, LuTicket, LuX } from 'react-icons/lu';
import { Navigate, useNavigate } from 'react-router-dom';

import { errorMessage } from '@shared/api/client';
import type { Hold, Offer, Price } from '@shared/api/types';
import { hoursText, rupees } from '@shared/lib/format';
import { isWeekend, useSecondsLeft } from '@shared/lib/time';
import { sanitizeCode } from '@shared/lib/validation';
import { Button, cx } from '@shared/ui/core';
import { Modal } from '@shared/ui/Modal';
import { useToast } from '@shared/ui/Toast';

import { api } from '../api';
import { ArenaHeader, HoldTimer, PriceError, PriceLines, PriceSkeleton, SlotFacts } from '../components/booking';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { useOffers, useVenue } from '../hooks';
import { useCustomer } from '../session';
import { loadHold, loadOfferCode, saveHold, saveOfferCode } from './checkout-state';

export const HOLD_SECONDS = 8 * 60;

export const HoldExpiredModal = ({ open, date }: { open: boolean; date: string }) => {
  const navigate = useNavigate();
  return (
    <Modal
      open={open}
      locked
      onClose={() => undefined}
      title="Your hold has expired"
      subtitle="We released your slots so others could book. They may still be free."
      footer={
        <Button
          variant="primary"
          onClick={() => {
            saveHold(null);
            navigate(`/book?date=${date}&step=time`, { replace: true });
          }}
        >
          Choose slots again
        </Button>
      }
    >
      <p className="muted small">Slots are held for 8 minutes while you check out.</p>
    </Modal>
  );
};

export const PolicyNote = () => (
  <div className="bk-card bk-policy">
    <h2 className="bk-card-title">
      <LuShieldCheck aria-hidden /> Cancellation policy
    </h2>
    <ul>
      <li>
        <b className="t-full">100%</b> refund 24+ hours before
      </li>
      <li>
        <b className="t-half">50%</b> refund 6–24 hours before
      </li>
      <li>
        <b className="t-none">0%</b> under 6 hours
      </li>
    </ul>
  </div>
);

// Client-side hint only; the server checks every rule when the code is applied.
const offerProblem = (offer: Offer, hold: Hold): string | null => {
  if (hold.hours.length < offer.minHours) return `Needs at least ${hoursText(offer.minHours)}`;
  if (offer.weekdaysOnly && isWeekend(hold.date)) return 'Weekdays only (Mon–Fri)';
  return null;
};

// Price for the current hold with the saved offer code, shared by the Summary and Details steps.
export const useHoldPrice = (hold: Hold | null, offerCode: string | null) => {
  const sorted = hold ? [...hold.hours].sort((a, b) => a - b) : [];
  return useQuery({
    queryKey: ['price', hold?.date, sorted.join(','), offerCode ?? ''],
    queryFn: () => api.price({ hours: sorted.length, date: hold!.date, startHour: sorted[0], ...(offerCode && { offerCode }) }),
    enabled: !!hold,
    retry: false,
  });
};

// Step 3: booking summary + offers.
export const Checkout = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const customer = useCustomer();
  const venue = useVenue();
  const offers = useOffers();
  const hold = useMemo(loadHold, []);
  const secondsLeft = useSecondsLeft(hold?.expiresAt);
  const [offerCode, setOfferCode] = useState<string | null>(loadOfferCode);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const base = useHoldPrice(hold, null);
  const withOffer = useHoldPrice(hold, offerCode);

  // A saved code that no longer applies (e.g. hours changed): drop it quietly.
  useEffect(() => {
    if (offerCode && withOffer.isError) {
      setOfferCode(null);
      saveOfferCode(null);
    }
  }, [offerCode, withOffer.isError]);

  const apply = useMutation({
    mutationFn: (code: string) => {
      const sorted = [...hold!.hours].sort((a, b) => a - b);
      return api.price({ hours: sorted.length, date: hold!.date, startHour: sorted[0], offerCode: code });
    },
    onSuccess: (price: Price, code) => {
      const c = code.toUpperCase();
      setOfferCode(c);
      saveOfferCode(c);
      setCodeError(undefined);
      setCodeInput('');
      toast.show(`${c} applied. You save ${rupees(price.discount)}.`);
    },
    onError: (error) => setCodeError(errorMessage(error)),
  });

  const release = useMutation({
    mutationFn: () => api.releaseHold(hold!.holdId),
    onSettled: () => {
      saveHold(null);
      navigate(`/book?date=${hold?.date ?? ''}&step=time`);
    },
  });

  if (!customer) return <Navigate to="/auth?from=/checkout/summary" replace />;
  if (!hold) return <Navigate to="/book" replace />;

  const sorted = [...hold.hours].sort((a, b) => a - b);
  const slot = { date: hold.date, startHour: sorted[0], hours: sorted.length };
  const price = (offerCode ? withOffer.data : base.data) ?? base.data;
  const expired = secondsLeft === 0;
  const v = venue.data;
  const pitchName = v?.pitches.find((p) => p.id === hold.pitchId)?.name ?? 'Main Box';
  const next = () => navigate('/checkout/details');
  const removeOffer = () => {
    setOfferCode(null);
    saveOfferCode(null);
  };

  return (
    <CheckoutLayout step={3} title="Booking summary" onBack={() => release.mutate()}>
      <div className="bk-layout">
        <div className="bk-main-col">
          <div className="bk-head">
            <h1>Booking summary</h1>
            <p>Check your game before adding your details.</p>
          </div>
          {secondsLeft !== null && <HoldTimer secondsLeft={secondsLeft} total={HOLD_SECONDS} />}

          <div className="bk-card">
            <ArenaHeader name={v?.name ?? 'The Riverside Cricket Box'} sub={`${pitchName} · M. G. Road, ${v?.city ?? 'Porbandar'}`} rate={v?.settings.hourlyRate} />
            <SlotFacts slot={slot} />
            <button type="button" className="bk-link" onClick={() => release.mutate()} disabled={release.isPending}>
              <LuCalendarClock aria-hidden /> Change date or time
            </button>
          </div>

          <div className="bk-card">
            <h2 className="bk-card-title">
              <LuTag aria-hidden /> Offers &amp; coupons
            </h2>
            {offerCode && withOffer.data ? (
              <div className="bk-applied">
                <LuCircleCheck aria-hidden />
                <span className="grow">
                  <b>{offerCode}</b> applied · you save {rupees(withOffer.data.discount)}
                </span>
                <button type="button" onClick={removeOffer} aria-label="Remove offer">
                  <LuX />
                </button>
              </div>
            ) : (
              <>
                <form
                  className="bk-code"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (codeInput.trim()) apply.mutate(codeInput.trim());
                    else setCodeError('Enter a coupon code.');
                  }}
                >
                  <input
                    className="input"
                    placeholder="Enter coupon code"
                    value={codeInput}
                    aria-label="Coupon code"
                    aria-invalid={!!codeError}
                    onChange={(e) => {
                      setCodeInput(sanitizeCode(e.target.value));
                      setCodeError(undefined);
                    }}
                  />
                  <Button type="submit" variant="outline" loading={apply.isPending}>
                    Apply
                  </Button>
                </form>
                {codeError && <p className="field-error">{codeError}</p>}
                {offers.data && offers.data.length > 0 && (
                  <div className="bk-offers">
                    {offers.data.map((o) => {
                      const problem = offerProblem(o, hold);
                      return (
                        <button key={o.id} type="button" className={cx('bk-offer', problem && 'off')} disabled={!!problem || apply.isPending} onClick={() => apply.mutate(o.code)}>
                          <LuTicket aria-hidden />
                          <span className="grow">
                            <b>{o.code}</b>
                            <small>{problem ?? o.description}</small>
                          </span>
                          <em>{problem ? '' : 'Apply'}</em>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <PolicyNote />
        </div>

        <aside className="bk-aside">
          <div className="bk-card bk-sum">
            <h3>
              <LuReceipt aria-hidden /> Price details
            </h3>
            {price ? <PriceLines price={price} /> : base.isError ? <PriceError onRetry={() => void base.refetch()} /> : <PriceSkeleton />}
            <Button variant="primary" size="lg" block disabled={expired || !price} onClick={next}>
              Add your details <LuArrowRight aria-hidden />
            </Button>
            <p className="bk-note">No payment yet. You'll review everything before paying.</p>
          </div>
        </aside>
      </div>

      <div className="bk-bar">
        <span className="grow">
          <strong>{price ? rupees(price.total) : '…'}</strong>
          <small>Total payable</small>
        </span>
        <Button variant="primary" size="lg" disabled={expired || !price} onClick={next}>
          Continue <LuArrowRight aria-hidden />
        </Button>
      </div>

      <HoldExpiredModal open={expired} date={hold.date} />
    </CheckoutLayout>
  );
};
