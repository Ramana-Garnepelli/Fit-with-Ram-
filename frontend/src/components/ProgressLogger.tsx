'use client';

import { useState } from 'react';
import { Camera, Ruler, Save, Weight } from 'lucide-react';
import { API_URL } from '../lib/api';

export default function ProgressLogger() {
    const [loading, setLoading] = useState(false);
    const [weight, setWeight] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/progress/measurement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    weight: parseFloat(weight),
                    chest: parseFloat(chest),
                    waist: parseFloat(waist)
                })
            });

            if (res.ok) {
                alert('Stats updated! Keep it up.');
                window.location.reload();
            }
        } catch (err) {
            alert('Failed to save measurements');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Ruler className="text-orange-500" /> Log Progress
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Body Weight (kg)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 focus:border-orange-500 outline-none transition-all font-black text-gray-700"
                                placeholder="75.0"
                            />
                            <Weight size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Chest (cm)</label>
                        <input
                            type="number"
                            value={chest}
                            onChange={(e) => setChest(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:border-orange-500 outline-none transition-all font-black text-gray-700"
                            placeholder="100"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Waist (cm)</label>
                    <input
                        type="number"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 focus:border-orange-500 outline-none transition-all font-black text-gray-700"
                        placeholder="85"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 disabled:bg-gray-200"
                    >
                        <Save size={20} /> {loading ? 'Saving...' : 'Update Stats'}
                    </button>
                </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs font-black uppercase text-gray-400 tracking-widest mb-4">
                    <span>Progress Photos</span>
                    <button className="text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1">
                        <Camera size={14} /> Add photo
                    </button>
                </div>
                <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                    <div className="text-center">
                        <Camera size={32} className="mx-auto mb-2 opacity-20" />
                        <span className="text-[10px]">No photos yet</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
