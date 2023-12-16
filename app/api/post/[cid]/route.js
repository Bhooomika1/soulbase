import { connectToDB } from '@/utils/database';
import Post from '@/models/post';
import User from '@/models/user';

export const GET = async (req, { params }) => {
  try {
    await connectToDB();

    const post = await Post.findOne({ cid: params.cid }).populate('creator');
    if (!post) {
      return new Response('Post not found', { status: 404 });
    }

    const response = await fetch(`${process.env.LIGHTHOUSE_GATEWAY}/${post.cid}`);
    if (!response.ok) {
      return new Response('Failed to fetch post data', { status: 500 });
    }

    const postData = await response.json();
    if (!postData.files || postData.files.length === 0) {
      return new Response('No image found for this post', { status: 404 });
    }

    const fileCID = postData.files[0].cid;

    return new Response(JSON.stringify({ cid: fileCID, content: postData.content }), {
      status: 200, headers: {'Content-Type': 'application/json'}
    });
  } catch (error) {
    console.error(error);
    return new Response('Failed to fetch post', { status: 500 });
  }
};
