import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
  LuArrowRight,
  LuCalendarCheck,
  LuChevronDown,
  LuCircleCheck,
  LuClock,
  LuImages,
  LuIndianRupee,
  LuLampCeiling,
  LuLayoutGrid,
  LuMapPin,
  LuReceipt,
  LuShare2,
  LuShieldCheck,
  LuSprout,
  LuUsers,
  LuZap,
  LuCar,
} from 'react-icons/lu';
import { Link } from 'react-router-dom';

import { hourLabel, hoursText, rupees, shortDate } from '@shared/lib/format';
import { todayIST } from '@shared/lib/time';
import { useToast } from '@shared/ui/Toast';

import { Gallery } from '../components/Gallery';
import { MapCard } from '../components/MapCard';
import { arenaFaqs, facilities, groundRules, rating } from '../content';
import { useNextFree, useVenue } from '../hooks';
import { hoursOpenText, Stars } from './Home';

const SectionTitle = ({ eyebrow, title, sub }: { eyebrow?: string; title: ReactNode; sub?: string }) => (
  <div className="h-title">
    {eyebrow && <span className="a-eyebrow">{eyebrow}</span>}
    <h2>{title}</h2>
    {sub && <p>{sub}</p>}
  </div>
);

interface Spec {
  icon: IconType;
  label: string;
  value?: string;
  note: string;
}

const SpecCard = ({ icon: Icon, label, value, note }: Spec) => (
  <div className={`a-spec${value ? '' : ' tbc'}`}>
    <span className="a-spec-icon">
      <Icon aria-hidden />
    </span>
    <small>{label}</small>
    <strong>{value ?? 'To be confirmed'}</strong>
    <p>{value ? note : 'Details coming soon'}</p>
  </div>
);

