'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const Hero = () => {
    return (
        <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black text-white">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-0" />

            {/* Dynamic Background Effect (Optional: could be an image or video) */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="sm:w-1/2"
                >
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
                        <span className="block text-gray-200">Transform Your Body</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ea] to-[#ff0050]">
                            With FitWithRAM
                        </span>
                    </h1>
                    <p className="mt-4 text-xl text-gray-400 max-w-lg mx-auto sm:mx-0">
                        Professional Online & Offline Training for Muscle Building, Fat Loss, and Strength. Join the elite team today.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                        <Link
                            href="/pricing"
                            className="px-8 py-4 text-lg font-bold rounded-full bg-gradient-to-r from-[#00f2ea] to-[#ff0050] text-black hover:scale-105 transition-transform"
                        >
                            Start Training
                        </Link>
                        <Link
                            href="/contact"
                            className="px-8 py-4 text-lg font-bold rounded-full border border-gray-500 hover:bg-white/10 transition-colors"
                        >
                            Contact Me
                        </Link>
                    </div>
                </motion.div>

                {/* Hero Image / Trainer Photo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-10 sm:mt-0 sm:w-1/2 flex justify-center"
                >
                    {/* Placeholder for Trainer Photo - You will replace this! */}
                    <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border-4 border-[#00f2ea]/30 overflow-hidden shadow-[0_0_50px_rgba(0,242,234,0.3)]">
                        {/* <img src="/trainer-photo.jpg" alt="FitWithRAM Trainer" className="object-cover w-full h-full" /> */}
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                            <span className="text-center p-4">Add Your Photo Here<br />(public/trainer.jpg)</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
