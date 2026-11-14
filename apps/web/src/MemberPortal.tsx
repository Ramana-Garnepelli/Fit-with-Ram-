import { useEffect, useRef, useState } from 'react';
import { Activity, Bell, CalendarDays, Dumbbell, LogOut, Settings, Weight } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminPortal from './AdminPortal';
import TrainerPortal from './TrainerPortal';

type User = { id: string; full_name: string; email: string; role: string; phone?: string; profile_photo_url?: string };
type Auth = { access_token: string; csrf_token: string; user: User };
type Plan = { id: string; title: string; description?: string; exercises: { name: string; sets: number; repetitions: string; rest_seconds: number }[] };
type Progress = { id: string; recorded_at: string; weight_kg?: number; body_fat_percent?: number };
type Booking = { id: string; status: string; title: string; starts_at: string; class_id?: string };
type FitnessClass = { id: string; title: string; description?: string; starts_at: string; ends_at: string; capacity: number; booked: number };
type Branch = { id: string; name: string; city?: string };
type Payment = { id: string; amount_paise: number; status: string; created_at: string; plan_name?: string; invoice_number?: string };
type MembershipPlan = { id: string; name: string; description?: string; price_paise: number; duration_days: number; discount_bps: number; tax_bps: number; benefits: string[] };
type MemberNotification = { id: string; title: string; body: string; category: string; created_at: string; read_at?: string | null };
type MemberProfileData = { user: User; profile: { date_of_birth?: string; gender?: string; address?: string; emergency_contact_name?: string; emergency_contact_phone?: string; height_cm?: number; current_weight_kg?: number; target_weight_kg?: number; fitness_goals: string[]; preferred_training_type?: string; profile_photo_url?: string }; branch: Branch };
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export default function MemberPortal({ onExit }: { onExit: () => void }) {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [attendance, setAttendance] = useState<{id: string; checked_in_at: string; checked_out_at?: string | null}[]>([]);
  const [tab, setTab] = useState('overview');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState(import.meta.env.VITE_ORGANIZATION_SLUG ?? 'fitwithram');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [membership, setMembership] = useState<{plan_name?: string; status: string; expires_at?: string} | null>(null);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [availableClasses, setAvailableClasses] = useState<FitnessClass[]>([]);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [payingFor, setPayingFor] = useState('');
  const [profile, setProfile] = useState<MemberProfileData | null>(null);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [workoutMessage, setWorkoutMessage] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const checkoutKeys = useRef<Record<string, string>>({});
  const checkoutPrice = (plan: MembershipPlan) => {
    const discounted = plan.price_paise - Math.floor(plan.price_paise * plan.discount_bps / 10000);
    return discounted + Math.floor(discounted * plan.tax_bps / 10000);
  };

  useEffect(() => {
    const csrfCookie = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('fitwithram_csrf='))
      ?.slice('fitwithram_csrf='.length);
    if (!csrfCookie) return;

    let active = true;
    setBusy(true);
    fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': decodeURIComponent(csrfCookie) },
    })
      .then(response => response.ok ? response.json() : null)
      .then((session: Auth | null) => { if (active && session) setAuth(session); })
      .catch(() => undefined)
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('phonepe_order_id');
    if (!auth || !orderId) return;
    let cancelled = false;
    let timer = 0;
    const check = async () => {
      try {
        const response = await fetch(`${API}/payments/phonepe/status/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${auth.access_token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail ?? 'Could not confirm payment status.');
        if (result.status === 'PAID') {
          if (cancelled) return;
          setPaymentMessage('Payment confirmed and membership activated.'); history.replaceState({}, '', '/app');
          const [membershipResponse, paymentsResponse] = await Promise.all([
            fetch(`${API}/members/me/membership`, { headers: { Authorization: `Bearer ${auth.access_token}` } }),
            fetch(`${API}/members/me/payments`, { headers: { Authorization: `Bearer ${auth.access_token}` } }),
          ]);
          setMembership(await membershipResponse.json());
          const data = await paymentsResponse.json(); setPayments(Array.isArray(data.items) ? data.items : []);
        } else if (result.status === 'FAILED') {
          if (!cancelled) { setError(result.message); history.replaceState({}, '', '/app'); }
        } else if (!cancelled) timer = window.setTimeout(check, 2500);
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : 'Payment status is not available yet.'); history.replaceState({}, '', '/app'); }
      }
    };
    void check();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRF-Token': auth.csrf_token },
        });
        if (response.ok) setAuth(await response.json());
        else if (response.status === 401) setAuth(null);
      } catch {
        // Keep the current access token; the next interval retries the rotation.
      }
    }, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [auth]);

  useEffect(() => {
    if (mode !== 'register' || organization.trim().length < 2) { setBranches([]); return; }
    const controller = new AbortController();
    fetch(`${API}/organizations/${encodeURIComponent(organization.trim().toLowerCase())}/branches`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : [])
      .then((rows: Branch[]) => { setBranches(rows); setBranchId(rows[0]?.id ?? ''); })
      .catch(() => setBranches([]));
    return () => controller.abort();
  }, [organization, mode]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setAuthMessage('');
    try {
      const body = mode === 'register'
        ? { full_name: name, email, password, phone: phone || null, organization_slug: organization.trim().toLowerCase(), branch_id: branchId }
        : mode === 'forgot' ? { email } : { email, password };
      const endpoint = mode === 'register' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'login';
      const res = await fetch(`${API}/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? 'Unable to sign in');
      if (mode === 'forgot') setAuthMessage(data.message);
      else setAuth(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to connect to the FITWITHRAM service'); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (!auth || auth.user.role !== 'MEMBER') return;
    const headers = { Authorization: `Bearer ${auth.access_token}` };
    Promise.all([
      fetch(`${API}/members/me/workout-plans`, { headers }).then(r => r.json()),
      fetch(`${API}/members/me/progress`, { headers }).then(r => r.json()),
      fetch(`${API}/members/me/class-bookings`, { headers }).then(r => r.json()),
      fetch(`${API}/members/me/attendance`, { headers }).then(r => r.json()),
      fetch(`${API}/members/me/payments`, { headers }).then(r => r.json()),
      fetch(`${API}/members/me/membership`, { headers }).then(r => r.json()),
      fetch(`${API}/members/me/membership-plans`, { headers }).then(r => r.json()),
      fetch(`${API}/members/me`, { headers }).then(r => r.json()),
    ]).then(async ([p, pr, b, a, pay, m, mp, memberProfile]) => { setPlans(Array.isArray(p) ? p : []); setProgress(Array.isArray(pr) ? pr : []); setBookings(Array.isArray(b) ? b : []); setAttendance(Array.isArray(a) ? a : []); setPayments(Array.isArray(pay?.items) ? pay.items : []); setMembership(m); setMembershipPlans(Array.isArray(mp) ? mp : []); setProfile(memberProfile); const memberBranch = memberProfile?.branch?.id; if (memberBranch) { setBranchId(memberBranch); const classesResponse = await fetch(`${API}/branches/${memberBranch}/classes`, { headers }); const classes = await classesResponse.json(); setAvailableClasses(Array.isArray(classes) ? classes : []); } }).catch(() => setError('Could not load your member data. Please sign in again.'));
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    fetch(`${API}/notifications?limit=30`, { headers: { Authorization: `Bearer ${auth.access_token}` } })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load notifications')))
      .then(data => { setNotifications(data.items ?? []); setUnreadNotifications(data.unread_count ?? 0); })
      .catch(() => setNotifications([]));
  }, [auth]);

  async function markNotificationRead(id: string) {
    if (!auth) return;
    const response = await fetch(`${API}/notifications/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}` } });
    if (response.ok) {
      setNotifications(items => items.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
      setUnreadNotifications(count => Math.max(0, count - 1));
    }
  }

  async function markAllNotificationsRead() {
    if (!auth) return;
    const response = await fetch(`${API}/notifications/read-all`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}` } });
    if (response.ok) {
      const readAt = new Date().toISOString();
      setNotifications(items => items.map(item => ({ ...item, read_at: item.read_at ?? readAt })));
      setUnreadNotifications(0);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!auth) return;
    const form = new FormData(event.currentTarget);
    const optionalNumber = (key: string) => String(form.get(key) ?? '').trim() ? Number(form.get(key)) : null;
    const goals = String(form.get('fitness_goals') ?? '').split(',').map(item=>item.trim()).filter(Boolean);
    const payload = {
      full_name: form.get('full_name'), phone: form.get('phone') || null,
      profile_photo_url: form.get('profile_photo_url') || null,
      date_of_birth: form.get('date_of_birth') || null, gender: form.get('gender') || null,
      address: form.get('address') || null, emergency_contact_name: form.get('emergency_contact_name') || null,
      emergency_contact_phone: form.get('emergency_contact_phone') || null,
      height_cm: optionalNumber('height_cm'), current_weight_kg: optionalNumber('current_weight_kg'),
      target_weight_kg: optionalNumber('target_weight_kg'), fitness_goals: goals,
      preferred_training_type: form.get('preferred_training_type') || null,
    };
    setSettingsMessage(''); setError('');
    const response = await fetch(`${API}/members/me`, { method: 'PUT', headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail ?? 'Could not update profile'); return; }
    const fresh = await (await fetch(`${API}/members/me`, { headers: { Authorization: `Bearer ${auth.access_token}` } })).json();
    setProfile(fresh); setAuth(current=>current?{...current,user:fresh.user}:current); setSettingsMessage('Profile saved.');
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!auth) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPasswordMessage(''); setError('');
    const response = await fetch(`${API}/members/me/password`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: form.get('current_password'), new_password: form.get('new_password') }) });
    if (!response.ok) { const result = await response.json(); setError(result.detail ?? 'Could not change password'); return; }
    setPasswordMessage('Password changed. Sign in again after this session expires.'); formElement.reset();
  }

  async function bookClass(classId: string) {
    if (!auth) return;
    setError('');
    const response = await fetch(`${API}/classes/${classId}/book`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}` } });
    const result = await response.json();
    if (!response.ok) { setError(result.detail ?? 'Could not book this class'); return; }
    const [bookingResponse, classResponse] = await Promise.all([
      fetch(`${API}/members/me/class-bookings`, { headers: { Authorization: `Bearer ${auth.access_token}` } }),
      fetch(`${API}/branches/${branchId}/classes`, { headers: { Authorization: `Bearer ${auth.access_token}` } }),
    ]);
    setBookings(await bookingResponse.json()); setAvailableClasses(await classResponse.json());
  }

  async function cancelClass(bookingId: string) {
    if (!auth) return;
    const response = await fetch(`${API}/class-bookings/${bookingId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${auth.access_token}` } });
    if (!response.ok) { setError('Could not cancel this class booking'); return; }
    setBookings(await (await fetch(`${API}/members/me/class-bookings`, { headers: { Authorization: `Bearer ${auth.access_token}` } })).json());
  }

  async function checkIn() {
    if (!auth || !branchId) return;
    const response = await fetch(`${API}/branches/${branchId}/attendance/check-in`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}` } });
    const result = await response.json();
    if (!response.ok) { setError(result.detail ?? 'Could not record attendance'); return; }
    setAttendance(await (await fetch(`${API}/members/me/attendance`, { headers: { Authorization: `Bearer ${auth.access_token}` } })).json());
  }

  async function checkOut() {
    if (!auth || !branchId) return;
    const response = await fetch(`${API}/branches/${branchId}/attendance/check-out`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}` } });
    const result = await response.json();
    if (!response.ok) { setError(result.detail ?? 'Could not record attendance check-out'); return; }
    setAttendance(await (await fetch(`${API}/members/me/attendance`, { headers: { Authorization: `Bearer ${auth.access_token}` } })).json());
  }

  async function downloadInvoice(payment: Payment) {
    if (!auth) return;
    const response = await fetch(`${API}/members/me/payments/${payment.id}/invoice`, { headers: { Authorization: `Bearer ${auth.access_token}` } });
    if (!response.ok) { setError('Invoice is unavailable for this transaction'); return; }
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = blobUrl; link.download = `${payment.invoice_number ?? 'fitwithram-invoice'}.html`; link.click(); URL.revokeObjectURL(blobUrl);
  }

  async function addProgress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!auth) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const weightValue = String(form.get('weight_kg')??'').trim();
    const bodyFatValue = String(form.get('body_fat_percent')??'').trim();
    if (!weightValue && !bodyFatValue) { setError('Enter at least your weight or body-fat percentage'); return; }
    const response = await fetch(`${API}/members/me/progress`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ weight_kg: weightValue?Number(weightValue):null, body_fat_percent: bodyFatValue?Number(bodyFatValue):null }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not save progress'); return; }
    setProgressMessage('Progress entry saved.');
    const rows = await (await fetch(`${API}/members/me/progress`, { headers: { Authorization: `Bearer ${auth.access_token}` } })).json(); setProgress(rows);
    formElement.reset();
  }

  async function logWorkout(plan: Plan) {
    if (!auth) return;
    const response = await fetch(`${API}/members/me/workout-logs`, { method: 'POST', headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ workout_plan_id: plan.id, notes: `Completed ${plan.title}` }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not log this workout'); return; }
    setWorkoutMessage('Workout completion recorded.');
  }

  async function purchaseMembership(plan: MembershipPlan) {
    if (!auth) return;
    setError(''); setPaymentMessage(''); setPayingFor(plan.id);
    try {
      const idempotencyKey = checkoutKeys.current[plan.id] ?? crypto.randomUUID();
      checkoutKeys.current[plan.id] = idempotencyKey;
      const response = await fetch(`${API}/memberships`, {
        method: 'POST', credentials: 'include',
        headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const order = await response.json();
      if (!response.ok) throw new Error(order.detail ?? 'Could not start checkout. Check PhonePe setup with your gym.');
      if (!order.redirect_url) throw new Error('PhonePe did not return a checkout URL.');
      window.location.assign(order.redirect_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start membership checkout');
      setPayingFor('');
    }
  }

  async function logout() {
    if (auth) await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': auth.csrf_token } }).catch(() => undefined);
    setAuth(null); setPlans([]); setProgress([]); setBookings([]); setAttendance([]);
  }

  if (auth && auth.user.role !== 'MEMBER') {
    if (auth.user.role === 'TRAINER') return <TrainerPortal auth={auth} onSignOut={logout} />;
    return <AdminPortal auth={auth} onSignOut={logout} />;
  }

  if (!auth) return <main className="portal-shell"><button className="portal-back" onClick={onExit}>← Back to FITWITHRAM</button><form className="login-card" onSubmit={login}><span className="eyebrow">MEMBER ACCESS</span><h1>{mode==='register'?'Start your journey.':mode==='forgot'?'Reset your password.':'Welcome back.'}</h1><p>{mode==='register'?'Create your member account at your FITWITHRAM branch.':mode==='forgot'?'We’ll email a secure reset link if an account matches.':'Sign in to see your training and progress.'}</p>{mode==='register'&&<><label>Full name<input value={name} required autoComplete="name" onChange={e=>setName(e.target.value)}/></label><label>Organization slug<input value={organization} required placeholder="e.g. fitwithram" onChange={e=>setOrganization(e.target.value)}/></label><label>Choose your branch<select value={branchId} required onChange={e=>setBranchId(e.target.value)}><option value="">{organization.length<2?'Enter organization slug first':branches.length?'Select a branch':'No branches found for this slug'}</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}{b.city?` · ${b.city}`:''}</option>)}</select></label><label>Phone (optional)<input type="tel" value={phone} autoComplete="tel" onChange={e=>setPhone(e.target.value)}/></label></>}<label>{mode==='login'?'Phone or email':'Email'}<input type={mode==='login'?'text':'email'} value={email} required autoComplete={mode==='login'?'username':'email'} onChange={e=>setEmail(e.target.value)} placeholder={mode==='login'?'Phone number or email address':'you@example.com'}/></label>{mode!=='forgot'&&<label>Password<input type="password" value={password} required minLength={mode==='register'?10:1} autoComplete={mode==='register'?'new-password':'current-password'} onChange={e=>setPassword(e.target.value)}/></label>}{error&&<div className="portal-error">{error}</div>}{authMessage&&<div className="payment-success">{authMessage}</div>}<button className="button-primary" disabled={busy||(mode==='register'&&!branchId)}>{busy?'Please wait…':mode==='register'?'Create member account':mode==='forgot'?'Send reset link':'Sign in'}</button>{mode==='register'&&<small>Your organization slug is provided by your gym.</small>}{mode==='login'&&<button className="auth-toggle" type="button" onClick={()=>{setMode('forgot');setError('');setAuthMessage('');}}>Forgot password?</button>}<button className="auth-toggle" type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setAuthMessage('');}}>{mode==='login'?'Create an account':'Back to sign in'}</button></form></main>;

  const nav = [{ id: 'overview', label: 'Overview', icon: Activity }, { id: 'membership', label: 'Memberships', icon: Weight }, { id: 'workouts', label: 'My training', icon: Dumbbell }, { id: 'classes', label: 'Classes', icon: CalendarDays }, { id: 'progress', label: 'Progress', icon: Weight }, { id: 'payments', label: 'Payments', icon: Weight }, { id: 'notifications', label: `Notifications${unreadNotifications ? ` (${unreadNotifications})` : ''}`, icon: Bell }, { id: 'settings', label: 'Settings', icon: Settings }];
  return <div className="member-app"><aside className="member-sidebar"><a className="brand" href="#home"><span className="brand-mark"><Dumbbell size={18}/></span><span>FITWITH<span className="accent">RAM</span></span></a><span className="sidebar-caption">YOUR FITNESS</span>{nav.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon size={17}/>{item.label}</button>)}<button className="signout" onClick={logout}><LogOut size={17}/>Sign out</button></aside><main className="member-content"><div className="member-top"><div><span className="eyebrow">MEMBER SPACE</span><h1>{tab === 'overview' ? `Good to see you, ${auth.user.full_name.split(' ')[0]}.` : nav.find(n => n.id === tab)?.label}</h1></div><div className="member-avatar">{auth.user.full_name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div></div>{error && <div className="portal-error">{error}</div>}
    {tab === 'overview' && <><div className="member-stats"><article><span>Membership</span><strong className="member-status-value">{membership?.status ?? '—'}</strong><small>{membership?.plan_name ?? 'Contact your branch to activate'}</small></article><article><span>Training plans</span><strong>{plans.length}</strong><small>Built for your goals</small></article><article><span>Classes booked</span><strong>{bookings.filter(b=>b.status==='BOOKED').length}</strong><small>Stay consistent</small></article></div><div className="member-columns"><section className="member-panel"><div className="panel-title"><h2>Your training</h2><button onClick={()=>setTab('workouts')}>View all →</button></div>{plans.length ? plans.slice(0,2).map(p=><div className="list-row" key={p.id}><div><strong>{p.title}</strong><span>{p.exercises.length} exercises · {p.description || 'Personalized plan'}</span></div><Dumbbell size={18}/></div>) : <p className="empty-state">Your coach’s plan will appear here once assigned.</p>}</section><section className="member-panel"><div className="panel-title"><h2>Upcoming classes</h2><CalendarDays size={18}/></div>{bookings.filter(b=>b.status==='BOOKED').slice(0,3).map(b=><div className="list-row" key={b.id}><div><strong>{b.title}</strong><span>{new Date(b.starts_at).toLocaleString()}</span></div><span className="status-pill">BOOKED</span></div>)}{!bookings.length && <p className="empty-state">Your class reservations will show here.</p>}</section></div></>}
    {tab === 'workouts' && <section className="member-panel full-panel"><h2>My training plans</h2>{workoutMessage&&<div className="payment-success">{workoutMessage}</div>}{plans.length ? plans.map(p=><article className="workout-card" key={p.id}><div className="panel-title"><h3>{p.title}</h3><button className="panel-action" onClick={()=>void logWorkout(p)}>Mark workout complete</button></div><p>{p.description}</p>{p.exercises.map((e,i)=><div className="exercise-row" key={`${e.name}-${i}`}><strong>{e.name}</strong><span>{e.sets} sets × {e.repetitions}</span><small>{e.rest_seconds}s rest</small></div>)}</article>) : <p className="empty-state">Your coach’s plan will appear here once assigned.</p>}</section>}
    {tab === 'notifications' && <section className="member-panel full-panel"><div className="panel-title"><h2>Notifications {unreadNotifications ? `· ${unreadNotifications} unread` : ''}</h2>{unreadNotifications > 0 && <button onClick={()=>void markAllNotificationsRead()}>Mark all read</button>}</div>{notifications.map(item=><div className="list-row" key={item.id}><div><strong>{item.title}{!item.read_at&&<span className="notification-unread-dot" aria-label="Unread"/>}</strong><span>{item.body}</span><small>{new Date(item.created_at).toLocaleString()}</small></div>{!item.read_at&&<button className="table-action" onClick={()=>void markNotificationRead(item.id)}>Mark read</button>}</div>)}{!notifications.length&&<p className="empty-state">You’re all caught up. Membership and class updates will appear here.</p>}</section>}
    {tab === 'membership' && <section className="member-panel full-panel"><h2>Membership plans</h2><p className="empty-state">Checkout uses PhonePe secure hosted checkout. Membership activates only after server-side payment verification. A renewal paid before expiry starts after your current membership ends.</p>{membership&&<div className="current-membership"><strong>Current membership: {membership.plan_name} · {membership.status}</strong>{membership.expires_at&&<span>Valid until {new Date(membership.expires_at).toLocaleDateString()}</span>}</div>}{paymentMessage && <div className="payment-success">{paymentMessage}</div>}<div className="membership-plan-grid">{membershipPlans.map(p=><article className="membership-plan-card" key={p.id}><span className="eyebrow">{p.duration_days} DAYS</span><h3>{p.name}</h3><strong>₹{(checkoutPrice(p) / 100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong><small className="plan-price-note">Final total, including configured discounts and tax</small><p>{p.description}</p><ul>{p.benefits.map(benefit=><li key={benefit}>{benefit}</li>)}</ul><button className="button-primary" disabled={Boolean(payingFor)} onClick={()=>purchaseMembership(p)}>{payingFor===p.id ? 'Starting checkout…' : 'Choose membership'}</button></article>)}</div>{!membershipPlans.length && <p className="empty-state">No plans are available for your branch yet. Contact your gym team.</p>}</section>}
    {tab === 'classes' && <div className="member-columns"><section className="member-panel"><h2>Available classes</h2>{availableClasses.map(c=>{const booking=bookings.find(b=>b.class_id===c.id&&b.status==='BOOKED');return <div className="list-row" key={c.id}><div><strong>{c.title}</strong><span>{new Date(c.starts_at).toLocaleString()} · {c.booked}/{c.capacity} booked</span></div>{booking?<button className="table-action" onClick={()=>void cancelClass(booking.id)}>Cancel</button>:<button className="panel-action" disabled={c.booked>=c.capacity} onClick={()=>void bookClass(c.id)}>{c.booked>=c.capacity?'Full':'Book class'}</button>}</div>})}{!availableClasses.length&&<p className="empty-state">No upcoming classes are listed for your branch.</p>}</section><section className="member-panel"><h2>Your class bookings</h2>{bookings.map(b=><div className="list-row" key={b.id}><div><strong>{b.title}</strong><span>{new Date(b.starts_at).toLocaleString()}</span></div><span className="status-pill">{b.status}</span></div>)}{!bookings.length&&<p className="empty-state">No classes are booked yet.</p>}</section></div>}
    {tab === 'progress' && <div className="member-columns"><section className="member-panel"><h2>Fitness progress</h2>{progressMessage&&<div className="payment-success">{progressMessage}</div>}{progress.some(p=>p.weight_kg)&&<div className="progress-chart"><ResponsiveContainer width="100%" height={210}><LineChart data={progress.filter(p=>p.weight_kg).slice().reverse().map(p=>({date:new Date(p.recorded_at).toLocaleDateString(),weight:p.weight_kg}))}><CartesianGrid stroke="#eee" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis width={35} tick={{fontSize:10}} domain={['auto','auto']}/><Tooltip/><Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></div>}<form className="progress-form" onSubmit={addProgress}><label>Weight kg<input name="weight_kg" type="number" min={20} max={400} step="0.1"/></label><label>Body fat %<input name="body_fat_percent" type="number" min={1} max={80} step="0.1"/></label><button className="button-primary">Record progress</button></form>{progress.map(p=><div className="list-row" key={p.id}><div><strong>{p.weight_kg ? `${p.weight_kg} kg` : `${p.body_fat_percent ?? '—'}% body fat`}</strong><span>{new Date(p.recorded_at).toLocaleDateString()}</span></div><Weight size={18}/></div>)}{!progress.length && <p className="empty-state">Your measurements will appear here as you log progress.</p>}</section><section className="member-panel"><div className="panel-title"><h2>Recent check-ins</h2>{attendance[0]&&!attendance[0].checked_out_at?<button onClick={()=>void checkOut()}>Check out now</button>:<button onClick={()=>void checkIn()}>Check in now</button>}</div>{attendance.slice(0,8).map(a=><div className="list-row" key={a.id}><div><strong>Gym visit</strong><span>In {new Date(a.checked_in_at).toLocaleString()}{a.checked_out_at?` · Out ${new Date(a.checked_out_at).toLocaleString()}`:' · Still checked in'}</span></div><Activity size={18}/></div>)}{!attendance.length && <p className="empty-state">Your gym visits will show here.</p>}</section></div>}
    {tab === 'payments' && <section className="member-panel full-panel"><h2>Transactions</h2>{payments.map(p=><div className="list-row" key={p.id}><div><strong>{p.plan_name ?? 'Membership payment'} · ₹{(p.amount_paise / 100).toFixed(2)}</strong><span>{new Date(p.created_at).toLocaleString()} · {p.invoice_number??'Receipt pending'}</span></div><div className="payment-row-actions"><span className={`status-pill status-${p.status.toLowerCase()}`}>{p.status}</span>{p.invoice_number&&<button className="table-action" onClick={()=>void downloadInvoice(p)}>Download invoice</button>}</div></div>)}{!payments.length && <p className="empty-state">Your membership payments will appear here.</p>}</section>}
    {tab === 'settings' && <div className="settings-layout"><section className="member-panel"><h2>Profile details</h2>{settingsMessage&&<div className="payment-success">{settingsMessage}</div>}{profile&&<form className="trainer-form profile-form" onSubmit={saveProfile}><label>Full name<input name="full_name" required minLength={2} defaultValue={profile.user.full_name}/></label><label>Email<input value={profile.user.email} disabled/></label><label>Phone<input name="phone" defaultValue={profile.user.phone??''}/></label><label>Profile photo URL (HTTPS)<input name="profile_photo_url" type="url" defaultValue={profile.profile.profile_photo_url??''}/></label><div className="trainer-form-row"><label>Date of birth<input name="date_of_birth" type="date" defaultValue={profile.profile.date_of_birth??''}/></label><label>Gender<input name="gender" defaultValue={profile.profile.gender??''}/></label></div><label>Address<textarea name="address" rows={2} defaultValue={profile.profile.address??''}/></label><div className="trainer-form-row"><label>Height cm<input name="height_cm" type="number" min={80} max={260} defaultValue={profile.profile.height_cm??''}/></label><label>Current weight kg<input name="current_weight_kg" type="number" min={20} max={400} step="0.1" defaultValue={profile.profile.current_weight_kg??''}/></label><label>Target weight kg<input name="target_weight_kg" type="number" min={20} max={400} step="0.1" defaultValue={profile.profile.target_weight_kg??''}/></label></div><div className="trainer-form-row"><label>Emergency contact<input name="emergency_contact_name" defaultValue={profile.profile.emergency_contact_name??''}/></label><label>Emergency phone<input name="emergency_contact_phone" defaultValue={profile.profile.emergency_contact_phone??''}/></label></div><label>Fitness goals (comma separated)<input name="fitness_goals" defaultValue={profile.profile.fitness_goals?.join(', ')??''}/></label><label>Preferred training type<input name="preferred_training_type" defaultValue={profile.profile.preferred_training_type??''}/></label><button className="button-primary">Save profile</button></form>}</section><section className="member-panel"><h2>Change password</h2>{passwordMessage&&<div className="payment-success">{passwordMessage}</div>}<form className="trainer-form" onSubmit={changePassword}><label>Current password<input name="current_password" type="password" required autoComplete="current-password"/></label><label>New password<input name="new_password" type="password" required minLength={12} autoComplete="new-password"/></label><button className="button-primary">Update password</button></form></section></div>}
  </main></div>;
}
