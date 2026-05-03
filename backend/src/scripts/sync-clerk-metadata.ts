import { clerkClient } from '@clerk/express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env', override: true });

async function syncMetadata() {
    try {
        const userIds = [
            'user_3CIVJyUvYzNJ0fQ41mKgmHGXrwO',
            'user_3CIybuTs7IHM3MM8fPznbEDx87I' 
        ];

        for (const userId of userIds) {
            console.log(`Syncing Clerk Metadata for ${userId}...`);
            await clerkClient.users.updateUser(userId, {
                publicMetadata: {
                    role: 'parent'
                }
            });
            console.log(`Successfully updated Clerk Metadata for ${userId}`);
        }

        // Also ensure they are parents in MongoDB
        await mongoose.connect(process.env.MONGO_URI!);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        
        await User.updateMany(
            { clerkId: { $in: userIds } },
            { $set: { role: 'parent' } }
        );
        console.log("MongoDB roles updated too.");
        await mongoose.disconnect();

    } catch (err) {
        console.error("Sync Error:", err);
    }
}

syncMetadata();
