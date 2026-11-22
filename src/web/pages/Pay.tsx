import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { MdCreditCard, MdLock, MdQrCode2 } from 'react-icons/md';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import type { Booking, OnlinePaymentKind, PaymentOrder } from '@shared/api/types';
import { rupees } from '@shared/lib/format';
import { openCheckout } from '@shared/lib/razorpay';
import { useSecondsLeft } from '@shared/lib/time';
import { Banner, Button, EmptyState, ErrorState, Loading } from '@shared/ui/core';
import { PriceBreakdown } from '@shared/ui/PriceBreakdown';

import { api, queryKeys } from '../api';
import { BallMark } from '../components/art';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { useLoginRedirect } from '../components/RequireLogin';
import { useCustomer } from '../session';
import { BookingSummaryCard, HoldBanner } from './Checkout';

const methods: { id: OnlinePaymentKind; label: string; icon: typeof MdQrCode2 }[] = [
  { id: 'upi_qr', label: 'UPI QR', icon: MdQrCode2 },
  { id: 'credit_card', label: 'Credit card', icon: MdCreditCard },
  { id: 'debit_card', label: 'Debit card', icon: MdCreditCard },
];

const PENDING_SECONDS = 15 * 60;

const PayInner = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const customer = useCustomer();
  const [method, setMethod] = useState<OnlinePaymentKind>('upi_qr');
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [failure, setFailure] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const orderFor = useRef<string | null>(null);

  const booking = useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: () => api.booking(id),
    // A real UPI QR is paid in another app: poll so the webhook-confirmed status shows up.
    refetchInterval: (q) => (order?.qrString && !order.mock && q.state.data?.status === 'pending' ? 3000 : false),
  });
  const secondsLeft = useSecondsLeft(booking.data?.status === 'pending' ? booking.data.expiresAt : null);

  const createOrder = useMutation({
    mutationFn: (m: OnlinePaymentKind) => api.createOrder(id, m),
    onSuccess: (created) => {
      setOrder(created);
      void booking.refetch();
    },
    onError: (error) => setFailure(errorMessage(error)),
  });

  // One order per chosen method, so the UPI QR can be shown straight away.
  useEffect(() => {
    if (booking.data?.status !== 'pending' || orderFor.current === method) return;
    orderFor.current = method;
    setOrder(null);
    createOrder.mutate(method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, booking.data?.status]);

  const finish = (result: Booking) => {
    queryClient.setQueryData(queryKeys.booking(id), result);
    void queryClient.invalidateQueries({ queryKey: queryKeys.myBookings });
    void queryClient.invalidateQueries({ queryKey: ['slots'] });
    navigate(`/booking/${id}/confirmed`, { replace: true });
  };

  useEffect(() => {
    if (booking.data?.status === 'upcoming' && order) finish(booking.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.data?.status]);

  const verify = async (result: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
    setProcessing(true);
    const started = Date.now();
    try {
      const confirmed = await api.verifyPayment({ bookingId: id, ...result });
      await new Promise((r) => setTimeout(r, Math.max(0, 1200 - (Date.now() - started))));
      finish(confirmed);
    } catch (error) {
      setProcessing(false);
      setFailure(
        error instanceof ApiError && error.status === 409
          ? 'Your payment arrived after the 15-minute window and the slot was taken by someone else. The full amount is being refunded automatically.'
          : errorMessage(error),
      );
      void booking.refetch();
    }
  };

  const pay = async () => {
    setFailure(undefined);
    const b = booking.data;
    if (!order || !b) return;
    if (order.mock) {
      await verify({ razorpayOrderId: order.orderId, razorpayPaymentId: `pay_test_${Date.now()}`, razorpaySignature: 'test-mode' });
      return;
    }
    if (order.method === 'upi_qr' && order.qrString) {
      // Paid by scanning: check whether the payment has reached us.
      const latest = await booking.refetch();
      if (latest.data?.status !== 'upcoming') setFailure('We have not received the payment yet. Finish it in your UPI app - this page updates by itself.');
      return;
    }
    try {
      const { result, error } = await openCheckout(order, {
        name: booking.data?.customerName ?? '',
        phone: customer?.visitor.phone ?? '',
        email: customer?.visitor.email,
        description: `${b.slotLabel}, ${b.date} - ${b.id}`,
      });
      if (result) await verify(result);
      else if (error) setFailure(`${error} You can try again.`);
    } catch (error) {
      setFailure(errorMessage(error));
    }
  };

  if (booking.isLoading) return <Loading label="Loading your booking…" />;
  if (booking.isError) return <ErrorState error={booking.error} title="We could not find this booking" onRetry={() => booking.refetch()} />;
  const b = booking.data!;
  if (b.status !== 'pending') return <Navigate to={b.status === 'upcoming' ? `/booking/${b.id}/confirmed` : `/bookings/${b.id}`} replace />;

  if (secondsLeft === 0) {
    return (
      <EmptyState title="Payment time is up" action={<Link to="/book" className="btn primary lg">Book again</Link>}>
        Unpaid bookings are released after 15 minutes, so these slots may now be free for others. No money has been deducted.
      </EmptyState>
    );
  }

  const qrValue = order?.qrString ?? (order?.mock ? `upi://pay?pn=The%20Riverside%20Cricket%20Box&am=${b.price.total}&tn=${b.id}` : null);

  return (
    <div className="two-col">
      <div>
        <h1 className="page-title">Payment</h1>
        {secondsLeft !== null && <HoldBanner secondsLeft={secondsLeft} total={PENDING_SECONDS} />}
        {failure && (
          <div style={{ marginTop: 14 }}>
            <Banner tone="danger">{failure}</Banner>
          </div>
        )}
        <h2 className="step-heading" style={{ marginBottom: 0 }}>
          Choose payment method
        </h2>
        <div className="pay-methods" role="radiogroup" aria-label="Payment method">
          {methods.map(({ id: m, label, icon: Icon }) => (
            <button key={m} type="button" role="radio" aria-checked={method === m} className="chip" aria-pressed={method === m} onClick={() => setMethod(m)}>
              <Icon aria-hidden /> {label}
            </button>
          ))}
        </div>

        <div className="card pay-panel">
          {!order ? (
            <Loading label="Preparing secure payment…" />
          ) : method === 'upi_qr' && qrValue ? (
            <>
              <h4>Scan to pay {rupees(b.price.total)}</h4>
              <p className="tiny muted" style={{ marginTop: 6 }}>
                Open any UPI app and scan this QR code.{order.mock ? ' Test mode - no real payment.' : ''}
              </p>
              <div className="qr-box" style={{ margin: '14px auto 6px' }}>
                <QRCodeSVG value={qrValue} size={186} />
              </div>
              <p className="tiny muted">{order.mock ? 'Tap Pay below to complete the test payment.' : 'After paying in your app, this page updates by itself.'}</p>
            </>
          ) : (
            <>
              <h4>Pay {rupees(b.price.total)} by {method === 'upi_qr' ? 'UPI' : method === 'credit_card' ? 'credit card' : 'debit card'}</h4>
              <p className="small muted" style={{ marginTop: 8 }}>
                {order.mock
                  ? 'Test mode: Razorpay keys are not set on the server, so tapping Pay completes a test payment.'
                  : method === 'upi_qr'
                    ? 'Tap Pay to open Razorpay secure checkout. Scan the UPI QR with any UPI app (GPay, PhonePe, Paytm), or pick your UPI app on mobile.'
                    : "Tap Pay to open Razorpay's secure checkout. We never see or store your card number."}
              </p>
              <p className="tiny muted" style={{ marginTop: 10 }}>
                Secured by Razorpay
              </p>
            </>
          )}
        </div>
        <p className="row small muted" style={{ marginTop: 16, '--gap': '8px' } as React.CSSProperties}>
          <MdLock color="#138a57" aria-hidden /> Payments are encrypted and secure.
        </p>
      </div>

      <aside className="sticky-side stack" style={{ '--gap': '16px' } as React.CSSProperties}>
        <BookingSummaryCard date={b.date} startHour={b.startHour} hours={b.hours} pitchName={b.pitchName} />
        <div className="card summary-card">
          <PriceBreakdown price={b.price} lines={false} />
        </div>
        <Button variant="primary" size="lg" block disabled={!order || processing} loading={createOrder.isPending} onClick={() => void pay()}>
          <MdLock aria-hidden /> Pay {rupees(b.price.total)}
        </Button>
      </aside>

      <div className="mobile-bar">
        <span className="grow">
          <strong className="block">{rupees(b.price.total)}</strong>
          <span style={{ color: '#c8f23a', fontSize: 13 }}>Total payable</span>
        </span>
        <Button variant="primary" size="lg" disabled={!order || processing} onClick={() => void pay()}>
          <MdLock aria-hidden /> Pay
        </Button>
      </div>

      {processing && (
        <div className="processing" role="alert" aria-live="assertive">
          <div>
            <div className="bounce" style={{ display: 'inline-block' }}>
              <BallMark size={44} spin />
            </div>
            <div className="shadow" />
            <h3>Processing your payment</h3>
            <p>Please do not press back or close this page.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const Pay = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const customer = useCustomer();
  const goLogin = useLoginRedirect();
  useEffect(() => {
    if (!customer) goLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);
  return (
    <CheckoutLayout step={3} title="Payment" onBack={() => navigate(`/bookings/${id}`)}>
      {customer ? <PayInner id={id} /> : <Loading />}
    </CheckoutLayout>
  );
};
