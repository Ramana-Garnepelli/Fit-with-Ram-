'use client';

import Link from 'next/link';

const Hero = () => {
    return (
        <div className="relative bg-white pt-24 md:pt-0 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center gap-12 min-h-[70vh] py-12 md:py-20">

                    {/* Left Content */}
                    <div className="flex-1 text-center md:text-left z-10">
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-tight uppercase">
                            BUILD <span className="text-blue-600">YOUR</span> <br />
                            DREAM BODY
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-lg mx-auto md:mx-0">
                            Professional coaching tailored to your lifestyle. <br className="hidden md:block" />
                            Join clients who transformed their lives.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link href="/programs" className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl text-center">
                                Start Transformation
                            </Link>
                            <Link href="/contact" className="border-2 border-black text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-black hover:text-white transition-all text-center">
                                Book Consultation
                            </Link>
                        </div>
                    </div>

                    {/* Right Image - Total View */}
                    <div className="flex-1 w-full relative">
                        <div className="relative h-[400px] md:h-[550px] w-full bg-[#f8f9fa] rounded-3xl overflow-hidden border border-gray-100 shadow-2xl transition-transform hover:scale-[1.02] duration-500">
                            <img
                                src="/uploads/RAMANAGYMPIC-2.jpg"
                                alt="Ram Fitness"
                                className="w-full h-full object-contain p-4"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop';
                                }}
                            />
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full bg-blue-100 rounded-3xl opacity-50 blur-xl"></div>
                    </div>
                </div>
            </div>

            {/* Branding background text */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[15rem] font-black text-gray-50 -z-10 select-none hidden lg:block opacity-40">
                FITNESS
            </div>
        </div>
    );
};

export default Hero;
