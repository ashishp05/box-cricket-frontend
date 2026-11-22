import { useState } from 'react';
import {
  MdAccessTime,
  MdArrowForward,
  MdBolt,
  MdCalendarMonth,
  MdCheckCircle,
  MdCurrencyRupee,
  MdEventAvailable,
  MdExpandMore,
  MdLockClock,
  MdSearch,
  MdSportsCricket,
  MdStar,
} from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import { hourLabel, rupees, shortDate } from '@shared/lib/format';
import { addDays, todayIST } from '@shared/lib/time';
import { Skeleton } from '@shared/ui/core';

import { BallMark, HeroScene } from '../components/art';
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

const CheckSlots = () => {
  const navigate = useNavigate();
  const today = todayIST();
  const [day, setDay] = useState<'today' | 'tomorrow' | string>('today');
  const from = day === 'today' ? today : day === 'tomorrow' ? addDays(today, 1) : day;
  const next = useNextFree(from, 1);
  const venue = useVenue();

  return (
    <div className="check-card">
      <div className="row between">
        <h3>Check slots</h3>
        <span className="live-dot">Live availability</span>
      </div>
      <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>
        When do you want to play?
      </p>
      <div className="row wrap" style={{ '--gap': '8px', marginTop: 10 } as React.CSSProperties}>
        <button type="button" className="chip" aria-pressed={day === 'today'} onClick={() => setDay('today')}>
          Today
        </button>
        <button type="button" className="chip" aria-pressed={day === 'tomorrow'} onClick={() => setDay('tomorrow')}>
          Tomorrow
        </button>
        <label className="chip" aria-pressed={day !== 'today' && day !== 'tomorrow'} style={{ position: 'relative', cursor: 'pointer' }}>
          <MdCalendarMonth aria-hidden /> {day !== 'today' && day !== 'tomorrow' ? shortDate(day) : 'Pick a date'}
          <input
            type="date"
            aria-label="Pick a date"
            min={today}
            max={venue.data ? addDays(today, venue.data.advanceDays) : undefined}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </label>
      </div>
      <div className="next-free">
        <MdBolt aria-hidden />
        {next.isLoading ? (
          <span className="muted">Checking live slots…</span>
        ) : next.data ? (
          <span>
            Next free: {shortDate(next.data.date)}, {hourLabel(next.data.hours[0])} • {next.data.pitchName}
          </span>
        ) : (
          <span>No free slots in the booking window. Check back soon.</span>
        )}
      </div>
      <button type="button" className="btn primary lg block" style={{ marginTop: 14 }} onClick={() => navigate(`/book?date=${next.data?.date ?? from}`)}>
        <MdSportsCricket aria-hidden /> See open slots <MdArrowForward aria-hidden />
      </button>
    </div>
  );
};

