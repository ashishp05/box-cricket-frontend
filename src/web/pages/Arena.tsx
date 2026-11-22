import { Fragment } from 'react';
import {
  MdAccessTime,
  MdArrowForward,
  MdBolt,
  MdCall,
  MdCheckCircleOutline,
  MdGrass,
  MdGridView,
  MdGroups,
  MdIosShare,
  MdLocalOffer,
  MdOutlineLocationOn,
  MdOutlineReceiptLong,
  MdOutlineVerifiedUser,
  MdSportsCricket,
  MdStar,
  MdTimelapse,
} from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import { hourLabel, hoursText, rupees, shortDate } from '@shared/lib/format';
import { todayIST } from '@shared/lib/time';
import { Loading } from '@shared/ui/core';
import { useToast } from '@shared/ui/Toast';

import { Gallery } from '../components/Gallery';
import { MapCard } from '../components/MapCard';
import { arenaReviews, facilities, groundRules, rating } from '../content';
import { useNextFree, useOffers, useVenue } from '../hooks';
import { hoursOpenText, Stars } from './Home';

const Heading = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="section-title" style={{ marginTop: 32, marginBottom: 14 }}>
    <h2>{title}</h2>
    {sub && <p>{sub}</p>}
  </div>
);

export const Arena = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const venue = useVenue();
  const offers = useOffers();
  const next = useNextFree(todayIST(), 5);
  const v = venue.data;
  if (!v) return <Loading />;

  const firstOffer = offers.data?.[0];
  const share = async () => {
    const data = { title: v.name, text: `${v.name} - ${v.address}`, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href).then(() => toast.show('Link copied. Share it with your team.'));
  };

  return (
    <div className="container arena-layout">
      <div>
        <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 10 }}>
          <button type="button" className="btn ghost sm" style={{ color: '#07201a' }} onClick={() => void share()}>
            <MdIosShare aria-hidden /> Share
          </button>
        </div>
        <Gallery venueName={v.name} />

        <span className="badge dot" style={{ marginTop: 20 }}>
          Open now
        </span>
        <h1 style={{ fontSize: 44, marginTop: 10 }}>{v.name}</h1>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="badge star" style={{ height: 28, fontSize: 13 }}>
            <MdStar aria-hidden /> {rating.score}
          </span>
          <a href="#reviews" className="link underline" style={{ fontWeight: 500, color: '#0f6b47' }}>
            {rating.count} reviews
          </a>
        </div>
        <p className="row muted" style={{ marginTop: 14, '--gap': '6px' } as React.CSSProperties}>
          <MdOutlineLocationOn size={18} aria-hidden /> {v.address}
        </p>
        <p className="row muted" style={{ marginTop: 6, '--gap': '6px' } as React.CSSProperties}>
          <MdAccessTime size={18} aria-hidden /> {hoursOpenText(v.openHour, v.closeHour)}
        </p>

        <div className="card spec-strip" style={{ marginTop: 16 }}>
          <div>
            <MdGrass aria-hidden />
            <strong>Premium turf</strong>
            <span>Surface</span>
          </div>
          <div>
            <MdGridView aria-hidden />
            <strong>
              {v.pitches.length} {v.pitches.length === 1 ? 'box' : 'boxes'}
            </strong>
            <span>Pitches</span>
          </div>
          <div>
            <MdGroups aria-hidden />
            <strong>{v.pitches[0]?.format ?? '6-a-side'}</strong>
            <span>Format</span>
          </div>
          <div>
            <MdTimelapse aria-hidden />
            <strong>
              {v.minHours}-{v.maxHours} hrs
            </strong>
            <span>Booking</span>
          </div>
        </div>

        {firstOffer && (
          <div className="dark-offer" style={{ marginTop: 16 }}>
            <span className="icon">
              <MdLocalOffer size={24} aria-hidden />
            </span>
            <div>
              <strong>
                {firstOffer.label} {firstOffer.title ? `- ${firstOffer.title}` : ''}
              </strong>
              <span>Use code {firstOffer.code} at checkout</span>
            </div>
          </div>
        )}

        <Heading title="About the arena" />
        <p style={{ fontSize: 16, lineHeight: 1.55 }}>{v.description}</p>

        <Heading title="Facilities" />
        <div className="facilities three">
          {facilities.map(({ name, icon: Icon }) => (
            <div key={name} className="facility">
              <span className="facility-icon">
                <Icon aria-hidden />
              </span>
              {name}
            </div>
          ))}
        </div>

        <Heading title="The box" sub={v.pitches.length === 1 ? 'One floodlit pitch for your match' : `${v.pitches.length} floodlit pitches`} />
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          {v.pitches.map((p) => (
            <div key={p.id} className="card venue-card">
              <span className="facility-icon" style={{ width: 48, height: 48 }}>
                <MdSportsCricket aria-hidden />
              </span>
              <div className="grow">
                <strong>{p.name}</strong>
                <span>
                  {p.size} • {p.format}
                </span>
              </div>
              <span className="badge" style={{ marginRight: 4 }}>
                Premium turf
              </span>
            </div>
          ))}
        </div>

        <Heading title="Pricing" sub={`Book ${v.minHours} to ${v.maxHours} hours back-to-back`} />
        <div className="card price-card">
          <div className="amount">
            {rupees(v.settings.hourlyRate)}
            <small>/ hour</small>
          </div>
          <p>Flat rate - same price any hour, any day. {hoursOpenText(v.openHour, v.closeHour)}.</p>
          <p className="tiny">Excludes additional charges (payment/platform fee) shown before you pay.</p>
        </div>

        <Heading title="Ground rules" />
        <div className="card pad stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          {groundRules.map((r) => (
            <div key={r} className="row top" style={{ '--gap': '10px', fontSize: 15 } as React.CSSProperties}>
              <MdCheckCircleOutline size={20} color="#0f6b47" style={{ flex: 'none', marginTop: 1 }} aria-hidden /> {r}
            </div>
          ))}
        </div>

        <Heading title="Cancellation policy" />
        <div className="card pad" id="cancellation">
          {[
            ['100%', '#ddf3e8', '#138a57', '24+ hours before your slot', 'Full refund to your original payment method'],
            ['50%', '#fff1d6', '#d98b00', '6 to 24 hours before', '50% refund'],
            ['0%', '#fde7e4', '#e23d2e', 'Less than 6 hours before', 'No refund'],
          ].map(([pct, bg, fg, title, text]) => (
            <div key={pct} className="tier">
              <span className="pct" style={{ background: bg, color: fg }}>
                {pct}
              </span>
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
          <p className="tiny muted center" style={{ marginTop: 8 }}>
            Refunds reach your account in 3-5 working days.
          </p>
        </div>

        <Heading title="Location" />
        <MapCard address={v.address} phone={v.phone} />

        <div id="reviews">
          <Heading title="Reviews" sub={`${rating.count} players rated the arena`} />
        </div>
        <div className="card rating-summary">
          <div className="big">
            <strong>{rating.score}</strong>
            <Stars />
            <span className="small muted">{rating.count} reviews</span>
          </div>
          <div className="stack" style={{ '--gap': '9px' } as React.CSSProperties}>
            {rating.bars.map((share, i) => (
              <div key={i} className="bar-row">
                <span className="row" style={{ '--gap': '4px' } as React.CSSProperties}>
                  {5 - i} <MdStar size={12} color="#f4a21b" aria-hidden />
                </span>
                <span className="track">
                  <i style={{ width: `${share * 100}%` }} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="review-grid">
          {arenaReviews.map((r) => (
            <div key={r.name} className="card pad">
              <div className="row top">
                <span className="avatar">{r.name[0]}</span>
                <div className="grow">
                  <strong style={{ display: 'block', fontWeight: 500 }}>{r.name}</strong>
                  <span className="small muted">{r.when}</span>
                </div>
                <span className="badge star">
                  <MdStar aria-hidden /> {r.stars.toFixed(1)}
                </span>
              </div>
              <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.35 }}>{r.text}</p>
              <span className="tag" style={{ marginTop: 10 }}>
                {r.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      <aside className="sticky-side stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="card pad">
          <span className="small muted">Starting from</span>
          <div style={{ fontSize: 40, fontWeight: 500, color: '#07201a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {rupees(v.settings.hourlyRate)}
            <small style={{ fontSize: 14, color: '#55655f', marginLeft: 4 }}>/hr</small>
          </div>
          <div className="next-box">
            <div className="row between">
              <span className="row" style={{ '--gap': '8px', fontWeight: 500 } as React.CSSProperties}>
                <MdBolt size={22} color="#0f6b47" aria-hidden /> Next available
              </span>
              {next.data && (
                <span className="small" style={{ fontWeight: 500 }}>
                  {shortDate(next.data.date)} • {next.data.pitchName}
                </span>
              )}
            </div>
            <div className="chips">
              {next.isLoading ? (
                <Loading />
              ) : next.data ? (
                next.data.hours.map((h) => (
                  <Fragment key={h}>
                    <button type="button" className="chip" onClick={() => navigate(`/book?date=${next.data!.date}`)}>
                      {hourLabel(h)}
                    </button>
                  </Fragment>
                ))
              ) : (
                <span className="small muted">No free slots in the booking window.</span>
              )}
            </div>
          </div>
          <Link to="/book" className="btn primary lg block" style={{ marginTop: 14 }}>
            Check slots &amp; book <MdArrowForward aria-hidden />
          </Link>
          <div className="stack" style={{ '--gap': '10px', marginTop: 16, fontSize: 13 } as React.CSSProperties}>
            <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <MdOutlineVerifiedUser size={18} color="#0f6b47" aria-hidden /> Free cancellation up to 24 hours before
            </span>
            <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <MdOutlineReceiptLong size={18} color="#0f6b47" aria-hidden /> Full price shown before you pay
            </span>
            <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <MdBolt size={18} color="#0f6b47" aria-hidden /> Instant confirmation with QR entry
            </span>
          </div>
        </div>
        <a className="btn outline lg block" href={`tel:${v.phone.replace(/\s/g, '')}`}>
          <MdCall aria-hidden /> Call {v.phone}
        </a>
        <p className="tiny muted center">Minimum booking {hoursText(v.minHours)}.</p>
      </aside>
    </div>
  );
};
