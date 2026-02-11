'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Redirect based on role
                if (user.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                router.push('/login');
            }
        } else {
            router.push('/login');
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#00f2ea] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl">Signing you in...</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <p>Loading...</p>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
