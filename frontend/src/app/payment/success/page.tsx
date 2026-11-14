'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { API_URL } from '@/lib/api';

function PaymentStatusContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('id');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
    const [message, setMessage] = useState('');
    const [checkAgain, setCheckAgain] = useState(0);
    const displayStatus = transactionId ? status : 'failed';
    const displayMessage = transactionId ? message : 'No transaction ID found';

    useEffect(() => {
        if (!transactionId) return;

        let cancelled = false;
        let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

        const verifyPayment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setStatus('failed');
                    setMessage('Please sign in again to verify your payment.');
                    return;
                }

                for (let attempt = 0; attempt < 10; attempt++) {
                    const res = await fetch(`${API_URL}/api/payment/phonepe/status/${encodeURIComponent(transactionId)}`, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    const data = await res.json();

                    if (cancelled) return;
                    if (res.ok && data.success) {
                        if (data.user) {
                            localStorage.setItem('user', JSON.stringify(data.user));
                            localStorage.setItem('hasPlan', 'true');
                        }
                        setStatus('success');
                        redirectTimeout = setTimeout(() => router.push('/dashboard'), 3000);
                        return;
                    }
                    if (data.failed || (res.status >= 400 && res.status < 500)) {
                        setStatus('failed');
                        setMessage(data.message || 'Payment verification failed');
                        return;
                    }

                    setMessage(data.message || 'Payment is still processing. Please wait.');
                    if (attempt < 9) {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                    }
                }

                if (!cancelled) setStatus('pending');
            } catch {
                if (cancelled) return;
                setStatus('failed');
                setMessage('Unable to verify your payment. Please try again.');
            }
        };

        verifyPayment();

        return () => {
            cancelled = true;
            if (redirectTimeout) clearTimeout(redirectTimeout);
        };
    }, [transactionId, router, checkAgain]);

    return (
        <div className="min-h-screen bg-black text-white pt-24 px-4">
            <div className="max-w-md mx-auto bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
                {displayStatus === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
                        <p className="text-gray-400">Please wait while we confirm your transaction.</p>
                    </div>
                )}

                {displayStatus === 'success' && (
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

                {displayStatus === 'failed' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-red-500">Payment Failed</h2>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
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

                {displayStatus === 'pending' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-blue-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Payment Processing</h2>
                        <p className="text-gray-400 mb-6">{displayMessage}</p>
                        <button
                            onClick={() => {
                                setStatus('loading');
                                setCheckAgain((attempt) => attempt + 1);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold transition-colors"
                        >
                            Check payment again
                        </button>
                    </div>
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
