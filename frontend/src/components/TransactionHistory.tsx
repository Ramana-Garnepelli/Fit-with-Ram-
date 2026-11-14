'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

type Payment = {
    _id: string;
    amount: number;
    currency: string;
    status: 'created' | 'pending' | 'paid' | 'failed';
    provider: string;
    merchantTransactionId?: string;
    providerPaymentId?: string;
    razorpayPaymentId?: string;
    createdAt: string;
    plan?: { name?: string };
    user?: { name?: string; email?: string };
};

const statusStyles: Record<Payment['status'], string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    created: 'bg-blue-100 text-blue-700',
    failed: 'bg-rose-100 text-rose-700',
};

export default function TransactionHistory({ adminView = false }: { adminView?: boolean }) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('all');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const endpoint = adminView
                    ? `${API_URL}/api/payment/admin${status === 'all' ? '' : `?status=${status}`}`
                    : `${API_URL}/api/payment/mine`;
                const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Unable to load transactions');
                if (active) setPayments(adminView ? result.payments : result);
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : 'Unable to load transactions');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [adminView, status]);

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{adminView ? 'Transactions' : 'Payment history'}</h2>
                    <p className="mt-1 text-sm text-gray-500">{adminView ? 'Customer payments and gateway status.' : 'Your plan purchases and payment status.'}</p>
                </div>
                {adminView && (
                    <select aria-label="Filter transactions by status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                        <option value="all">All statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="created">Created</option>
                        <option value="failed">Failed</option>
                    </select>
                )}
            </div>
            {loading ? <p className="py-8 text-center text-sm text-gray-500">Loading transactions…</p>
                : error ? <p role="alert" className="py-6 text-center text-sm text-rose-600">{error}</p>
                    : payments.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">No transactions yet.</p>
                        : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
                            <thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400"><th className="pb-3 pr-4">Plan</th>{adminView && <th className="pb-3 pr-4">Customer</th>}<th className="pb-3 pr-4">Date</th><th className="pb-3 pr-4">Amount</th><th className="pb-3 pr-4">Provider</th><th className="pb-3 pr-4">Reference</th><th className="pb-3">Status</th></tr></thead>
                            <tbody>{payments.map((payment) => <tr key={payment._id} className="border-b border-gray-50 last:border-0">
                                <td className="py-4 pr-4 font-semibold text-gray-900">{payment.plan?.name || 'Training plan'}</td>
                                {adminView && <td className="py-4 pr-4 text-gray-600">{payment.user?.name || 'Unknown'}<span className="block text-xs text-gray-400">{payment.user?.email || ''}</span></td>}
                                <td className="py-4 pr-4 text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</td>
                                <td className="py-4 pr-4 font-semibold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</td>
                                <td className="py-4 pr-4 capitalize text-gray-600">{payment.provider}</td>
                                <td className="py-4 pr-4 font-mono text-xs text-gray-500">{payment.merchantTransactionId || payment.providerPaymentId || payment.razorpayPaymentId || payment._id}</td>
                                <td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[payment.status]}`}>{payment.status}</span></td>
                            </tr>)}</tbody>
                        </table></div>}
        </section>
    );
}