export const Arena = () => {
  const toast = useToast();
  const venue = useVenue();
  const next = useNextFree(todayIST(), 4);
  const v = venue.data;

  const name = v?.name ?? 'The Riverside Cricket Box';
  const rate = v ? rupees(v.settings.hourlyRate) : '₹900';
  const hours = v ? hoursOpenText(v.openHour, v.closeHour) : 'Open 24 hours';
  const allDay = !v || (v.openHour === 0 && v.closeHour === 24);
  const pitch = v?.pitches[0];
  const address = v?.address ?? 'At Ashmavati Riverfront, Opp. Jalaram Colony, M. G. Road, Porbandar';
  const minH = v?.minHours ?? 1;
  const maxH = v?.maxHours ?? 24;

  const share = async () => {
    const data = { title: name, text: `${name} - ${address}`, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href).then(() => toast.show('Link copied. Share it with your team.'));
  };

  // Only facts the venue API or the venue itself confirms; anything else shows "To be confirmed".
  const specs: Spec[] = [
    { icon: LuLayoutGrid, label: 'Ground type', value: pitch ? `Netted box · ${pitch.size}` : undefined, note: `${v?.pitches.length ?? 1} floodlit box, fully netted` },
    { icon: LuSprout, label: 'Playing surface', value: 'Premium turf', note: 'Marked centre pitch, non-marking shoes only' },
    { icon: LuLampCeiling, label: 'Lighting', value: 'LED floodlights', note: 'Bright, even light for night matches' },
    { icon: LuClock, label: 'Operating hours', value: allDay ? 'Open 24 hours' : hours.replace('Open ', ''), note: allDay ? 'Every day of the week' : 'Every day' },
    { icon: LuUsers, label: 'Capacity', value: pitch?.format, note: 'Extra players may be charged at the venue' },
    { icon: LuIndianRupee, label: 'Booking price', value: `${rate} / hour`, note: `Flat rate, book ${minH}–${maxH} hours` },
  ];

  return (
    <div className="arena-page">
      {/* Hero */}
      <section className="a-hero">
        <img className="a-hero-img" src="/images/arena-night.webp" alt="" fetchPriority="high" />
        <div className="a-hero-shade" aria-hidden />
        <div className="container a-hero-inner">
          <nav className="a-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link> <span aria-hidden>/</span> <span aria-current="page">Arena</span>
          </nav>
          <div className="a-hero-copy">
            <span className="pill-lime a-open">
              <i /> {allDay ? 'Open now · 24 hours' : hours}
            </span>
            <h1>
              Explore The <span>Riverside Arena</span>
            </h1>
            <p>
              A floodlit, fully netted box on the Ashmavati Riverfront. Premium turf, a marked centre pitch and the same flat price at any hour — built for
              friends, office teams and weekend leagues.
            </p>
            <div className="a-hero-meta">
              <span>
                <LuMapPin aria-hidden /> {v ? `${v.area}, ${v.city}` : 'Ashmavati Riverfront, Porbandar'}
              </span>
              <span>
                <Stars /> <b>{rating.score}</b> <em>({rating.count} reviews)</em>
              </span>
            </div>
            <div className="a-hero-actions">
              <Link to="/book" className="h-btn lime lg">
                Book This Arena <LuArrowRight aria-hidden />
              </Link>
              <a href="#gallery" className="h-btn ghost-light lg">
                <LuImages aria-hidden /> View Gallery
              </a>
              <button type="button" className="h-btn ghost-light lg icon" onClick={() => void share()} aria-label="Share this arena">
                <LuShare2 aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick facts bar */}
      <div className="container">
        <div className="a-facts">
          <div>
            <small>Price</small>
            <strong>
              {rate}
              <em>/hr</em>
            </strong>
          </div>
          <div>
            <small>Format</small>
            <strong>{pitch?.format ?? '6-a-side'}</strong>
          </div>
          <div>
            <small>Hours</small>
            <strong>{allDay ? '24 × 7' : hours.replace('Open ', '')}</strong>
          </div>
          <div className="a-next">
            <small>
              <LuZap aria-hidden /> Next available
            </small>
            <strong>
              {next.isPending ? 'Checking…' : next.data ? `${shortDate(next.data.date)}, ${hourLabel(next.data.hours[0])}` : 'Fully booked'}
            </strong>
          </div>
          <Link to={next.data ? `/book?date=${next.data.date}` : '/book'} className="h-btn dark">
            Check Slots <LuArrowRight aria-hidden />
          </Link>
        </div>
      </div>

      {/* Gallery */}
      <section className="h-band cream a-first" id="gallery">
        <div className="container">
          <SectionTitle eyebrow="Gallery" title="See the Arena" sub="Tap any photo to view it full screen" />
          <Gallery venueName={name} withTabs />
        </div>
      </section>

      {/* About */}
      <section className="h-band">
        <div className="container a-about">
          <div className="a-about-copy">
            <SectionTitle eyebrow="About the arena" title="Cricket by the river, any hour you like" />
            <p className="a-lead">{v?.description ?? 'A riverside box cricket arena on the Ashmavati Riverfront in Porbandar.'}</p>
            <p>
              The box is fully netted, so every shot stays in play and nobody has to fetch the ball from the road. Floodlights keep the turf bright long after
              sunset, which makes late-night matches just as good as morning ones.
            </p>
            <ul className="a-checks">
              <li>
                <LuCircleCheck aria-hidden /> Live slots and instant confirmation
              </li>
              <li>
                <LuCircleCheck aria-hidden /> QR ticket for quick check-in
              </li>
              <li>
                <LuCircleCheck aria-hidden /> Same flat rate day and night
              </li>
              <li>
                <LuCircleCheck aria-hidden /> Parking, cafe and washrooms on site
              </li>
            </ul>
          </div>
          <div className="a-collage">
            <img src="/images/golden-hour.webp" alt="Players warming up on the outfield at sunset" loading="lazy" className="a-collage-main" />
            <img src="/images/bat-and-ball.webp" alt="A cricket bat and red ball" loading="lazy" className="a-collage-side" />
            <div className="a-collage-badge">
              <strong>{rating.score}</strong>
              <Stars />
              <span>{rating.count} player reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="h-band cream">
        <div className="container">
          <SectionTitle eyebrow="Ground specifications" title="Know the Ground" sub="Verified details from the venue" />
          <div className="a-specs">
            {specs.map((s) => (
              <SpecCard key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="h-band">
        <div className="container">
          <SectionTitle eyebrow="Facilities" title="Everything Your Team Needs" sub="Included with every booking" />
          <div className="a-facilities">
            {facilities.map(({ name: f, icon: Icon, desc }) => (
              <div key={f} className="a-facility">
                <span>
                  <Icon aria-hidden />
                </span>
                <strong>{f}</strong>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="h-band cream" id="pricing">
        <div className="container">
          <SectionTitle eyebrow="Pricing" title="One Simple Price" sub="No peak hours, no weekend surcharge" />
          <div className="a-pricing">
            <div className="a-price-card">
              <span className="pill-lime">All hours · Same price</span>
              <div className="a-price">
                {rate}
                <small>/ hour</small>
              </div>
              <p>Flat rate any hour, any day. {hours}.</p>
              <Link to="/book" className="h-btn lime lg">
                Book Your Slot <LuArrowRight aria-hidden />
              </Link>
              <ul>
                <li>
                  <LuCalendarCheck aria-hidden /> Book {minH}–{maxH} hours back-to-back
                </li>
                <li>
                  <LuZap aria-hidden /> Instant confirmation with QR entry
                </li>
              </ul>
            </div>

            <div className="a-price-info">
              <div className="a-info-card">
                <h3>
                  <LuReceipt aria-hidden /> What you pay
                </h3>
                <dl>
                  <div>
                    <dt>Hourly rate</dt>
                    <dd>{rate} / hour</dd>
                  </div>
                  <div>
                    <dt>Minimum booking</dt>
                    <dd>{hoursText(minH)}</dd>
                  </div>
                  {v && v.settings.additionalCharge > 0 && (
                    <div>
                      <dt>Platform fee</dt>
                      <dd>{rupees(v.settings.additionalCharge)} per booking</dd>
                    </div>
                  )}
                  {v && v.settings.gstRate > 0 && (
                    <div>
                      <dt>GST</dt>
                      <dd>{v.settings.gstRate}%</dd>
                    </div>
                  )}
                  <div className="total">
                    <dt>Example: 2 hours</dt>
                    <dd>
                      {v
                        ? rupees(
                            Math.round(
                              (v.settings.hourlyRate * 2 + v.settings.additionalCharge) * (1 + v.settings.gstRate / 100),
                            ),
                          )
                        : '—'}
                    </dd>
                  </div>
                </dl>
                <p className="a-fine">The full total is always shown before you pay. Offers and coupons apply at checkout.</p>
              </div>

              <div className="a-info-card" id="cancellation">
                <h3>
                  <LuShieldCheck aria-hidden /> Cancellation
                </h3>
                <div className="a-tiers">
                  <div>
                    <b className="t-full">100%</b>
                    <span>
                      <strong>24+ hours before</strong>
                      <small>Full refund</small>
                    </span>
                  </div>
                  <div>
                    <b className="t-half">50%</b>
                    <span>
                      <strong>6–24 hours before</strong>
                      <small>Half refund</small>
                    </span>
                  </div>
                  <div>
                    <b className="t-none">0%</b>
                    <span>
                      <strong>Under 6 hours</strong>
                      <small>No refund</small>
                    </span>
                  </div>
                </div>
                <p className="a-fine">Refunds reach your account in 3–5 working days.</p>
              </div>
            </div>
          </div>

          <details className="a-rules">
            <summary>
              Ground rules <LuChevronDown aria-hidden />
            </summary>
            <ul>
              {groundRules.map((r) => (
                <li key={r}>
                  <LuCircleCheck aria-hidden /> {r}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      {/* Location */}
      <section className="h-band" id="location">
        <div className="container a-location">
          <div>
            <SectionTitle eyebrow="Location" title="Find the Arena" sub="On the Ashmavati Riverfront, M. G. Road" />
            <ul className="a-getting">
              <li>
                <span>
                  <LuMapPin aria-hidden />
                </span>
                <p>
                  <strong>Address</strong>
                  <small>{address}</small>
                </p>
              </li>
              <li>
                <span>
                  <LuCar aria-hidden />
                </span>
                <p>
                  <strong>Parking</strong>
                  <small>Free parking on site</small>
                </p>
              </li>
              <li>
                <span>
                  <LuClock aria-hidden />
                </span>
                <p>
                  <strong>Arrive early</strong>
                  <small>Reach 10 minutes before your slot</small>
                </p>
              </li>
            </ul>
          </div>
          <MapCard address={address} phone={v?.phone ?? '+91 75071 97507'} />
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="h-band cream" id="faq">
        <div className="container">
          <SectionTitle eyebrow="FAQ" title="Arena Questions" sub="Everything players usually ask before booking" />
          <div className="h-faq">
            {arenaFaqs.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>
                  {q} <LuChevronDown aria-hidden />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <div className="a-cta">
            <img src="/images/batting-under-lights.webp" alt="" loading="lazy" />
            <div className="a-cta-copy">
              <h2>
                Ready for your <span>next match?</span>
              </h2>
              <p>Pick a slot, pay online and walk in with your QR ticket.</p>
              <div className="a-cta-actions">
                <Link to="/book" className="h-btn lime lg">
                  Book Your Slot <LuArrowRight aria-hidden />
                </Link>
                {v && (
                  <a href={`tel:${v.phone.replace(/\s/g, '')}`} className="h-btn ghost-light lg">
                    Call {v.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky booking bar */}
      <div className="a-mobile-bar">
        <div>
          <strong>
            {rate}
            <small>/hr</small>
          </strong>
          <span>{next.data ? `Next: ${shortDate(next.data.date)}, ${hourLabel(next.data.hours[0])}` : hours}</span>
        </div>
        <Link to={next.data ? `/book?date=${next.data.date}` : '/book'} className="h-btn lime">
          Book Now <LuArrowRight aria-hidden />
        </Link>
      </div>
    </div>
  );
};
