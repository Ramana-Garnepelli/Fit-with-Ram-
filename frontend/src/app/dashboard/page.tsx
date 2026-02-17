'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Dumbbell, Salad, CheckCircle, Calendar, TrendingUp, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import DailyPlanViewer from '../../components/DailyPlanViewer';
import WorkoutTracker from '../../components/WorkoutTracker';
import DietTracker from '../../components/DietTracker';
import ProgressLogger from '../../components/ProgressLogger';
import WeeklyCalendar from '../../components/WeeklyCalendar';
import { API_URL } from '../../lib/api';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [hasActivePlan, setHasActivePlan] = useState(false);
    const router = useRouter();

    const [workoutStats, setWorkoutStats] = useState({
        totalDays: 0,
        targetDays: 30, // Default target
        currentStreak: 0,
        completedWorkouts: 0,
    });

    const [vitals, setVitals] = useState({ height: '', weight: '' });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const userData = JSON.parse(userStr);
        setUser(userData);
        setVitals({
            height: userData.height || '',
            weight: userData.weightLog?.[userData.weightLog.length - 1]?.weight || ''
        });

        if (userData.loginDays && Array.isArray(userData.loginDays)) {
            const loginDays = userData.loginDays;
            const total = loginDays.length;

            // Simple streak calculation
            let streak = 0;
            const sortedDays = [...loginDays].sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            if (sortedDays[0] === today || sortedDays[0] === yesterday) {
                streak = 1;
                for (let i = 0; i < sortedDays.length - 1; i++) {
                    const d1 = new Date(sortedDays[i]);
                    const d2 = new Date(sortedDays[i + 1]);
                    const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
                    if (diff === 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }

            setWorkoutStats(prev => ({
                ...prev,
                totalDays: total,
                currentStreak: streak,
                completedWorkouts: Math.min(total, prev.targetDays)
            }));
        }

        const mockHasPlan = localStorage.getItem('hasPlan') === 'true' || userData.activePlanType !== null;
        setHasActivePlan(mockHasPlan);
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(vitals),
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
                alert('Profile updated successfully!');
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (err) {
            alert('Failed to connect to server');
        } finally {
            setUpdating(false);
        }
    };

    const pieData = [
        { name: 'Completed', value: workoutStats.completedWorkouts },
        { name: 'Remaining', value: Math.max(0, workoutStats.targetDays - workoutStats.completedWorkouts) },
    ];

    const weeklyProgress = [
        { day: 'Mon', workouts: 1 },
        { day: 'Tue', workouts: 1 },
        { day: 'Wed', workouts: 0 },
        { day: 'Thu', workouts: 1 },
        { day: 'Fri', workouts: 1 },
        { day: 'Sat', workouts: 0 },
        { day: 'Sun', workouts: 1 },
    ];

    if (!user) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    // Dashboard WITH Active Plan
    if (hasActivePlan) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
                <Navbar />
                <div className="pt-24 px-4 max-w-7xl mx-auto pb-10">

                    {/* Welcome Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-black mb-2 text-gray-900">Welcome back, <span className="text-blue-600">{user.name}</span>!</h1>
                        <p className="text-gray-500">Track your progress and crush your goals 💪</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid md:grid-cols-4 gap-6 mb-10">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Calendar className="text-blue-500" />
                                <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-bold">Active</span>
                            </div>
                            <p className="text-3xl font-black text-gray-900">{workoutStats.totalDays}</p>
                            <p className="text-gray-500 text-sm">Days Worked Out</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="text-orange-500" />
                            </div>
                            <p className="text-3xl font-black text-gray-900">{workoutStats.currentStreak}</p>
                            <p className="text-gray-500 text-sm">Day Streak 🔥</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <Target className="text-purple-500" />
                            </div>
                            <p className="text-3xl font-black text-gray-900">{workoutStats.completedWorkouts}/{workoutStats.targetDays}</p>
                            <p className="text-gray-500 text-sm">Workouts Completed</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="text-green-500" />
                            </div>
                            <p className="text-3xl font-black text-gray-900">{localStorage.getItem('activePlan') || 'Custom Plan'}</p>
                            <p className="text-gray-500 text-sm">Active Plan</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        {/* Progress Pie Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold mb-4 text-gray-900">Monthly Progress</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#2563eb', '#e5e7eb'][index % 2]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                    <span className="text-sm text-gray-500">Completed ({workoutStats.completedWorkouts})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                    <span className="text-sm text-gray-500">Remaining</span>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Activity Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold mb-4 text-gray-900">This Week</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyProgress}>
                                        <defs>
                                            <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        <Area type="monotone" dataKey="workouts" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorWorkouts)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Main Tracker Grid */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-10">
                        {/* Center/Left: Workout */}
                        <div className="lg:col-span-2 space-y-8">
                            <WeeklyCalendar />
                            <WorkoutTracker />
                        </div>

                        {/* Right Sidebar: Diet & Progress */}
                        <div className="space-y-8">
                            <DietTracker />
                            <ProgressLogger />
                        </div>
                    </div>

                    {/* Original Daily Content (Legacy support or additional tips) */}
                    <div className="hidden">
                        <DailyPlanViewer user={user} />
                    </div>

                    {/* Client Data Form */}
                    <div className="mt-10 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                        <h3 className="text-2xl font-black mb-4">My Vitality Data</h3>
                        <p className="text-gray-500 mb-6">Keep your stats updated so Coach Ram can personalize your plan.</p>
                        <form onSubmit={handleUpdateProfile} className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Height (cm)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 175"
                                    value={vitals.height}
                                    onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Current Weight (kg)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 70"
                                    value={vitals.weight}
                                    onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                                >
                                    {updating ? 'Updating...' : 'Update My Data'}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        );
    }

    // Dashboard WITHOUT Active Plan (Default View)
    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
            <Navbar />
            <div className="pt-24 px-4 max-w-6xl mx-auto">

                {/* Welcome Header */}
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-black mb-2 text-gray-900">Welcome back, <span className="text-blue-600">{user.name}</span>!</h1>
                    <p className="text-xl text-gray-500">Your personalized fitness journey starts here.</p>
                </div>

                {/* Status Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Active Plan</h3>
                            <CheckCircle className="text-gray-300" />
                        </div>
                        <p className="text-2xl font-black text-gray-400">No Active Plan</p>
                        <a href="/pricing" className="text-sm text-blue-600 hover:text-blue-800 font-bold mt-4 inline-flex items-center gap-1">
                            Browse Plans →
                        </a>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Workout Plan</h3>
                            <Dumbbell className="text-blue-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-600">Purchase a plan to unlock your customized routine.</p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Diet Plan</h3>
                            <Salad className="text-green-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-600">Get a scientifically crafted nutrition chart.</p>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-black text-white p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20" />
                    <h2 className="text-3xl font-black mb-4 relative z-10">Ready to Transform?</h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto relative z-10">Select a training program tailored to your goals and start your journey today.</p>
                    <a
                        href="/pricing"
                        className="inline-block bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 relative z-10"
                    >
                        View Pricing Plans
                    </a>
                </div>


                {/* My Progress Gallery */}
                <div className="mt-20 mb-20">
                    <h3 className="text-3xl font-black mb-8 text-gray-900 border-l-4 border-black pl-4">My Progress</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-gray-100">
                                <img
                                    src={`/uploads/RAMANAGYMPIC-${num}.jpg`}
                                    alt={`Progress Pic ${num}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        // Fallback if image fails
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop';
                                        (e.target as HTMLImageElement).parentElement?.classList.add('opacity-50');
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <p className="text-white font-bold text-lg">Phase {num}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
