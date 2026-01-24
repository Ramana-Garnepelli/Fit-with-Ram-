import Navbar from '../../components/Navbar';

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-black text-gray-300">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-24">
                <h1 className="text-4xl font-bold text-white mb-8">Refund & Cancellation Policy</h1>
                <div className="space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold text-[#00f2ea] mb-4">No Refunds for Digital Products</h2>
                        <p>Due to the nature of digital content (workout and diet plans), all sales are final once the content has been accessed or downloaded.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[#00f2ea] mb-4">Exceptions</h2>
                        <p>If a technical error prevents you from accessing your plan, please contact us at support@fitwithram.com for a resolution.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
