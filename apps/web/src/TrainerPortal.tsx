import { useCallback, useEffect, useState } from 'react';
import { Activity, CalendarDays, Dumbbell, LogOut, Users } from 'lucide-react';

type TrainerAuth = { access_token: string; csrf_token: string; user: { id: string; full_name: string; role: string } };
type TrainerMember = { id: string; full_name: string; email: string; branch_id: string; fitness_goals: string[]; current_weight_kg?: number; target_weight_kg?: number; height_cm?: number };
type Summary = { assigned_members: number; upcoming_classes: number; workout_plans: number };
type TrainerClass = { id: string; title: string; starts_at: string; ends_at: string; capacity: number; booked: number; branch_id: string };
type TrainerBranch = { id: string; name: string; city?: string };
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export default function TrainerPortal({ auth, onSignOut }: { auth: TrainerAuth; onSignOut: () => void }) {
  const [members, setMembers] = useState<TrainerMember[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [classes, setClasses] = useState<TrainerClass[]>([]);
  const [branches, setBranches] = useState<TrainerBranch[]>([]);
  const [selected, setSelected] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(3);
  const [repetitions, setRepetitions] = useState('10');
  const [rest, setRest] = useState(60);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'overview' | 'members' | 'workouts' | 'schedule'>('overview');
  const [classBranch, setClassBranch] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [classStart, setClassStart] = useState('');
  const [classEnd, setClassEnd] = useState('');
  const [classCapacity, setClassCapacity] = useState(16);
  const headers = { Authorization: `Bearer ${auth.access_token}` };
  const refresh = useCallback(async () => {
    setError('');
    try {
      const [dashboardResponse, membersResponse, classesResponse, branchesResponse] = await Promise.all([
        fetch(`${API}/trainer/dashboard`, { headers }), fetch(`${API}/trainer/members`, { headers }),
        fetch(`${API}/trainer/classes`, { headers }), fetch(`${API}/trainer/branches`, { headers }),
      ]);
      const dashboardData = await dashboardResponse.json(); const memberData = await membersResponse.json();
      const classData = await classesResponse.json(); const branchData = await branchesResponse.json();
      if (!dashboardResponse.ok) throw new Error(dashboardData.detail ?? 'Could not load trainer workspace');
      if (!membersResponse.ok) throw new Error(memberData.detail ?? 'Could not load assigned members');
      setSummary(dashboardData); setMembers(memberData);
      setClasses(classData); setBranches(branchData);
      if (!classBranch && branchData.length) setClassBranch(branchData[0].id);
      if (!selected && memberData.length) setSelected(memberData[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load trainer workspace'); }
  }, [auth.access_token, selected, classBranch]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function assignWorkout(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${API}/trainer/workout-plans`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_user_id: selected, title, description: description || null, schedule: {}, exercises: [{ name: exerciseName, sets, repetitions, rest_seconds: rest }] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? 'Could not assign this workout');
      setMessage(`Workout “${result.title}” assigned successfully.`); setTitle(''); setDescription(''); setExerciseName('');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not assign workout'); }
    finally { setBusy(false); }
  }

  async function createClass(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${API}/branches/${classBranch}/classes`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer_user_id: auth.user.id, title: classTitle, starts_at: new Date(classStart).toISOString(), ends_at: new Date(classEnd).toISOString(), capacity: classCapacity }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? 'Could not create class');
      setMessage(`Class “${result.title}” scheduled.`); setClassTitle(''); setClassStart(''); setClassEnd(''); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not schedule class'); }
    finally { setBusy(false); }
  }

  const nav = [{ id: 'overview' as const, label: 'Overview', icon: Activity }, { id: 'members' as const, label: 'Assigned members', icon: Users }, { id: 'workouts' as const, label: 'Workout plans', icon: Dumbbell }, { id: 'schedule' as const, label: 'Class schedule', icon: CalendarDays }];
  return <div className="member-app"><aside className="member-sidebar"><a className="brand" href="#home"><span className="brand-mark"><Dumbbell size={18}/></span><span>FITWITH<span className="accent">RAM</span></span></a><span className="sidebar-caption">COACH WORKSPACE</span>{nav.map(item=><button key={item.id} className={tab===item.id?'active':''} onClick={()=>setTab(item.id)}><item.icon size={17}/>{item.label}</button>)}<button className="signout" onClick={onSignOut}><LogOut size={17}/>Sign out</button></aside><main className="member-content"><div className="member-top"><div><span className="eyebrow">TRAINER DASHBOARD</span><h1>{tab==='overview'?`Welcome, ${auth.user.full_name.split(' ')[0]}.`:nav.find(n=>n.id===tab)?.label}</h1></div><button className="admin-refresh" onClick={()=>void refresh()}>Refresh</button></div>{error&&<div className="portal-error">{error}</div>}{message&&<div className="payment-success">{message}</div>}
    {tab==='overview'&&<><div className="member-stats"><article><span>Assigned members</span><strong>{summary?.assigned_members??'—'}</strong><small>Members assigned to your coaching</small></article><article><span>Upcoming sessions</span><strong>{summary?.upcoming_classes??'—'}</strong><small>Classes scheduled with you</small></article><article><span>Workout plans</span><strong>{summary?.workout_plans??'—'}</strong><small>Active plans you created</small></article></div><section className="member-panel"><h2>Assigned members</h2>{members.slice(0,6).map(m=><div className="list-row" key={m.id}><div><strong>{m.full_name}</strong><span>{m.fitness_goals.join(' · ')||'Fitness goals not set'}{m.current_weight_kg?` · ${m.current_weight_kg} kg`:''}</span></div><button className="panel-action" onClick={()=>{setSelected(m.id);setTab('workouts');}}>Assign workout →</button></div>)}{!members.length&&<p className="empty-state">No members have been assigned to you yet.</p>}</section></>}
    {tab==='members'&&<section className="member-panel full-panel"><h2>Your coaching roster</h2>{members.map(m=><article className="trainer-member-card" key={m.id}><div><strong>{m.full_name}</strong><span>{m.email}</span><p>{m.fitness_goals.join(' · ')||'No fitness goals recorded'}</p></div><div className="trainer-measures"><span>Current weight<strong>{m.current_weight_kg?`${m.current_weight_kg} kg`:'—'}</strong></span><span>Target weight<strong>{m.target_weight_kg?`${m.target_weight_kg} kg`:'—'}</strong></span><span>Height<strong>{m.height_cm?`${m.height_cm} cm`:'—'}</strong></span></div><button className="button-primary" onClick={()=>{setSelected(m.id);setTab('workouts');}}>Create workout</button></article>)}{!members.length&&<p className="empty-state">Your assigned members will appear here.</p>}</section>}
    {tab==='workouts'&&<div className="trainer-workout-layout"><section className="member-panel"><h2>Assign a workout plan</h2><p className="empty-state">Only members assigned to your trainer account are available here.</p><form className="trainer-form" onSubmit={assignWorkout}><label>Member<select value={selected} required onChange={e=>setSelected(e.target.value)}><option value="">Select assigned member</option>{members.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label><label>Plan name<input value={title} required minLength={2} onChange={e=>setTitle(e.target.value)} placeholder="Foundation strength · Week 1"/></label><label>Coaching notes<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></label><h3>First exercise</h3><label>Exercise name<input value={exerciseName} required onChange={e=>setExerciseName(e.target.value)} placeholder="Goblet squat"/></label><div className="trainer-form-row"><label>Sets<input type="number" min={1} max={50} value={sets} onChange={e=>setSets(Number(e.target.value))}/></label><label>Repetitions<input value={repetitions} required onChange={e=>setRepetitions(e.target.value)}/></label><label>Rest seconds<input type="number" min={0} max={3600} value={rest} onChange={e=>setRest(Number(e.target.value))}/></label></div><button className="button-primary" disabled={busy||!selected}>{busy?'Saving…':'Assign plan'}</button></form></section><aside className="member-panel"><h2>Assigned members</h2>{members.map(m=><button className={`trainer-select-row ${selected===m.id?'selected':''}`} key={m.id} onClick={()=>setSelected(m.id)}><strong>{m.full_name}</strong><span>{m.fitness_goals.join(' · ')||'Goals not set'}</span></button>)}</aside></div>}
    {tab==='schedule'&&<div className="trainer-workout-layout"><section className="member-panel"><h2>Schedule a class</h2><form className="trainer-form" onSubmit={createClass}><label>Branch<select required value={classBranch} onChange={e=>setClassBranch(e.target.value)}><option value="">Select assigned branch</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}{b.city?` · ${b.city}`:''}</option>)}</select></label><label>Class name<input required minLength={2} value={classTitle} onChange={e=>setClassTitle(e.target.value)} placeholder="Strength circuit"/></label><label>Starts<input type="datetime-local" required value={classStart} onChange={e=>setClassStart(e.target.value)}/></label><label>Ends<input type="datetime-local" required value={classEnd} onChange={e=>setClassEnd(e.target.value)}/></label><label>Maximum attendees<input type="number" min={1} max={500} value={classCapacity} onChange={e=>setClassCapacity(Number(e.target.value))}/></label><button className="button-primary" disabled={busy||!classBranch}>{busy?'Saving…':'Schedule class'}</button></form></section><section className="member-panel"><h2>Upcoming sessions</h2>{classes.map(c=><div className="list-row" key={c.id}><div><strong>{c.title}</strong><span>{new Date(c.starts_at).toLocaleString()} · {c.booked}/{c.capacity} booked</span></div><CalendarDays size={18}/></div>)}{!classes.length&&<p className="empty-state">No upcoming sessions are scheduled.</p>}</section></div>}
  </main></div>;
}
