import { Link } from 'react-router-dom';

import { EmptyState } from '@shared/ui/core';

import { EmptyTicketArt } from '../components/art';

export const Terms = () => (
  <div className="container prose">
    <h1>Terms of use</h1>
    <p>These terms cover bookings made at The Riverside Cricket Box, Ashmavati Riverfront, Porbandar.</p>
    <h3>Bookings and payment</h3>
    <p>A booking is confirmed only after online payment succeeds, or after payment at the counter. Selected slots are held for 8 minutes during checkout and unpaid bookings are released after 15 minutes.</p>
    <h3 id="cancellation">Cancellations and refunds</h3>
    <p>Cancel 24 hours or more before the start for a 100% refund, 6 to 24 hours before for 50%, and less than 6 hours before for no refund. Online refunds go back to the original payment method within 3-5 working days.</p>
    <h3>Rescheduling</h3>
    <p>You can move a confirmed booking to another free time of the same length until 2 hours before the original start, at no charge.</p>
    <h3>At the venue</h3>
    <p>Tennis or rubber balls only. Damage to nets, turf or lights is charged at actuals. No smoking, alcohol or gutka on the premises. Your slot ends on time for the next team.</p>
    <h3>Privacy</h3>
    <p>
      See the <Link to="/privacy" className="link">privacy policy</Link>.
    </p>
  </div>
);

export const Privacy = () => (
  <div className="container prose">
    <h1>Privacy policy</h1>
    <p>We collect only what we need to run your bookings.</p>
    <h3>What we store</h3>
    <p>Your mobile number (your login), name, and optionally email and birthday. We keep your booking history and payment status. Card and UPI details are handled by Razorpay; we never see or store your card number.</p>
    <h3>How we use it</h3>
    <p>To confirm bookings by SMS, process refunds, and let venue staff look up your booking at the counter. We do not sell your data.</p>
    <h3>Your choices</h3>
    <p>You can edit or clear your email and birthday from your profile at any time. Contact the venue to delete your account.</p>
  </div>
);

export const NotFound = () => (
  <div className="container">
    <EmptyState art={<EmptyTicketArt />} title="Page not found" action={<Link to="/" className="btn primary lg">Go to home page</Link>}>
      The page you are looking for does not exist or has moved.
    </EmptyState>
  </div>
);
