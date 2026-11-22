import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MdAccessTime, MdArrowForward, MdCalendarToday, MdSportsCricket, MdStadium, MdTouchApp } from 'react-icons/md';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import { hoursText, longDate, shortDate, shortRange } from '@shared/lib/format';
import { addDays, dateRange, todayIST } from '@shared/lib/time';
import { Banner, Button, ErrorState, Loading } from '@shared/ui/core';
import { PriceBreakdown } from '@shared/ui/PriceBreakdown';
import { DateStrip, SlotGrid, SlotLegend, toggleHour } from '@shared/ui/SlotPicker';
import { useToast } from '@shared/ui/Toast';

import { api, queryKeys } from '../api';
import { GalleryScene } from '../components/art';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { useLoginRedirect } from '../components/RequireLogin';
import { useDayMarks, useVenue } from '../hooks';
import { loadSelection, saveSelection, useCustomer } from '../session';
import { hoursOpenText } from './Home';
import { saveHold } from './checkout-state';

export const VenueCard = ({ action }: { action?: React.ReactNode }) => {
  const venue = useVenue();
  const v = venue.data;
  return (
    <div className="card venue-card">
      <span className="venue-thumb">
        <GalleryScene variant="lights" />
      </span>
      <div className="grow">
        <strong>{v?.name ?? 'The Riverside Cricket Box'}</strong>
        <span>M. G. Road, {v?.city ?? 'Porbandar'}</span>
        {v && <span>{hoursOpenText(v.openHour, v.closeHour)}</span>}
      </div>
      {action}
    </div>
  );
};

