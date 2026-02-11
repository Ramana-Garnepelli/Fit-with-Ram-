'use client';

import Navbar from '../../components/Navbar';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16">

                    {/* Contact Info */}
                    <div>
                        <h1 className="text-4xl font-bold mb-6">Get in Touch</h1>
                        <p className="text-gray-400 mb-10">
                            Have questions about the plans? Want to know more about offline training? Drop a message!
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-[#00f2ea]">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Phone</p>
                                    <p className="font-bold text-lg">+91 70365 92919</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-[#ff0050]">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Email</p>
                                    <p className="font-bold text-lg">ramana.garnepelli16@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-purple-500">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Location</p>
                                    <p className="font-bold text-lg">GACHIBOWLI, HYDERABAD</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="bg-gray-900 p-8 rounded-2xl border border-gray-800 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                            <input type="text" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:border-[#00f2ea] outline-none" placeholder="Your Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input type="email" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:border-[#00f2ea] outline-none" placeholder="your@email.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                            <textarea rows={4} className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:border-[#00f2ea] outline-none" placeholder="How can I help you?" />
                        </div>
                        <button className="w-full bg-[#00f2ea] text-black font-bold py-3 rounded-lg hover:bg-[#00d2ca] transition-colors">
                            Send Message
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}
