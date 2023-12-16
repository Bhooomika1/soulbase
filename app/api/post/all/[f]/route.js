import { connectToDB } from '@/utils/database';
import Post from '@/models/post';

export const GET = async (req, { params }) => {
  try {
    await connectToDB();

    const posts = await Post.find().populate('creator').sort({ timestamp: -1 });
    console.log("Received all posts request");

    if (!posts) return new Response('Posts not found', { status: 404 });

    return new Response(JSON.stringify(posts), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Failed to fetch posts', { status: 500 });
  }
};
