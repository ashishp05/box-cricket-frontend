import type { Hold } from '@shared/api/types';

// The live hold and a chosen offer code survive refreshes during checkout (per tab).
const HOLD_KEY = 'rcb.customer.hold';
const OFFER_KEY = 'rcb.customer.offer';

export const saveHold = (hold: Hold | null) =>
  hold ? sessionStorage.setItem(HOLD_KEY, JSON.stringify(hold)) : sessionStorage.removeItem(HOLD_KEY);

export const loadHold = (): Hold | null => {
  try {
    return JSON.parse(sessionStorage.getItem(HOLD_KEY) ?? 'null') as Hold | null;
  } catch {
    return null;
  }
};

export const saveOfferCode = (code: string | null) =>
  code ? sessionStorage.setItem(OFFER_KEY, code) : sessionStorage.removeItem(OFFER_KEY);
export const loadOfferCode = () => sessionStorage.getItem(OFFER_KEY);
