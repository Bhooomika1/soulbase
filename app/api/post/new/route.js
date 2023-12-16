import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { connectToDB } from '@/utils/database';
import lighthouse from '@lighthouse-web3/sdk';
import User from '@/models/user';
import Post from '@/models/post';

export const POST = async (req) => {
  await connectToDB();

  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: session missing' }),
      { status: 401 }
    );
  }

  if (!session.user.address) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: user.address missing' }),
      { status: 401 }
    );
  }

  const { postData } = await req.json();
  const { content, files, replyingTo, chain } = postData;
  console.log('Post Data:', postData);

  if (!postData) {
    return new Response(JSON.stringify({ error: 'Content is required' }), {
      status: 400,
    });
  }

  try {
    const pinData = {
      content,
      files,
    };

    if (replyingTo) {
      let updatedReplyingTo = [replyingTo];

      const user = await User.findOne({ address: replyingTo.address });
      if (user) {
        replyingTo.username = user.username;

        const response = await fetch(
          `${process.env.PINATA_GATEWAY}/${replyingTo.cid}`
        );
        if (response.ok) {
          const fetchedContent = await response.json();
          if (fetchedContent.replyingTo) {
            updatedReplyingTo = [
              ...updatedReplyingTo,
              ...fetchedContent.replyingTo,
            ];
            updatedReplyingTo = updatedReplyingTo.filter(
              (item, index, self) =>
                index ===
                self.findIndex(
                  (t) => t.cid === item.cid && t.address === item.address
                )
            );
          }
        }
      }
      pinData.replyingTo = updatedReplyingTo;
    }

    const result = await lighthouse.uploadText(
      JSON.stringify(pinData),
      process.env.LIGHTHOUSE_API_KEY
    )

    if (result.data) {
      let postCreationData = {
        creator: session.user.id,
        cid: result.data.Hash,
        blockchain: chain
      };

      if (pinData.replyingTo) {
        postCreationData.replyingTo = pinData.replyingTo.map((reply) => ({
          cid: reply.cid,
          address: reply.address,
        }));
      }

      await Post.create(postCreationData);

      return new Response(JSON.stringify({ success: true, postCreationData }), {
        status: 200,
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to upload to Lighthouse' }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);
    return new Response(error, { status: 500 });
  }
};
