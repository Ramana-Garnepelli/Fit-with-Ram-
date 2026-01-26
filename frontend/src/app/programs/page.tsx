'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Programs() {
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/programs`);
            if (res.ok) {
                const data = await res.json();
                setPrograms(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
            <Navbar />
            <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black mb-4 text-gray-900 tracking-tight">Our Training Programs</h1>
                    <p className="text-xl text-gray-500">Choose a path that fits your goal.</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400 font-medium">Loading programs...</div>
                ) : programs.length === 0 ? (
                    <div className="text-center py-20 text-blue-500 font-bold text-xl">New programs coming soon! Check back later.</div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        {programs.map((prog) => (
                            <div key={prog._id} className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-white border border-gray-100 flex flex-col">
                                <div className="aspect-w-16 aspect-h-9 h-64 bg-gray-100 overflow-hidden">
                                    <img
                                        src={prog.image || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop'}
                                        alt={prog.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop';
                                        }}
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-md text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                                            {prog.mode}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 flex-grow flex flex-col">
                                    <h3 className="text-2xl font-black mb-3 text-gray-900 leading-tight">{prog.name}</h3>
                                    <p className="text-gray-500 leading-relaxed mb-8 flex-grow">
                                        {prog.description || "A comprehensive program designed by Ram to help you reach your peak performance."}
                                    </p>
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="text-3xl font-black text-gray-900">₹{prog.price}</span>
                                        <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">{prog.type.replace('_', ' ')}</span>
                                    </div>
                                    <Link href="/pricing" className="block w-full py-4 rounded-xl bg-black text-white font-black hover:bg-gray-800 transition-all text-sm uppercase tracking-widest text-center shadow-lg hover:shadow-black/20 transform hover:-translate-y-1">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
