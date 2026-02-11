'use client';

import { Users, IndianRupee, Activity, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        usersCount: 0,
        totalRevenue: 0,
        activeCount: 0,
        recentSales: []
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setStats(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h2 className="text-4xl font-bold text-gray-900">
                    Command Center
                </h2>
                <p className="text-gray-500 mt-2">Overview of your fitness empire.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative group bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="relative flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Total Users</h3>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <p className="relative text-4xl font-bold text-gray-900">{stats.usersCount}</p>
                    <span className="relative text-sm text-green-600 flex items-center gap-1 mt-2">
                        Lifetime Signups
                    </span>
                </div>

                <div className="relative group bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="relative flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Total Revenue</h3>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <IndianRupee className="text-green-600" size={24} />
                        </div>
                    </div>
                    <p className="relative text-4xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
                    <span className="relative text-sm text-green-600 flex items-center gap-1 mt-2">
                        Gross Income
                    </span>
                </div>

                <div className="relative group bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                    <div className="relative flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Recent Activations</h3>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Activity className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <p className="relative text-4xl font-bold text-gray-900">{stats.recentSales.length}</p>
                    <span className="relative text-sm text-gray-500 mt-2">In last few days</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a href="/admin/content" className="group relative overflow-hidden bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-300">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 flex items-center gap-2">
                        Manage Content <ChevronRight size={20} />
                    </h3>
                    <p className="text-gray-500 relative z-10">Create and edit daily workouts, diets, and training programs.</p>
                </a>

                <a href="/admin/users" className="group relative overflow-hidden bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-300">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 flex items-center gap-2">
                        Manage Users <ChevronRight size={20} />
                    </h3>
                    <p className="text-gray-500 relative z-10">View registered users, track activity, and manage roles.</p>
                </a>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-gray-900">Recent Plan Activations</h3>
                <div className="space-y-4">
                    {stats.recentSales.length === 0 ? (
                        <p className="text-gray-500">No recent plan activations.</p>
                    ) : (
                        stats.recentSales.map((sale: any) => (
                            <div key={sale._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold border border-purple-200">
                                        {sale.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{sale.user?.name || 'Unknown User'}</p>
                                        <p className="text-sm text-gray-500">Activated: {sale.plan?.name || 'Plan'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-900 font-bold">₹{sale.amount}</p>
                                    <span className="text-gray-500 text-xs bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                        {new Date(sale.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
