'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function PaymentStatusContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('id');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!transactionId) {
            setStatus('failed');
            setMessage('No transaction ID found');
            return;
        }

        const verifyPayment = async () => {
            try {
                const token = localStorage.getItem('token'); // Assuming auth token is stored here
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

                const res = await fetch(`${apiUrl}/api/payment/phonepe/status/${transactionId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const data = await res.json();

                if (data.success) {
                    setStatus('success');
                    // Auto redirect to dashboard after 3 seconds
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 3000);
                } else {
                    setStatus('failed');
                    setMessage(data.message || 'Payment verification failed');
                }
            } catch (error) {
                setStatus('failed');
                setMessage('Error connecting to server');
            }
        };

        verifyPayment();
    }, [transactionId, router]);

    return (
        <div className="min-h-screen bg-black text-white pt-24 px-4">
            <div className="max-w-md mx-auto bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
                        <p className="text-gray-400">Please wait while we confirm your transaction.</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-green-500">Payment Successful!</h2>
                        <p className="text-gray-400 mb-6">Your plan has been activated. Redirecting you to dashboard...</p>
                        <Link
                            href="/dashboard"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    </motion.div>
                )}

                {status === 'failed' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-red-500">Payment Failed</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <div className="flex gap-4">
                            <Link
                                href="/pricing"
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                            >
                                Try Again
                            </Link>
                            <Link
                                href="/dashboard"
                                className="border border-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                            >
                                Dashboard
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
                <PaymentStatusContent />
            </Suspense>
        </>
    );
}
