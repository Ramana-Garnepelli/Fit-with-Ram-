'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

export default function Pricing() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
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

    const handlePurchase = async (plan: any) => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            const res = await fetch(`${apiUrl}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planId: plan._id })
            });

            if (res.ok) {
                const order = await res.json();

                // Check if it's a Mock Order (Simulation Mode)
                if (order.id.startsWith('order_mock_')) {
                    // Automatically verify for simulation
                    const confirmSim = window.confirm(`Simulating Payment Gateway...\n\nClick OK to complete purchase of ${plan.name} Plan.`);

                    if (confirmSim) {
                        const verifyRes = await fetch(`${apiUrl}/api/payment/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_order_id: order.id,
                                razorpay_payment_id: 'pay_mock_' + Date.now(),
                                razorpay_signature: 'mock_signature'
                            })
                        });

                        if (verifyRes.ok) {
                            alert(`Payment Successful! ${plan.name} Plan Activated.`);
                            localStorage.setItem('hasPlan', 'true');
                            localStorage.setItem('activePlan', plan.name);
                            router.push('/dashboard');
                        } else {
                            const verifyErr = await verifyRes.json();
                            alert(`Verification Failed: ${verifyErr.message}`);
                        }
                    }
                } else {
                    alert(`Razorpay Order Created: ${order.id}. (Real Razorpay keys required for pop-up)`);
                    // Here we would use window.Razorpay in production
                }
            } else {
                const err = await res.json();
                alert(`Payment Error: ${err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
            <Navbar />
            <div className="pt-24 px-4 max-w-7xl mx-auto pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-black mb-4 tracking-tight text-gray-900">Simple Pricing</h1>
                    <p className="text-xl text-gray-500">Invest in your body. It's the only place you have to live.</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500 font-medium">Loading membership plans...</div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div key={plan._id} className="relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                                {plan.type === 'muscle_building' && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                        MOST POPULAR
                                    </div>
                                )}

                                <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                                <div className="mb-6">
                                    <span className="text-5xl font-black text-gray-900">₹{plan.price}</span>
                                    <span className="text-gray-400 font-medium">/month</span>
                                </div>

                                <p className="text-gray-500 mb-8 leading-relaxed border-b border-gray-100 pb-8">{plan.description}</p>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {(plan.features || []).map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-center gap-3 text-gray-700">
                                            <Check className="text-green-500 w-5 h-5 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {isLoggedIn ? (
                                    <button
                                        onClick={() => handlePurchase(plan)}
                                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 block text-center"
                                    >
                                        Choose Plan
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 block text-center"
                                    >
                                        Get Started
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
