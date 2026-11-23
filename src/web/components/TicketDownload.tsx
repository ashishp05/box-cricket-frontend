import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState } from 'react';
import { LuDownload } from 'react-icons/lu';

import type { Booking } from '@shared/api/types';
import { hourLabel, hoursText, longDate, phoneText, rupees } from '@shared/lib/format';
import { cx } from '@shared/ui/core';

import { paymentStatus } from './booking';

const W = 1080;
const H = 1560;
const NIGHT = '#062019';
const LIME = '#c8f23a';
const DISPLAY = "'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Geist Variable', system-ui, sans-serif";

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

// Draws the entry ticket (booking details + QR) onto a canvas and saves it as a PNG.
const drawTicket = async (b: Booking, qr: HTMLCanvasElement, address: string) => {
  await Promise.all([document.fonts.load(`700 40px ${DISPLAY}`), document.fonts.load(`400 20px ${BODY}`), document.fonts.load(`600 20px ${BODY}`)]);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f5f2ea';
  ctx.fillRect(0, 0, W, H);

  // Dark top
  const top = 760;
  roundRect(ctx, 60, 60, W - 120, H - 120, 48);
  ctx.save();
  ctx.clip();
  const g = ctx.createLinearGradient(0, 60, 0, top);
  g.addColorStop(0, '#0b3325');
  g.addColorStop(1, NIGHT);
  ctx.fillStyle = g;
  ctx.fillRect(60, 60, W - 120, top - 60);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(60, top, W - 120, H - top);
  ctx.restore();

  const x = 130;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 26px ${DISPLAY}`;
  ctx.fillText('THE', x, 160);
  ctx.fillStyle = LIME;
  ctx.font = `700 40px ${DISPLAY}`;
  ctx.fillText('Riverside Cricket Box', x, 205);

  // Status pill
  const status = b.status === 'upcoming' ? 'CONFIRMED' : b.status.toUpperCase();
  ctx.font = `700 22px ${BODY}`;
  const pw = ctx.measureText(status).width + 48;
  roundRect(ctx, W - 130 - pw, 150, pw, 50, 25);
  ctx.fillStyle = b.status === 'upcoming' ? LIME : '#fff1d6';
  ctx.fill();
  ctx.fillStyle = NIGHT;
  ctx.fillText(status, W - 130 - pw + 24, 183);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `600 22px ${BODY}`;
  ctx.fillText('BOOKING ID', x, 300);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 72px ${DISPLAY}`;
  ctx.fillText(b.id, x, 375);

  const facts: [string, string][] = [
    ['DATE', longDate(b.date)],
    ['TIME', `${hourLabel(b.startHour)} – ${hourLabel(b.startHour + b.hours)}`],
    ['DURATION', hoursText(b.hours)],
    ['BOX', b.pitchName],
  ];
  facts.forEach(([k, val], i) => {
    const fx = x + (i % 2) * 420;
    const fy = 470 + Math.floor(i / 2) * 130;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 20px ${BODY}`;
    ctx.fillText(k, fx, fy);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${val.length > 22 ? 30 : 36}px ${DISPLAY}`;
    ctx.fillText(val, fx, fy + 48);
  });

  // Perforation
  ctx.fillStyle = '#f5f2ea';
  ctx.beginPath();
  ctx.arc(60, top, 34, 0, Math.PI * 2);
  ctx.arc(W - 60, top, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9d5c7';
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(110, top);
  ctx.lineTo(W - 110, top);
  ctx.stroke();
  ctx.setLineDash([]);

  // QR
  const qs = 380;
  const qx = (W - qs) / 2;
  const qy = top + 70;
  roundRect(ctx, qx - 24, qy - 24, qs + 48, qs + 48, 28);
  ctx.strokeStyle = '#e2dfd2';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.drawImage(qr, qx, qy, qs, qs);

  ctx.textAlign = 'center';
  ctx.fillStyle = NIGHT;
  ctx.font = `700 34px ${DISPLAY}`;
  ctx.fillText('Show this QR at the entry', W / 2, qy + qs + 90);
  ctx.fillStyle = '#55655f';
  ctx.font = `400 24px ${BODY}`;
  ctx.fillText('Please arrive 10 minutes before your slot.', W / 2, qy + qs + 130);

  // Footer row
  ctx.textAlign = 'left';
  const fy = H - 170;
  ctx.strokeStyle = '#ebe8de';
  ctx.beginPath();
  ctx.moveTo(130, fy - 50);
  ctx.lineTo(W - 130, fy - 50);
  ctx.stroke();
  const cols: [string, string][] = [
    ['PLAYER', `${b.customerName} · ${phoneText(b.customerPhone)}`],
    ['PAID', `${rupees(b.price.total)} · ${paymentStatus(b).label}`],
  ];
  cols.forEach(([k, val], i) => {
    ctx.fillStyle = '#8a9791';
    ctx.font = `600 18px ${BODY}`;
    ctx.fillText(k, 130, fy + i * 62);
    ctx.fillStyle = NIGHT;
    ctx.font = `600 24px ${BODY}`;
    ctx.fillText(val, 130, fy + 30 + i * 62);
  });
  ctx.fillStyle = '#8a9791';
  ctx.font = `400 18px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText(address.length > 48 ? `${address.slice(0, 46)}…` : address, W - 130, H - 90);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create the ticket image.');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `riverside-ticket-${b.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// "Download ticket" button. Only for paid bookings: the entry QR is only valid once confirmed.
export const TicketDownload = ({ booking, address, className, label = 'Download Ticket' }: { booking: Booking; address: string; className?: string; label?: string }) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const allowed = booking.status === 'upcoming' || booking.status === 'completed';
  if (!allowed) return null;
  return (
    <>
      <button
        type="button"
        className={cx('btn', className)}
        disabled={busy}
        onClick={async () => {
          if (!qrRef.current) return;
          setBusy(true);
          try {
            await drawTicket(booking, qrRef.current, address);
          } finally {
            setBusy(false);
          }
        }}
      >
        <LuDownload aria-hidden /> {busy ? 'Preparing…' : label}
      </button>
      <QRCodeCanvas ref={qrRef} value={booking.id} size={380} marginSize={0} fgColor={NIGHT} style={{ display: 'none' }} aria-hidden />
    </>
  );
};
