const jwt = require('jsonwebtoken');

// Generate JWT for user
const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

module.exports = { generateToken };
