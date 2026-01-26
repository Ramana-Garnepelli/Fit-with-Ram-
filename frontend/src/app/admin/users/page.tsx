'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { Trash2 } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const res = await fetch(`${apiUrl}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            await fetch(`${apiUrl}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                        <p className="text-gray-500 mt-1">View and manage your registered client base.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="p-6 text-gray-500 font-bold text-xs uppercase tracking-wider">User Profile</th>
                                    <th className="p-6 text-gray-500 font-bold text-xs uppercase tracking-wider">Role</th>
                                    <th className="p-6 text-gray-500 font-bold text-xs uppercase tracking-wider">Joined Date</th>
                                    <th className="p-6 text-gray-500 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-10 text-center text-gray-500">Loading your users...</td></tr>
                                ) : users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                : 'bg-green-100 text-green-700 border-green-200'
                                                }`}>
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-6 text-gray-600 font-mono text-sm">
                                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            <a
                                                href={`/admin/users/${user._id}`}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all inline-block"
                                                title="Edit Plan"
                                            >
                                                Edit Plan
                                            </a>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
