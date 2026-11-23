import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LuArrowRight, LuCalendarClock, LuChevronRight, LuClock, LuHistory, LuQrCode, LuRefreshCw, LuTicketX, LuTrophy } from 'react-icons/lu';
import { Link } from 'react-router-dom';

import type { Booking } from '@shared/api/types';
import { hourLabel, hoursText, longDate, monthShort, rupees, weekdayShort } from '@shared/lib/format';
import { Skeleton } from '@shared/ui/core';
import { Modal } from '@shared/ui/Modal';

import { api, queryKeys } from '../api';
import { ARENA_PHOTO, bookingStatus, paymentStatus, Pill } from '../components/booking';
import { BookingDetailsBody, CancelDialog, canCancel, canReschedule, RescheduleDialog } from '../components/BookingDetails';
import { RequireLogin } from '../components/RequireLogin';
import { TicketDownload } from '../components/TicketDownload';
import { useVenue } from '../hooks';

type Tab = 'upcoming' | 'history';
const isUpcoming = (b: Booking) => b.status === 'upcoming' || b.status === 'pending';
const key = (b: Booking) => `${b.date}${String(b.startHour).padStart(2, '0')}`;

// Cricket-themed empty state: stumps, bat and ball on a pitch.
const PitchArt = () => (
  <svg width="220" height="170" viewBox="0 0 220 170" aria-hidden className="mb-art">
    <ellipse cx="110" cy="146" rx="100" ry="18" fill="#e6efdc" />
    <path d="M78 146 L94 40 L126 40 L142 146 Z" fill="#e8dcb8" />
    <path d="M78 146 L94 40 L126 40 L142 146 Z" fill="url(#mbPitch)" opacity="0.6" />
    <line x1="88" y1="112" x2="132" y2="112" stroke="#fff" strokeWidth="2" />
    <g>
      {[100, 108, 116].map((x) => (
        <rect key={x} x={x} y="64" width="5" height="48" rx="2.5" fill="#f7efd7" stroke="#cdbf96" />
      ))}
      <rect x="99" y="61" width="11" height="4" rx="2" fill="#cdbf96" />
      <rect x="111" y="61" width="11" height="4" rx="2" fill="#cdbf96" />
    </g>
    <g transform="rotate(28 160 92)">
      <rect x="152" y="40" width="7" height="30" rx="3" fill="#062019" />
      <rect x="146" y="68" width="19" height="70" rx="8" fill="#f1d9a3" stroke="#d9bd80" />
    </g>
    <circle cx="58" cy="122" r="13" fill="#d8382b" />
    <path d="M50 113 Q58 122 50 131 M66 113 Q58 122 66 131" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.9" />
    <circle cx="40" cy="38" r="4" fill="#c8f23a" />
    <circle cx="184" cy="30" r="3" fill="#c8f23a" />
    <circle cx="30" cy="80" r="2.5" fill="#c8f23a" opacity="0.7" />
    <defs>
      <linearGradient id="mbPitch" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#c9b98a" />
      </linearGradient>
    </defs>
  </svg>
);

