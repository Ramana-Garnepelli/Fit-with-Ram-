'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { Smartphone, Video, Clock } from 'lucide-react';

export default function OnlineTraining() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Train <span className="text-[#00f2ea]">Anywhere</span>, Anytime
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Get elite coaching delivered directly to your phone. Whether you have a full gym or just bodyweight, we build the plan for you.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center">
                        <Smartphone className="w-12 h-12 text-[#00f2ea] mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">App Access</h3>
                        <p className="text-gray-400">View workouts, track progress, and log nutrition in our easy-to-use dashboard.</p>
                    </div>
                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center">
                        <Video className="w-12 h-12 text-[#ff0050] mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Form Analysis</h3>
                        <p className="text-gray-400">Send videos of your lifts and get detailed feedback to prevent injury.</p>
                    </div>
                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center">
                        <Clock className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
                        <p className="text-gray-400">Have questions about a meal or exercise? Message me anytime.</p>
                    </div>
                </div>

                <div className="text-center pb-20">
                    <Link href="/pricing" className="bg-[#00f2ea] text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-[#00d2ca] transition-colors">
                        View Plans
                    </Link>
                </div>
            </div>
        </div>
    );
}
