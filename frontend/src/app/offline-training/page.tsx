'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function OfflineTraining() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    Train with me <span className="text-[#ff0050]">In-Person</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
                    Get hands-on coaching, real-time form correction, and the motivation you need to push past your limits.
                </p>

                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 inline-block text-left max-w-2xl w-full">
                    <h3 className="text-2xl font-bold mb-4 text-[#ff0050]">Location & Timings</h3>
                    <div className="space-y-4 text-gray-300">
                        <p><strong className="text-white">Gym:</strong> FIT_WITH_RAM</p>
                        <p><strong className="text-white">Address:</strong> GACHIBOWLI, HYDERABAD</p>
                        <p><strong className="text-white">Morning Batch:</strong> 5:00 AM - 10:00 AM</p>
                        <p><strong className="text-white">Evening Batch:</strong> 4:00 PM - 9:00 PM</p>
                    </div>

                    <Link href="/contact" className="block w-full mt-8 bg-[#ff0050] text-white text-center py-3 rounded-lg font-bold hover:bg-[#cc0040]">
                        Book a Session
                    </Link>
                </div>
            </div>
        </div>
    );
}
