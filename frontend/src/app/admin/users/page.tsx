'use client';

export default function ManageUsers() {
    // Placeholder data
    const users = [
        { id: 1, name: 'Ram Kumar', email: 'ram@example.com', role: 'admin', joined: '2024-01-01' },
        { id: 2, name: 'John Doe', email: 'john@example.com', role: 'user', joined: '2024-01-15' },
        { id: 3, name: 'Jane Smith', email: 'jane@example.com', role: 'user', joined: '2024-01-20' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Manage Users</h2>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black text-gray-400">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-800/50">
                                <td className="p-4 font-medium">{user.name}</td>
                                <td className="p-4 text-gray-400">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">{user.joined}</td>
                                <td className="p-4">
                                    <button className="text-sm text-[#00f2ea] hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
