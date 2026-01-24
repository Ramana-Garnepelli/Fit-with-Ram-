'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                setSuccess(true);

                // Show success message, then redirect
                setTimeout(() => {
                    if (data.role === 'admin') {
                        router.push('/admin');
                    } else {
                        router.push('/dashboard');
                    }
                }, 2000);
            } else {
                setError(data.message || 'Signup failed');
            }
        } catch (err) {
            setError('Something went wrong. Is the backend running?');
        }
    };

    // Success Screen
    if (success) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="text-center p-10">
                        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold mb-4">Account Created!</h2>
                        <p className="text-gray-400 mb-2">Welcome to FitWithRAM 💪</p>
                        <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] py-12">
                <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                    <h2 className="text-3xl font-bold text-center mb-6 text-[#00f2ea]">Create Account</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                onChange={handleChange}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-[#00f2ea] focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                            <input
                                name="email"
                                type="email"
                                onChange={handleChange}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-[#00f2ea] focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                onChange={handleChange}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-[#00f2ea] focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                            <input
                                name="password"
                                type="password"
                                onChange={handleChange}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 focus:border-[#00f2ea] focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#00f2ea] text-black font-bold py-3 rounded-lg hover:bg-[#00d2ca] transition-colors mt-4"
                        >
                            Sign Up
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-white hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
