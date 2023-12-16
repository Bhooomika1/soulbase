import { connectToDB } from '@/utils/database';
import Post from '@/models/post';

export const GET = async (req, { params }) => {
  try {
    await connectToDB();

    const posts = await Post.find();

    let fileCIDs = [];
    for (const post of posts) {
      const response = await fetch(`${process.env.LIGHTHOUSE_GATEWAY}/${post.cid}`);
      if (response.ok) {
        const postData = await response.json();
        if (postData.files && postData.files.length > 0) {
          fileCIDs.push(postData.files[0].cid);
        }
      }
    }
    console.log("File CIDs:", fileCIDs);

    return new Response(JSON.stringify(fileCIDs), { status: 200, headers: {'Content-Type': 'application/json'} });
  } catch (error) {
    console.error(error);
    return new Response('Failed to fetch posts', { status: 500 });
  }
};
