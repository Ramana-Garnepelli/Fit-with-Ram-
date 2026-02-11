'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { Plus, Trash2, Save, X } from 'lucide-react';

export default function ManagePlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlan, setNewPlan] = useState({
        name: '',
        type: 'muscle_building',
        mode: 'online',
        price: 500,
        description: '',
        duration: 30,
        image: ''
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/programs`);
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const res = await fetch(`${apiUrl}/api/programs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newPlan)
            });

            if (res.ok) {
                setIsCreating(false);
                setNewPlan({ name: '', type: 'muscle_building', mode: 'online', price: 500, description: '', duration: 30, image: '' });
                fetchPlans();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const res = await fetch(`${apiUrl}/api/programs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) fetchPlans();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Manage Plans</h1>
                        <p className="text-gray-500 mt-2 text-lg">Create and manage your training subscription offerings.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={20} /> Create New Plan
                    </button>
                </div>

                {isCreating && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative">
                            <button onClick={() => setIsCreating(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-black mb-6">Create New Program</h2>
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600 block">Plan Name</label>
                                        <input
                                            required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 transition-all"
                                            placeholder="e.g. Muscle Building Elite"
                                            value={newPlan.name}
                                            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600 block">Price (INR)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 transition-all"
                                            value={newPlan.price}
                                            onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600 block">Type</label>
                                        <select
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 transition-all"
                                            value={newPlan.type}
                                            onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}
                                        >
                                            <option value="muscle_building">Muscle Building</option>
                                            <option value="fat_loss">Fat Loss</option>
                                            <option value="strength">Strength</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-600 block">Mode</label>
                                        <select
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 transition-all"
                                            value={newPlan.mode}
                                            onChange={(e) => setNewPlan({ ...newPlan, mode: e.target.value })}
                                        >
                                            <option value="online">Online</option>
                                            <option value="offline">Offline</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600 block">Description</label>
                                    <textarea
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 transition-all h-32 resize-none"
                                        placeholder="What does this plan offer?..."
                                        value={newPlan.description}
                                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-600 block">Image URL (Optional)</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:border-blue-500 transition-all"
                                        placeholder="https://..."
                                        value={newPlan.image}
                                        onChange={(e) => setNewPlan({ ...newPlan, image: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-lg">
                                    <Save size={20} /> Create Plan
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-3 text-center py-20 text-gray-400">Loading your plans...</div>
                    ) : plans.length === 0 ? (
                        <div className="col-span-3 text-center py-20 text-blue-400 font-bold text-xl">No plans found. Create your first one!</div>
                    ) : plans.map((plan) => (
                        <div key={plan._id} className="bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 p-8 flex flex-col group relative overflow-hidden">
                            <button
                                onClick={() => handleDelete(plan._id)}
                                className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                            >
                                <Trash2 size={18} />
                            </button>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">{plan.type.replace('_', ' ')}</span>
                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider border border-green-100">{plan.mode}</span>
                            </div>
                            <div className="text-4xl font-black text-gray-900 mb-6">₹{plan.price}<span className="text-sm text-gray-400 font-medium">/month</span></div>
                            <p className="text-gray-500 mb-8 border-t border-gray-50 pt-6 leading-relaxed flex-grow">{plan.description}</p>
                            <div className="text-xs text-gray-300 font-mono">ID: {plan._id}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
