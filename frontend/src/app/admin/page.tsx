'use client';

import { Users, IndianRupee, Activity } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400">Total Users</h3>
                        <Users className="text-[#00f2ea]" />
                    </div>
                    <p className="text-4xl font-bold">128</p>
                    <span className="text-sm text-green-400">+12% this month</span>
                </div>

                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400">Total Revenue</h3>
                        <IndianRupee className="text-[#00f2ea]" />
                    </div>
                    <p className="text-4xl font-bold">₹45,600</p>
                    <span className="text-sm text-green-400">+8% this month</span>
                </div>

                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400">Active Plans</h3>
                        <Activity className="text-[#00f2ea]" />
                    </div>
                    <p className="text-4xl font-bold">3</p>
                    <span className="text-sm text-gray-500">Live on site</span>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-xl font-bold mb-4">Recent Registrations</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-black rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                    U
                                </div>
                                <div>
                                    <p className="font-medium">User {i}</p>
                                    <p className="text-sm text-gray-400">user{i}@example.com</p>
                                </div>
                            </div>
                            <span className="text-gray-400 text-sm">2 hours ago</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
