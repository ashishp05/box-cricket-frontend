import { Navigate, Route, Routes, useParams } from 'react-router-dom';

import { Layout } from './components/Layout';
import { WelcomeGate } from './components/Welcome';
import { Arena } from './pages/Arena';
import { Auth } from './pages/Auth';
import { Book } from './pages/Book';
import { BookingDetail, Confirmed } from './pages/BookingDetail';
import { Checkout } from './pages/Checkout';
import { Details } from './pages/Details';
import { Home } from './pages/Home';
import { MyBookings } from './pages/MyBookings';
import { Pay } from './pages/Pay';
import { Profile } from './pages/Profile';
import { NotFound, Privacy, Terms } from './pages/Static';

const LegacyPay = () => <Navigate to={`/checkout/payment/${useParams().id}`} replace />;

export const App = () => (
  <WelcomeGate>
    <Routes>
      {/* Booking steps use their own header with the six-step progress. */}
      <Route path="book" element={<Book />} />
      <Route path="checkout/summary" element={<Checkout />} />
      <Route path="checkout/details" element={<Details />} />
      <Route path="checkout/payment/:id" element={<Pay />} />
      <Route path="booking/:id/confirmed" element={<Confirmed />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="arena" element={<Arena />} />
        <Route path="auth" element={<Auth />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        {/* Old paths */}
        <Route path="checkout" element={<Navigate to="/checkout/summary" replace />} />
        <Route path="pay/:id" element={<LegacyPay />} />
        <Route path="account" element={<Navigate to="/profile" replace />} />
        <Route path="offers" element={<Navigate to="/#offers" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </WelcomeGate>
);
