import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { LuCircleX, LuClock, LuCreditCard, LuLock, LuQrCode, LuRefreshCw, LuShieldCheck, LuSmartphone, LuWallet } from 'react-icons/lu';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import type { Booking, OnlinePaymentKind, PaymentOrder } from '@shared/api/types';
import { rupees } from '@shared/lib/format';
import { openCheckout } from '@shared/lib/razorpay';
import { useSecondsLeft } from '@shared/lib/time';
import { Button, ErrorState, Skeleton, cx } from '@shared/ui/core';

import { api, queryKeys } from '../api';
import { BallMark } from '../components/art';
import { ArenaHeader, HoldTimer, PriceLines, SlotFacts } from '../components/booking';
import { CheckoutLayout } from '../components/CheckoutLayout';
import { useLoginRedirect } from '../components/RequireLogin';
import { useCustomer } from '../session';

const methods: { id: OnlinePaymentKind; label: string; sub: string; icon: typeof LuQrCode }[] = [
  { id: 'upi_qr', label: 'UPI', sub: 'GPay, PhonePe, Paytm, BHIM or any UPI app', icon: LuSmartphone },
  { id: 'credit_card', label: 'Credit card', sub: 'Visa, Mastercard, RuPay, Amex', icon: LuCreditCard },
  { id: 'debit_card', label: 'Debit card', sub: 'All major Indian bank cards', icon: LuWallet },
];

const PENDING_SECONDS = 15 * 60;

