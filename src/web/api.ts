import { createApiClient, VENUE_ID } from '@shared/api/client';
import type {
  Booking,
  Hold,
  OnlinePaymentKind,
  Offer,
  OtpSent,
  PaymentOrder,
  Price,
  SlotGrid,
  Venue,
  Visitor,
  VisitorSession,
} from '@shared/api/types';

import { customerSession } from './session';

const client = createApiClient({
  getToken: customerSession.token,
  // Expired or revoked customer login: sign out; pages that need login show the login prompt.
  onUnauthorized: () => customerSession.clear(),
});
const { request } = client;

export const api = {
  // Login (OTP)
  sendOtp: (phone: string) => request<OtpSent>('/visitors/otp/send', { method: 'POST', body: { phone }, token: null }),
  verifyOtp: (phone: string, code: string, name?: string) =>
    request<VisitorSession>('/visitors/otp/verify', { method: 'POST', body: { phone, code, ...(name && { name }) }, token: null }),
  me: () => request<Visitor>('/visitors/me'),
  updateMe: (patch: Partial<Pick<Visitor, 'name' | 'email' | 'birthday'>>) =>
    request<Visitor>('/visitors/me', { method: 'PATCH', body: patch }),

  // Venue
  venue: () => request<Venue>(`/venues/${VENUE_ID}`),
  slots: (date: string, pitchId?: string) => request<SlotGrid>(`/venues/${VENUE_ID}/slots`, { query: { date, pitchId } }),
  offers: () => request<Offer[]>(`/venues/${VENUE_ID}/offers`),

  // Booking flow
  price: (body: { hours: number; date?: string; startHour?: number; offerCode?: string }) =>
    request<Price>('/bookings/price', { method: 'POST', body: { venueId: VENUE_ID, ...body } }),
  createHold: (body: { pitchId: string; date: string; hours: number[] }) =>
    request<Hold>('/holds', { method: 'POST', body: { venueId: VENUE_ID, ...body } }),
  releaseHold: (holdId: string) => request<void>(`/holds/${holdId}`, { method: 'DELETE' }),
  createBooking: (body: { holdId: string; customerName?: string; players?: number; notes?: string; offerCode?: string }) =>
    request<Booking>('/bookings', { method: 'POST', body: { channel: 'self', ...body } }),

  // My bookings
  myBookings: () => request<Booking[]>('/bookings'),
  booking: (id: string) => request<Booking>(`/bookings/${id}`),
  cancel: (id: string, reason?: string) => request<Booking>(`/bookings/${id}/cancel`, { method: 'POST', body: { reason } }),
  reschedule: (id: string, date: string, startHour: number) =>
    request<Booking>(`/bookings/${id}/reschedule`, { method: 'POST', body: { date, startHour } }),

  // Payments
  createOrder: (bookingId: string, method: OnlinePaymentKind) =>
    request<PaymentOrder>('/payments/razorpay/order', { method: 'POST', body: { bookingId, method } }),
  verifyPayment: (body: { bookingId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    request<Booking>('/payments/razorpay/verify', { method: 'POST', body }),
};

export const queryKeys = {
  venue: ['venue'] as const,
  offers: ['offers'] as const,
  slots: (date: string, pitchId: string) => ['slots', date, pitchId] as const,
  myBookings: ['my-bookings'] as const,
  booking: (id: string) => ['booking', id] as const,
  me: ['me'] as const,
};
