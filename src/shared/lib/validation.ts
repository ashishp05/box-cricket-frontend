// Field sanitisers (applied while typing) and validators shared by every form on the site.
// They mirror the backend rules so most mistakes are caught before a request is sent.

// Digits only, at most 10. A pasted "+91 98765 43210" or "098765 43210" becomes "9876543210".
export const sanitizePhone = (value: string): string => {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
};

export const phoneError = (phone: string): string | undefined => {
  if (!phone) return 'Enter your 10-digit mobile number.';
  if (phone.length !== 10) return 'Mobile number must be exactly 10 digits.';
  if (!/^[6-9]/.test(phone)) return 'Mobile numbers start with 6, 7, 8 or 9.';
  return undefined;
};

// Letters (any language), spaces, dots, apostrophes and hyphens; no leading spaces or doubles.
export const sanitizeName = (value: string): string =>
  value
    .replace(/[^\p{L}\p{M} .'-]/gu, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 80);

export const nameError = (name: string): string | undefined => {
  const n = name.trim();
  if (!n) return 'Please enter your name.';
  if (n.length < 2) return 'Name must be at least 2 letters.';
  if (!/^\p{L}[\p{L}\p{M} .'-]*$/u.test(n)) return 'Name can only contain letters, spaces, dots, apostrophes and hyphens.';
  return undefined;
};

export const emailError = (email: string): string | undefined => {
  const e = email.trim();
  if (!e) return undefined;
  if (e.length > 120) return 'Email is too long.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'Enter a valid email address.';
  return undefined;
};

export const birthdayError = (date: string, today: string): string | undefined => {
  if (!date) return undefined;
  if (date >= today) return 'Birthday must be in the past.';
  if (date < '1900-01-01') return 'Enter a real birth date.';
  return undefined;
};

// Offer codes: letters, digits, - and _, upper-cased, max 32.
export const sanitizeCode = (value: string): string => value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);

export const NOTE_MAX = 500;
