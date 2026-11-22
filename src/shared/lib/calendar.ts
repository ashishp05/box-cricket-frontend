import type { Booking } from '../api/types';
import { slotStart } from './time';

const icsStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Downloads an .ics file so the booking can be added to any calendar app.
export const downloadCalendarFile = (booking: Booking, address: string) => {
  const start = slotStart(booking.date, booking.startHour);
  const end = slotStart(booking.date, booking.endHour);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Riverside Cricket Box//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@riverside-cricket-box`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:Box cricket at ${booking.venueName} (${booking.pitchName})`,
    `DESCRIPTION:Booking ID ${booking.id}. Show your entry QR at the venue. Arrive 10 minutes early.`,
    `LOCATION:${address.replace(/,/g, '\\,')}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Your box cricket slot starts in 2 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `riverside-${booking.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
};
