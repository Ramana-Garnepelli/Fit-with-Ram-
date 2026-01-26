'use client';

import { useState } from 'react';

const BMICalculator = () => {
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bmi, setBmi] = useState<number | null>(null);
    const [category, setCategory] = useState('');

    const calculateBMI = (e: React.FormEvent) => {
        e.preventDefault();
        if (!height || !weight) return;

        let h = parseFloat(height);
        const w = parseFloat(weight);

        // Smart Unit Detection:
        // If height is less than 3.0, assume user entered Meters.
        // Otherwise, assume CM and convert to Meters.
        if (h > 3.0) {
            h = h / 100;
        }

        if (h <= 0 || w <= 0) {
            alert("Please enter valid positive numbers");
            return;
        }

        const bmiValue = w / (h * h);

        setBmi(parseFloat(bmiValue.toFixed(1)));

        if (bmiValue < 18.5) setCategory('Underweight');
        else if (bmiValue < 24.9) setCategory('Normal Weight');
        else if (bmiValue < 29.9) setCategory('Overweight');
        else setCategory('Obese');
    };

    const getCategoryColor = () => {
        if (category === 'Underweight') return 'text-blue-400';
        if (category === 'Normal Weight') return 'text-green-400';
        if (category === 'Overweight') return 'text-yellow-400';
        if (category === 'Obese') return 'text-red-500';
        return 'text-white';
    };

    return (
        <section className="py-24 bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
                    <h2 className="text-3xl font-black text-center mb-10 text-gray-900">BMI CALCULATOR</h2>

                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <form onSubmit={calculateBMI} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Height (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    placeholder="e.g. 175"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00f2ea] transition-all font-bold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g. 70"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#00f2ea] transition-all font-bold"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-black text-white font-black py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                Calculate Now
                            </button>
                        </form>

                        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
                            {bmi ? (
                                <div className="space-y-4">
                                    <p className="text-gray-500 font-medium">Your BMI Score</p>
                                    <p className="text-6xl font-black text-gray-900">{bmi}</p>
                                    <p className={`text-2xl font-bold ${category === 'Obese' ? 'text-red-500' :
                                            category === 'Overweight' ? 'text-orange-500' :
                                                category === 'Normal Weight' ? 'text-green-600' : 'text-blue-500'
                                        }`}>
                                        {category}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-4">
                                        Target BMI: 18.5 - 24.9
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <p className="text-lg">Enter your details to see your health status.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BMICalculator;
