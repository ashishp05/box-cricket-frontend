import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MdChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';

import type { Booking } from '@shared/api/types';
import { hoursText, monthShort, rupees, shortDate, shortRange, weekdayShort } from '@shared/lib/format';
import { EmptyState, ErrorState, Loading, StatusBadge } from '@shared/ui/core';

import { api, queryKeys } from '../api';
import { EmptyTicketArt } from '../components/art';
import { RequireLogin } from '../components/RequireLogin';

type Tab = 'upcoming' | 'past' | 'cancelled';
const tabs: { id: Tab; label: string; match: (b: Booking) => boolean; empty: [string, string] }[] = [
  { id: 'upcoming', label: 'Upcoming', match: (b) => b.status === 'upcoming' || b.status === 'pending', empty: ['No upcoming games', 'Pick a slot and your ticket will show up here.'] },
  { id: 'past', label: 'Past', match: (b) => b.status === 'completed', empty: ['No past games yet', 'Completed matches will show up here so you can book the same slot again.'] },
  { id: 'cancelled', label: 'Cancelled', match: (b) => b.status === 'cancelled', empty: ['Nothing cancelled', 'Cancelled bookings and their refunds will appear here.'] },
];

const BookingCard = ({ b }: { b: Booking }) => (
  <Link to={b.status === 'pending' ? `/checkout/payment/${b.id}` : `/bookings/${b.id}`} className="card booking-card">
    <span className="date-block" aria-hidden>
      <small>{weekdayShort(b.date).toUpperCase()}</small>
      <strong>{Number(b.date.slice(8))}</strong>
      <small style={{ color: '#d7e0dc', fontWeight: 400 }}>{monthShort(b.date)}</small>
    </span>
    <div className="grow">
      <div className="row wrap" style={{ '--gap': '8px' } as React.CSSProperties}>
        <strong style={{ fontSize: 17, fontWeight: 500 }}>{shortRange(b.startHour, b.hours)}</strong>
        <StatusBadge status={b.status} />
      </div>
      <p className="small muted" style={{ marginTop: 4 }}>
        {shortDate(b.date)} · {b.pitchName} · {hoursText(b.hours)} · <span className="mono">{b.id}</span>
      </p>
    </div>
    <strong style={{ fontWeight: 500 }}>{rupees(b.price.total)}</strong>
    <MdChevronRight size={24} aria-hidden />
  </Link>
);

const List = () => {
  const [tab, setTab] = useState<Tab>('upcoming');
  const bookings = useQuery({ queryKey: queryKeys.myBookings, queryFn: api.myBookings });
  if (bookings.isLoading) return <Loading />;
  if (bookings.isError) return <ErrorState error={bookings.error} title="Could not load your bookings." onRetry={() => bookings.refetch()} />;
  const all = bookings.data!;
  const active = tabs.find((t) => t.id === tab)!;
  let items = all.filter(active.match);
  if (tab === 'upcoming') items = [...items].sort((a, b) => `${a.date}${String(a.startHour).padStart(2, '0')}`.localeCompare(`${b.date}${String(b.startHour).padStart(2, '0')}`));
  return (
    <>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" className="chip" aria-selected={t.id === tab} aria-pressed={t.id === tab} onClick={() => setTab(t.id)}>
            {t.label} ({all.filter(t.match).length})
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <EmptyState art={<EmptyTicketArt />} title={active.empty[0]} action={<Link to="/book" className="btn primary lg">Book a slot</Link>}>
          {active.empty[1]}
        </EmptyState>
      ) : (
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          {items.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </>
  );
};

export const MyBookings = () => (
  <div className="container" style={{ width: 'min(880px, 100% - 32px)', paddingTop: 12 }}>
    <h1 style={{ fontSize: 38, marginBottom: 18 }}>My bookings</h1>
    <RequireLogin>
      <List />
    </RequireLogin>
  </div>
);
