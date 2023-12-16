import { Alchemy, Network } from "alchemy-sdk";

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
});

export const GET = async (req, { params }) => {
  const owner = params.owner;
  let allNfts = [];
  let pageKey;

  try {
    do {
      const response = await alchemy.nft.getNftsForOwner(owner, { pageKey });
      const nfts = response.ownedNfts.map(extractNftData);
      allNfts = [...allNfts, ...nfts];

      pageKey = response.pageKey;
    } while (pageKey);

    return new Response(JSON.stringify(allNfts), { status: 200 });
    
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch NFTs." }), {
      status: 500,
    });
  }
}

const extractNftData = (nft) => {
  const data = {};

  if (nft.title) data.name = nft.title;
  if (nft.description) data.description = nft.description;
  if (nft.contract && nft.contract.symbol) data.symbol = nft.contract.symbol;
  if (nft.rawMetadata && nft.rawMetadata.image) data.image = nft.rawMetadata.image;
  if (nft.contract && nft.contract.address) data.contractAddress = nft.contract.address;
  if (nft.tokenId) data.tokenId = nft.tokenId;
  if (nft.tokenType) data.tokenType = nft.tokenType;

  return data;
};
