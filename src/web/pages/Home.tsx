import { useState } from 'react';
import {
  LuArrowRight,
  LuBadgeCheck,
  LuCalendar,
  LuCalendarDays,
  LuClock,
  LuCreditCard,
  LuEye,
  LuInfo,
  LuMapPin,
  LuRefreshCw,
  LuShieldCheck,
  LuTrophy,
  LuZap,
  LuChevronDown,
} from 'react-icons/lu';
import { MdStar } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import { hourLabel, rupees, shortDate } from '@shared/lib/format';
import { addDays, todayIST } from '@shared/lib/time';

import { Gallery } from '../components/Gallery';
import { MapCard } from '../components/MapCard';
import { OfferCards } from '../components/OfferCards';
import { facilities, faqs, homeReviews, rating } from '../content';
import { useNextFree, useOffers, useVenue } from '../hooks';

export const Stars = ({ count = 5 }: { count?: number }) => (
  <span className="stars" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: count }, (_, i) => (
      <MdStar key={i} aria-hidden />
    ))}
  </span>
);

export const hoursOpenText = (open: number, close: number) =>
  open === 0 && close === 24 ? 'Open 24 hours' : `Open ${hourLabel(open)} - ${hourLabel(close)}`;

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="h-title">
    <h2>{title}</h2>
    {sub && <p>{sub}</p>}
  </div>
);

const CheckSlots = () => {
  const navigate = useNavigate();
  const today = todayIST();
  const [day, setDay] = useState<'today' | 'tomorrow' | string>('today');
  const from = day === 'today' ? today : day === 'tomorrow' ? addDays(today, 1) : day;
  const next = useNextFree(from, 1);
  const venue = useVenue();
  const picked = day !== 'today' && day !== 'tomorrow';

  return (
    <div className="check-card">
      <div className="check-head">
        <h3>Check slots</h3>
        <span className="live-dot">Live availability</span>
      </div>
      <p className="check-q">When do you want to play?</p>
      <div className="day-picks">
        <button type="button" aria-pressed={day === 'today'} onClick={() => setDay('today')}>
          Today
        </button>
        <button type="button" aria-pressed={day === 'tomorrow'} onClick={() => setDay('tomorrow')}>
          Tomorrow
        </button>
        <label aria-pressed={picked}>
          <LuCalendar aria-hidden /> {picked ? shortDate(day) : 'Pick a date'}
          <input
            type="date"
            aria-label="Pick a date"
            min={today}
            max={venue.data ? addDays(today, venue.data.advanceDays) : undefined}
            onChange={(e) => e.target.value && setDay(e.target.value)}
          />
        </label>
      </div>
      <div className={`next-free${next.data ? ' ok' : ''}`}>
        {next.data ? <LuZap aria-hidden /> : <LuInfo aria-hidden />}
        {next.isPending ? (
          <span>Checking live slots…</span>
        ) : next.data ? (
          <span>
            Next free: {shortDate(next.data.date)}, {hourLabel(next.data.hours[0])} · {next.data.pitchName}
          </span>
        ) : (
          <span>No free slots in the booking window. Check back soon.</span>
        )}
      </div>
      <button type="button" className="see-slots" onClick={() => navigate(`/book?date=${next.data?.date ?? from}`)}>
        <LuEye aria-hidden /> See Open Slots <LuArrowRight aria-hidden />
      </button>
      <p className="check-foot">No calls needed · Instant confirmation</p>
    </div>
  );
};

const steps = [
  [LuCalendarDays, 'Pick a Date', 'See which hours are free in each box'],
  [LuClock, 'Pick Your Slot', 'See live availability and the exact price'],
  [LuCreditCard, 'Pay Securely', 'UPI, cards or wallets. Slots are held while you pay'],
  [LuTrophy, 'Play!', 'Show your QR at the venue and start the match'],
] as const;

