import type { ReactNode } from 'react';
import { LuArrowLeft, LuCheck, LuLock } from 'react-icons/lu';
import { Link } from 'react-router-dom';

import { Logo } from './art';

export const bookingSteps = ['Date', 'Time', 'Summary', 'Details', 'Payment', 'Confirmed'] as const;
export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;

// One shell for every booking screen: back arrow, logo, the six-step progress and "Secure checkout".
export const CheckoutLayout = ({ step, title, onBack, children }: { step: BookingStep; title: string; onBack?: () => void; children: ReactNode }) => (
  <div className="site bk-site">
    <header className="bk-header">
      <div className="container bk-header-row">
        {onBack ? (
          <button type="button" className="bk-back" onClick={onBack} aria-label="Back">
            <LuArrowLeft />
          </button>
        ) : (
          <span className="bk-back-spacer" />
        )}
        <Link to="/" aria-label="The Riverside Cricket Box, home" className="bk-logo">
          <Logo inverse />
        </Link>
        <span className="bk-mobile-title">{title}</span>
        <span className="bk-secure">
          <LuLock aria-hidden /> Secure checkout
        </span>
      </div>
      <div className="container">
        <ol className="bk-steps" aria-label="Booking progress">
          {bookingSteps.map((label, i) => {
            const n = i + 1;
            const state = n < step || step === 6 ? 'done' : n === step ? 'current' : 'todo';
            return (
              <li key={label} className={state} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="bk-dot">{state === 'done' ? <LuCheck aria-hidden /> : n}</span>
                <span className="bk-step-label">{label}</span>
              </li>
            );
          })}
        </ol>
        <div className="bk-progress" aria-hidden>
          <i style={{ width: `${(step / bookingSteps.length) * 100}%` }} />
        </div>
        <p className="bk-progress-text">
          Step {step} of {bookingSteps.length} · <b>{bookingSteps[step - 1]}</b>
        </p>
      </div>
    </header>
    <main className="bk-main">
      <div className="container">{children}</div>
    </main>
  </div>
);
