'use client';

import { useState } from 'react';
import Navbar from '../../../components/Navbar';
import { Plus, Trash, Save, CheckCircle } from 'lucide-react';

export default function AdminContent() {
    const [planType, setPlanType] = useState('muscle_building');
    const [dayNumber, setDayNumber] = useState(1);
    const [title, setTitle] = useState('');

    // Dynamic Fields
    const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', tips: '' }]);
    const [diet, setDiet] = useState([{ mealName: '', foodItems: '', calories: '' }]);

    const [status, setStatus] = useState('');

    const handleExerciseChange = (index: number, field: string, value: string) => {
        const newExercises = [...exercises];
        (newExercises[index] as any)[field] = value;
        setExercises(newExercises);
    };

    const addExercise = () => {
        setExercises([...exercises, { name: '', sets: '', reps: '', tips: '' }]);
    };

    const removeExercise = (index: number) => {
        const newExercises = exercises.filter((_, i) => i !== index);
        setExercises(newExercises);
    };

    const handleDietChange = (index: number, field: string, value: string) => {
        const newDiet = [...diet];
        (newDiet[index] as any)[field] = value;
        setDiet(newDiet);
    };

    const addDiet = () => {
        setDiet([...diet, { mealName: '', foodItems: '', calories: '' }]);
    };

    const removeDiet = (index: number) => {
        const newDiet = diet.filter((_, i) => i !== index);
        setDiet(newDiet);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Saving...');

        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        try {
            const res = await fetch(`${apiUrl}/api/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    planType,
                    dayNumber: Number(dayNumber),
                    title,
                    exercises,
                    diet
                })
            });

            if (res.ok) {
                setStatus('Saved Successfully! ✅');
                // Optional: Clear form or stay to edit
            } else {
                const data = await res.json();
                setStatus(`Error: ${data.message}`);
            }
        } catch (err) {
            setStatus('Error connecting to server');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 px-4 max-w-4xl mx-auto pb-20">
                <h1 className="text-3xl font-bold mb-8 text-[#00f2ea]">Create Daily Content</h1>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Basic Info */}
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 grid md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-gray-400 mb-2">Plan Type</label>
                            <select
                                value={planType}
                                onChange={(e) => setPlanType(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded p-3"
                            >
                                <option value="muscle_building">Muscle Building</option>
                                <option value="fat_loss">Fat Loss</option>
                                <option value="strength">Strength</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Day Number</label>
                            <input
                                type="number"
                                value={dayNumber}
                                onChange={(e) => setDayNumber(Number(e.target.value))}
                                className="w-full bg-black border border-gray-700 rounded p-3"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Day Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Chest Day"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded p-3"
                            />
                        </div>
                    </div>

                    {/* Exercises */}
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Exercises</h3>
                            <button type="button" onClick={addExercise} className="flex items-center gap-2 text-[#00f2ea] text-sm">
                                <Plus size={16} /> Add Exercise
                            </button>
                        </div>

                        <div className="space-y-4">
                            {exercises.map((ex, idx) => (
                                <div key={idx} className="grid md:grid-cols-12 gap-4 items-start bg-black/50 p-4 rounded-lg">
                                    <div className="md:col-span-4">
                                        <input placeholder="Exercise Name" value={ex.name} onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)} className="w-full bg-gray-800 rounded p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input placeholder="Sets (e.g. 3)" value={ex.sets} onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)} className="w-full bg-gray-800 rounded p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input placeholder="Reps (e.g. 12)" value={ex.reps} onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)} className="w-full bg-gray-800 rounded p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <input placeholder="Tips/Notes" value={ex.tips} onChange={(e) => handleExerciseChange(idx, 'tips', e.target.value)} className="w-full bg-gray-800 rounded p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end">
                                        <button type="button" onClick={() => removeExercise(idx)} className="text-red-500 hover:text-red-400"><Trash size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Diet */}
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Diet Plan</h3>
                            <button type="button" onClick={addDiet} className="flex items-center gap-2 text-[#ff0050] text-sm">
                                <Plus size={16} /> Add Meal
                            </button>
                        </div>

                        <div className="space-y-4">
                            {diet.map((meal, idx) => (
                                <div key={idx} className="grid md:grid-cols-12 gap-4 items-start bg-black/50 p-4 rounded-lg">
                                    <div className="md:col-span-3">
                                        <input placeholder="Meal (e.g. Breakfast)" value={meal.mealName} onChange={(e) => handleDietChange(idx, 'mealName', e.target.value)} className="w-full bg-gray-800 rounded p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-6">
                                        <input placeholder="Food Items (e.g. 2 Eggs + Oats)" value={meal.foodItems} onChange={(e) => handleDietChange(idx, 'foodItems', e.target.value)} className="w-full bg-gray-800 rounded p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input placeholder="Calories" value={meal.calories} onChange={(e) => handleDietChange(idx, 'calories', e.target.value)} className="w-full bg-gray-800 rounded p-2 text-sm" />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end">
                                        <button type="button" onClick={() => removeDiet(idx)} className="text-red-500 hover:text-red-400"><Trash size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4">
                        <span className={`text-lg font-bold ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{status}</span>
                        <button type="submit" className="flex items-center gap-2 bg-[#00f2ea] text-black font-bold px-8 py-4 rounded-lg hover:bg-[#00d2ca] transition-colors">
                            <Save size={20} /> Save Day Plan
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
