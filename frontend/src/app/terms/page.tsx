import Navbar from '../../components/Navbar';

export default function Terms() {
    return (
        <div className="min-h-screen bg-black text-gray-300">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-24">
                <h1 className="text-4xl font-bold text-white mb-8">Terms and Conditions</h1>
                <div className="space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold text-[#00f2ea] mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing FitWithRAM, you agree to be bound by these Terms and Conditions.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[#00f2ea] mb-4">2. Medical Disclaimer</h2>
                        <p>Consult a physician before starting any workout or diet plan. FitWithRAM is not responsible for any injuries or health issues.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[#00f2ea] mb-4">3. Payments & Services</h2>
                        <p>All payments for plans are final unless otherwise stated in the Refund Policy. Services are provided digitally.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
