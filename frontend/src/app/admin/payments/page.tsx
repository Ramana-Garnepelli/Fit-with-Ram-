'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, ReceiptText } from 'lucide-react';
import TransactionHistory from '../../../components/TransactionHistory';
import { API_URL } from '../../../lib/api';

export default function AdminPaymentsPage() {
    const [summary, setSummary] = useState({ count: 0, revenue: 0, currency: 'INR' });

    useEffect(() => {
        const loadSummary = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/payment/admin?status=paid&limit=1`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) return;
                const data = await response.json();
                const total = data.totals?.[0] || {};
                setSummary({ count: total.count || 0, revenue: total.revenue || 0, currency: total._id || 'INR' });
            } catch (error) {
                console.error('Unable to load transaction summary', error);
            }
        };
        loadSummary();
    }, []);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Payments &amp; transactions</h1>
                <p className="mt-2 text-gray-500">Review every customer payment and its gateway status.</p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6">
                    <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><IndianRupee /></span>
                    <div><p className="text-sm text-gray-500">Collected revenue</p><p className="text-2xl font-bold text-gray-900">{summary.currency === 'INR' ? '₹' : ''}{summary.revenue.toLocaleString('en-IN')}</p></div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6">
                    <span className="rounded-xl bg-blue-50 p-3 text-blue-700"><ReceiptText /></span>
                    <div><p className="text-sm text-gray-500">Successful transactions</p><p className="text-2xl font-bold text-gray-900">{summary.count}</p></div>
                </div>
            </div>
            <TransactionHistory adminView />
        </div>
    );
}
