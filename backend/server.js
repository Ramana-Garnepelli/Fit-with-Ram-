require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Plan = require('./models/planModel');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL,
        'https://fitwithram.com',
        'https://www.fitwithram.com'
    ].filter(Boolean),
    credentials: true
}));
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP in dev to avoid blocking local fetches
}));
app.use(morgan('dev'));

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Database Connection
const connectDB = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitwithram';
        const conn = await mongoose.connect(dbUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log('Failed to connect to configured MongoDB.');
        console.log('Starting In-Memory MongoDB...');
        try {
            const mongod = await MongoMemoryServer.create({
                instance: {
                    dbName: 'fitwithram'
                },
                binary: {
                    version: '6.0.5', // Specify a stable version
                }
            });
            const uri = mongod.getUri();
            const conn = await mongoose.connect(uri);
            console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
        } catch (err) {
            console.error('CRITICAL: In-Memory MongoDB failed to start.');
            console.error(err);
            process.exit(1);
        }
    }
};

const seedData = async () => {
    const plansCount = await Plan.countDocuments();
    if (plansCount === 0) {
        const plans = [
            {
                name: 'Muscle Building',
                price: 500,
                type: 'muscle_building',
                description: 'Hypertrophy focused program to pack on size.',
                features: ['Custom Workout Split', 'Macronutrient Guide', 'Form Analysis', '24/7 Whatsapp Support'],
                duration: 30,
                mode: 'online',
                isActive: true,
                image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
            },
            {
                name: 'Fat Loss',
                price: 500,
                type: 'fat_loss',
                description: 'High intensity shredding program.',
                features: ['HIIT Workouts', 'Calorie Deficit Diet', 'Cardio Protocol', '24/7 Whatsapp Support'],
                duration: 30,
                mode: 'online',
                isActive: true,
                image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop"
            },
            {
                name: 'Strength Training',
                price: 600,
                type: 'strength',
                description: 'Develop raw strength and power.',
                features: ['Powerlifting Focus', 'Mobility Drills', 'Advanced Techniques', 'Priority Support'],
                duration: 30,
                mode: 'online',
                isActive: true,
                image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
            }
        ];
        await Plan.insertMany(plans);
        console.log('Seed: Initial plans created');
    }
};

// Routes
app.get('/', (req, res) => {
    res.send('FitWithRAM API is running...');
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const dietRoutes = require('./routes/dietRoutes');
const progressRoutes = require('./routes/progressRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/progress', progressRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    await seedData();
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
});
