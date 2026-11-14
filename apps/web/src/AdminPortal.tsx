import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Building2, CalendarDays, Download, Dumbbell, LogOut, Search, Users, Wallet } from 'lucide-react';

type AdminAuth = { access_token: string; csrf_token: string; user: { id: string; full_name: string; role: string; organization_id?: string } };
type Kpis = { total_members: number; active_members: number; inactive_members: number; total_trainers: number; total_branches: number; monthly_revenue_paise: number; annual_revenue_paise: number; pending_payments: number; expiring_memberships: number };
type Branch = { id: string; name: string; city?: string; slug: string; address?: string; phone?: string; is_active: boolean };
type Member = { id: string; full_name: string; email: string; phone?: string; branch_id: string; is_active: boolean; created_at: string; membership_plan_name?: string | null; membership_status?: string | null; membership_expires_at?: string | null };
type Payment = { id: string; member_name: string; member_email: string; amount_paise: number; status: string; provider_payment_id?: string; created_at: string; paid_at?: string };
type Trainer = { id: string; full_name: string; email: string; branch_id: string; specializations: string[]; years_experience: number };
type Organization = { id: string; name: string; slug: string };
type MembershipPlan = { id: string; organization_id: string; branch_id?: string; name: string; code: string; description?: string; price_paise: number; duration_days: number; discount_bps: number; tax_bps: number; benefits: string[]; is_active: boolean };
type AdminClass = { id: string; branch_id: string; title: string; starts_at: string; ends_at: string; capacity: number; booked: number; trainer_user_id?: string };
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export default function AdminPortal({ auth, onSignOut }: { auth: AdminAuth; onSignOut: () => void }) {
  const [tab, setTab] = useState('overview');
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [fitnessClasses, setFitnessClasses] = useState<AdminClass[]>([]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [message, setMessage] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('');
  const [trainerSpecialization, setTrainerSpecialization] = useState('');
  const [assignTrainerId, setAssignTrainerId] = useState('');
  const [assignMemberId, setAssignMemberId] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchSlug, setBranchSlug] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCode, setNewPlanCode] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('30');
  const [newPlanBenefits, setNewPlanBenefits] = useState('');
  const [editingPlanId, setEditingPlanId] = useState('');
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState('');
  const [editPlanDuration, setEditPlanDuration] = useState('');
  const [editPlanBenefits, setEditPlanBenefits] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [classTrainerId, setClassTrainerId] = useState('');
  const [classStartsAt, setClassStartsAt] = useState('');
  const [classEndsAt, setClassEndsAt] = useState('');
  const [classCapacity, setClassCapacity] = useState('16');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${auth.access_token}` };

  const getJson = useCallback(async (path: string) => {
    const response = await fetch(`${API}${path}`, { headers });
    const body = await response.json();
    if (!response.ok) throw new Error(body.detail ?? 'Unable to load management data');
    return body;
  }, [auth.access_token]);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dashboard, branchRows, memberResult, paymentResult, trainerRows] = await Promise.all([
        getJson('/admin/dashboard'), getJson('/admin/branches'),
        getJson(`/admin/members?page=1&page_size=50${branchId ? `&branch_id=${branchId}` : ''}${search ? `&q=${encodeURIComponent(search)}` : ''}`),
        getJson(`/admin/payments?page=1&page_size=50${branchId ? `&branch_id=${branchId}` : ''}${paymentStatus ? `&status=${paymentStatus}` : ''}`),
        getJson(`/admin/trainers${branchId ? `?branch_id=${branchId}` : ''}`),
      ]);
      setKpis(dashboard); setBranches(branchRows); setMembers(memberResult.items ?? []); setPayments(paymentResult.items ?? []); setTrainers(trainerRows);
      const classResults = await Promise.all(
        (branchRows as Branch[]).map(branch => getJson(`/branches/${branch.id}/classes`)),
      );
      setFitnessClasses(classResults.flat());
      let organizationRows: Organization[] = [];
      if (auth.user.role === 'SUPER_ADMIN') {
        organizationRows = await getJson('/admin/organizations'); setOrganizations(organizationRows);
        if (!selectedOrganizationId && organizationRows.length) setSelectedOrganizationId(organizationRows[0].id);
      }
      const organizationFilter = selectedOrganizationId || organizationRows[0]?.id;
      if (auth.user.role !== 'SUPER_ADMIN' || organizationFilter) {
        const plansQuery = auth.user.role === 'SUPER_ADMIN' ? `?organization_id=${organizationFilter}` : '';
        setMembershipPlans(await getJson(`/admin/membership-plans${plansQuery}`));
      } else setMembershipPlans([]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load dashboard'); }
    finally { setLoading(false); }
  }, [getJson, branchId, search, paymentStatus, selectedOrganizationId, auth.user.role]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function deactivate(member: Member) {
    if (!window.confirm(`Deactivate ${member.full_name}'s account?`)) return;
    const response = await fetch(`${API}/admin/members/${member.id}/deactivate`, { method: 'POST', headers });
    if (!response.ok) { setError('Could not deactivate this member'); return; }
    await refresh();
  }

  async function editMember(member: Member) {
    const fullName = window.prompt('Member full name', member.full_name);
    if (fullName === null || !fullName.trim()) return;
    const phone = window.prompt('Phone number', member.phone ?? '');
    if (phone === null) return;
    const response = await fetch(`${API}/admin/members/${member.id}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() || null }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not update member'); return; }
    setMessage(`Member ${result.full_name} updated.`); await refresh();
  }

  async function createTrainer(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    if (!branchId) { setError('Select a branch before adding a trainer'); return; }
    const response = await fetch(`${API}/admin/branches/${branchId}/staff`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: trainerName, email: trainerEmail, password: trainerPassword, role: 'TRAINER', specializations: trainerSpecialization.split(',').map(x=>x.trim()).filter(Boolean) }),
    });
    const result = await response.json();
    if (!response.ok) { setError(result.detail ?? 'Could not add trainer'); return; }
    setMessage(`Trainer ${result.full_name} added.`); setTrainerName(''); setTrainerEmail(''); setTrainerPassword(''); setTrainerSpecialization(''); await refresh();
  }

  async function assignMember() {
    setError('');
    const response = await fetch(`${API}/admin/trainer-assignments`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ trainer_user_id: assignTrainerId, member_user_id: assignMemberId }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail ?? 'Could not assign this member'); return; }
    setMessage('Member assigned to trainer.'); setAssignMemberId('');
  }

  async function createOrganization(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const response = await fetch(`${API}/admin/organizations`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: organizationName, slug: organizationSlug }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not create organization'); return; }
    setOrganizationName(''); setOrganizationSlug(''); setSelectedOrganizationId(result.id); setMessage(`Organization ${result.name} created with starter plans.`); await refresh();
  }

  async function createGymOwner(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!selectedOrganizationId) { setError('Select an organization first'); return; }
    const response = await fetch(`${API}/admin/organizations/${selectedOrganizationId}/owners`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: ownerName, email: ownerEmail, password: ownerPassword }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not create gym owner'); return; }
    setOwnerName(''); setOwnerEmail(''); setOwnerPassword(''); setMessage(`Gym owner ${result.full_name} created.`);
  }

  async function createBranch(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const body: Record<string, string> = { name: branchName, slug: branchSlug };
    if (auth.user.role === 'SUPER_ADMIN') body.organization_id = selectedOrganizationId;
    const response = await fetch(`${API}/admin/branches`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not create branch'); return; }
    setBranchName(''); setBranchSlug(''); setBranchId(result.id); setMessage(`Branch ${result.name} created.`); await refresh();
  }

  async function createBranchManager(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!branchId) { setError('Choose a branch before adding a manager'); return; }
    const response = await fetch(`${API}/admin/branches/${branchId}/staff`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: managerName, email: managerEmail, password: managerPassword, role: 'BRANCH_MANAGER' }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not assign branch manager'); return; }
    setManagerName(''); setManagerEmail(''); setManagerPassword(''); setMessage(`Branch manager ${result.full_name} created and assigned.`);
  }

  async function editBranch(branch: Branch) {
    const name = window.prompt('Branch name', branch.name);
    if (name === null || !name.trim()) return;
    const city = window.prompt('City', branch.city??'');
    if (city === null) return;
    const address = window.prompt('Address', branch.address??'');
    if (address === null) return;
    const response = await fetch(`${API}/admin/branches/${branch.id}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), city: city.trim()||null, address: address.trim()||null }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not update branch'); return; }
    setMessage(`Branch ${result.name} updated.`); await refresh();
  }

  async function deactivateBranch(branch: Branch) {
    if (!window.confirm(`Deactivate ${branch.name}? Existing records are retained.`)) return;
    const response = await fetch(`${API}/admin/branches/${branch.id}/deactivate`, { method: 'POST', headers });
    if (!response.ok) { setError('Could not deactivate branch'); return; }
    await refresh();
  }

  async function createMember(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!branchId) { setError('Choose a branch before adding a member'); return; }
    const response = await fetch(`${API}/admin/members`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ branch_id: branchId, full_name: newMemberName, email: newMemberEmail, password: newMemberPassword }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not create member'); return; }
    setNewMemberName(''); setNewMemberEmail(''); setNewMemberPassword(''); setMessage(`Member ${result.full_name} added.`); await refresh();
  }

  async function createPlan(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const body: Record<string, unknown> = { name: newPlanName, code: newPlanCode, price_paise: Math.round(Number(newPlanPrice)*100), duration_days: Number(newPlanDuration), benefits: newPlanBenefits.split(',').map(x=>x.trim()).filter(Boolean) };
    if (auth.user.role === 'SUPER_ADMIN') body.organization_id = selectedOrganizationId;
    if (branchId) body.branch_id = branchId;
    const response = await fetch(`${API}/admin/membership-plans`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not create membership plan'); return; }
    setNewPlanName(''); setNewPlanCode(''); setNewPlanPrice(''); setNewPlanBenefits(''); setMessage(`Plan ${result.name} created.`); await refresh();
  }

  async function createFitnessClass(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!branchId || !classTrainerId) { setError('Choose a branch and trainer'); return; }
    const response = await fetch(`${API}/branches/${branchId}/classes`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainer_user_id: classTrainerId, title: classTitle, starts_at: new Date(classStartsAt).toISOString(), ends_at: new Date(classEndsAt).toISOString(), capacity: Number(classCapacity) }),
    });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not create class'); return; }
    setClassTitle(''); setClassStartsAt(''); setClassEndsAt(''); setMessage(`Class ${result.title} scheduled.`); await refresh();
  }

  async function togglePlan(plan: MembershipPlan) {
    const response = await fetch(`${API}/admin/membership-plans/${plan.id}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !plan.is_active }) });
    if (!response.ok) { setError('Could not update membership plan'); return; }
    await refresh();
  }

  async function savePlan(plan: MembershipPlan) {
    const response = await fetch(`${API}/admin/membership-plans/${plan.id}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editPlanName, price_paise: Math.round(Number(editPlanPrice)*100), duration_days: Number(editPlanDuration), benefits: editPlanBenefits.split(',').map(x=>x.trim()).filter(Boolean) }) });
    const result = await response.json();
    if (!response.ok) { setError(result.detail??'Could not update membership plan'); return; }
    setEditingPlanId(''); setMessage(`Plan ${result.name} updated.`); await refresh();
  }

  function beginPlanEdit(plan: MembershipPlan) {
    setEditingPlanId(plan.id); setEditPlanName(plan.name); setEditPlanPrice((plan.price_paise/100).toFixed(2)); setEditPlanDuration(String(plan.duration_days)); setEditPlanBenefits(plan.benefits.join(', '));
  }

  async function exportCsv() {
    const params = new URLSearchParams();
    if (branchId) params.set('branch_id', branchId);
    if (paymentStatus) params.set('status', paymentStatus);
    const response = await fetch(`${API}/admin/payments.csv?${params}`, { headers });
    if (!response.ok) { setError('Could not export transactions'); return; }
    const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'fitwithram-payments.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  const nav = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'payments', label: 'Transactions', icon: Wallet },
    { id: 'trainers', label: 'Trainers', icon: Dumbbell },
    { id: 'classes', label: 'Classes', icon: CalendarDays },
    { id: 'plans', label: 'Membership plans', icon: Wallet },
    { id: 'branches', label: 'Branches', icon: Building2 },
  ];
  if (auth.user.role === 'SUPER_ADMIN') nav.unshift({ id: 'organizations', label: 'Organizations', icon: Building2 });
  const money = (paise?: number) => `₹${((paise ?? 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return <div className="member-app"><aside className="member-sidebar"><a className="brand" href="#home"><span className="brand-mark"><Dumbbell size={18}/></span><span>FITWITH<span className="accent">RAM</span></span></a><span className="sidebar-caption">MANAGEMENT</span>{nav.map(item=><button key={item.id} className={tab===item.id?'active':''} onClick={()=>setTab(item.id)}><item.icon size={17}/>{item.label}</button>)}<button className="signout" onClick={onSignOut}><LogOut size={17}/>Sign out</button></aside><main className="member-content"><div className="member-top"><div><span className="eyebrow">{auth.user.role.replace('_',' ')}</span><h1>{tab==='overview'?`Welcome, ${auth.user.full_name.split(' ')[0]}.`:nav.find(n=>n.id===tab)?.label}</h1></div><button className="admin-refresh" onClick={()=>void refresh()}>Refresh data</button></div>{error&&<div className="portal-error">{error}</div>}{message&&<div className="payment-success">{message}</div>}{loading&&!kpis?<p className="empty-state">Loading live management data…</p>:null}
    {tab==='organizations'&&auth.user.role==='SUPER_ADMIN'&&<section className="member-panel full-panel"><h2>Gym organizations</h2><div className="admin-filters"><select value={selectedOrganizationId} onChange={e=>setSelectedOrganizationId(e.target.value)}><option value="">Choose organization</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name} · {o.slug}</option>)}</select></div><form className="inline-admin-form" onSubmit={createOrganization}><label>Organization name<input required minLength={2} value={organizationName} onChange={e=>setOrganizationName(e.target.value)}/></label><label>Organization slug<input required minLength={2} value={organizationSlug} onChange={e=>setOrganizationSlug(e.target.value)} placeholder="northside-fitness"/></label><button className="button-primary">Create organization</button></form><div className="organization-list">{organizations.map(o=><button className={`organization-card ${selectedOrganizationId===o.id?'selected':''}`} key={o.id} onClick={()=>setSelectedOrganizationId(o.id)}><strong>{o.name}</strong><span>{o.slug}</span></button>)}</div><h2 className="subheading">Create gym owner</h2><form className="inline-admin-form" onSubmit={createGymOwner}><label>Owner name<input required value={ownerName} onChange={e=>setOwnerName(e.target.value)}/></label><label>Owner email<input type="email" required value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)}/></label><label>Temporary password<input type="password" minLength={12} required value={ownerPassword} onChange={e=>setOwnerPassword(e.target.value)}/></label><button className="button-primary" disabled={!selectedOrganizationId}>Create owner account</button></form></section>}
    {tab==='overview'&&kpis&&<><div className="member-stats admin-kpis"><article><span>Total members</span><strong>{kpis.total_members}</strong><small>{kpis.active_members} with active memberships</small></article><article><span>Monthly revenue</span><strong>{money(kpis.monthly_revenue_paise)}</strong><small>Current calendar month</small></article><article><span>Annual revenue</span><strong>{money(kpis.annual_revenue_paise)}</strong><small>Current calendar year</small></article><article><span>Trainers</span><strong>{kpis.total_trainers}</strong><small>Across authorized branches</small></article><article><span>Branches</span><strong>{kpis.total_branches}</strong><small>Active locations</small></article><article><span>Pending payments</span><strong>{kpis.pending_payments}</strong><small>{kpis.expiring_memberships} memberships expire in 30 days</small></article></div><div className="member-columns"><section className="member-panel"><h2>Recent transactions</h2>{payments.slice(0,6).map(p=><div className="list-row" key={p.id}><div><strong>{p.member_name} · {money(p.amount_paise)}</strong><span>{new Date(p.created_at).toLocaleString()}</span></div><span className={`status-pill status-${p.status.toLowerCase()}`}>{p.status}</span></div>)}{!payments.length&&<p className="empty-state">No transactions are recorded yet.</p>}<button className="panel-action" onClick={()=>setTab('payments')}>Review all transactions →</button></section><section className="member-panel"><h2>Branch performance</h2>{branches.map(b=><div className="list-row" key={b.id}><div><strong>{b.name}</strong><span>{b.city??b.slug}</span></div><span className="status-pill">ACTIVE</span></div>)}{!branches.length&&<p className="empty-state">No active branches found.</p>}</section></div></>}
    {tab==='members'&&<section className="member-panel full-panel"><div className="panel-title"><h2>Member directory</h2><form className="admin-search" onSubmit={e=>{e.preventDefault();setSearch(query.trim());}}><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or email"/><button>Search</button></form></div><form className="inline-admin-form" onSubmit={createMember}><label>Branch<select required value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">Choose branch</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label>Member name<input required value={newMemberName} onChange={e=>setNewMemberName(e.target.value)}/></label><label>Email<input type="email" required value={newMemberEmail} onChange={e=>setNewMemberEmail(e.target.value)}/></label><label>Temporary password<input type="password" minLength={12} required value={newMemberPassword} onChange={e=>setNewMemberPassword(e.target.value)}/></label><button className="button-primary">Add member</button></form><div className="admin-filters"><select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">All authorized branches</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Member</th><th>Phone</th><th>Branch</th><th>Selected plan</th><th>Joined</th><th>Status</th><th></th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td><strong>{m.full_name}</strong><small>{m.email}</small></td><td>{m.phone||'—'}</td><td>{branches.find(b=>b.id===m.branch_id)?.name??'—'}</td><td>{m.membership_plan_name ? <><strong>{m.membership_plan_name}</strong><small>{m.membership_status}{m.membership_expires_at ? ` · until ${new Date(m.membership_expires_at).toLocaleDateString()}` : ''}</small></> : 'No plan selected'}</td><td>{new Date(m.created_at).toLocaleDateString()}</td><td>{m.is_active?'Active':'Inactive'}</td><td><button className="table-action" onClick={()=>void editMember(m)}>Edit</button>{m.is_active&&<button className="table-action" onClick={()=>void deactivate(m)}>Deactivate</button>}</td></tr>)}</tbody></table></div>{!members.length&&<p className="empty-state">No members match this search.</p>}</section>}
    {tab==='payments'&&<section className="member-panel full-panel"><div className="panel-title"><h2>Transactions</h2><button className="export-button" onClick={()=>void exportCsv()}><Download size={15}/> Export CSV</button></div><div className="admin-filters"><select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">All authorized branches</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><select value={paymentStatus} onChange={e=>setPaymentStatus(e.target.value)}><option value="">All statuses</option>{['PAID','PENDING','CREATED','FAILED','REFUNDED'].map(s=><option key={s}>{s}</option>)}</select></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Member</th><th>Amount</th><th>Status</th><th>Payment reference</th><th>Created</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td><strong>{p.member_name}</strong><small>{p.member_email}</small></td><td>{money(p.amount_paise)}</td><td><span className={`status-pill status-${p.status.toLowerCase()}`}>{p.status}</span></td><td>{p.provider_payment_id||'—'}</td><td>{new Date(p.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>{!payments.length&&<p className="empty-state">No transactions found.</p>}</section>}
    {tab==='trainers'&&<div className="member-columns"><section className="member-panel"><h2>Add a trainer</h2><div className="admin-filters"><select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">Choose branch</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><form className="trainer-form" onSubmit={createTrainer}><label>Full name<input required value={trainerName} onChange={e=>setTrainerName(e.target.value)}/></label><label>Email<input type="email" required value={trainerEmail} onChange={e=>setTrainerEmail(e.target.value)}/></label><label>Temporary password<input type="password" required minLength={12} value={trainerPassword} onChange={e=>setTrainerPassword(e.target.value)}/></label><label>Specializations, comma separated<input value={trainerSpecialization} onChange={e=>setTrainerSpecialization(e.target.value)} placeholder="Strength, mobility"/></label><button className="button-primary">Create trainer account</button></form><h2 className="subheading">Current trainers</h2>{trainers.map(t=><div className="list-row" key={t.id}><div><strong>{t.full_name}</strong><span>{t.email} · {t.specializations.join(', ')||'General coaching'}</span></div><span className="status-pill">{branches.find(b=>b.id===t.branch_id)?.name??'BRANCH'}</span></div>)}</section><section className="member-panel"><h2>Assign a member</h2><p className="empty-state">Assignment is limited to a trainer and member in the selected branch.</p><div className="trainer-form"><label>Trainer<select value={assignTrainerId} onChange={e=>setAssignTrainerId(e.target.value)}><option value="">Select trainer</option>{trainers.map(t=><option value={t.id} key={t.id}>{t.full_name}</option>)}</select></label><label>Member<select value={assignMemberId} onChange={e=>setAssignMemberId(e.target.value)}><option value="">Select member</option>{members.filter(m=>{const trainer=trainers.find(t=>t.id===assignTrainerId);return trainer&&m.branch_id===trainer.branch_id&&(!branchId||m.branch_id===branchId);}).map(m=><option value={m.id} key={m.id}>{m.full_name} · {m.email}</option>)}</select></label><button className="button-primary" disabled={!assignTrainerId||!assignMemberId} onClick={()=>void assignMember()}>Assign trainer</button></div></section></div>}
    {tab==='classes'&&<div className="member-columns"><section className="member-panel"><h2>Schedule a branch class</h2><form className="trainer-form" onSubmit={createFitnessClass}><label>Branch<select required value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">Select branch</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label>Trainer<select required value={classTrainerId} onChange={e=>setClassTrainerId(e.target.value)}><option value="">Select branch trainer</option>{trainers.filter(t=>t.branch_id===branchId).map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label><label>Class title<input required minLength={2} value={classTitle} onChange={e=>setClassTitle(e.target.value)}/></label><div className="trainer-form-row"><label>Starts<input type="datetime-local" required value={classStartsAt} onChange={e=>setClassStartsAt(e.target.value)}/></label><label>Ends<input type="datetime-local" required value={classEndsAt} onChange={e=>setClassEndsAt(e.target.value)}/></label></div><label>Capacity<input type="number" min={1} max={500} required value={classCapacity} onChange={e=>setClassCapacity(e.target.value)}/></label><button className="button-primary" disabled={!branchId||!classTrainerId}>Create class</button></form></section><section className="member-panel"><h2>Upcoming classes</h2>{fitnessClasses.filter(c=>!branchId||c.branch_id===branchId).map(c=><div className="list-row" key={c.id}><div><strong>{c.title}</strong><span>{new Date(c.starts_at).toLocaleString()} · {c.booked}/{c.capacity} bookings</span></div><CalendarDays size={18}/></div>)}{!fitnessClasses.length&&<p className="empty-state">No future classes scheduled.</p>}</section></div>}
    {tab==='plans'&&<div className="member-columns"><section className="member-panel"><h2>Create membership plan</h2>{auth.user.role==='SUPER_ADMIN'&&<label className="standalone-label">Organization<select value={selectedOrganizationId} onChange={e=>setSelectedOrganizationId(e.target.value)}><option value="">Select organization</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}<form className="trainer-form" onSubmit={createPlan}><label>Plan name<input required value={newPlanName} onChange={e=>setNewPlanName(e.target.value)} placeholder="Annual access"/></label><label>Code<input required value={newPlanCode} onChange={e=>setNewPlanCode(e.target.value)} placeholder="ANNUAL"/></label><div className="trainer-form-row"><label>Price INR<input type="number" min="1" step="0.01" required value={newPlanPrice} onChange={e=>setNewPlanPrice(e.target.value)}/></label><label>Duration days<input type="number" min="1" required value={newPlanDuration} onChange={e=>setNewPlanDuration(e.target.value)}/></label></div><label>Benefits, comma separated<input value={newPlanBenefits} onChange={e=>setNewPlanBenefits(e.target.value)}/></label><label>Branch scope<select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">All organization branches</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><button className="button-primary" disabled={auth.user.role==='SUPER_ADMIN'&&!selectedOrganizationId}>Create plan</button></form></section><section className="member-panel"><h2>Configured plans</h2>{membershipPlans.map(p=><article className="admin-plan-row" key={p.id}>{editingPlanId===p.id?<div className="plan-edit-form"><label>Name<input value={editPlanName} onChange={e=>setEditPlanName(e.target.value)}/></label><div className="trainer-form-row"><label>Price INR<input type="number" step="0.01" value={editPlanPrice} onChange={e=>setEditPlanPrice(e.target.value)}/></label><label>Duration<input type="number" min="1" value={editPlanDuration} onChange={e=>setEditPlanDuration(e.target.value)}/></label></div><label>Benefits<input value={editPlanBenefits} onChange={e=>setEditPlanBenefits(e.target.value)}/></label><div><button className="table-action" onClick={()=>void savePlan(p)}>Save</button><button className="table-action" onClick={()=>setEditingPlanId('')}>Cancel</button></div></div>:<><div><strong>{p.name}</strong><span>{p.code} · {p.duration_days} days · {money(p.price_paise)}</span><small>{p.benefits.join(' · ')}</small></div><div className="plan-action-group"><button className="table-action" onClick={()=>beginPlanEdit(p)}>Edit</button><button className="table-action" onClick={()=>void togglePlan(p)}>{p.is_active?'Deactivate':'Activate'}</button></div></>}</article>)}{!membershipPlans.length&&<p className="empty-state">Select an organization to view membership plans.</p>}</section></div>}
    {tab==='branches'&&<div className="member-columns"><section className="member-panel"><h2>Branch directory</h2>{auth.user.role==='SUPER_ADMIN'&&<label className="standalone-label">Organization<select value={selectedOrganizationId} onChange={e=>setSelectedOrganizationId(e.target.value)}><option value="">Select organization</option>{organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}{['SUPER_ADMIN','GYM_OWNER'].includes(auth.user.role)&&<form className="trainer-form" onSubmit={createBranch}><label>Branch name<input required value={branchName} onChange={e=>setBranchName(e.target.value)}/></label><label>Branch slug<input required value={branchSlug} onChange={e=>setBranchSlug(e.target.value)} placeholder="central"/></label><button className="button-primary">Create branch</button></form>}<div className="admin-filters"><select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">Select branch for manager assignment</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><form className="trainer-form" onSubmit={createBranchManager}><h2>Assign branch manager</h2><label>Manager name<input required value={managerName} onChange={e=>setManagerName(e.target.value)}/></label><label>Email<input type="email" required value={managerEmail} onChange={e=>setManagerEmail(e.target.value)}/></label><label>Temporary password<input type="password" required minLength={12} value={managerPassword} onChange={e=>setManagerPassword(e.target.value)}/></label><button className="button-primary" disabled={!branchId}>Create manager login</button></form></section><section className="member-panel"><h2>Active branches</h2>{branches.map(b=><div className="list-row" key={b.id}><div><strong>{b.name}</strong><span>{b.city??b.slug}</span></div><div className="plan-action-group"><span className="status-pill">{b.is_active?'ACTIVE':'INACTIVE'}</span><button className="table-action" onClick={()=>void editBranch(b)}>Edit</button>{b.is_active&&['SUPER_ADMIN','GYM_OWNER'].includes(auth.user.role)&&<button className="table-action" onClick={()=>void deactivateBranch(b)}>Deactivate</button>}</div></div>)}</section></div>}
  </main></div>;
}
