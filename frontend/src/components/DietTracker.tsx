'use client';

import { useState, useEffect } from 'react';
import { Apple, Check, CheckCircle2, Circle, Flame, Timer, Utensils } from 'lucide-react';
import { API_URL } from '../lib/api';

interface Meal {
    _id: string;
    time: string;
    name: string;
    foods: string[];
    macros: { protein: number; carbs: number; fats: number };
    calories: number;
    notes?: string;
}

interface DietPlan {
    calorieTarget: number;
    macroTargets: { protein: number; carbs: number; fats: number };
    meals: Meal[];
}

export default function DietTracker() {
    const [plan, setPlan] = useState<DietPlan | null>(null);
    const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTodayDiet();
    }, []);

    const fetchTodayDiet = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/diet/today`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setPlan(data.dietPlan);
                setLoggedMeals(data.loggedMeals);
            } else {
                setError('Diet plan not loaded');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogMeal = async (meal: Meal) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/diet/log-meal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    mealName: meal.name,
                    macros: meal.macros,
                    calories: meal.calories
                })
            });

            if (res.ok) {
                fetchTodayDiet(); // Refresh list
            }
        } catch (err) {
            alert('Failed to log meal');
        }
    };

    const isMealLogged = (name: string) => {
        return loggedMeals.some(m => m.mealName === name);
    };

    const calculateDailyProgress = () => {
        if (!plan) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
        return loggedMeals.reduce((acc, current) => ({
            calories: acc.calories + (current.calories || 0),
            protein: acc.protein + (current.macros?.protein || 0),
            carbs: acc.carbs + (current.macros?.carbs || 0),
            fats: acc.fats + (current.macros?.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    };

    const progress = calculateDailyProgress();

    if (loading) return <div className="p-8 text-center bg-white rounded-3xl">Nutrition profile loading...</div>;
    if (error || !plan) return null;

    return (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 h-full flex flex-col">
            {/* Header / Stats */}
            <div className="bg-orange-500 p-6 text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Apple size={24} /> Nutrition Plan
                    </h2>
                    <div className="flex gap-2">
                        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Flame size={12} /> {plan.calorieTarget}kcal Target
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/10 rounded-2xl p-2 border border-white/20">
                        <span className="block text-[10px] uppercase font-black text-white/70">Calories</span>
                        <span className="text-sm font-black">{progress.calories}</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-2 border border-white/20">
                        <span className="block text-[10px] uppercase font-black text-white/70">Protein</span>
                        <span className="text-sm font-black">{progress.protein}g</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-2 border border-white/20">
                        <span className="block text-[10px] uppercase font-black text-white/70">Carbs</span>
                        <span className="text-sm font-black">{progress.carbs}g</span>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-2 border border-white/20">
                        <span className="block text-[10px] uppercase font-black text-white/70">Fats</span>
                        <span className="text-sm font-black">{progress.fats}g</span>
                    </div>
                </div>
            </div>

            {/* Meal List */}
            <div className="p-6 flex-1 bg-gray-50/50">
                <div className="space-y-4">
                    {plan.meals.map((meal) => (
                        <div
                            key={meal._id}
                            className={`p-4 rounded-2xl border transition-all ${isMealLogged(meal.name)
                                ? 'bg-white border-green-200'
                                : 'bg-white border-gray-100 hover:border-orange-200'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Timer size={14} className="text-orange-500" />
                                        <span className="text-xs font-bold text-gray-400 font-mono tracking-tighter">{meal.time}</span>
                                        <h4 className="font-bold text-gray-800 text-sm">{meal.name}</h4>
                                    </div>
                                    <div className="text-xs text-gray-500 leading-relaxed mb-2">
                                        {meal.foods.join(', ')}
                                    </div>
                                    <div className="flex gap-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                                        <span>P: {meal.macros.protein}g</span>
                                        <span>C: {meal.macros.carbs}g</span>
                                        <span>F: {meal.macros.fats}g</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleLogMeal(meal)}
                                    disabled={isMealLogged(meal.name)}
                                    className={`p-2 rounded-xl transition-all ${isMealLogged(meal.name)
                                        ? 'text-green-500 bg-green-50'
                                        : 'text-gray-300 bg-gray-50 hover:bg-orange-50 hover:text-orange-500'
                                        }`}
                                >
                                    {isMealLogged(meal.name) ? <Check size={20} strokeWidth={3} /> : <Utensils size={20} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
