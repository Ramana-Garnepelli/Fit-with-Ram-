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

        const h = parseFloat(height) / 100; // convert cm to m
        const w = parseFloat(weight);
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
        <section className="py-20 bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-black/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-md shadow-xl">
                    <h2 className="text-3xl font-bold text-center mb-8">BMI Calculator</h2>

                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <form onSubmit={calculateBMI} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Height (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    placeholder="e.g. 175"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00f2ea] transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g. 70"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00f2ea] transition-colors"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#00f2ea] text-black font-bold py-3 rounded-lg hover:bg-[#00d2ca] transition-colors"
                            >
                                Calculate Now
                            </button>
                        </form>

                        <div className="text-center p-6 bg-gray-800/50 rounded-xl">
                            {bmi ? (
                                <div className="space-y-4">
                                    <p className="text-gray-400">Your BMI Score</p>
                                    <p className="text-6xl font-black text-white">{bmi}</p>
                                    <p className={`text-2xl font-bold ${getCategoryColor()}`}>
                                        {category}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-4">
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
