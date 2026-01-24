'use client';

import { useState } from 'react';
import { Plus, Trash, Edit } from 'lucide-react';

export default function ManagePlans() {
    const [showAddModal, setShowAddModal] = useState(false);
    // Placeholder data - in real app, fetch from /api/plans
    const [plans, setPlans] = useState([
        { id: 1, name: 'Muscle Building', price: 400, type: 'muscle_building' },
        { id: 2, name: 'Fat Loss', price: 300, type: 'fat_loss' },
        { id: 3, name: 'Strength Training', price: 600, type: 'strength' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Manage Plans</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#00f2ea] text-black px-4 py-2 rounded-lg font-bold flex items-center space-x-2 hover:bg-[#00d2ca] transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Plan</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 relative group">
                        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-2xl text-[#00f2ea] font-bold mb-4">₹{plan.price}</p>
                        <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                            {plan.type.replace('_', ' ')}
                        </span>

                        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-blue-400">
                                <Edit size={16} />
                            </button>
                            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-red-500">
                                <Trash size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simplified Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-xl max-w-md w-full border border-gray-800">
                        <h3 className="text-2xl font-bold mb-6">Add New Plan</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Plan Name" className="w-full bg-black border border-gray-700 rounded p-3" />
                            <input type="number" placeholder="Price (₹)" className="w-full bg-black border border-gray-700 rounded p-3" />
                            <select className="w-full bg-black border border-gray-700 rounded p-3 text-gray-400">
                                <option>Muscle Building</option>
                                <option>Fat Loss</option>
                                <option>Strength</option>
                            </select>
                            <div className="flex space-x-4 pt-4">
                                <button className="flex-1 bg-[#00f2ea] text-black font-bold py-3 rounded-lg">Save</button>
                                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-lg">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
