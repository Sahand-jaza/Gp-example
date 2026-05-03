import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env', override: true });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const user = await User.findOne({ clerkId: 'user_3CIVJyUvYzNJ0fQ41mKgmHGXrwO' });

        if (user) {
            console.log("User Found:", JSON.stringify(user, null, 2));
        } else {
            console.log("User NOT found in database.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
