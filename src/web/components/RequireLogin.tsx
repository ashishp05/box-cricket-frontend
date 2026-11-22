import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { EmptyState } from '@shared/ui/core';

import { useCustomer } from '../session';
import { EmptyTicketArt } from './art';

// Sends the visitor to /auth and brings them back here afterwards.
export const useLoginRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (from = location.pathname + location.search) => navigate(`/auth?from=${encodeURIComponent(from)}`);
};

export const RequireLogin = ({ children, title, text }: { children: ReactNode; title?: string; text?: string }) => {
  const customer = useCustomer();
  const goLogin = useLoginRedirect();
  const navigate = useNavigate();
  if (customer) return <>{children}</>;
  return (
    <EmptyState
      art={<EmptyTicketArt />}
      title={title ?? 'Log in to see your bookings'}
      action={
        <div className="stack" style={{ alignItems: 'center', '--gap': '16px' } as React.CSSProperties}>
          <button type="button" className="btn primary lg" style={{ paddingInline: 26 }} onClick={() => goLogin()}>
            Log in
          </button>
          <button type="button" className="link" onClick={() => navigate('/book')}>
            Browse available slots
          </button>
        </div>
      }
    >
      {text ?? 'Your upcoming matches, past games and tickets live here once you log in with your mobile number.'}
    </EmptyState>
  );
};
