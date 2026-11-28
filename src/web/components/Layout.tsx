import { useEffect } from 'react';
import { LuCalendarPlus, LuHouse, LuLandPlot, LuTicket, LuUser } from 'react-icons/lu';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { useCustomer } from '../session';
import { CONTACT_EMAIL } from '../content';
import { Logo } from './art';

const tabs = [
  { to: '/', label: 'Home', icon: LuHouse, active: LuHouse, end: true },
  { to: '/arena', label: 'Arena', icon: LuLandPlot, active: LuLandPlot },
  { to: '/book', label: 'Book', icon: LuCalendarPlus, active: LuCalendarPlus, book: true },
  { to: '/bookings', label: 'Bookings', icon: LuTicket, active: LuTicket },
  { to: '/profile', label: 'Profile', icon: LuUser, active: LuUser },
];

export const TabBar = () => (
  <nav className="tabbar" aria-label="Main">
    {tabs.map((t) => (
      <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `${isActive ? 'active' : ''}${t.book ? ' book' : ''}`}>
        {({ isActive }) => {
          const Icon = isActive ? t.active : t.icon;
          return (
            <>
              <span className="ic">
                <Icon aria-hidden />
              </span>
              {t.label}
            </>
          );
        }}
      </NavLink>
    ))}
  </nav>
);

export const SiteHeader = () => {
  const customer = useCustomer();
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" aria-label="The Riverside Cricket Box, home">
          <Logo inverse />
        </Link>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/arena">Arena</NavLink>
          <NavLink to="/bookings">My bookings</NavLink>
        </nav>
        <div className="header-actions">
          {customer ? (
            <Link to="/profile" className="account-chip">
              <span className="avatar">{(customer.visitor.name || '?').slice(0, 1).toUpperCase()}</span>
              {customer.visitor.name.split(' ')[0] || 'Profile'}
            </Link>
          ) : (
            <Link to="/auth" className="account-chip">
              <LuUser aria-hidden /> Log in
            </Link>
          )}
          <Link to="/book" className="header-book">
            Book a slot
          </Link>
        </div>
        <Link to="/profile" className="mobile-account" aria-label="Profile">
          <LuUser aria-hidden />
        </Link>
      </div>
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <Logo inverse />
          <p>The Riverside Cricket Box - Ashmavati Riverfront, Porbandar. Open 24 hours. Pick a slot and play tonight.</p>
        </div>
        <div>
          <h4>Play</h4>
          <ul>
            <li>
              <Link to="/book">Book a slot</Link>
            </li>
            <li>
              <Link to="/arena">The arena</Link>
            </li>
            <li>
              <Link to="/bookings">My bookings</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Visit us</h4>
          <ul>
            <li>M. G. Road, Porbandar</li>
            <li>
              <a href="tel:+917507197507">+91 75071 97507</a>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li>Open 24 hours</li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li>
              <Link to="/terms">Terms of use</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy policy</Link>
            </li>
            <li>
              <Link to="/terms#cancellation">Cancellation policy</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} The Riverside Cricket Box.</div>
    </div>
  </footer>
);

export const Layout = () => {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className={`site${location.pathname === '/' ? ' home' : ''}`}>
      <SiteHeader />
      <main className="site-main">
        <Outlet />
      </main>
      <SiteFooter />
      <TabBar />
    </div>
  );
};

