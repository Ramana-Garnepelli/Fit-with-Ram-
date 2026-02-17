'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Dumbbell, Info, Play, SkipForward } from 'lucide-react';
import { API_URL } from '../lib/api';

interface Exercise {
    _id: string;
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    notes?: string;
    muscleGroup: string;
    equipment: string;
}

interface Workout {
    _id: string;
    dayName: string;
    dayType: string;
    exercises: Exercise[];
    totalDuration: number;
    caloriesBurned: number;
}

export default function WorkoutTracker() {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [completedExercises, setCompletedExercises] = useState<string[]>([]);
    const [activeRest, setActiveRest] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        fetchTodayWorkout();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (activeRest !== null && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setActiveRest(null);
        }
        return () => clearInterval(timer);
    }, [activeRest, timeLeft]);

    const fetchTodayWorkout = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/workouts/today`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setWorkout(data);
            } else {
                const errData = await res.json();
                setError(errData.message || 'Failed to load workout');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleExercise = (id: string, restSeconds: number) => {
        if (completedExercises.includes(id)) {
            setCompletedExercises(prev => prev.filter(item => item !== id));
        } else {
            setCompletedExercises(prev => [...prev, id]);
            startRest(restSeconds);
        }
    };

    const startRest = (seconds: number) => {
        setActiveRest(seconds);
        setTimeLeft(seconds);
    };

    const handleCompleteWorkout = async () => {
        if (!workout) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/workouts/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    workoutPlanId: workout._id,
                    exercises: workout.exercises.map(ex => ({
                        name: ex.name,
                        setsCompleted: completedExercises.includes(ex._id) ? ex.sets : 0
                    }))
                })
            });

            if (res.ok) {
                alert('Workout completed! Great job today!');
                window.location.reload();
            }
        } catch (err) {
            alert('Failed to save workout history');
        }
    };

    if (loading) return <div className="p-8 text-center bg-white rounded-3xl shadow-sm">Loading today's session...</div>;

    if (error) return (
        <div className="p-8 bg-white rounded-3xl shadow-sm border border-orange-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to start?</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            {!localStorage.getItem('token')?.includes('plan') && (
                <button
                    onClick={() => window.location.href = '/programs'}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                    Explore Programs
                </button>
            )}
        </div>
    );

    if (!workout) return null;

    return (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gray-900 p-6 text-white text-center sm:text-left">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <span className="inline-block px-3 py-1 bg-orange-500 text-xs font-bold rounded-full uppercase tracking-widest mb-2">
                            {workout.dayType}
                        </span>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{workout.dayName}</h2>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <span className="block text-xs uppercase text-gray-400 font-bold">Duration</span>
                            <span className="text-lg font-bold">{workout.totalDuration}m</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-xs uppercase text-gray-400 font-bold">Burn</span>
                            <span className="text-lg font-bold text-orange-400">{workout.caloriesBurned}kcal</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exercises */}
            <div className="p-6">
                <div className="space-y-4">
                    {workout.exercises.map((exercise) => (
                        <div
                            key={exercise._id}
                            className={`p-4 rounded-2xl border-2 transition-all ${completedExercises.includes(exercise._id)
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-100 hover:border-orange-200'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900">{exercise.name}</h4>
                                        <Dumbbell size={14} className="text-gray-400" />
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                                        <span className="font-medium">{exercise.sets} Sets</span>
                                        <span className="font-medium text-orange-600 font-mono">{exercise.reps} Reps</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {exercise.restSeconds}s Rest
                                        </span>
                                    </div>
                                    {exercise.notes && (
                                        <p className="text-xs italic text-gray-400 flex items-start gap-1">
                                            <Info size={12} className="mt-0.5" /> {exercise.notes}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleExercise(exercise._id, exercise.restSeconds)}
                                    className={`p-2 rounded-xl transition-colors ${completedExercises.includes(exercise._id)
                                        ? 'text-green-600'
                                        : 'text-gray-300 hover:text-orange-500'
                                        }`}
                                >
                                    {completedExercises.includes(exercise._id) ? <CheckCircle2 size={28} fill="currentColor" className="text-white" /> : <Circle size={28} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Complete Button */}
                <button
                    onClick={handleCompleteWorkout}
                    disabled={completedExercises.length === 0}
                    className={`w-full mt-8 py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all shadow-lg ${completedExercises.length > 0
                        ? 'bg-gray-900 text-white hover:bg-black hover:transform hover:-translate-y-1 active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Finish Workout
                </button>
            </div>

            {/* Rest Timer Overlay */}
            {activeRest !== null && (
                <div className="fixed bottom-8 right-8 z-50">
                    <div className="bg-orange-500 text-white p-6 rounded-3xl shadow-2xl border-4 border-white flex flex-col items-center min-w-[160px] animate-bounce-subtle">
                        <span className="text-xs font-black uppercase tracking-tighter mb-1">Resting</span>
                        <div className="text-4xl font-black mb-2">{timeLeft}s</div>
                        <button
                            onClick={() => setActiveRest(null)}
                            className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-xs font-bold transition-colors"
                        >
                            Skip Rest
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
