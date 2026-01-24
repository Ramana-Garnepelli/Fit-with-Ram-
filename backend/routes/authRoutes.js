const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { passport, generateToken } = require('../config/passport');

// Email/Password routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Generate JWT token
        const token = generateToken(req.user);

        // Redirect to frontend with token
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }))}`);
    }
);

module.exports = router;
