import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Wallet, ethers } from 'ethers';
import lighthouse from '@lighthouse-web3/sdk';

const contractABI = [
  'function mintNFT(address recipient, string memory tokenURI) public'
];

const chainConfig = {
  "Polygon zkEVM Testnet": { rpc: process.env.POLYGON_RPC, contract: process.env.POLYGON_CONTRACT },
  "Arbitrum Goerli": { rpc: process.env.ARBITRUM_RPC, contract: process.env.ARBITRUM_CONTRACT },
  "Scroll Sepolia": { rpc: process.env.SCROLL_RPC, contract: process.env.SCROLL_CONTRACT },
  "Alfajores": { rpc: process.env.CELO_RPC, contract: process.env.CELO_CONTRACT },
  "Base Sepolia": { rpc: process.env.BASE_RPC, contract: process.env.BASE_CONTRACT },
  "Mantle Testnet": { rpc: process.env.MANTLE_RPC, contract: process.env.MANTLE_CONTRACT },
  "OKX X1": { rpc: process.env.X1_RPC, contract: process.env.X1_CONTRACT }
};

export const POST = async (req) => {
  const session = await getServerSession(authOptions);
  const { image_cid, nft_name, nft_description, chain } = await req.json();
  console.log('chain', chain)

  if (!chainConfig[chain]) {
    return new Response('Unsupported chain', { status: 400 });
  }

  const provider = new ethers.JsonRpcProvider(chainConfig[chain].rpc);
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    chainConfig[chain].contract,
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
