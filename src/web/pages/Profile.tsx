import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { LuArrowRight, LuChevronRight, LuCircleHelp, LuFileText, LuHeadphones, LuLogOut, LuShieldCheck, LuTicket } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError, errorMessage } from '@shared/api/client';
import { phoneText } from '@shared/lib/format';
import { todayIST } from '@shared/lib/time';
import { birthdayError, emailError, nameError, sanitizeName } from '@shared/lib/validation';
import { Button } from '@shared/ui/core';
import { Modal } from '@shared/ui/Modal';
import { useToast } from '@shared/ui/Toast';

import { api, queryKeys } from '../api';
import { ADMIN_PANEL_URL } from '../content';
import { customerSession, useCustomer } from '../session';

const EditProfile = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: queryKeys.me, queryFn: api.me });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!me.data) return;
    setName(me.data.name);
    setEmail(me.data.email ?? '');
    setBirthday(me.data.birthday ?? '');
    customerSession.update({ visitor: me.data });
  }, [me.data]);

  const save = useMutation({
    mutationFn: () => api.updateMe({ name: name.trim(), email: email.trim() || null, birthday: birthday || null }),
    onSuccess: (visitor) => {
      queryClient.setQueryData(queryKeys.me, visitor);
      customerSession.update({ visitor });
      setErrors({});
      toast.show('Profile updated');
    },
    onError: (e) => {
      if (e instanceof ApiError && e.errors.length) setErrors(Object.fromEntries(e.errors.map((x) => [x.path, x.message])));
      else toast.error(errorMessage(e));
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = { name: nameError(name), email: emailError(email), birthday: birthdayError(birthday, todayIST()) };
    const problems = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as Record<string, string>;
    setErrors(problems);
    if (Object.keys(problems).length === 0) save.mutate();
  };

  return (
    <form className="card pad stack" style={{ '--gap': '14px', marginTop: 16 } as React.CSSProperties} onSubmit={submit} noValidate>
      <strong style={{ fontSize: 17, fontWeight: 500 }}>Edit profile</strong>
      <label className="field">
        <span className="field-label">Full name</span>
        <input className="input" value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(sanitizeName(e.target.value))} aria-invalid={!!errors.name} />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>
      <label className="field">
        <span className="field-label">Email (for receipts, optional)</span>
        <input className="input" type="email" value={email} maxLength={120} autoComplete="email" onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))} aria-invalid={!!errors.email} />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>
      <label className="field">
        <span className="field-label">Birthday (optional)</span>
        <input className="input" type="date" min="1900-01-01" max={todayIST()} value={birthday} onChange={(e) => setBirthday(e.target.value)} aria-invalid={!!errors.birthday} />
        {errors.birthday && <span className="field-error">{errors.birthday}</span>}
      </label>
      <div>
        <Button type="submit" variant="primary" loading={save.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
};

export const Profile = () => {
  const customer = useCustomer();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const logout = () => {
    customerSession.clear();
    queryClient.clear();
    setConfirmLogout(false);
    navigate('/');
  };

  return (
    <div className="container">
      <div className="profile-wrap">
        <h1 style={{ fontSize: 38, marginBottom: 12 }}>Profile</h1>
        {customer ? (
          <div className="card pad row" style={{ '--gap': '14px' } as React.CSSProperties}>
            <span className="avatar lg">{(customer.visitor.name || '?').slice(0, 1).toUpperCase()}</span>
            <div className="grow">
              <strong style={{ display: 'block', fontSize: 20, fontWeight: 500 }}>{customer.visitor.name || 'Player'}</strong>
              <span className="muted">{phoneText(customer.visitor.phone)}</span>
            </div>
          </div>
        ) : (
          <div className="promo-card">
            <h3>Play more, wait less</h3>
            <p>Log in to see your tickets, rebook in one tap and get offers for regulars.</p>
            <Link to="/auth?from=/profile" className="btn lime lg" style={{ paddingInline: 24 }}>
              Log in or sign up <LuArrowRight aria-hidden />
            </Link>
          </div>
        )}

        {customer && <EditProfile />}

        <nav className="card menu-list" aria-label="Profile menu">
          <Link to="/bookings">
            <LuTicket aria-hidden /> My bookings <LuChevronRight className="chev" aria-hidden />
          </Link>
          <a href={ADMIN_PANEL_URL}>
            <LuShieldCheck aria-hidden /> Counter admin <LuChevronRight className="chev" aria-hidden />
          </a>
          <a href="tel:+917507197507">
            <LuHeadphones aria-hidden /> Call +91 75071 97507 <LuChevronRight className="chev" aria-hidden />
          </a>
          <Link to="/#faq">
            <LuCircleHelp aria-hidden /> Help and FAQs <LuChevronRight className="chev" aria-hidden />
          </Link>
          <Link to="/terms">
            <LuFileText aria-hidden /> Terms and privacy <LuChevronRight className="chev" aria-hidden />
          </Link>
          {customer && (
            <button type="button" onClick={() => setConfirmLogout(true)} style={{ color: '#e23d2e' }}>
              <LuLogOut aria-hidden style={{ color: '#e23d2e' }} /> Log out
            </button>
          )}
        </nav>
      </div>
      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              Stay logged in
            </Button>
            <Button variant="danger" onClick={logout}>
              Log out
            </Button>
          </>
        }
      >
        <p className="muted">Your bookings stay safe. Log in with the same number to see them again.</p>
      </Modal>
    </div>
  );
};
