const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists, return them
                return done(null, user);
            }

            // Check if this is the first user (make them admin)
            const isFirstAccount = (await User.countDocuments({})) === 0;
            const role = isFirstAccount ? 'admin' : 'user';

            // Create new user
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                password: 'google-oauth-no-password', // Google users don't need password
                phone: '',
                role
            });

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Generate JWT for user
const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

module.exports = { passport, generateToken };
