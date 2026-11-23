import { useQuery } from '@tanstack/react-query';
import { LuArrowLeft, LuCalendarPlus, LuCopy, LuHourglass, LuListChecks, LuMapPin, LuNavigation, LuShare2, LuWallet } from 'react-icons/lu';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { downloadCalendarFile } from '@shared/lib/calendar';
import { hourLabel, hoursText, longDate, phoneText, rupees } from '@shared/lib/format';
import { ErrorState, Skeleton } from '@shared/ui/core';
import { useToast } from '@shared/ui/Toast';

import { api, queryKeys } from '../api';
import { paymentStatus, Pill } from '../components/booking';
import { BookingDetailsBody, QrTicket, useCopyId, useShare } from '../components/BookingDetails';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { Confetti } from '../components/confetti';
import { mapsUrl } from '../components/MapCard';
import { RequireLogin } from '../components/RequireLogin';
import { TicketDownload } from '../components/TicketDownload';
import { useVenue } from '../hooks';

const DetailsSkeleton = () => (
  <div className="bd-grid" aria-label="Loading booking">
    <Skeleton height={420} />
    <div className="stack">
      <Skeleton height={160} />
      <Skeleton height={160} />
    </div>
  </div>
);

const Detail = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const booking = useQuery({ queryKey: queryKeys.booking(id), queryFn: () => api.booking(id) });
  return (
    <div className="bd-page">
      <button type="button" className="bk-link" onClick={() => navigate('/bookings')}>
        <LuArrowLeft aria-hidden /> My bookings
      </button>
      <h1>Booking details</h1>
      {booking.isLoading ? (
        <DetailsSkeleton />
      ) : booking.isError ? (
        <div className="bk-card bk-state">
          <ErrorState error={booking.error} title="We could not find this booking" onRetry={() => booking.refetch()} />
        </div>
      ) : (
        <BookingDetailsBody booking={booking.data!} />
      )}
    </div>
  );
};

export const BookingDetail = () => {
  const { id = '' } = useParams();
  return (
    <div className="container">
      <RequireLogin title="Log in to see this booking" text="Log in with the mobile number you booked with to see this booking.">
        <Detail id={id} />
      </RequireLogin>
    </div>
  );
};

// ---------- Step 6: confirmation ----------

const ConfirmedInner = ({ id }: { id: string }) => {
  const venue = useVenue();
  const share = useShare();
  const copy = useCopyId();
  const toast = useToast();
  const booking = useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: () => api.booking(id),
    // Payment confirmed by webhook a moment later: keep checking while pending.
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 4000 : false),
  });
  if (booking.isLoading) return <DetailsSkeleton />;
  if (booking.isError)
    return (
      <div className="bk-card bk-state">
        <ErrorState error={booking.error} title="We could not find this booking" onRetry={() => booking.refetch()} />
      </div>
    );
  const b = booking.data!;
  const paid = b.status === 'upcoming' || b.status === 'completed';
  const address = venue.data?.address ?? 'At Ashmavati Riverfront, Opp. Jalaram Colony, M. G. Road, Porbandar';
  const pay = paymentStatus(b);

  return (
    <div className="cf">
      {paid && <Confetti />}
      <div className={`cf-hero${paid ? '' : ' pending'}`}>
        <div className="cf-tick" aria-hidden>
          {paid ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <LuHourglass />
          )}
        </div>
        <h1>{paid ? 'Booking Confirmed!' : 'Booking received'}</h1>
        <p>
          {paid
            ? `You're all set for ${longDate(b.date)}. We've sent the details to ${phoneText(b.customerPhone)}.`
            : "We're waiting for the payment to clear. This page updates by itself, and we'll SMS you once it's confirmed."}
        </p>
        <button type="button" className="cf-id" onClick={() => copy(b.id)}>
          Booking ID <b>{b.id}</b> <LuCopy aria-hidden />
        </button>
      </div>

      <div className="cf-grid">
        <QrTicket booking={b} size={170} />

        <div className="cf-side">
          <div className="bk-card cf-info">
            <div className="cf-row">
              <span className="cf-ic">
                <LuMapPin aria-hidden />
              </span>
              <div className="grow">
                <small>Arena</small>
                <strong>
                  {b.venueName} · {b.pitchName}
                </strong>
                <span>{address}</span>
              </div>
              <a href={mapsUrl(address)} target="_blank" rel="noreferrer" className="cf-mini" aria-label="Directions">
                <LuNavigation />
              </a>
            </div>
            <div className="cf-row">
              <span className="cf-ic">
                <LuCalendarPlus aria-hidden />
              </span>
              <div className="grow">
                <small>Date &amp; time</small>
                <strong>{longDate(b.date)}</strong>
                <span>
                  {hourLabel(b.startHour)} – {hourLabel(b.startHour + b.hours)} · {hoursText(b.hours)}
                </span>
              </div>
              <button
                type="button"
                className="cf-mini"
                aria-label="Add to calendar"
                onClick={() => {
                  downloadCalendarFile(b, address);
                  toast.show('Calendar file downloaded');
                }}
              >
                <LuCalendarPlus />
              </button>
            </div>
            <div className="cf-row">
              <span className="cf-ic">
                <LuWallet aria-hidden />
              </span>
              <div className="grow">
                <small>Payment</small>
                <strong>{rupees(b.price.total)}</strong>
                <span>
                  <Pill tone={pay.tone}>{pay.label}</Pill>
                </span>
              </div>
            </div>
          </div>

          <div className="cf-actions">
            <TicketDownload booking={b} address={address} className="lime lg block" />
            <Link to="/bookings" className="btn outline lg block">
              <LuListChecks aria-hidden /> View My Bookings
            </Link>
            <button type="button" className="bk-link" onClick={() => void share(b)}>
              <LuShare2 aria-hidden /> Share with your team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Confirmed = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  return (
    <CheckoutLayout step={6} title="Confirmed" onBack={() => navigate('/bookings')}>
      <RequireLogin title="Log in to see this booking">
        <ConfirmedInner id={id} />
      </RequireLogin>
    </CheckoutLayout>
  );
};
