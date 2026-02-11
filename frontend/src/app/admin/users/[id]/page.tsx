'use client';

import { useEffect, useState, use } from 'react';
import Navbar from '../../../../components/Navbar';
import { Save, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditUserPlan({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [workoutPlan, setWorkoutPlan] = useState<any>(null);
    const [dietPlan, setDietPlan] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUser(data);
                setWorkoutPlan(data.workoutPlan || { days: [] });
                setDietPlan(data.dietPlan || { meals: [] });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const res = await fetch(`${apiUrl}/api/admin/users/${id}/plan`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ workoutPlan, dietPlan })
            });

            if (res.ok) {
                alert('Plan updated successfully!');
            } else {
                alert('Failed to update plan');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    // Helper functions for editing plans
    const addWorkoutDay = () => {
        setWorkoutPlan({
            ...workoutPlan,
            days: [...(workoutPlan.days || []), { day: workoutPlan.days?.length + 1 || 1, exercises: [] }]
        });
    };

    const addExercise = (dayIndex: number) => {
        const newDays = [...workoutPlan.days];
        newDays[dayIndex].exercises.push({ name: '', sets: '', reps: '', weight: '' });
        setWorkoutPlan({ ...workoutPlan, days: newDays });
    };

    const updateExercise = (dayIndex: number, exIndex: number, field: string, value: string) => {
        const newDays = [...workoutPlan.days];
        newDays[dayIndex].exercises[exIndex][field] = value;
        setWorkoutPlan({ ...workoutPlan, days: newDays });
    };

    const removeExercise = (dayIndex: number, exIndex: number) => {
        const newDays = [...workoutPlan.days];
        newDays[dayIndex].exercises.splice(exIndex, 1);
        setWorkoutPlan({ ...workoutPlan, days: newDays });
    };

    const addMeal = () => {
        setDietPlan({
            ...dietPlan,
            meals: [...(dietPlan.meals || []), { name: '', items: '', calories: '' }]
        });
    };

    const updateMeal = (index: number, field: string, value: string) => {
        const newMeals = [...dietPlan.meals];
        newMeals[index][field] = value;
        setDietPlan({ ...dietPlan, meals: newMeals });
    };

    const removeMeal = (index: number) => {
        const newMeals = [...dietPlan.meals];
        newMeals.splice(index, 1);
        setDietPlan({ ...dietPlan, meals: newMeals });
    };

    if (loading) return <div className="text-center pt-20">Loading client data...</div>;
    if (!user) return <div className="text-center pt-20">User not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            <Navbar />
            <div className="pt-24 px-4 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">Customize Plan: {user.name}</h1>
                            <p className="text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save Plan'}
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Workout Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Workout Plan</h2>
                            <button onClick={addWorkoutDay} className="text-sm font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100 flex items-center gap-1 hover:bg-blue-100">
                                <Plus size={16} /> Add Day
                            </button>
                        </div>

                        {workoutPlan?.days?.map((day: any, dIdx: number) => (
                            <div key={dIdx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 border-l-4 border-blue-500 pl-2">Day {day.day}</h3>
                                    <button onClick={() => addExercise(dIdx)} className="text-xs font-bold text-blue-600 hover:underline">
                                        + Add Exercise
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {day.exercises.map((ex: any, eIdx: number) => (
                                        <div key={eIdx} className="flex gap-2 items-center">
                                            <input
                                                className="bg-gray-50 border border-gray-100 p-2 rounded-lg flex-1 text-sm outline-none focus:border-blue-300"
                                                placeholder="Exercise"
                                                value={ex.name}
                                                onChange={(e) => updateExercise(dIdx, eIdx, 'name', e.target.value)}
                                            />
                                            <input
                                                className="bg-gray-50 border border-gray-100 p-2 rounded-lg w-16 text-sm text-center outline-none focus:border-blue-300"
                                                placeholder="Sets"
                                                value={ex.sets}
                                                onChange={(e) => updateExercise(dIdx, eIdx, 'sets', e.target.value)}
                                            />
                                            <input
                                                className="bg-gray-50 border border-gray-100 p-2 rounded-lg w-16 text-sm text-center outline-none focus:border-blue-300"
                                                placeholder="Reps"
                                                value={ex.reps}
                                                onChange={(e) => updateExercise(dIdx, eIdx, 'reps', e.target.value)}
                                            />
                                            <button onClick={() => removeExercise(dIdx, eIdx)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Diet Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Diet Plan</h2>
                            <button onClick={addMeal} className="text-sm font-bold bg-green-50 text-green-600 px-3 py-1 rounded-lg border border-green-100 flex items-center gap-1 hover:bg-green-100">
                                <Plus size={16} /> Add Meal
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="space-y-4">
                                {dietPlan?.meals?.map((meal: any, mIdx: number) => (
                                    <div key={mIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 relative group">
                                        <button onClick={() => removeMeal(mIdx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                        <input
                                            className="bg-transparent font-bold text-gray-900 border-none outline-none focus:ring-0 w-full"
                                            placeholder="Meal Name (e.g. Breakfast)"
                                            value={meal.name}
                                            onChange={(e) => updateMeal(mIdx, 'name', e.target.value)}
                                        />
                                        <textarea
                                            className="w-full bg-white border border-gray-100 p-3 rounded-lg text-sm outline-none focus:border-green-300 resize-none"
                                            placeholder="Items and portions..."
                                            rows={2}
                                            value={meal.items}
                                            onChange={(e) => updateMeal(mIdx, 'items', e.target.value)}
                                        />
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Calories:</span>
                                            <input
                                                className="bg-white border border-gray-100 px-2 py-1 rounded text-sm w-20 outline-none focus:border-green-300"
                                                placeholder="e.g. 400"
                                                value={meal.calories}
                                                onChange={(e) => updateMeal(mIdx, 'calories', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
