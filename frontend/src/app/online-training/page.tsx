'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { Smartphone, Video, Clock, CheckCircle } from 'lucide-react';

export default function OnlineTraining() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto pb-20">
                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h1 className="text-5xl font-black mb-6 text-gray-900 tracking-tight">
                            Elite <span className="text-blue-600">Online Coaching</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Get world-class training programs delivered directly to your phone. Whether you are at home or the gym, I will be your virtual coach.
                        </p>
                        <div className="space-y-4">
                            {[
                                'Customized Diet Charts based on localized Indian food',
                                'Video demonstrations for every exercise',
                                'Weekly check-ins and progress tracking',
                                '24/7 Support via WhatsApp'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="text-green-600 w-4 h-4" />
                                    </div>
                                    <span className="text-lg font-medium text-gray-700">{item}</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/pricing" className="inline-block mt-10 bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Start Your Transformation
                        </Link>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-3xl transform rotate-3 opacity-10"></div>
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                            <img
                                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
                                alt="Online Training"
                                className="w-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-2">Step 1</h3>
                        <p className="text-gray-600">Choose a plan that fits your goal.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-2">Step 2</h3>
                        <p className="text-gray-600">Receive your custom workout & diet.</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold mb-2">Step 3</h3>
                        <p className="text-gray-600">Track progress and get results.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
