require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!process.env.MONGODB_URI || !email) {
    console.error('Set MONGODB_URI and ADMIN_EMAIL in the backend environment before promoting an admin.');
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOneAndUpdate(
            { email },
            { $set: { role: 'admin' } },
            { new: true }
        ).select('_id email role');

        if (!user) {
            throw new Error(`No account exists for ${email}. Create the account first, then run this command.`);
        }

        console.log(`Admin access granted to ${user.email}.`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
