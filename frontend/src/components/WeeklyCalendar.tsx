'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { API_URL } from '../lib/api';

export default function WeeklyCalendar() {
    const [calendar, setCalendar] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeeklyOverview();
    }, []);

    const fetchWeeklyOverview = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/workouts/weekly-overview`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCalendar(data);
            }
        } catch (err) {
            console.error('Failed to load calendar');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CalendarIcon className="text-orange-500" size={20} /> Weekly Consistency
            </h3>

            <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {calendar.map((day, idx) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();

                    return (
                        <div key={idx} className="flex flex-col items-center gap-2 min-w-[50px]">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{dayName}</span>
                            <div className={`w-12 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${day.completed
                                ? 'bg-orange-50 border-orange-200 '
                                : 'bg-gray-50 border-gray-100'
                                }`}>
                                <span className={`text-sm font-black mb-1 ${day.completed ? 'text-orange-600' : 'text-gray-400'}`}>
                                    {dayNum}
                                </span>
                                {day.completed ? (
                                    <CheckCircle2 size={16} fill="currentColor" className="text-orange-500 text-white" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border border-gray-300" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs font-bold text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-orange-500" /> Completed
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md border border-gray-300 bg-gray-50" /> Missed/Future
                </div>
            </div>
        </div>
    );
}
