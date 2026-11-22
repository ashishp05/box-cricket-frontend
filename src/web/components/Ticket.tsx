import { QRCodeSVG } from 'qrcode.react';
import { MdCheckCircle, MdContentCopy, MdLockOutline, MdReceiptLong } from 'react-icons/md';

import type { Booking } from '@shared/api/types';
import { channelLabel, dateTime, hoursText, phoneText, shortDate, shortRange, statusLabel } from '@shared/lib/format';
import { PriceBreakdown } from '@shared/ui/PriceBreakdown';
import { useToast } from '@shared/ui/Toast';

// Dark booking ticket with entry QR (active only once the booking is paid).
export const Ticket = ({ booking: b }: { booking: Booking }) => {
  const toast = useToast();
  const copy = () =>
    void navigator.clipboard
      .writeText(b.id)
      .then(() => toast.show(`Booking ID ${b.id} copied`))
      .catch(() => toast.show(`Booking ID ${b.id}`));
  const active = b.status === 'upcoming';
  return (
    <div className={`ticket${b.status === 'cancelled' ? ' cancelled' : ''}`}>
      <div className="ticket-top">
        <span className="ticket-id">{b.id}</span>
        <span className="chip-status" style={b.status === 'upcoming' ? undefined : { background: '#fff1d6', color: '#b36b00' }}>
          {b.status === 'upcoming' ? <MdCheckCircle aria-hidden /> : null}
          {statusLabel[b.status]}
        </span>
        <h3>{b.venueName}</h3>
        <p className="where">
          {b.pitchName} • M. G. Road, Porbandar
        </p>
        <div className="ticket-facts">
          <div>
            <small>DATE</small>
            <strong>{shortDate(b.date)}</strong>
          </div>
          <div>
            <small>TIME</small>
            <strong>{shortRange(b.startHour, b.hours)}</strong>
          </div>
          <div>
            <small>DURATION</small>
            <strong>{hoursText(b.hours)}</strong>
          </div>
        </div>
      </div>
      <div className="ticket-cut" />
      <div className="ticket-bottom">
        <div className="qr-box">
          {active ? (
            <QRCodeSVG value={b.id} size={116} bgColor="#ffffff" fgColor="#07201a" />
          ) : (
            <div style={{ width: 116, height: 116, display: 'grid', placeItems: 'center', color: '#8a9791' }}>
              <MdLockOutline size={40} aria-hidden />
            </div>
          )}
        </div>
        <div>
          <strong>Show at entry</strong>
          <p>
            {b.status === 'cancelled'
              ? 'This booking was cancelled, so the entry QR is no longer valid.'
              : active
                ? 'Staff will scan this QR. Arrive 10 minutes early to warm up.'
                : 'Your QR becomes active as soon as the payment is confirmed.'}
          </p>
          <button type="button" className="link" onClick={copy}>
            <MdContentCopy size={18} aria-hidden /> Copy booking ID
          </button>
        </div>
      </div>
    </div>
  );
};

export const Receipt = ({ booking: b }: { booking: Booking }) => (
  <div className="card pad receipt">
    <div className="card-head">
      <MdReceiptLong aria-hidden /> Payment receipt
    </div>
    <PriceBreakdown price={b.price} />
    <hr className="divider" />
    <dl className="kv">
      <dt>Customer</dt>
      <dd>{b.customerName}</dd>
      <dt>Mobile</dt>
      <dd>{phoneText(b.customerPhone)}</dd>
      <dt>Channel</dt>
      <dd>{channelLabel[b.channel] === 'Online' ? 'Self' : 'Counter'}</dd>
      <dt>Payment method</dt>
      <dd>{b.status === 'pending' ? 'Not paid yet' : (b.paymentMethodLabel ?? '-')}</dd>
      <dt>Booked on</dt>
      <dd>{dateTime(b.createdAt)}</dd>
      {b.players && (
        <>
          <dt>Players</dt>
          <dd>{b.players}</dd>
        </>
      )}
      {b.refundAmount !== null && (
        <>
          <dt>Refund</dt>
          <dd>₹{b.refundAmount}</dd>
        </>
      )}
    </dl>
  </div>
);

