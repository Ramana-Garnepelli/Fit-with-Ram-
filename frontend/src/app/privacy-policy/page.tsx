import Navbar from '../../components/Navbar';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-gray-300">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-24">
                <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
                <div className="space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold text-[#00f2ea] mb-4">Data Collection</h2>
                        <p>We collect your name, email, phone number, and physical metrics (height, weight) to provide personalized training.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-[#00f2ea] mb-4">Data Usage</h2>
                        <p>Your data is used solely for generating training plans and processing payments. We do not sell your data.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
