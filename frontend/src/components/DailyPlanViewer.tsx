'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, Salad, CheckCircle } from 'lucide-react';

export default function DailyPlanViewer({ user }: { user: any }) {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        if (!user.activePlanType) {
            setLoading(false);
            return;
        }
        fetchContent();
    }, [user]);

    const fetchContent = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/content/${user.activePlanType}/${user.currentDay}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setContent(data);
            }
        } catch (err) {
            console.error('Error fetching plan', err);
        } finally {
            setLoading(false);
        }
    };

    const markComplete = async () => {
        setCompleting(true);
        // Here you would call an API to increment user.currentDay
        // For MVP demo, just alert
        alert('Work in progress: This will update your streak and move to Day ' + (user.currentDay + 1));
        setCompleting(false);
    };

    if (loading) return <div className="text-gray-400 text-center py-10">Loading your personalized plan...</div>;

    if (!user.activePlanType) return null; // Should be handled by parent active check

    if (!content) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center col-span-2">
                <h3 className="text-xl font-bold mb-2">Day {user.currentDay} Plan Not Ready</h3>
                <p className="text-gray-400">Your trainer hasn't uploaded the specific details for Day {user.currentDay} ({user.activePlanType}) yet.</p>
                <p className="text-sm text-gray-500 mt-2">Check back later or contact support.</p>
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Workout Section */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                    <Dumbbell className="text-[#00f2ea]" size={28} />
                    <div>
                        <h3 className="text-xl font-bold">Day {content.dayNumber}: {content.title}</h3>
                        <p className="text-sm text-gray-400">Today's Workout</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {content.exercises.map((ex: any, idx: number) => (
                        <div key={idx} className="p-3 bg-black rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-[#00f2ea]">{ex.name}</span>
                                <span className="text-gray-400 text-sm">{ex.sets} x {ex.reps}</span>
                            </div>
                            {ex.tips && <p className="text-xs text-gray-500 italic">Tip: {ex.tips}</p>}
                        </div>
                    ))}
                </div>

                <button
                    onClick={markComplete}
                    disabled={completing}
                    className="w-full mt-6 bg-[#00f2ea] text-black font-bold py-3 rounded-lg hover:bg-[#00d2ca] transition-colors flex items-center justify-center gap-2"
                >
                    {completing ? 'Updating...' : <>Mark Day Complete <CheckCircle size={18} /></>}
                </button>
            </div>

            {/* Diet Section */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                    <Salad className="text-[#ff0050]" size={28} />
                    <div>
                        <h3 className="text-xl font-bold">Nutrition Plan</h3>
                        <p className="text-sm text-gray-400">Today's Fuel</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {content.diet.map((meal: any, idx: number) => (
                        <div key={idx} className="p-3 bg-black rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-[#ff0050]">{meal.mealName}</span>
                                <span className="text-gray-400 text-sm">{meal.calories} kcal</span>
                            </div>
                            <p className="text-gray-300 text-sm">{meal.foodItems}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-black/50 rounded-lg text-center">
                    <p className="text-gray-400 text-sm">Remember to stay hydrated! 💧</p>
                </div>
            </div>
        </div>
    );
}
