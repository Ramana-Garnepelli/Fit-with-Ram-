import { ArrowRight, Dumbbell, Menu, MoveUpRight } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

const MemberPortal = lazy(() => import('./MemberPortal'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
const ORGANIZATION_SLUG = import.meta.env.VITE_ORGANIZATION_SLUG ?? 'fitwithram';
type PublicBranch = { id: string; name: string; city?: string; address?: string; phone?: string; facilities?: string[] };
type PublicPlan = { id: string; name: string; description?: string; price_paise: number; duration_days: number; discount_bps: number; tax_bps: number; benefits: string[] };

const programs = [
  { name: 'Strength & Conditioning', detail: 'Build durable strength with coaching that meets you where you are.', icon: '01' },
  { name: 'Personal Training', detail: 'One-to-one coaching shaped around your goals, schedule, and progress.', icon: '02' },
  { name: 'Mobility & Recovery', detail: 'Move better, recover well, and keep showing up consistently.', icon: '03' },
];

function App() {
  const [showPortal, setShowPortal] = useState(window.location.pathname === '/app');
  const [contactBranches, setContactBranches] = useState<PublicBranch[]>([]);
  const [publicPlans, setPublicPlans] = useState<PublicPlan[]>([]);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState('');
  useEffect(() => {
    Promise.all([
      fetch(`${API}/organizations/${encodeURIComponent(ORGANIZATION_SLUG)}/branches`).then(response => response.ok ? response.json() : []),
      fetch(`${API}/membership-plans?organization_slug=${encodeURIComponent(ORGANIZATION_SLUG)}`).then(response => response.ok ? response.json() : []),
    ]).then(([branches, plans]) => {
      setContactBranches(Array.isArray(branches) ? branches : []);
      setPublicPlans(Array.isArray(plans) ? plans : []);
    }).catch(() => { setContactBranches([]); setPublicPlans([]); });
  }, []);

  async function submitEnquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setContactBusy(true); setContactError(''); setContactMessage('');
    try {
      const response = await fetch(`${API}/organizations/${encodeURIComponent(ORGANIZATION_SLUG)}/enquiries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.get('name'), email: values.get('email'), phone: values.get('phone') || null,
          subject: values.get('subject'), message: values.get('message'), branch_id: values.get('branch_id') || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? 'Could not send your enquiry. Please try again.');
      setContactMessage(result.message); form.reset();
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Could not send your enquiry. Please try again.');
    } finally { setContactBusy(false); }
  }
  if (window.location.pathname === '/reset-password') return <Suspense fallback={<div className="portal-loading">Loading secure reset…</div>}><ResetPassword /></Suspense>;
  if (showPortal) return <Suspense fallback={<div className="portal-loading">Loading your FITWITHRAM space…</div>}><MemberPortal onExit={() => { history.pushState({}, '', '/'); setShowPortal(false); }} /></Suspense>;
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="FITWITHRAM home"><span className="brand-mark"><Dumbbell size={20} /></span><span>FITWITH<span className="accent">RAM</span></span></a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#programs">Programs</a><a href="#approach">Our approach</a><a href="#locations">Locations</a>
        </nav>
        <div className="header-actions"><button className="signin-link" onClick={() => { history.pushState({}, '', '/app'); setShowPortal(true); }}>Member sign in</button><a className="header-cta" href="#membership">Explore memberships <MoveUpRight size={16} /></a></div>
        <button className="mobile-menu" aria-label="Open menu"><Menu /></button>
      </header>

      <section className="hero" id="home">
        <div className="hero-image" role="img" aria-label="Athlete training in a premium gym" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> TRAIN HARD. STAY CONSISTENT.</p>
          <h1>BUILD YOUR<br /><span>BEST SELF.</span></h1>
          <p className="hero-description">A stronger you starts with a plan that fits your life. Expert coaching, a welcoming community, and progress you can feel.</p>
          <div className="hero-actions"><a className="button-primary" href="#membership">Start your journey <ArrowRight size={18} /></a><a className="text-link" href="#programs">Explore programs</a></div>
          <div className="hero-note"><span className="note-line" /> COACHING BUILT AROUND YOU</div>
        </div>
        <div className="hero-index"><span>01</span><span className="index-track" /><span>03</span></div>
      </section>

      <section className="intro" id="approach">
        <div className="intro-label"><span className="eyebrow">THE FITWITHRAM APPROACH</span><span className="orange-rule" /></div>
        <div><h2>Consistency changes<br />everything.</h2><p>Fitness is personal. Your coaching should be too. We bring together thoughtful training, practical guidance, and a community that keeps you moving forward — one session at a time.</p><a className="text-link" href="#membership">Meet your next chapter <ArrowRight size={16} /></a></div>
        <div className="intro-stat"><strong>01</strong><span>Better each day.<br />Stronger over time.</span></div>
      </section>

      <section className="programs" id="programs">
        <div className="section-heading"><div><span className="eyebrow">FIND YOUR FOCUS</span><h2>Train with purpose.</h2></div><p>Choose a path that feels right today. We’ll help you build from there.</p></div>
        <div className="program-grid">{programs.map((program) => <article className="program-card" key={program.name}><span className="program-number">{program.icon}</span><div><h3>{program.name}</h3><p>{program.detail}</p></div><a href="#membership" aria-label={`Learn about ${program.name}`}><ArrowRight size={19} /></a></article>)}</div>
      </section>

      <section className="membership" id="membership"><div className="membership-intro"><span className="eyebrow">YOUR NEXT REP STARTS HERE</span><h2>Memberships<br />that move you.</h2><p>Choose from the plans configured by your gym. Your first step can also be a conversation with our team.</p><a className="button-primary" href="#contact">Ask about a plan <ArrowRight size={18} /></a></div>{publicPlans.length ? <div className="public-plan-grid">{publicPlans.map(plan=>{const discounted=plan.price_paise-Math.floor(plan.price_paise*plan.discount_bps/10000);const total=discounted+Math.floor(discounted*plan.tax_bps/10000);return <article className="public-plan-card" key={plan.id}><span className="eyebrow">{plan.duration_days} DAYS</span><h3>{plan.name}</h3><strong>₹{(total/100).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2})}</strong><p>{plan.description??'Gym access and training support tailored to your goals.'}</p><ul>{plan.benefits.slice(0,4).map(item=><li key={item}>{item}</li>)}</ul><button className="text-link" onClick={()=>{history.pushState({}, '', '/app');setShowPortal(true);}}>Join this plan <ArrowRight size={15}/></button></article>})}</div>:<div className="membership-art"><div className="art-circle"/><span>SHOW UP<br />FOR YOURSELF.</span><MoveUpRight className="art-arrow" size={34} /></div>}</section>

      <section className="locations" id="locations"><span className="eyebrow">A COMMUNITY THAT MOVES WITH YOU</span><h2>Find your place.<br /><span>Find your pace.</span></h2><p>We’re building a welcoming space for every stage of your fitness journey. Get in touch to find the right training option for you.</p>{contactBranches.length>0&&<div className="public-branch-grid">{contactBranches.map(branch=><article className="public-branch-card" key={branch.id}><span className="eyebrow">FITWITHRAM LOCATION</span><h3>{branch.name}</h3><p>{[branch.address,branch.city].filter(Boolean).join(', ')||'Contact us for location details'}</p>{branch.phone&&<a href={`tel:${branch.phone}`}>{branch.phone}</a>}{branch.facilities?.length? <small>{branch.facilities.slice(0,4).join(' · ')}</small>:null}</article>)}</div>}<div className="contact-layout" id="contact"><div><h3>Talk with our team</h3><p>Tell us what you’re looking for. The right branch team can help you choose your next step.</p>{contactMessage&&<div className="payment-success" role="status">{contactMessage}</div>}{contactError&&<div className="portal-error" role="alert">{contactError}</div>}</div><form className="contact-form" onSubmit={submitEnquiry}><div className="contact-form-row"><label>Your name<input name="name" required minLength={2} maxLength={160} autoComplete="name"/></label><label>Email<input name="email" type="email" required autoComplete="email"/></label></div><div className="contact-form-row"><label>Phone (optional)<input name="phone" type="tel" maxLength={30} autoComplete="tel"/></label><label>Branch<select name="branch_id" defaultValue=""><option value="">Any branch</option>{contactBranches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}{branch.city?` · ${branch.city}`:''}</option>)}</select></label></div><label>Subject<input name="subject" required minLength={2} maxLength={160}/></label><label>How can we help?<textarea name="message" required minLength={10} maxLength={5000} rows={4}/></label><button className="button-primary" disabled={contactBusy}>{contactBusy?'Sending…':'Send enquiry'} <ArrowRight size={16}/></button></form></div></section>

      <footer><a className="brand" href="#home"><span className="brand-mark"><Dumbbell size={18} /></span><span>FITWITH<span className="accent">RAM</span></span></a><span className="footer-tag">TRAIN HARD. STAY CONSISTENT. TRANSFORM YOURSELF.</span><span className="copyright">© {new Date().getFullYear()} FITWITHRAM</span></footer>
    </main>
  );
}

export default App;
