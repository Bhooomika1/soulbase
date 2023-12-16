import { connectToDB } from '@/utils/database';
import User from '@/models/user';

export const GET = async (req, { params }) => {
  try {
    await connectToDB();

    const users = await User.find().sort({ timestamp: -1 });
    console.log("Recieved users request")

    if (!users) return new Response('Users not found', { status: 404 });

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Failed to fetch users', { status: 500 });
  }
};
