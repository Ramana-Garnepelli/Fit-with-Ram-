'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { Suspense } from 'react';
import { API_URL } from '../../lib/api';

function PricingContent() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const planIdFromQuery = searchParams.get('planId');

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch(`${API_URL}/api/programs`);
            if (res.ok) {
                const data = await res.json();
                setPlans(data);

                // If a planId was passed in query, auto-select it
                if (planIdFromQuery) {
                    const plan = data.find((p: any) => p._id === planIdFromQuery);
                    if (plan) {
                        setSelectedPlan(plan);
                        setShowUpiModal(true);
                    }
                }
            } else {
                console.error('Failed to fetch plans');
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseInitiation = (plan: any) => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        setSelectedPlan(plan);
        setShowUpiModal(true);
    };

    const handlePhonePePayment = async () => {
        if (!selectedPlan) return;
        setVerifying(true);

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                alert('Please login to continue');
                router.push('/login');
                return;
            }

            const res = await fetch(`${API_URL}/api/payment/phonepe/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId: selectedPlan._id })
            });

            const data = await res.json();

            if (res.status === 401) {
                // Token expired or user not found - clear storage and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('Your session has expired. Please login again to continue.');
                router.push('/login');
                return;
            }

            if (res.ok && data.url) {
                // Redirect to PhonePe payment page
                window.location.href = data.url;
            } else {
                alert(`Payment Initiation Failed: ${data.message || 'Unknown error'}`);
                setVerifying(false);
            }
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Failed to initiate payment. Please try again.');
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-urbanist">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black mb-4 tracking-tight text-gray-900 uppercase">Choose Your Plan</h1>
                    <p className="text-xl text-gray-500 font-medium">Secure Payment via PhonePe</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400 font-medium italic animate-pulse">Fetching latest plans...</div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div key={plan._id} className="relative bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col group overflow-hidden">
                                {plan.type === 'muscle_building' && (
                                    <div className="absolute top-0 right-0 bg-black text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black tracking-widest uppercase">
                                        Best Seller
                                    </div>
                                )}

                                <h3 className="text-3xl font-black mb-2 text-gray-900 tracking-tighter">{plan.name}</h3>
                                <div className="mb-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                    <span className="text-5xl font-black text-gray-900 tracking-tighter">₹{plan.price}</span>
                                    <span className="text-gray-400 font-black ml-1 uppercase text-[10px] tracking-widest">/ month</span>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {(plan.features || ['Personalized Training', 'Diet Consultation', 'WhatsApp Support']).map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-gray-600 font-bold text-sm">
                                            <div className="bg-green-100 p-1.5 rounded-full text-green-600 mt-0.5 flex-shrink-0">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handlePurchaseInitiation(plan)}
                                    className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 text-sm"
                                >
                                    Select Plan
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showUpiModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => !verifying && setShowUpiModal(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowUpiModal(false)}
                            className="absolute top-8 right-8 text-gray-300 hover:text-black transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center">
                            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter text-gray-900">Confirm Plan</h2>
                            <p className="text-gray-500 mb-10 font-bold text-sm">You are subscribing to <span className="text-black uppercase">{selectedPlan?.name}</span>.</p>

                            <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 mb-10 space-y-8">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.25em] mb-2">Total Amount</p>
                                    <p className="text-6xl font-black text-gray-900 tracking-tighter">₹{selectedPlan?.price}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handlePhonePePayment}
                                    disabled={verifying}
                                    className="w-full bg-[#5f259f] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.15em] hover:bg-[#4a1d7c] transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {verifying ? (
                                        <>
                                            <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        'Pay Now'
                                    )}
                                </button>
                                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-relaxed">
                                    Secure payment powered by PhonePe
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Pricing() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PricingContent />
        </Suspense>
    );
}