export const Home = () => {
  const venue = useVenue();
  const offers = useOffers();
  const v = venue.data;

  return (
    <>
      <section className="hero">
        <HeroScene />
        <div className="container hero-content">
          <div>
            <span className="hero-pill">
              <i /> LIVE SLOTS <i /> INSTANT CONFIRMATION
            </span>
            <h1 className="hero-title">
              Play by the
              <br />
              <span>Riverfront.</span>
            </h1>
            <p className="hero-sub">
              Floodlit box cricket at {v?.area ?? 'Ashmavati Riverfront'}, {v?.city ?? 'Porbandar'}. {v ? hoursOpenText(v.openHour, v.closeHour) : 'Open 24 hours'}, flat{' '}
              {v ? rupees(v.settings.hourlyRate) : '₹900'}/hr - see live slots and lock your game in under a minute.
            </p>
            <div className="hero-meta">
              <span>
                <MdStar className="star-icon" aria-hidden /> {rating.score} ({rating.count} reviews)
              </span>
              <span>
                <MdCurrencyRupee aria-hidden /> {v ? rupees(v.settings.hourlyRate) : '₹900'}/hr flat
              </span>
              <span>
                <MdAccessTime aria-hidden /> {v ? hoursOpenText(v.openHour, v.closeHour) : 'Open 24 hours'}
              </span>
            </div>
          </div>
          <CheckSlots />
        </div>
      </section>

      <div className="container">
        <div className="card stats">
          <div>
            <strong>{v?.pitches.length ?? 1}</strong>
            <span>{(v?.pitches.length ?? 1) === 1 ? 'Box' : 'Boxes'}</span>
          </div>
          <div>
            <strong>{v ? rupees(v.settings.hourlyRate) : '₹900'}</strong>
            <span>Per hour</span>
          </div>
          <div>
            <strong>{rating.score}</strong>
            <span>Rating</span>
          </div>
          <div>
            <strong>{v && !(v.openHour === 0 && v.closeHour === 24) ? `${hourLabel(v.openHour)}` : 'Open'}</strong>
            <span>{v && !(v.openHour === 0 && v.closeHour === 24) ? `to ${hourLabel(v.closeHour)}` : '24 hours'}</span>
          </div>
        </div>

        <section className="section">
          <div className="section-title">
            <h2>Meet the arena</h2>
            <p>M. G. Road, {v?.city ?? 'Porbandar'}</p>
          </div>
          <div className="arena-grid">
            <Gallery venueName={v?.name ?? 'The Riverside Cricket Box'} />
            <div className="arena-copy">
              {v ? <p>{v.description}</p> : <Skeleton height={80} />}
              {v?.pitches.map((p) => (
                <div key={p.id} className="check-line">
                  <MdCheckCircle aria-hidden /> {p.name}: {p.size}, {p.format}
                </div>
              ))}
              <Link to="/arena" className="btn outline lg" style={{ marginTop: 18, paddingInline: 24 }}>
                See the full arena <MdArrowForward aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <h2>Everything for game night</h2>
            <p>Facilities included in every booking</p>
          </div>
          <div className="facilities">
            {facilities.map(({ name, icon: Icon }) => (
              <div key={name} className="facility">
                <span className="facility-icon">
                  <Icon aria-hidden />
                </span>
                {name}
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <h2>Simple, upfront pricing</h2>
            <p>
              Book {v?.minHours ?? 1} to {v?.maxHours ?? 24} hours. Fees are shown before you pay.
            </p>
          </div>
          <div className="card price-card">
            <div className="amount">
              {v ? rupees(v.settings.hourlyRate) : '₹900'}
              <small>/ hour</small>
            </div>
            <p>Flat rate - same price any hour, any day. {v ? hoursOpenText(v.openHour, v.closeHour) : 'Open 24 hours'}.</p>
            <p className="tiny">Excludes additional charges (payment/platform fee) shown before you pay.</p>
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <h2>Booked in four taps</h2>
            <p>No calls, no waiting for confirmation</p>
          </div>
          <div className="steps">
            {[
              [MdSearch, 'Pick a date', 'See which hours are free in each box.'],
              [MdEventAvailable, 'Pick your slot', 'See live availability and the exact price.'],
              [MdLockClock, 'Pay securely', 'UPI, cards or wallets. Slots are held while you pay.'],
              [MdSportsCricket, 'Play!', 'Show your QR at the venue and start the match.'],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof MdSearch;
              return (
                <div key={title as string} className="step">
                  <span className="step-icon">
                    <I aria-hidden />
                  </span>
                  <div>
                    <small>STEP {i + 1}</small>
                    <strong>{title as string}</strong>
                    <p>{text as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {offers.data && offers.data.length > 0 && (
          <section className="section" id="offers">
            <div className="section-title">
              <h2>Offers for you</h2>
              <p>Tap a code to copy it</p>
            </div>
            <OfferCards offers={offers.data} />
          </section>
        )}

        <section className="section">
          <div className="section-title">
            <h2>Players love it</h2>
            <p>From teams who play here every week</p>
          </div>
          <div className="reviews-row">
            {homeReviews.map((r) => (
              <div key={r.name} className="card review">
                <Stars />
                <blockquote>“{r.text}”</blockquote>
                <div className="review-author">
                  <span className="avatar">{r.name[0]}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.team}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <h2>Find us</h2>
            <p>Free parking on site</p>
          </div>
          <MapCard address={v?.address ?? 'At Ashmavati Riverfront, Opp. Jalaram Colony, M. G. Road, Porbandar'} phone={v?.phone ?? '+91 75071 97507'} />
        </section>

        <section className="section" id="faq">
          <div className="section-title">
            <h2>Good to know</h2>
          </div>
          <div className="card faq">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q} <MdExpandMore aria-hidden />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="cta">
          <h2>
            Your next match is
            <br />
            <span>one tap away.</span>
          </h2>
          <p>Check live slots at {v?.name ?? 'The Riverside Cricket Box'} and lock in your game.</p>
          <Link to="/book" className="btn lime lg" style={{ paddingInline: 24 }}>
            Book a slot <MdArrowForward aria-hidden />
          </Link>
          <div className="cta-ball" aria-hidden>
            <BallMark size={140} angle={-35} />
          </div>
        </div>
      </div>
    </>
  );
};
