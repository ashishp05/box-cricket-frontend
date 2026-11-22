// Models for the HTTP contract in RCB_backend/API.md. Money is rupees unless noted.

export type BookingStatus = 'pending' | 'upcoming' | 'completed' | 'cancelled';
export type BookingChannel = 'self' | 'counter';
export type PaymentKind = 'upi_qr' | 'credit_card' | 'debit_card' | 'cash';
export type OnlinePaymentKind = Exclude<PaymentKind, 'cash'>;
export type SlotStatus = 'available' | 'booked' | 'held' | 'past';
export type StaffRole = 'admin' | 'staff';
export type OfferKind = 'flat' | 'percent';
export type OfferAccent = 'lime' | 'ball' | 'sky' | 'amber';

export interface PriceLine {
  hour: number;
  amount: number;
  isPeak: boolean;
}

export interface Price {
  lines: PriceLine[];
  subtotal: number;
  discount: number;
  platformFee: number;
  taxes: number;
  total: number;
  hourlyRate: number;
  hours: number;
  gstRate: number;
  couponCode: string | null;
}

export interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  venueArea: string;
  pitchId: string;
  pitchName: string;
  date: string;
  startHour: number;
  endHour: number;
  hours: number;
  slotLabel: string;
  status: BookingStatus;
  channel: BookingChannel;
  paymentKind: PaymentKind | null;
  paymentMethod: string | null;
  paymentMethodLabel: string | null;
  createdBy: 'guest' | 'staff';
  price: Price;
  customerName: string;
  customerPhone: string;
  staffId: string | null;
  players: number | null;
  notes: string | null;
  refundAmount: number | null;
  cancelReason: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface PaymentOrder {
  bookingId: string;
  orderId: string;
  // Paise.
  amount: number;
  currency: string;
  keyId: string;
  qrString: string | null;
  method: OnlinePaymentKind;
  mock: boolean;
}

export interface Pitch {
  id: string;
  name: string;
  size: string;
  format: string;
}

export interface VenueSettings {
  hourlyRate: number;
  additionalCharge: number;
  gstRate: number;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  area: string;
  city: string;
  address: string;
  description: string;
  phone: string;
  settings: VenueSettings;
  pitches: Pitch[];
  openHour: number;
  closeHour: number;
  minHours: number;
  maxHours: number;
  advanceDays: number;
}

export interface Slot {
  hour: number;
  label: string;
  status: SlotStatus;
  price: number;
  isPeak: boolean;
}

export interface SlotGrid {
  date: string;
  pitchId: string;
  slots: Slot[];
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  label: string;
  kind: OfferKind;
  value: number;
  maxDiscount: number | null;
  minSubtotal: number;
  minHours: number;
  weekdaysOnly: boolean;
  accent: OfferAccent;
  active: boolean;
  validFrom: string | null;
  validTo: string | null;
}

export interface Hold {
  holdId: string;
  expiresAt: string;
  venueId: string;
  pitchId: string;
  date: string;
  hours: number[];
}

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthday: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface OtpSent {
  message: string;
  phone: string;
  expiresIn: number;
  resendAfter: number;
  devCode?: string;
}

export interface VisitorSession {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number | null;
  visitor: Visitor;
  needsName: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSession {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number | null;
  staffId: string;
  staff: Staff;
}

export interface Dashboard {
  venueId: string;
  date: string;
  bookings: number;
  bookedHours: number;
  openHours: number;
  occupancy: number;
  revenue: number;
  pendingToday: number;
  cancelledToday: number;
  byChannel: { channel: BookingChannel; bookings: number; revenue: number }[];
  pendingTotal: number;
  upcomingTotal: number;
  today: Booking[];
}

export interface PaymentRecord {
  id: string;
  provider: string;
  orderId: string;
  paymentId: string | null;
  status: 'created' | 'captured' | 'failed' | 'refunded';
  amount: number;
  method: string;
  refundId: string | null;
  createdAt: string;
}

export interface SmsMessage {
  id: string;
  toPhone: string;
  recipient: 'customer' | 'admin';
  body: string;
  bookingId: string | null;
  provider: string;
  providerId: string | null;
  status: 'sent' | 'failed' | 'simulated';
  error: string | null;
  sentAt: string;
}

export interface AdminBookingDetail extends Booking {
  staff: { id: string; name: string } | null;
  payments: PaymentRecord[];
  sms: SmsMessage[];
}

export interface WalkInResult extends Booking {
  payment: PaymentOrder | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  count: number;
  totalSpent: number;
  firstSeen: string;
  lastSeen: string;
  lastBookingAt: string | null;
}

export interface CustomerDetail extends Customer {
  bookings: Booking[];
}

export interface AdminSettings extends VenueSettings {
  preview: {
    hours: number;
    hourlyBookingCharge: number;
    additionalCharge: number;
    taxes: number;
    totalPayable: number;
  };
  openHour: number;
  closeHour: number;
  minHours: number;
  maxHours: number;
  advanceDays: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}
