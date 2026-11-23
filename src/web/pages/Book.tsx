import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowRight, LuCalendarDays, LuChevronLeft, LuChevronRight, LuInfo, LuMousePointerClick, LuPencil } from 'react-icons/lu';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import { hoursText, longDate, rupees, shortDate, shortRange } from '@shared/lib/format';
import { addDays, dateRange, todayIST } from '@shared/lib/time';
import { Banner, Button, ErrorState, Skeleton } from '@shared/ui/core';
import { useToast } from '@shared/ui/Toast';

import { api, queryKeys } from '../api';
import { ArenaHeader, PriceError, PriceLines, PriceSkeleton, SlotFacts } from '../components/booking';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { useLoginRedirect } from '../components/RequireLogin';
import { MonthCalendar, SlotLegend, TimeSlots, toggleHour } from '../components/SlotPickers';
import { useDayMarks, useVenue } from '../hooks';
import { loadSelection, saveSelection, useCustomer } from '../session';
import { saveHold } from './checkout-state';

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
  const maxDate = v ? addDays(today, v.advanceDays) : addDays(today, 14);
  const dates = useMemo(() => (v ? dateRange(today, v.advanceDays + 1) : []), [v, today]);
  const marks = useDayMarks(dates, pitch?.id ?? '');

  const restored = useMemo(loadSelection, []);
  const step = params.get('step') === 'time' ? 2 : 1;
  const date = params.get('date') ?? restored?.date ?? today;
  const [hours, setHours] = useState<number[]>(restored && restored.date === date ? restored.hours : []);
  const [jumpedFrom, setJumpedFrom] = useState<string | null>(null);
  const jumped = useRef(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  const setDate = (next: string, nextStep: 1 | 2 = step) => {
    setHours([]);
    setJumpedFrom(null);
    setParams(nextStep === 2 ? { date: next, step: 'time' } : { date: next }, { replace: nextStep === step });
  };
  const goStep = (s: 1 | 2) => setParams(s === 2 ? { date, step: 'time' } : { date });

  // Today fully booked and no date asked for: jump to the first open day.
  useEffect(() => {
    if (jumped.current || params.get('date') || restored) return;
    if (marks[today] === 'full') {
      const firstOpen = dates.find((d) => marks[d] === 'open');
      if (firstOpen) {
        jumped.current = true;
        setParams({ date: firstOpen }, { replace: true });
        setJumpedFrom(today);
      }
    }
  }, [marks, dates, today, params, restored, setParams]);

  const slots = useQuery({
    queryKey: queryKeys.slots(date, pitch?.id ?? ''),
    queryFn: () => api.slots(date, pitch?.id),
    enabled: !!pitch,
    refetchInterval: 30_000,
  });

  // Someone else took a selected hour: drop the selection.
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
      toast.error(`You can book up to ${hoursText(v.maxHours)} at a time.`);
      return;
    }
    if (next.reset) toast.show('Slots must be back-to-back, so we started a new selection.');
    setHours(next.hours);
  };

  const tooShort = v ? sorted.length > 0 && sorted.length < v.minHours : false;
  const proceed = () => {
    if (!pitch || sorted.length === 0 || tooShort) return;
    if (!customer) {
      saveSelection({ date, pitchId: pitch.id, hours: sorted });
      goLogin(`/book?date=${date}&step=time&resume=1`);
      return;
    }
    hold.mutate();
  };

  const freeCount = slots.data?.slots.filter((s) => s.status === 'available').length ?? 0;
  const nextOpen = dates.find((d) => d > date && marks[d] === 'open');
  const name = v?.name ?? 'The Riverside Cricket Box';
  const arenaSub = `${pitch?.name ?? 'Main Box'} · M. G. Road, ${v?.city ?? 'Porbandar'}`;

  if (venue.isError) {
    return (
      <CheckoutLayout step={1} title="Book your game" onBack={() => navigate('/')}>
        <div className="bk-card bk-state">
          <ErrorState error={venue.error} title="We could not load the arena" onRetry={() => venue.refetch()} />
        </div>
      </CheckoutLayout>
    );
  }

  // ---------- Step 1: date ----------
  if (step === 1) {
    const tomorrow = addDays(today, 1);
    const chip = (d: string, label: string) => (
      <button type="button" className="bk-chip" aria-pressed={date === d} disabled={marks[d] === 'full' || d > maxDate} onClick={() => setDate(d)}>
        {label}
        {marks[d] === 'full' && <small>Full</small>}
      </button>
    );
    return (
      <CheckoutLayout step={1} title="Pick a date" onBack={() => navigate(-1)}>
        <div className="bk-layout">
          <div className="bk-main-col">
            <div className="bk-head">
              <h1>Book Your Game</h1>
              <p>Pick a day, then choose your hours. Live availability, instant confirmation.</p>
            </div>
            <ArenaHeader name={name} sub={arenaSub} rate={v?.settings.hourlyRate} />
            {jumpedFrom && (
              <Banner tone="warning" onClose={() => setJumpedFrom(null)}>
                Today is fully booked, so we picked {shortDate(date)}, the next day with free slots.
              </Banner>
            )}

            <div className="bk-card">
              <h2 className="bk-card-title">
                <LuCalendarDays aria-hidden /> Select a date
              </h2>
              <div className="bk-shortcuts">
                {chip(today, 'Today')}
                {chip(tomorrow, 'Tomorrow')}
                <label className="bk-chip" aria-pressed={date !== today && date !== tomorrow}>
                  <LuCalendarDays aria-hidden /> {date !== today && date !== tomorrow ? shortDate(date) : 'Pick a date'}
                  <input
                    ref={pickerRef}
                    type="date"
                    min={today}
                    max={maxDate}
                    value={date}
                    aria-label="Pick a date"
                    onClick={() => pickerRef.current?.showPicker?.()}
                    onChange={(e) => e.target.value && setDate(e.target.value)}
                  />
                </label>
              </div>
              {v ? (
                <MonthCalendar value={date} onChange={(d) => setDate(d)} min={today} max={maxDate} marks={marks} />
              ) : (
                <div className="cal-skel" aria-hidden>
                  <Skeleton height={28} width={180} />
                  <Skeleton height={260} />
                </div>
              )}
            </div>
          </div>

          <aside className="bk-aside hide-m">
            <div className="bk-card bk-sum">
              <h3>Your game</h3>
              <div className="bk-sum-date">
                <span>{shortDate(date).split(', ')[0]}</span>
                <strong>{Number(date.slice(8))}</strong>
                <span>{longDate(date).split(' ').slice(2).join(' ')}</span>
              </div>
              <p className="bk-sum-free">
                {slots.isLoading ? 'Checking free slots…' : freeCount > 0 ? <><b>{freeCount}</b> hourly slots free</> : 'No free slots on this day'}
              </p>
              <Button variant="primary" size="lg" block disabled={!slots.data || freeCount === 0} onClick={() => goStep(2)}>
                Choose a time <LuArrowRight aria-hidden />
              </Button>
              <p className="bk-note">
                {v ? `Flat ${rupees(v.settings.hourlyRate)}/hr · Book up to ${v.advanceDays} days ahead` : ' '}
              </p>
            </div>
          </aside>
        </div>

        <div className="bk-bar">
          <span className="grow">
            <strong>{shortDate(date)}</strong>
            <small>{slots.isLoading ? 'Checking…' : freeCount > 0 ? `${freeCount} slots free` : 'Fully booked'}</small>
          </span>
          <Button variant="primary" size="lg" disabled={!slots.data || freeCount === 0} onClick={() => goStep(2)}>
            Choose time <LuArrowRight aria-hidden />
          </Button>
        </div>
      </CheckoutLayout>
    );
  }

  // ---------- Step 2: time ----------
  const allPast = slots.data?.slots.every((s) => s.status === 'past');
  const canPrevDay = date > today;
  const canNextDay = date < maxDate;
  return (
    <CheckoutLayout step={2} title="Pick a time" onBack={() => goStep(1)}>
      <div className="bk-layout">
        <div className="bk-main-col">
          <div className="bk-head">
            <h1>Pick Your Time</h1>
            <p>Tap one slot, or several back-to-back hours for a longer game.</p>
          </div>

          <div className="bk-daybar">
            <button type="button" onClick={() => setDate(addDays(date, -1))} disabled={!canPrevDay} aria-label="Previous day">
              <LuChevronLeft />
            </button>
            <div className="grow">
              <strong>{longDate(date)}</strong>
              <span>
                {v ? rupees(v.settings.hourlyRate) : '₹900'}/hr · {slots.data ? `${freeCount} slots free` : 'Checking…'}
              </span>
            </div>
            <button type="button" className="bk-change" onClick={() => goStep(1)}>
              <LuPencil aria-hidden /> <span>Change</span>
            </button>
            <button type="button" onClick={() => setDate(addDays(date, 1))} disabled={!canNextDay} aria-label="Next day">
              <LuChevronRight />
            </button>
          </div>

          <div className="bk-card">
            <SlotLegend />
            {slots.isLoading || !pitch ? (
              <div className="ts-skel" aria-label="Loading slots">
                {Array.from({ length: 12 }, (_, i) => (
                  <Skeleton key={i} height={74} />
                ))}
              </div>
            ) : slots.isError ? (
              <ErrorState title="Could not load slots" error={slots.error} onRetry={() => slots.refetch()} />
            ) : freeCount === 0 ? (
              <div className="bk-empty">
                <span className="bk-empty-icon">
                  <LuCalendarDays aria-hidden />
                </span>
                <strong>{allPast ? "Today's slots have all passed" : `${shortDate(date)} is fully booked`}</strong>
                <p>Every hour on this day is taken. The next day with free slots is just a tap away.</p>
                {nextOpen ? (
                  <Button variant="primary" onClick={() => setDate(nextOpen)}>
                    See {shortDate(nextOpen)} <LuArrowRight aria-hidden />
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => goStep(1)}>
                    Pick another date
                  </Button>
                )}
              </div>
            ) : (
              <TimeSlots slots={slots.data!.slots} selected={hours} onToggle={onToggle} />
            )}
          </div>
          <p className="bk-hint">
            <LuInfo aria-hidden /> Book {v ? hoursText(v.minHours) : '1 hr'} to {v ? hoursText(v.maxHours) : '24 hrs'}, back-to-back. Slots are held for 8 minutes once you
            continue.
          </p>
        </div>

        <aside className="bk-aside hide-m">
          <div className="bk-card bk-sum">
            <h3>Your game</h3>
            <ArenaHeader name={name} sub={pitch?.name ?? 'Main Box'} />
            {sorted.length === 0 ? (
              <div className="bk-tap">
                <LuMousePointerClick aria-hidden /> Tap a green slot to start
              </div>
            ) : (
              <>
                <SlotFacts slot={{ date, startHour: sorted[0], hours: sorted.length }} compact />
                {price.data ? <PriceLines price={price.data} /> : price.isError ? <PriceError onRetry={() => void price.refetch()} /> : <PriceSkeleton />}
              </>
            )}
            {tooShort && v && <p className="field-error">Minimum booking is {hoursText(v.minHours)}.</p>}
            <Button variant="primary" size="lg" block disabled={sorted.length === 0 || tooShort} loading={hold.isPending} onClick={proceed}>
              Continue <LuArrowRight aria-hidden />
            </Button>
            {!customer && sorted.length > 0 && <p className="bk-note">You'll log in with your mobile number next.</p>}
          </div>
        </aside>
      </div>

      <div className="bk-bar">
        {sorted.length === 0 ? (
          <span className="grow">
            <strong>{shortDate(date)}</strong>
            <small>Tap a slot to start</small>
          </span>
        ) : (
          <span className="grow">
            <strong>
              {shortRange(sorted[0], sorted.length)} · {hoursText(sorted.length)}
            </strong>
            <small className="lime">{price.data ? rupees(price.data.total) : '…'}</small>
          </span>
        )}
        <Button variant="primary" size="lg" disabled={sorted.length === 0 || tooShort} loading={hold.isPending} onClick={proceed}>
          Continue <LuArrowRight aria-hidden />
        </Button>
      </div>
    </CheckoutLayout>
  );
};
