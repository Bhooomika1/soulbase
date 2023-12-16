import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Wallet, ethers } from 'ethers';
import lighthouse from '@lighthouse-web3/sdk';

const contractABI = [
  'function mintNFT(address recipient, string memory tokenURI) public'
];

const rpc = process.env.POLYGON_RPC;
const contractAddress = process.env.POLYGON_CONTRACT;

export const POST = async (req) => {
  const session = await getServerSession(authOptions);
  const { image_cid, nft_name, nft_description } = await req.json();

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    contractAddress,
    contractABI,
    wallet
  );

  const metadata = {
    "name": nft_name,
    "description": nft_description,
    "image": `${process.env.LIGHTHOUSE_GATEWAY}/${image_cid}`
  };

  try {
    const response = await lighthouse.uploadText(
      JSON.stringify(metadata),
      process.env.LIGHTHOUSE_API_KEY
    );

    const tokenURI = `${process.env.LIGHTHOUSE_GATEWAY}/${response.data.Hash}`;

    const tx = await contract.mintNFT(
      session.user.address,
      tokenURI
    );

    const receipt = await tx.wait();

    return new Response(JSON.stringify({ success: true, receipt }), {
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('Failed to mint NFT', { status: 500 });
  }
};