export const Home = () => {
  const venue = useVenue();
  const offers = useOffers();
  const v = venue.data;
  const rate = v ? rupees(v.settings.hourlyRate) : '₹900';
  const hours = v ? hoursOpenText(v.openHour, v.closeHour) : 'Open 24 hours';
  const allDay = !v || (v.openHour === 0 && v.closeHour === 24);
  const boxes = v?.pitches.length ?? 1;
  const address = v?.address ?? 'At Ashmavati Riverfront, Opp. Jalaram Colony, M. G. Road, Porbandar';

  return (
    <div className="home-page">
      <section className="h-hero">
        <img className="h-hero-img" src="/images/arena-night.webp" alt="" fetchPriority="high" />
        <div className="h-hero-glow" aria-hidden />
        <div className="container h-hero-grid">
          <div className="h-hero-copy">
            <div className="h-pills">
              <span className="pill-lime">
                <i /> Live slots
              </span>
              <span className="pill-white">
                <LuZap aria-hidden /> Instant confirmation
              </span>
            </div>
            <h1 className="h-hero-title">
              Play by the <span>Riverfront.</span>
            </h1>
            <p className="h-hero-sub">
              Floodlit box cricket at {v?.area ?? 'Ashmavati Riverfront'}, {v?.city ?? 'Porbandar'}. {hours}, flat {rate}/hr — see live slots and lock your game
              in under a minute.
            </p>
            <div className="h-hero-meta">
              <span>
                <Stars /> <b>{rating.score}</b> <em>({rating.count} reviews)</em>
              </span>
              <span className="lime">{rate}/hr flat</span>
              <span>
                <LuClock aria-hidden /> {hours}
              </span>
            </div>
          </div>
          <CheckSlots />
        </div>
      </section>

      <section className="h-stats">
        <div className="container h-stats-grid">
          <div>
            <strong>{boxes}</strong>
            <span>{boxes === 1 ? 'Box' : 'Boxes'}</span>
          </div>
          <div>
            <strong className="green">{rate}</strong>
            <span>Per Hour</span>
          </div>
          <div>
            <strong>{rating.score}</strong>
            <span>Rating</span>
          </div>
          <div>
            <strong>{allDay ? 'Open' : hourLabel(v!.openHour)}</strong>
            <span>{allDay ? '24 Hours' : `to ${hourLabel(v!.closeHour)}`}</span>
          </div>
        </div>
      </section>

      <section className="h-band cream">
        <div className="container">
          <SectionTitle title="Meet the Arena" sub={`M. G. Road, ${v?.city ?? 'Porbandar'}`} />
          <div className="h-arena">
            <Gallery venueName={v?.name ?? 'The Riverside Cricket Box'} />
            <aside className="h-arena-side">
              <div className="ground-info">
                <h3>Ground Info</h3>
                <ul>
                  <li>
                    <span className="gi-icon">
                      <LuMapPin aria-hidden />
                    </span>
                    <div>
                      <strong>{v?.area ?? 'Ashmavati Riverfront'}</strong>
                      <small>{address}</small>
                    </div>
                  </li>
                  <li>
                    <span className="gi-icon">
                      <LuClock aria-hidden />
                    </span>
                    <span>{allDay ? 'Open 24 Hours, 7 Days' : hours}</span>
                  </li>
                  <li>
                    <span className="gi-icon">
                      <LuZap aria-hidden />
                    </span>
                    <span>Premium LED Floodlights</span>
                  </li>
                  {v?.pitches.map((p) => (
                    <li key={p.id}>
                      <span className="gi-icon">
                        <LuBadgeCheck aria-hidden />
                      </span>
                      <span>
                        {p.name}: {p.size}, {p.format}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/arena" className="h-btn dark">
                View Full Arena <LuArrowRight aria-hidden />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="h-band">
        <div className="container">
          <SectionTitle title="Everything for Game Night" sub="Facilities included in every booking" />
          <div className="h-facilities">
            {facilities.map(({ name, icon: Icon }) => (
              <div key={name} className="h-facility">
                <span>
                  <Icon aria-hidden />
                </span>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="h-band cream">
        <div className="container">
          <SectionTitle title="Simple, Upfront Pricing" sub={`Book ${v?.minHours ?? 1} to ${v?.maxHours ?? 24} hours. Fees are shown before you pay`} />
          <div className="h-price">
            <div className="h-price-top">
              <div>
                <div className="h-price-amount">
                  {rate} <small>/ hour</small>
                </div>
                <p className="h-price-line">Flat rate · same price any hour, any day. {hours}.</p>
                <p className="h-price-note">Excludes additional charges (payment/platform fee) shown before you pay</p>
              </div>
              <span className="h-price-badge">
                <small>All hours</small>
                Same Price
              </span>
            </div>
            <div className="h-price-feats">
              <div>
                <span>
                  <LuClock aria-hidden />
                </span>
                <p>
                  <strong>Flexible Duration</strong>
                  <small>
                    Book {v?.minHours ?? 1}–{v?.maxHours ?? 24} hours in one slot
                  </small>
                </p>
              </div>
              <div>
                <span>
                  <LuShieldCheck aria-hidden />
                </span>
                <p>
                  <strong>No Hidden Charges</strong>
                  <small>What you see is what you pay</small>
                </p>
              </div>
              <div>
                <span>
                  <LuRefreshCw aria-hidden />
                </span>
                <p>
                  <strong>Easy Cancellation</strong>
                  <small>Cancel or reschedule from My Bookings</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="h-band">
        <div className="container">
          <SectionTitle title="Booked in Four Taps" sub="No calls, no waiting for confirmation" />
          <ol className="h-steps">
            {steps.map(([Icon, title, text], i) => (
              <li key={title}>
                <span className="h-step-icon">
                  <Icon aria-hidden />
                </span>
                <div>
                  <small>Step 0{i + 1}</small>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {offers.data && offers.data.length > 0 && (
        <section className="h-band" id="offers">
          <div className="container">
            <SectionTitle title="Offers for You" sub="Tap a code to copy it" />
            <OfferCards offers={offers.data} />
          </div>
        </section>
      )}

      <section className="h-band cream">
        <div className="container">
          <SectionTitle title="Players Love It" sub="From teams who play here every week" />
          <div className="h-reviews">
            {homeReviews.map((r) => (
              <figure key={r.name} className="h-review">
                <Stars />
                <blockquote>“{r.text}”</blockquote>
                <figcaption>
                  <span className="h-avatar">{r.name[0]}</span>
                  <span className="grow">
                    <strong>{r.name}</strong>
                    <small>{r.team}</small>
                  </span>
                  <span className="verified">
                    <LuShieldCheck aria-hidden /> Verified
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="h-band">
        <div className="container">
          <SectionTitle title="Find Us" sub="Free parking on site" />
          <MapCard address={address} phone={v?.phone ?? '+91 75071 97507'} />
        </div>
      </section>

      <section className="h-band cream" id="faq">
        <div className="container">
          <SectionTitle title="Good to Know" />
          <div className="h-faq">
            {faqs.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>
                  {q} <LuChevronDown aria-hidden />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <div className="h-cta">
            <div className="h-cta-copy">
              <h2>
                Your next match is <span>one tap away.</span>
              </h2>
              <p>Check live slots at {v?.name ?? 'The Riverside Cricket Box'} and lock in your game.</p>
              <Link to="/book" className="h-btn lime">
                Book a Slot <LuArrowRight aria-hidden />
              </Link>
            </div>
            <div className="h-cta-ball" aria-hidden>
              <img src="/images/ball.webp" alt="" width={190} height={190} loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
