import { connectToDB } from '@/utils/database';
import Post from '@/models/post';

const blockchainUrlMap = {
  "Polygon zkEVM Testnet": "https://testnet-zkevm.polygonscan.com/tx/",
  "Arbitrum Goerli": "https://goerli.arbiscan.io/tx/",
  "Scroll Sepolia": "https://sepolia-blockscout.scroll.io/tx/",
  "Alfajores": "https://explorer.celo.org/alfajores/tx/",
  "Base Sepolia": "https://base-sepolia.blockscout.com/tx/",
  "Mantle Testnet": "https://explorer.testnet.mantle.xyz/tx/",
  "OKX X1": "https://www.oklink.com/x1-test/tx/"
};

export const PATCH = async (req) => {
  try {
    await connectToDB();

    const { cid, blockchain, hash } = await req.json();

    if (!blockchainUrlMap[blockchain]) {
      return new Response(JSON.stringify({ error: 'Unsupported blockchain' }), { status: 400 });
    }

    const transactionUrl = blockchainUrlMap[blockchain] + hash;

    const post = await Post.findOne({ cid: cid });
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    post.transactionUrl = transactionUrl;
    await post.save();

    return new Response(JSON.stringify({ success: true, message: 'Transaction URL updated', transactionUrl }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