const BookingCard = ({ b, onOpen, onCancel, onMove }: { b: Booking; onOpen: () => void; onCancel: () => void; onMove: () => void }) => {
  const venue = useVenue();
  const st = bookingStatus(b);
  const pay = paymentStatus(b);
  const address = venue.data?.address ?? 'Ashmavati Riverfront, Porbandar';
  return (
    <article className={`mb-card${b.status === 'cancelled' ? ' muted' : ''}`}>
      <button type="button" className="mb-photo" onClick={onOpen} aria-label={`View booking ${b.id}`}>
        <img src={ARENA_PHOTO} alt="" loading="lazy" />
        <span className="mb-date">
          <small>{weekdayShort(b.date)}</small>
          <b>{Number(b.date.slice(8))}</b>
          <small>{monthShort(b.date)}</small>
        </span>
      </button>

      <div className="mb-body">
        <div className="mb-top">
          <div className="grow">
            <h3>{b.venueName}</h3>
            <span className="mb-id">
              {b.pitchName} · <span className="mono">{b.id}</span>
            </span>
          </div>
          <strong className="mb-amount">{rupees(b.price.total)}</strong>
        </div>
        <div className="mb-when">
          <span>
            <LuCalendarClock aria-hidden /> {longDate(b.date)}
          </span>
          <span>
            <LuClock aria-hidden /> {hourLabel(b.startHour)} – {hourLabel(b.startHour + b.hours)} · {hoursText(b.hours)}
          </span>
        </div>
        <div className="mb-pills">
          <Pill tone={st.tone}>{st.label}</Pill>
          {b.status !== 'pending' && <Pill tone={pay.tone}>{pay.label}</Pill>}
        </div>

        <div className="mb-actions">
          <button type="button" className="btn sm night" onClick={onOpen}>
            View details <LuChevronRight aria-hidden />
          </button>
          {b.status === 'pending' ? (
            <Link to={`/checkout/payment/${b.id}`} className="btn sm primary">
              Complete payment
            </Link>
          ) : (
            (b.status === 'upcoming' || b.status === 'completed') && <TicketDownload booking={b} address={address} className="sm outline" label="Ticket" />
          )}
          {b.status === 'upcoming' && (
            <button type="button" className="btn sm outline" onClick={onOpen} aria-label="Show entry QR">
              <LuQrCode aria-hidden /> QR
            </button>
          )}
          {b.status === 'upcoming' && canReschedule(b) && (
            <button type="button" className="btn sm outline" onClick={onMove}>
              <LuRefreshCw aria-hidden /> Reschedule
            </button>
          )}
          {canCancel(b) && (
            <button type="button" className="btn sm ghost-danger" onClick={onCancel}>
              <LuTicketX aria-hidden /> Cancel
            </button>
          )}
          {b.status === 'completed' && (
            <Link to={`/book?date=${b.date}`} className="btn sm outline">
              <LuTrophy aria-hidden /> Book again
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

const CardSkeleton = () => (
  <div className="mb-card skel" aria-hidden>
    <Skeleton height={150} />
    <div className="mb-body">
      <Skeleton height={22} width="60%" />
      <Skeleton height={14} width="40%" />
      <Skeleton height={14} width="80%" />
      <Skeleton height={36} width="70%" />
    </div>
  </div>
);

const List = () => {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ type: 'cancel' | 'move'; id: string } | null>(null);
  const bookings = useQuery({ queryKey: queryKeys.myBookings, queryFn: api.myBookings });

  if (bookings.isLoading) {
    return (
      <div className="mb-list" aria-label="Loading bookings">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }
  if (bookings.isError) {
    return (
      <div className="mb-empty">
        <PitchArt />
        <h2>We couldn't load your bookings</h2>
        <p>Check your connection and try again.</p>
        <button type="button" className="btn outline lg" onClick={() => void bookings.refetch()}>
          <LuRefreshCw aria-hidden /> Try again
        </button>
      </div>
    );
  }

  const all = bookings.data!;
  if (all.length === 0) {
    return (
      <div className="mb-empty">
        <PitchArt />
        <h2>No matches booked yet.</h2>
        <p>Floodlit turf, a flat hourly rate and instant confirmation. Your first game is a few taps away.</p>
        <Link to="/book" className="h-btn lime lg">
          Book Your First Match <LuArrowRight aria-hidden />
        </Link>
      </div>
    );
  }

  const upcoming = all.filter(isUpcoming).sort((a, b) => key(a).localeCompare(key(b)));
  const history = all.filter((b) => !isUpcoming(b)).sort((a, b) => key(b).localeCompare(key(a)));
  const items = tab === 'upcoming' ? upcoming : history;
  const find = (id: string | null) => all.find((b) => b.id === id);
  const open = find(openId);
  const target = dialog ? find(dialog.id) : undefined;

  return (
    <>
      <div className="mb-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          <LuCalendarClock aria-hidden /> Upcoming <span>{upcoming.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>
          <LuHistory aria-hidden /> Booking History <span>{history.length}</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mb-empty small">
          <PitchArt />
          <h2>{tab === 'upcoming' ? 'No upcoming matches' : 'No past games yet'}</h2>
          <p>{tab === 'upcoming' ? 'Your next game will show up here with its entry QR.' : 'Finished and cancelled games will appear here.'}</p>
          <Link to="/book" className="h-btn lime lg">
            Book a Match <LuArrowRight aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="mb-list">
          {items.map((b) => (
            <BookingCard
              key={b.id}
              b={b}
              onOpen={() => setOpenId(b.id)}
              onCancel={() => setDialog({ type: 'cancel', id: b.id })}
              onMove={() => setDialog({ type: 'move', id: b.id })}
            />
          ))}
        </div>
      )}

      {open && (
        <Modal open wide onClose={() => setOpenId(null)} title="Booking details" subtitle={`${open.id} · ${longDate(open.date)}`}>
          <BookingDetailsBody booking={open} />
        </Modal>
      )}
      {dialog?.type === 'cancel' && target && <CancelDialog booking={target} onClose={() => setDialog(null)} />}
      {dialog?.type === 'move' && target && <RescheduleDialog booking={target} onClose={() => setDialog(null)} />}
    </>
  );
};

export const MyBookings = () => (
  <div className="mb-page">
    <div className="container">
      <header className="mb-head">
        <span className="a-eyebrow">My bookings</span>
        <h1>Your Games, All in One Place</h1>
        <p>Manage your upcoming matches and revisit your previous games.</p>
      </header>
      <RequireLogin>
        <List />
      </RequireLogin>
    </div>
  </div>
);
