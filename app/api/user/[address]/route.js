import { connectToDB } from '@/utils/database';
import User from '@/models/user';

export const GET = async (req, { params }) => {
  try {
    await connectToDB();

    const user = await User.findOne({ address: params.address });

    if(!user) return new Response('User not found', { status: 404 });

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new Response("Failed to get users", { status: 500 });
  }
}
