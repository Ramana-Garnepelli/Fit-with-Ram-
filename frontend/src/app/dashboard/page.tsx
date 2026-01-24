'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Dumbbell, Salad, CheckCircle, Calendar, TrendingUp, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [hasActivePlan, setHasActivePlan] = useState(false);
    const router = useRouter();

    // Mock data for demonstration - in real app, this comes from API
    const [workoutStats, setWorkoutStats] = useState({
        totalDays: 15,
        targetDays: 30,
        currentStreak: 5,
        completedWorkouts: 12,
    });

    const [weeklyProgress, setWeeklyProgress] = useState([
        { day: 'Mon', workouts: 1 },
        { day: 'Tue', workouts: 1 },
        { day: 'Wed', workouts: 0 },
        { day: 'Thu', workouts: 1 },
        { day: 'Fri', workouts: 1 },
        { day: 'Sat', workouts: 0 },
        { day: 'Sun', workouts: 1 },
    ]);

    const pieData = [
        { name: 'Completed', value: workoutStats.completedWorkouts },
        { name: 'Remaining', value: workoutStats.targetDays - workoutStats.completedWorkouts },
    ];
    const COLORS = ['#00f2ea', '#333'];

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const userData = JSON.parse(userStr);
        setUser(userData);

        // Check if user has an active plan (mock check - in real app, fetch from API)
        // For demo, we'll simulate having a plan after payment
        const mockHasPlan = localStorage.getItem('hasPlan') === 'true';
        setHasActivePlan(mockHasPlan);
    }, [router]);

    if (!user) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }

    // Dashboard WITH Active Plan
    if (hasActivePlan) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <div className="pt-24 px-4 max-w-7xl mx-auto pb-10">

                    {/* Welcome Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Welcome back, <span className="text-[#00f2ea]">{user.name}</span>!</h1>
                        <p className="text-gray-400">Track your progress and crush your goals 💪</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid md:grid-cols-4 gap-6 mb-10">
                        <div className="bg-gradient-to-br from-[#00f2ea]/20 to-[#00f2ea]/5 p-6 rounded-xl border border-[#00f2ea]/30">
                            <div className="flex items-center justify-between mb-2">
                                <Calendar className="text-[#00f2ea]" />
                                <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">Active</span>
                            </div>
                            <p className="text-3xl font-bold">{workoutStats.totalDays}</p>
                            <p className="text-gray-400 text-sm">Days Worked Out</p>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="text-[#ff0050]" />
                            </div>
                            <p className="text-3xl font-bold">{workoutStats.currentStreak}</p>
                            <p className="text-gray-400 text-sm">Day Streak 🔥</p>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <Target className="text-purple-500" />
                            </div>
                            <p className="text-3xl font-bold">{workoutStats.completedWorkouts}/{workoutStats.targetDays}</p>
                            <p className="text-gray-400 text-sm">Workouts Completed</p>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="text-green-500" />
                            </div>
                            <p className="text-3xl font-bold">{localStorage.getItem('activePlan') || 'Custom Plan'}</p>
                            <p className="text-gray-400 text-sm">Active Plan</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        {/* Progress Pie Chart */}
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h3 className="text-xl font-bold mb-4">Monthly Progress</h3>
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
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#00f2ea]"></div>
                                    <span className="text-sm text-gray-400">Completed ({workoutStats.completedWorkouts})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                                    <span className="text-sm text-gray-400">Remaining</span>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Activity Chart */}
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h3 className="text-xl font-bold mb-4">This Week</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyProgress}>
                                        <defs>
                                            <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00f2ea" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#00f2ea" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" stroke="#666" />
                                        <YAxis stroke="#666" />
                                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                        <Area type="monotone" dataKey="workouts" stroke="#00f2ea" fillOpacity={1} fill="url(#colorWorkouts)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Workout and Diet Plans */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <Dumbbell className="text-[#00f2ea]" size={28} />
                                <h3 className="text-xl font-bold">Today's Workout</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Bench Press</span>
                                    <span className="text-gray-400">4x12</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Incline Dumbbell Press</span>
                                    <span className="text-gray-400">3x10</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Cable Flyes</span>
                                    <span className="text-gray-400">3x15</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Tricep Pushdowns</span>
                                    <span className="text-gray-400">3x12</span>
                                </div>
                            </div>
                            <button className="w-full mt-4 bg-[#00f2ea] text-black font-bold py-3 rounded-lg hover:bg-[#00d2ca]">
                                Mark as Complete ✓
                            </button>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <Salad className="text-[#ff0050]" size={28} />
                                <h3 className="text-xl font-bold">Today's Diet</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Breakfast</span>
                                    <span className="text-gray-400">Oats + Eggs</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Lunch</span>
                                    <span className="text-gray-400">Rice + Chicken</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Snack</span>
                                    <span className="text-gray-400">Protein Shake</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black rounded-lg">
                                    <span>Dinner</span>
                                    <span className="text-gray-400">Salad + Fish</span>
                                </div>
                            </div>
                            <p className="mt-4 text-center text-gray-400">Target: 2500 kcal | Protein: 150g</p>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // Dashboard WITHOUT Active Plan (Default View)
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 px-4 max-w-6xl mx-auto">

                {/* Welcome Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold mb-2">Welcome back, <span className="text-[#00f2ea]">{user.name}</span>!</h1>
                    <p className="text-gray-400">Your personalized fitness journey starts here.</p>
                </div>

                {/* Status Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-400">Active Plan</h3>
                            <CheckCircle className="text-gray-600" />
                        </div>
                        <p className="text-2xl font-bold">No Active Plan</p>
                        <a href="/pricing" className="text-sm text-[#00f2ea] hover:underline mt-2 inline-block">
                            Browse Plans →
                        </a>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-400">Workout Plan</h3>
                            <Dumbbell className="text-[#00f2ea]" />
                        </div>
                        <p className="text-lg">Purchase a plan to unlock your personalized workout routine.</p>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-400">Diet Plan</h3>
                            <Salad className="text-[#ff0050]" />
                        </div>
                        <p className="text-lg">Purchase a plan to unlock your personalized diet chart.</p>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-[#00f2ea]/10 to-[#ff0050]/10 p-8 rounded-2xl border border-gray-800 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to Transform?</h2>
                    <p className="text-gray-400 mb-6">Select a training program and start your journey today.</p>
                    <a
                        href="/pricing"
                        className="inline-block bg-[#00f2ea] text-black px-8 py-3 rounded-full font-bold hover:bg-[#00d2ca] transition-colors"
                    >
                        View Pricing Plans
                    </a>
                </div>


                {/* My Progress Gallery */}
                <div className="mt-10">
                    <h3 className="text-2xl font-bold mb-6 text-[#00f2ea]">My Progress Gallery</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-gray-800">
                                <img
                                    src={`/uploads/RAMANAGYMPIC-${num}.jpg`}
                                    alt={`Progress Pic ${num}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        // Fallback if image fails
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop';
                                        (e.target as HTMLImageElement).parentElement?.classList.add('opacity-50');
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <p className="text-white font-bold">Transformation Phase {num}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
