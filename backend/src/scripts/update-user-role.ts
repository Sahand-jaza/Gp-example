import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

async function changeRole() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("Connected to DB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        const result = await User.updateOne(
            { clerkId: 'user_3CIVJyUvYzNJ0fQ41mKgmHGXrwO' },
            { 
                $set: { 
                    role: 'parent',
                    permissions: ['view:student_stats', 'view:student_profile', 'manage:student_connection']
                } 
            }
        );

        if (result.matchedCount > 0) {
            console.log("Successfully updated role to 'parent' for user_3CIVJyUvYzNJ0fQ41mKgmHGXrwO");
        } else {
            console.log("User not found!");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

changeRole();
