'use client';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import BMICalculator from '../components/BMICalculator';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function Home() {
  const [featuredPrograms, setFeaturedPrograms] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/programs`);
        if (res.ok) {
          const data = await res.json();
          setFeaturedPrograms(data.slice(0, 3)); // Only show top 3 on home
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-gray-900">
      <Navbar />
      <Hero />

      {/* Featured Programs Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-4">
              Featured <span className="text-blue-600">Programs</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl font-medium">
              Elite training strategies used by professional athletes and champions.
            </p>
          </div>
          <Link href="/programs" className="flex items-center gap-2 group text-lg font-black uppercase tracking-widest text-black hover:text-blue-600 transition-colors">
            View All Programs <ChevronRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredPrograms.length === 0 ? (
            <div className="col-span-3 text-center py-20 text-gray-400 font-medium bg-white rounded-3xl border border-dashed border-gray-200">
              Loading elite programs...
            </div>
          ) : (
            featuredPrograms.map((prog) => (
              <div key={prog._id} className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-[500px]">
                <div className="h-64 overflow-hidden relative">
                  <img
                    src={prog.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop'}
                    alt={prog.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-black/90 backdrop-blur-md text-[#00f2ea] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {prog.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-black mb-2 text-gray-900">{prog.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                    {prog.description || "Transform your life with a custom training and nutrition protocol designed for your specific body type and goals."}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-900">₹{prog.price}</span>
                    <Link href="/pricing" className="text-black font-black uppercase tracking-widest text-xs hover:text-blue-600 transition-colors">
                      Enroll Now →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Gallery />
      <BMICalculator />

      <footer className="py-20 bg-white border-t border-gray-100 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="bg-black p-2 rounded-lg">
              <span className="text-[#00f2ea] font-black">R</span>
            </div>
            <span className="text-xl font-black tracking-tighter">FITWITH<span className="text-[#00f2ea]">RAM</span></span>
          </div>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 font-medium">
            Dedicated to helping you reach your maximum physical potential through science-based training and nutrition.
          </p>
          <div className="flex justify-center gap-8 mb-12">
            <Link href="/privacy" className="text-gray-500 hover:text-black font-bold text-xs uppercase tracking-widest">Privacy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-black font-bold text-xs uppercase tracking-widest">Terms</Link>
            <Link href="/refund" className="text-gray-500 hover:text-black font-bold text-xs uppercase tracking-widest">Refund</Link>
          </div>
          <p className="text-gray-300 text-[10px] uppercase tracking-[0.2em] font-black">© 2026 FitWithRAM. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
