import { connectToDB } from '@/utils/database';
import Profile from '@/models/profile';

export const GET = async (req) => {
  try {
    await connectToDB();

    const profiles = await Profile.find()
    console.log("Recieved profile request")

    if (!profiles) return new Response('Profiles not found', { status: 404 });

    return new Response(JSON.stringify(profiles), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Failed to get profiles', { status: 500 });
  }
};
