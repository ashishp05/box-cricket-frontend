import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { LuCircleAlert, LuCircleCheck, LuClock, LuLock, LuPhone, LuRotateCcw, LuShieldCheck, LuTicketX } from 'react-icons/lu';
import { Link, Navigate, useParams } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import { dateTime, rupees } from '@shared/lib/format';
import { openStandardCheckout } from '@shared/lib/razorpay';
import { Button, Skeleton } from '@shared/ui/core';

import { api, type PayLink } from '../api';
import { BallMark } from '../components/art';
import { ARENA_PHOTO } from '../components/booking';
import { useVenue } from '../hooks';

const methodLabel: Record<string, string> = { upi: 'UPI', card: 'Card', netbanking: 'Netbanking', wallet: 'Wallet', emi: 'EMI', test: 'Test payment' };

// Pay page for a payment link created by staff (Order management). No login needed.
const PayLinkPage = ({ id }: { id: string }) => {
  const queryClient = useQueryClient();
  const venue = useVenue();
  const [failure, setFailure] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const link = useQuery({ queryKey: ['pay-link', id], queryFn: () => api.payLink(id), retry: false });
  const phone = venue.data?.phone ?? '+91 75071 97507';

  const done = (paid: PayLink) => queryClient.setQueryData(['pay-link', id], paid);

  const pay = async () => {
    setFailure(undefined);
    try {
      const checkout = await api.payLinkCheckout(id);
      if (checkout.mock) {
        // Server has no Razorpay keys (development): complete a test payment.
        setProcessing(true);
        done(await api.payLinkVerify(id, { razorpayOrderId: checkout.razorpayOrderId, razorpayPaymentId: `pay_mock_${Date.now()}`, razorpaySignature: 'test-mode' }));
        return;
      }
      const { result, error } = await openStandardCheckout(checkout);
      if (!result) {
        setFailure(error ?? 'Payment was cancelled before it finished. No money has been deducted.');
        return;
      }
      setProcessing(true);
      done(await api.payLinkVerify(id, result));
    } catch (error) {
      setFailure(errorMessage(error));
      void link.refetch();
    } finally {
      setProcessing(false);
    }
  };

  if (link.isLoading) {
    return (
      <div className="pl-card" aria-label="Loading payment link">
        <Skeleton height={72} />
        <Skeleton height={40} width="60%" />
        <Skeleton height={56} />
      </div>
    );
  }

  if (link.isError) {
    const notFound = link.error instanceof ApiError && link.error.status === 404;
    return (
      <div className="pl-card pl-state">
        <span className="bk-state-icon red">
          <LuCircleAlert aria-hidden />
        </span>
        <h1>{notFound ? 'Payment link not found' : 'We could not load this payment link'}</h1>
        <p>{notFound ? 'Check the link you received, or ask the arena to send it again.' : errorMessage(link.error)}</p>
        {!notFound && (
          <Button variant="outline" onClick={() => void link.refetch()}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  const o = link.data!;

  return (
    <div className="pl-card">
      <div className="pl-head">
        <img src={ARENA_PHOTO} alt="" />
        <div>
          <strong>{venue.data?.name ?? 'The Riverside Cricket Box'}</strong>
          <span>Payment request · {o.id}</span>
        </div>
      </div>

      <div className="pl-body">
        <p className="pl-for">For {o.customerName}</p>
        <h1>{o.title}</h1>
        {o.description && <p className="pl-desc">{o.description}</p>}
        <div className="pl-amount">{rupees(o.amount)}</div>
      </div>

      {o.status === 'pending' && (
        <>
          {failure && (
            <div className="pl-fail" role="alert">
              <LuCircleAlert aria-hidden />
              <div>
                <strong>Payment failed</strong>
                <p>{failure}</p>
                <p className="bk-fine">If money was debited, it is refunded to your account automatically within 5–7 working days.</p>
              </div>
            </div>
          )}
          <Button variant="primary" size="lg" block loading={processing} onClick={() => void pay()}>
            {failure ? <LuRotateCcw aria-hidden /> : <LuLock aria-hidden />} {failure ? 'Try again' : `Pay ${rupees(o.amount)}`}
          </Button>
          <p className="pl-note">
            <LuShieldCheck aria-hidden /> UPI, cards, netbanking and wallets · Secured by Razorpay
          </p>
          <p className="pl-expiry">
            <LuClock aria-hidden /> Link valid until {dateTime(o.expiresAt)}
          </p>
        </>
      )}

      {o.status === 'paid' && (
        <div className="pl-done">
          <span className="pl-tick">
            <LuCircleCheck aria-hidden />
          </span>
          <h2>Payment received</h2>
          <p>
            Thanks, {o.customerName.split(' ')[0]}. {rupees(o.amount)} paid{o.paidAt ? ` on ${dateTime(o.paidAt)}` : ''}
            {o.paymentMethod ? ` by ${methodLabel[o.paymentMethod] ?? o.paymentMethod}` : ''}.
          </p>
          <p className="pl-ref">Reference {o.id}</p>
        </div>
      )}

      {(o.status === 'expired' || o.status === 'cancelled' || o.status === 'refunded') && (
        <div className="pl-done muted">
          <span className="pl-tick grey">
            <LuTicketX aria-hidden />
          </span>
          <h2>{o.status === 'expired' ? 'This link has expired' : o.status === 'cancelled' ? 'This link was cancelled' : 'This payment was refunded'}</h2>
          <p>
            {o.status === 'refunded'
              ? `${rupees(o.amount)} was refunded to your original payment method.`
              : 'It can no longer be paid. Ask the arena for a new link if you still need to pay.'}
          </p>
          <a className="btn outline" href={`tel:${phone.replace(/\s/g, '')}`}>
            <LuPhone aria-hidden /> Call {phone}
          </a>
        </div>
      )}

      {processing && (
        <div className="processing" role="alert" aria-live="assertive">
          <div>
            <div className="bounce" style={{ display: 'inline-block' }}>
              <BallMark size={44} spin />
            </div>
            <div className="shadow" />
            <h3>Confirming your payment</h3>
            <p>Please do not close this page.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// /pay/:id serves payment links (OD...) and the old booking pay URL (BX...).
export const PayRoute = () => {
  const { id = '' } = useParams();
  if (!id.toUpperCase().startsWith('OD')) return <Navigate to={`/checkout/payment/${id}`} replace />;
  return (
    <div className="pl-page">
      <PayLinkPage id={id.toUpperCase()} />
      <p className="pl-foot">
        Questions about this payment? <Link to="/">The Riverside Cricket Box</Link>
      </p>
    </div>
  );
};
