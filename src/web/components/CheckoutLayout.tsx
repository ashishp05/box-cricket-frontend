import type { ReactNode } from 'react';
import { MdArrowBack, MdCheck, MdLockOutline } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { Logo } from './art';
import { TabBar } from './Layout';

const stages = ['Slots', 'Review', 'Pay'];

// Checkout shell: back arrow, logo, Slots / Review / Pay stepper and "Secure checkout".
export const CheckoutLayout = ({
  step,
  title,
  onBack,
  children,
}: {
  step: 1 | 2 | 3;
  title: string;
  onBack: () => void;
  children: ReactNode;
}) => (
  <div className="site">
    <header className="checkout-header">
      <div className="container">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Back">
          <MdArrowBack />
        </button>
        <Link to="/" aria-label="Home">
          <Logo />
        </Link>
        <span className="mobile-title">{title}</span>
        <ol className="stepper" aria-label="Checkout progress">
          {stages.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const on = n <= step;
            return (
              <li key={label} className="row" style={{ listStyle: 'none', '--gap': '10px' } as React.CSSProperties}>
                {i > 0 && <span className={`line${on ? ' on' : ''}`} />}
                <span className={`stage${on ? ' on' : ''}`} aria-current={n === step ? 'step' : undefined}>
                  <span className="step-dot">{done ? <MdCheck /> : n}</span>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
        <span className="secure">
          <MdLockOutline aria-hidden /> Secure checkout
        </span>
      </div>
    </header>
    <main className="site-main">
      <div className="container">
        <div className="mobile-progress">
          <div className="bars">
            {stages.map((s, i) => (
              <i key={s} className={i < step ? 'on' : ''} />
            ))}
          </div>
          <p>
            Step {step} of 3 <b>{stages[step - 1]}</b>
          </p>
        </div>
        {children}
      </div>
    </main>
    <TabBar />
  </div>
);
