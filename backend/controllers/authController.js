const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const publicUser = (user) => {
    const value = user.toObject ? user.toObject() : user;
    delete value.password;
    return value;
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    const { name, password, phone } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        // Public registration must never grant elevated access based on an
        // unverified email address. Provision admins through the operator script.
        role: 'user',
    });

    if (user) {
        res.status(201).json({ ...publicUser(user), token: generateToken(user.id) });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        // Track login days
        const today = new Date().toISOString().split('T')[0];
        if (!user.loginDays.includes(today)) {
            user.loginDays.push(today);
            user.lastLogin = new Date();
            await user.save();
        }

        res.json({ ...publicUser(user), token: generateToken(user.id) });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Update user profile data (vitals)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (req.body.height !== undefined && req.body.height !== '') user.height = Number(req.body.height);
            if (req.body.weight !== undefined && req.body.weight !== '') {
                user.weightLog.push({ weight: req.body.weight });
            }

            const updatedUser = await user.save();

            res.json({ ...publicUser(updatedUser), token: generateToken(updatedUser.id) });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
};
