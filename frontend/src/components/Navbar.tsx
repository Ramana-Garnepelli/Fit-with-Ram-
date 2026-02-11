'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Dumbbell } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    setIsLoggedIn(!!token);
    setRole(userRole);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isOpen || 'bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="bg-black p-2 rounded-xl shadow-lg">
              <Dumbbell className="text-[#00f2ea] w-6 h-6" />
            </div>
            <Link href="/" className="text-2xl font-black tracking-tighter text-gray-900">
              FITWITH<span className="text-[#00f2ea]">RAM</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-gray-600 hover:text-black font-medium transition-colors">Home</Link>
              <Link href="/programs" className="text-gray-600 hover:text-black font-medium transition-colors">Programs</Link>
              <Link href="/online-training" className="text-gray-600 hover:text-black font-medium transition-colors">Online</Link>
              <Link href="/offline-training" className="text-gray-600 hover:text-black font-medium transition-colors">Offline</Link>
              <Link href="/contact" className="text-gray-600 hover:text-black font-medium transition-colors">Contact</Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="text-gray-900 font-bold hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-600 px-5 py-2 rounded-full font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Join Now
              </Link>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:text-black focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-xl absolute w-full left-0 top-16">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="text-gray-900 block px-3 py-4 rounded-md text-lg font-bold border-b border-gray-50">Home</Link>
            <Link href="/programs" className="text-gray-900 block px-3 py-4 rounded-md text-lg font-bold border-b border-gray-50">Programs</Link>
            <Link href="/online-training" className="text-gray-900 block px-3 py-4 rounded-md text-lg font-bold border-b border-gray-50">Online Training</Link>
            <Link href="/offline-training" className="text-gray-900 block px-3 py-4 rounded-md text-lg font-bold border-b border-gray-50">Offline Training</Link>
            <Link href="/contact" className="text-gray-900 block px-3 py-4 rounded-md text-lg font-bold border-b border-gray-50">Contact</Link>
            {isLoggedIn ? (
              <div className="space-y-2 p-3">
                <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="block w-full text-center bg-blue-600 text-white px-3 py-4 rounded-xl font-bold">Dashboard</Link>
                <button onClick={handleLogout} className="block w-full text-center bg-red-50 text-red-600 px-3 py-4 rounded-xl font-bold">Logout</button>
              </div>
            ) : (
              <Link href="/login" className="block w-full text-center mt-4 bg-black text-white px-3 py-4 rounded-xl font-bold">Join Now</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
