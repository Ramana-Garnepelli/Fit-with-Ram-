'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react'; // Added imports for MapPin and Clock

export default function OfflineTraining() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto pb-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-black rounded-3xl transform -rotate-2 opacity-5"></div>
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
                                alt="Offline Training"
                                className="w-full object-cover"
                            />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-4xl font-black mb-6 text-gray-900 tracking-tight">
                            Personal Training <br />
                            <span className="text-blue-600">In Hyderabad</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Experience 1-on-1 coaching at my premium facility in Gachibowli.
                            We focus on form correction, injury prevention, and maximizing intensity.
                        </p>

                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mb-8">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <MapPin className="text-red-500" /> Location
                            </h3>
                            <p className="text-gray-600 mb-4">
                                <strong>Ram's Fitness Studio</strong><br />
                                Plot No. 45, Financial District<br />
                                Gachibowli, Hyderabad - 500032
                            </p>
                            <div className="h-px bg-gray-100 my-4"></div>
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <Clock className="text-blue-500" /> Batch Timings
                            </h3>
                            <p className="text-gray-600"><strong>Morning Batch:</strong> 5:00 AM - 10:00 AM</p>
                            <p className="text-gray-600"><strong>Evening Batch:</strong> 4:00 PM - 9:00 PM</p>
                        </div>

                        <a
                            href="https://wa.me/917036592919?text=Hi%20Ram,%20I%20interested%20in%20Offline%20Training%20at%20Gachibowli.%20Please%20share%20details."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-[#25D366] text-white text-center py-4 rounded-xl font-bold hover:bg-[#128C7E] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <span>Chat on WhatsApp to Book</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