export const Book = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const customer = useCustomer();
  const goLogin = useLoginRedirect();
  const [params, setParams] = useSearchParams();
  const today = todayIST();
  const venue = useVenue();
  const v = venue.data;
  const pitch = v?.pitches[0];
  const dates = useMemo(() => (v ? dateRange(today, Math.min(v.advanceDays + 1, 15)) : []), [v, today]);
  const marks = useDayMarks(dates, pitch?.id ?? '');

  const restored = useMemo(loadSelection, []);
  const [date, setDate] = useState(params.get('date') ?? restored?.date ?? today);
  const [hours, setHours] = useState<number[]>(restored && restored.date === (params.get('date') ?? restored.date) ? restored.hours : []);
  const [jumpedFrom, setJumpedFrom] = useState<string | null>(null);
  const jumped = useRef(false);

  // Today fully booked and no date asked for: jump to the first open day, like the original app.
  useEffect(() => {
    if (jumped.current || params.get('date') || restored || date !== today) return;
    if (marks[today] === 'full') {
      const firstOpen = dates.find((d) => marks[d] === 'open');
      if (firstOpen) {
        jumped.current = true;
        setJumpedFrom(today);
        setDate(firstOpen);
      }
    }
  }, [marks, dates, today, date, params, restored]);

  const slots = useQuery({
    queryKey: queryKeys.slots(date, pitch?.id ?? ''),
    queryFn: () => api.slots(date, pitch?.id),
    enabled: !!pitch,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!slots.data) return;
    const free = new Set(slots.data.slots.filter((s) => s.status === 'available').map((s) => s.hour));
    setHours((current) => (current.every((h) => free.has(h)) ? current : []));
  }, [slots.data]);

  const sorted = [...hours].sort((a, b) => a - b);
  const price = useQuery({
    queryKey: ['price', date, sorted.join(',')],
    queryFn: () => api.price({ hours: sorted.length, date, startHour: sorted[0] }),
    enabled: sorted.length > 0,
    placeholderData: (previous) => previous,
  });

  const hold = useMutation({
    mutationFn: () => api.createHold({ pitchId: pitch!.id, date, hours: sorted }),
    onSuccess: (result) => {
      saveSelection(null);
      saveHold(result);
      navigate('/checkout/summary');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Someone just booked one of these hours. Pick another slot.');
        setHours([]);
        void queryClient.invalidateQueries({ queryKey: ['slots'] });
      } else toast.error(errorMessage(error));
    },
  });

  // Back from login with a saved selection: hold it straight away.
  useEffect(() => {
    if (params.get('resume') && customer && restored && restored.hours.length && pitch && !hold.isPending) {
      params.delete('resume');
      setParams(params, { replace: true });
      hold.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, pitch]);

  const onToggle = (hour: number) => {
    const next = toggleHour(hours, hour);
    if (v && next.hours.length > v.maxHours) {
      toast.error(`You can book up to ${v.maxHours} hours at a time.`);
      return;
    }
    if (next.reset) toast.show('Slots must be back-to-back, so we started a new selection.');
    setHours(next.hours);
  };

  const changeDate = (next: string) => {
    setDate(next);
    setHours([]);
    setJumpedFrom(null);
  };

  const tooShort = v ? sorted.length > 0 && sorted.length < v.minHours : false;
  const proceed = () => {
    if (!pitch) return;
    if (!customer) {
      saveSelection({ date, pitchId: pitch.id, hours: sorted });
      goLogin(`/book?date=${date}&resume=1`);
      return;
    }
    hold.mutate();
  };

  const freeCount = slots.data?.slots.filter((s) => s.status === 'available').length ?? 0;

  if (venue.isError) {
    return (
      <CheckoutLayout step={1} title="Choose date & slots" onBack={() => navigate('/')}>
        <ErrorState error={venue.error} onRetry={() => venue.refetch()} />
      </CheckoutLayout>
    );
  }

  const continueBtn = (
    <Button variant="primary" size="lg" block disabled={sorted.length === 0 || tooShort} loading={hold.isPending} onClick={proceed}>
      Continue <MdArrowForward aria-hidden />
    </Button>
  );

  return (
    <CheckoutLayout step={1} title="Choose date & slots" onBack={() => navigate(-1)}>
      <div className="two-col">
        <div>
          <h1 className="page-title">Choose date &amp; slots</h1>
          <VenueCard
            action={
              <Link to="/arena" className="link" style={{ marginRight: 12 }}>
                Change
              </Link>
            }
          />
          {jumpedFrom && (
            <div style={{ marginTop: 14 }}>
              <Banner tone="warning" onClose={() => setJumpedFrom(null)}>
                Today is fully booked, so we jumped to {shortDate(date)}.
              </Banner>
            </div>
          )}

          <h2 className="step-heading">1. Pick a date</h2>
          {v ? <DateStrip dates={dates} value={date} onChange={changeDate} marks={marks} min={today} max={addDays(today, v.advanceDays)} /> : <Loading />}

          <h2 className="step-heading">2. Select time</h2>
          <div className="slots-meta">
            {longDate(date)}
            {slots.data && <span className="badge">{freeCount} slots free</span>}
          </div>
          <SlotLegend />
          {slots.isLoading || !pitch ? (
            <Loading label="Loading slots…" />
          ) : slots.isError ? (
            <ErrorState title="Could not load slots" error={slots.error} onRetry={() => slots.refetch()} />
          ) : freeCount === 0 ? (
            <div style={{ marginTop: 16 }}>
              <Banner tone="warning">
                {slots.data!.slots.every((s) => s.status === 'past') ? "All of today's slots have passed." : `Every slot on ${shortDate(date)} is taken.`} Pick another day above.
              </Banner>
            </div>
          ) : (
            <SlotGrid slots={slots.data!.slots} selected={hours} onToggle={onToggle} />
          )}
          <div style={{ marginTop: 18 }}>
            <Banner>
              Book {v ? hoursText(v.minHours) : '1 hr'} to {v ? hoursText(v.maxHours) : '24 hrs'}, back-to-back. Flat {v ? `₹${v.settings.hourlyRate}` : '₹900'}/hr any time of day.
            </Banner>
          </div>
        </div>

        <aside className="card summary-card sticky-side book-side">
          <h3>Your booking</h3>
          <div className="summary-line">
            <MdStadium aria-hidden /> {v?.name ?? 'The Riverside Cricket Box'}
          </div>
          <div className="summary-line">
            <MdSportsCricket aria-hidden /> {pitch?.name ?? 'Main Box'}
          </div>
          <div className="summary-line">
            <MdCalendarToday aria-hidden /> {longDate(date)}
          </div>
          <div className={`summary-line${sorted.length ? '' : ' muted'}`}>
            <MdAccessTime aria-hidden /> {sorted.length ? `${shortRange(sorted[0], sorted.length)}  (${hoursText(sorted.length)})` : 'No time selected yet'}
          </div>
          <hr className="divider" />
          {sorted.length === 0 ? (
            <div className="tap-hint">
              <MdTouchApp aria-hidden /> Tap a slot to start your booking
            </div>
          ) : price.data ? (
            <div style={{ marginBottom: 14 }}>
              <PriceBreakdown price={price.data} />
            </div>
          ) : (
            <Loading />
          )}
          {tooShort && v && <p className="field-error" style={{ marginBottom: 8 }}>Minimum booking is {hoursText(v.minHours)}.</p>}
          {continueBtn}
          <p className="side-note">Slots are held for 8 minutes once you continue.</p>
        </aside>
      </div>

      <div className="mobile-bar">
        {sorted.length === 0 ? (
          <span className="grow row" style={{ '--gap': '10px' } as React.CSSProperties}>
            <MdTouchApp size={22} color="#c8f23a" aria-hidden /> Tap a slot to start your booking
          </span>
        ) : (
          <span className="grow">
            <strong className="block">
              {shortRange(sorted[0], sorted.length)} · {hoursText(sorted.length)}
            </strong>
            {price.data && <span style={{ color: '#c8f23a' }}>₹{price.data.total}</span>}
          </span>
        )}
        <Button variant="primary" size="lg" disabled={sorted.length === 0 || tooShort} loading={hold.isPending} onClick={proceed}>
          Continue <MdArrowForward aria-hidden />
        </Button>
      </div>
    </CheckoutLayout>
  );
};
