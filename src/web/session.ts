import { createSessionStore } from '@shared/lib/session';
import type { Visitor } from '@shared/api/types';

export interface CustomerSession {
  token: string;
  visitor: Visitor;
}

// How customers log in. Must match the backend's CUSTOMER_LOGIN_MODE.
export const LOGIN_WITH_OTP = import.meta.env.VITE_CUSTOMER_LOGIN_MODE === 'otp';

export const customerSession = createSessionStore<CustomerSession>('rcb.customer.session');
export const useCustomer = () => customerSession.use();

// The slot selection waiting for login / checkout, so a refresh or OTP detour keeps it.
export interface PendingSelection {
  date: string;
  pitchId: string;
  hours: number[];
}
const SELECTION_KEY = 'rcb.customer.selection';
export const saveSelection = (s: PendingSelection | null) =>
  s ? sessionStorage.setItem(SELECTION_KEY, JSON.stringify(s)) : sessionStorage.removeItem(SELECTION_KEY);
export const loadSelection = (): PendingSelection | null => {
  try {
    return JSON.parse(sessionStorage.getItem(SELECTION_KEY) ?? 'null') as PendingSelection | null;
  } catch {
    return null;
  }
};

// Name + mobile from the welcome screen. Kept on this device only and used to pre-fill login and
// booking details (the server identity is the OTP login).
export interface GuestProfile {
  name: string;
  phone: string;
}
const GUEST_KEY = 'rcb.customer.guest';
export const loadGuest = (): GuestProfile | null => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? 'null') as GuestProfile | null;
  } catch {
    return null;
  }
};
export const saveGuest = (guest: GuestProfile) => localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
