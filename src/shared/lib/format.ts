// Display helpers. All venue dates and hours are India time (IST), per the API contract.

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const rupees = (amount: number): string => rupeeFormatter.format(amount);

// 19 -> "7 PM", 0 / 24 -> "12 AM"
export const hourLabel = (hour: number): string => {
  const h = hour % 24;
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${h < 12 ? 'AM' : 'PM'}`;
};

export const slotRange = (startHour: number, hours: number): string =>
  `${hourLabel(startHour)} - ${hourLabel(startHour + hours)}`;

// Compact range as the app shows it: "9 - 10 AM", "12 - 2 PM", "11 AM - 12 PM".
export const shortRange = (startHour: number, hours: number): string => {
  const [a, am] = hourLabel(startHour).split(' ');
  const [b, bm] = hourLabel(startHour + hours).split(' ');
  return am === bm ? `${a} - ${b} ${bm}` : `${a} ${am} - ${b} ${bm}`;
};

const dateOnly = (date: string) => new Date(`${date}T00:00:00Z`);

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', ...options });

// "Mon, 23 Nov"
export const shortDate = (date: string): string =>
  fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(dateOnly(date));

// "Monday, 23 November 2026"
export const longDate = (date: string): string =>
  fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dateOnly(date));

export const weekdayShort = (date: string): string => fmt({ weekday: 'short' }).format(dateOnly(date));
export const dayOfMonth = (date: string): string => fmt({ day: 'numeric' }).format(dateOnly(date));
export const monthShort = (date: string): string => fmt({ month: 'short' }).format(dateOnly(date));

// ISO timestamp -> "23 Nov 2026, 7:15 PM" in IST
export const dateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

export const hoursText = (hours: number): string => (hours === 1 ? '1 hr' : `${hours} hrs`);

// 9876543210 -> "+91 98765 43210"
export const phoneText = (phone: string): string =>
  phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone;

export const statusLabel: Record<string, string> = {
  pending: 'Payment pending',
  upcoming: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const paymentKindLabel: Record<string, string> = {
  upi_qr: 'UPI QR',
  credit_card: 'Credit card',
  debit_card: 'Debit card',
  cash: 'Cash',
};

export const channelLabel: Record<string, string> = { self: 'Online', counter: 'Counter' };
