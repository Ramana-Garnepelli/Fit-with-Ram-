import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import BMICalculator from '../components/BMICalculator';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <BMICalculator />

      {/* Footer Placeholder */}
      <footer className="py-8 text-center text-gray-500 border-t border-gray-900">
        <p>© 2026 FitWithRAM. All rights reserved.</p>
      </footer>
    </main>
  );
}
