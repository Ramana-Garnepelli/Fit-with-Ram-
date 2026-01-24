'use client';

import Navbar from '../../components/Navbar';

export default function Programs() {
    const programs = [
        {
            title: 'Muscle Building',
            desc: 'Hypertrophy focused training to pack on size.',
            image: '/uploads/ram_muscle.jpg',
        },
        {
            title: 'Fat Loss',
            desc: 'High intensity interval training and cardio.',
            image: '/uploads/ram_fatloss.jpg',
        },
        {
            title: 'Strength & Power',
            desc: 'Focus on compound movements to build raw strength.',
            image: '/uploads/ram_strength.jpg',
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-12 text-center text-[#00f2ea]">Our Training Programs</h1>
                <div className="grid md:grid-cols-3 gap-8">
                    {programs.map((prog) => (
                        <div key={prog.title} className="group relative overflow-hidden rounded-xl border border-gray-800">
                            <div className="aspect-w-16 aspect-h-9 h-64 bg-gray-800">
                                <img
                                    src={prog.image}
                                    alt={prog.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-80"
                                />
                            </div>
                            <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black via-black/50 to-transparent">
                                <h3 className="text-2xl font-bold mb-2">{prog.title}</h3>
                                <p className="text-gray-300">{prog.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
