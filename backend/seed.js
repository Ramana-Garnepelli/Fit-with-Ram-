require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('./models/planModel');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fitwithram');
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const seedPlans = async () => {
    await connectDB();

    const plans = [
        {
            name: 'Muscle Building',
            price: 500,
            type: 'muscle_building',
            description: 'Hypertrophy focused program to pack on size.',
            features: ['Custom Workout Split', 'Macronutrient Guide', 'Form Analysis', '24/7 Whatsapp Support'],
            duration: 30,
            mode: 'online',
            image: "/uploads/RAMANAGYMPIC-1.jpg"
        },
        {
            name: 'Fat Loss',
            price: 500,
            type: 'fat_loss',
            description: 'High intensity shredding program.',
            features: ['HIIT Workouts', 'Calorie Deficit Diet', 'Cardio Protocol', '24/7 Whatsapp Support'],
            duration: 30,
            mode: 'online',
            image: "/uploads/RAMANAGYMPIC-2.jpg"
        },
        {
            name: 'Strength Training',
            price: 600,
            type: 'strength',
            description: 'Develop raw strength and power.',
            features: ['Powerlifting Focus', 'Mobility Drills', 'Advanced Techniques', 'Priority Support'],
            duration: 30,
            mode: 'online',
            image: "/uploads/RAMANAGYMPIC-3.jpg"
        }
    ];

    try {
        await Plan.deleteMany();
        console.log('Plans cleared');

        await Plan.insertMany(plans);
        console.log('Plans Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedPlans();
