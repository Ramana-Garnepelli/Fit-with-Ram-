'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

export default function Pricing() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showUpiModal, setShowUpiModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/programs`);
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
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

    const handleConfirmPayment = async () => {
        if (!selectedPlan) return;
        setVerifying(true);

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            // 1. Create a mock order on backend
            const orderRes = await fetch(`${apiUrl}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId: selectedPlan._id })
            });

            if (!orderRes.ok) throw new Error('Order creation failed');
            const order = await orderRes.json();

            // 2. Verify it immediately (Simulation of user saying "I paid")
            const verifyRes = await fetch(`${apiUrl}/api/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    razorpay_order_id: order.id,
                    razorpay_payment_id: 'upi_manual_' + Date.now(),
                    razorpay_signature: 'mock_signature'
                })
            });

            if (verifyRes.ok) {
                alert(`🎉 Payment Confirmed! Your ${selectedPlan.name} Plan is now Active.`);
                localStorage.setItem('hasPlan', 'true');
                localStorage.setItem('activePlan', selectedPlan.name);
                setShowUpiModal(false);
                router.push('/dashboard');
            } else {
                const verifyErr = await verifyRes.json();
                alert(`Verification Error: ${verifyErr.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong. Please try again or contact support.');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-urbanist">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black mb-4 tracking-tight text-gray-900 uppercase">Choose Your Plan</h1>
                    <p className="text-xl text-gray-500 font-medium">Direct Payment via PhonePe / Google Pay / UPI</p>
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

            {/* UPI Payment Modal */}
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
                            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter text-gray-900">Direct Pay</h2>
                            <p className="text-gray-500 mb-10 font-bold text-sm">Complete transfer for the <span className="text-black uppercase">{selectedPlan?.name}</span> plan.</p>

                            <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 mb-10 space-y-8">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.25em] mb-2">Total Amount</p>
                                    <p className="text-6xl font-black text-gray-900 tracking-tighter">₹{selectedPlan?.price}</p>
                                </div>
                                <div className="pt-8 border-t border-gray-200">
                                    <p className="text-[10px] uppercase font-black text-blue-500 tracking-[0.25em] mb-4">Transfer to PhonePe / GPay</p>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black text-gray-900 tracking-tight">+91 91338 55431</p>
                                        <p className="text-gray-400 text-xs font-black tracking-widest uppercase">UPI ID: fitwithram@upi</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={verifying}
                                    className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.15em] hover:bg-green-600 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {verifying ? (
                                        <>
                                            <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                                            Confirming...
                                        </>
                                    ) : (
                                        'I Have Paid'
                                    )}
                                </button>
                                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-relaxed">
                                    Clicking "I Have Paid" will unlock <br />your coaching dashboard instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