const PayInner = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const customer = useCustomer();
  const [method, setMethod] = useState<OnlinePaymentKind>('upi_qr');
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [failure, setFailure] = useState<string>();
  // The payment could not even start (e.g. the server has no Razorpay keys): no money moved.
  const [orderFailed, setOrderFailed] = useState(false);
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
    onError: (error) => {
      setOrderFailed(true);
      setFailure(errorMessage(error));
    },
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
      const latest = await booking.refetch();
      if (latest.data?.status !== 'upcoming') setFailure('We have not received the payment yet. Finish it in your UPI app - this page updates by itself.');
      return;
    }
    try {
      const { result, error } = await openCheckout(order, {
        name: b.customerName,
        phone: customer?.visitor.phone ?? '',
        email: customer?.visitor.email,
        description: `${b.slotLabel}, ${b.date} - ${b.id}`,
      });
      if (result) await verify(result);
      else setFailure(error ? `${error}` : 'Payment was cancelled before it finished. No money has been deducted.');
    } catch (error) {
      setFailure(errorMessage(error));
    }
  };

  const retry = (m?: OnlinePaymentKind) => {
    setFailure(undefined);
    setOrderFailed(false);
    if (m && m !== method) {
      setMethod(m);
      return;
    }
    orderFor.current = method;
    setOrder(null);
    createOrder.mutate(method);
  };

  if (booking.isLoading) {
    return (
      <div className="bk-layout" aria-label="Loading payment">
        <div className="bk-main-col">
          <Skeleton height={40} width={260} />
          <Skeleton height={84} />
          <Skeleton height={84} />
          <Skeleton height={84} />
        </div>
        <aside className="bk-aside">
          <Skeleton height={360} />
        </aside>
      </div>
    );
  }
  if (booking.isError) {
    return (
      <div className="bk-card bk-state">
        <ErrorState error={booking.error} title="We could not find this booking" onRetry={() => booking.refetch()} />
      </div>
    );
  }
  const b = booking.data!;
  if (b.status !== 'pending') return <Navigate to={b.status === 'upcoming' ? `/booking/${b.id}/confirmed` : '/bookings'} replace />;

  if (secondsLeft === 0) {
    return (
      <div className="bk-card bk-state bk-fail">
        <span className="bk-state-icon amber">
          <LuClock aria-hidden />
        </span>
        <h2>Payment time is up</h2>
        <p>Unpaid bookings are released after 15 minutes, so these slots may now be free for others. No money has been deducted.</p>
        <div className="bk-state-actions">
          <Link to={`/book?date=${b.date}&step=time`} className="btn primary lg">
            Book again
          </Link>
          <Link to="/bookings" className="btn outline lg">
            My bookings
          </Link>
        </div>
      </div>
    );
  }

  const qrValue = order?.qrString ?? (order?.mock ? `upi://pay?pn=The%20Riverside%20Cricket%20Box&am=${b.price.total}&tn=${b.id}` : null);
  const otherMethod = methods.find((m) => m.id !== method)!;

  return (
    <>
      <div className="bk-layout">
        <div className="bk-main-col">
          <div className="bk-head">
            <h1>Payment</h1>
            <p>Choose how you'd like to pay. Your slot is confirmed the moment payment succeeds.</p>
          </div>
          {secondsLeft !== null && <HoldTimer secondsLeft={secondsLeft} total={PENDING_SECONDS} label="Complete payment to confirm your slot" />}

          {failure && (
            <div className="bk-card bk-payfail" role="alert">
              <span className="bk-state-icon red">
                <LuCircleX aria-hidden />
              </span>
              <div className="grow">
                <h2>{orderFailed ? 'Online payment is unavailable' : 'Payment failed'}</h2>
                <p>{failure}</p>
                <p className="bk-fine">
                  {orderFailed
                    ? 'No money has been taken. Try again in a moment, or call the arena to pay at the counter.'
                    : 'If money was debited, it is refunded to your account automatically within 5–7 working days.'}
                </p>
                <div className="bk-state-actions">
                  <Button variant="primary" onClick={() => retry()}>
                    <LuRefreshCw aria-hidden /> Try again
                  </Button>
                  <Button variant="outline" onClick={() => retry(otherMethod.id)}>
                    Pay with {otherMethod.label}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bk-card">
            <h2 className="bk-card-title">
              <LuWallet aria-hidden /> Payment method
            </h2>
            <div className="bk-methods" role="radiogroup" aria-label="Payment method">
              {methods.map(({ id: m, label, sub, icon: Icon }) => (
                <button key={m} type="button" role="radio" aria-checked={method === m} className={cx('bk-method', method === m && 'on')} onClick={() => setMethod(m)}>
                  <span className="bk-method-icon">
                    <Icon aria-hidden />
                  </span>
                  <span className="grow">
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </span>
                  <span className="bk-radio" aria-hidden />
                </button>
              ))}
            </div>

            <div className="bk-paypanel">
              {!order && orderFailed ? (
                <p className="bk-paynote">Payment could not be started. Use Try again above.</p>
              ) : !order ? (
                <div className="bk-preparing">
                  <span className="spinner" aria-hidden /> Preparing secure payment…
                </div>
              ) : method === 'upi_qr' && qrValue ? (
                <div className="bk-qr">
                  <div className="bk-qr-code">
                    <QRCodeSVG value={qrValue} size={168} fgColor="#062019" />
                  </div>
                  <div>
                    <strong>
                      <LuQrCode aria-hidden /> Scan to pay {rupees(b.price.total)}
                    </strong>
                    <p>Open any UPI app and scan this code{order.mock ? '' : ', or tap Pay now to choose your UPI app'}.</p>
                    <p className="bk-fine">{order.mock ? 'Test mode: tap Pay now to complete a test payment.' : 'This page updates by itself once you pay.'}</p>
                  </div>
                </div>
              ) : (
                <p className="bk-paynote">
                  {order.mock
                    ? 'Test mode: Razorpay keys are not set on the server, so Pay now completes a test payment.'
                    : method === 'upi_qr'
                      ? 'Tap Pay Now to open secure checkout and pick your UPI app.'
                      : "Tap Pay Now to enter your card in Razorpay's secure checkout. We never see or store your card number."}
                </p>
              )}
            </div>
            {order?.mock && (
              <button type="button" className="bk-link small" onClick={() => setFailure('Your bank declined the payment (test). No money has been deducted.')}>
                Test mode: simulate a failed payment
              </button>
            )}
          </div>

          <p className="bk-trust">
            <LuShieldCheck aria-hidden /> 256-bit encrypted · Payments processed by Razorpay · PCI DSS compliant
          </p>
        </div>

        <aside className="bk-aside">
          <div className="bk-card bk-sum">
            <h3>Payment summary</h3>
            <ArenaHeader name={b.venueName} sub={`${b.pitchName} · Booking ${b.id}`} />
            <SlotFacts slot={b} compact />
            <PriceLines price={b.price} />
            <Button variant="primary" size="lg" block disabled={!order || processing} loading={createOrder.isPending} onClick={() => void pay()}>
              <LuLock aria-hidden /> Pay now · {rupees(b.price.total)}
            </Button>
            <p className="bk-note">
              Booked by {b.customerName} · {b.players ?? '—'} players
            </p>
          </div>
        </aside>
      </div>

      <div className="bk-bar">
        <span className="grow">
          <strong>{rupees(b.price.total)}</strong>
          <small>Total payable</small>
        </span>
        <Button variant="primary" size="lg" disabled={!order || processing} onClick={() => void pay()}>
          <LuLock aria-hidden /> Pay now
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
    </>
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
    <CheckoutLayout step={5} title="Payment" onBack={() => navigate('/bookings')}>
      {customer ? <PayInner id={id} /> : null}
    </CheckoutLayout>
  );
};
