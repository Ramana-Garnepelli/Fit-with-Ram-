'use client';

import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Pricing() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, []);

    const handleBuy = (planName: string) => {
        // Simulate Payment Process
        const confirm = window.confirm(`Proceed to pay for ${planName}? (Demo Mode)`);
        if (confirm) {
            // In a real app, this would open Razorpay
            // For demo: verify success immediately
            alert('Payment Successful! redirecting to your Dashboard...');

            localStorage.setItem('hasPlan', 'true');
            localStorage.setItem('activePlan', planName);

            router.push('/dashboard');
        }
    };

    const plans = [
        {
            name: 'Muscle Building',
            price: 300,
            features: ['Personalized Workout', 'Diet Chart', 'Weekly Check-in', 'Form Correction'],
            gradient: 'from-[#00f2ea] to-[#00c2aa]',
        },
        {
            name: 'Fat Loss',
            price: 400,
            features: ['Calorie Deficit Diet', 'Cardio Plan', 'Daily Tracking', 'Supplement Guide'],
            gradient: 'from-[#ff0050] to-[#cc0040]',
        },
        {
            name: 'Strength Training',
            price: 600,
            features: ['Powerlifting Focus', 'Mobility Drills', 'Advanced Techniques', 'Priority Support'],
            gradient: 'from-purple-500 to-indigo-500',
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Choose Your Plan</h1>
                <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
                    Expert guidance at unbeatable prices. Select the program that fits your goals.
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.name} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:transform hover:-translate-y-2 transition-transform duration-300">
                            <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${plan.gradient} rounded-t-2xl`} />
                            <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-bold">₹{plan.price}</span>
                                <span className="text-gray-500 ml-2">/ one-time</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center text-gray-300">
                                        <span className="w-2 h-2 bg-[#00f2ea] rounded-full mr-3" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {isLoggedIn ? (
                                <button
                                    onClick={() => handleBuy(plan.name)}
                                    className={`block w-full text-center py-3 rounded-lg font-bold bg-white text-black hover:bg-gray-200 transition-colors`}
                                >
                                    Buy Now
                                </button>
                            ) : (
                                <Link
                                    href="/signup"
                                    className={`block w-full text-center py-3 rounded-lg font-bold bg-white text-black hover:bg-gray-200 transition-colors`}
                                >
                                    Get Started
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
