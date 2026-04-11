// ---------------------------------------------------------------------------
// On-chain read functions — fetches real data from deployed contracts
// ---------------------------------------------------------------------------
// Uses a read-only JsonRpcProvider so data loads without wallet connection.
// All functions gracefully return empty/default values on error so the UI
// never crashes even if the RPC is unreachable.
// ---------------------------------------------------------------------------

import { Contract, JsonRpcProvider, formatEther } from "ethers";
import {
  COLLECTION_FACTORY_ABI,
  QFC_COLLECTION_ABI,
  QRC_MARKETPLACE_ABI,
  AUCTION_HOUSE_ABI,
  FACTORY_ADDRESS,
  MARKETPLACE_ADDRESS,
  AUCTION_ADDRESS,
  RPC_URL,
} from "./contracts";
import type { NFT, Collection, Activity } from "./mock-data";

// ---------------------------------------------------------------------------
// Provider (singleton — shared across all reads)
// ---------------------------------------------------------------------------

let _provider: JsonRpcProvider | null = null;

function getProvider(): JsonRpcProvider {
  if (!_provider) {
    _provider = new JsonRpcProvider(RPC_URL);
  }
  return _provider;
}

// ---------------------------------------------------------------------------
// Collections — read from CollectionFactory
// ---------------------------------------------------------------------------

export interface OnChainCollection {
  address: string;
  name: string;
  symbol: string;
  totalSupply: number;
  maxSupply: number;
  mintPrice: string; // formatted ether
  // Stats that require indexer — use defaults for now
  floorPrice: number;
  totalVolume: number;
  owners: number;
}

/** Fetch all collections created through the Factory. */
export async function fetchCollections(): Promise<Collection[]> {
  if (!FACTORY_ADDRESS) return [];
  const provider = getProvider();
  const factory = new Contract(FACTORY_ADDRESS, COLLECTION_FACTORY_ABI, provider);

  let total: number;
  try {
    total = Number(await factory.totalCollections());
  } catch {
    return [];
  }

  const collections: Collection[] = [];

  for (let i = 0; i < total; i++) {
    try {
      const addr: string = await factory.collections(BigInt(i));
      const col = new Contract(addr, QFC_COLLECTION_ABI, provider);

      const [name, symbol, totalSupply, maxSupply, mintPrice] = await Promise.all([
        col.name() as Promise<string>,
        col.symbol() as Promise<string>,
        col.totalSupply().then(Number).catch(() => 0),
        col.maxSupply().then(Number).catch(() => 0),
        col.mintPrice().then((v: bigint) => formatEther(v)).catch(() => "0"),
      ]);

      collections.push({
        address: addr,
        name,
        symbol,
        description: `${name} — a collection of ${maxSupply} NFTs on the QFC blockchain.`,
        emoji: "",
        bannerColor: generateColor(addr),
        logoColor: generateColor(addr, 30),
        floorPrice: parseFloat(mintPrice) || 0,
        totalVolume: 0,
        owners: 0,
        items: maxSupply || Number(totalSupply),
      });
    } catch {
      // skip broken collections
    }
  }

  return collections;
}

/** Fetch a single collection's metadata by address. */
export async function fetchCollection(address: string): Promise<Collection | null> {
  const provider = getProvider();
  const col = new Contract(address, QFC_COLLECTION_ABI, provider);

  try {
    const [name, symbol, totalSupply, maxSupply, mintPrice] = await Promise.all([
      col.name() as Promise<string>,
      col.symbol() as Promise<string>,
      col.totalSupply().then(Number).catch(() => 0),
      col.maxSupply().then(Number).catch(() => 0),
      col.mintPrice().then((v: bigint) => formatEther(v)).catch(() => "0"),
    ]);

    return {
      address,
      name,
      symbol,
      description: `${name} — a collection of ${maxSupply} NFTs on the QFC blockchain.`,
      emoji: "",
      bannerColor: generateColor(address),
      logoColor: generateColor(address, 30),
      floorPrice: parseFloat(mintPrice) || 0,
      totalVolume: 0,
      owners: 0,
      items: maxSupply || totalSupply,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// NFTs — read from individual ERC-721 collection contracts
// ---------------------------------------------------------------------------

/** Fetch all minted NFTs in a collection (via ERC721Enumerable). */
export async function fetchCollectionNFTs(
  collectionAddress: string,
  collectionName?: string
): Promise<NFT[]> {
  const provider = getProvider();
  const col = new Contract(collectionAddress, QFC_COLLECTION_ABI, provider);

  let totalSupply: number;
  try {
    totalSupply = Number(await col.totalSupply());
  } catch {
    return [];
  }

  const name = collectionName ?? (await col.name().catch(() => "Unknown"));

  // Batch fetch — cap at 100 to avoid huge RPC load
  const cap = Math.min(totalSupply, 100);
  const nfts: NFT[] = [];

  const promises = Array.from({ length: cap }, async (_, i) => {
    try {
      const tokenId = Number(await col.tokenByIndex(BigInt(i)));
      const owner: string = await col.ownerOf(BigInt(tokenId));

      // Try to fetch listing from marketplace
      let price: number | undefined;
      let listed = false;
      if (MARKETPLACE_ADDRESS) {
        try {
          const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, provider);
          const listing = await marketplace.listings(collectionAddress, BigInt(tokenId));
          const listingPrice = listing[1]; // price field
          if (listingPrice > 0n) {
            price = parseFloat(formatEther(listingPrice));
            listed = true;
          }
        } catch {
          // not listed
        }
      }

      return {
        tokenId,
        name: `${name} #${tokenId}`,
        emoji: "",
        bgColor: generateColor(collectionAddress),
        collection: name,
        collectionAddress,
        owner,
        price,
        rarity: 0,
        traits: [],
        listed,
      } satisfies NFT;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  for (const r of results) {
    if (r) nfts.push(r);
  }

  return nfts;
}

/** Fetch a single NFT's on-chain data. */
export async function fetchNFT(
  collectionAddress: string,
  tokenId: number
): Promise<NFT | null> {
  const provider = getProvider();
  const col = new Contract(collectionAddress, QFC_COLLECTION_ABI, provider);

  try {
    const [owner, collectionName, tokenURI] = await Promise.all([
      col.ownerOf(BigInt(tokenId)) as Promise<string>,
      col.name() as Promise<string>,
      col.tokenURI(BigInt(tokenId)).catch(() => "") as Promise<string>,
    ]);

    // Check marketplace listing
    let price: number | undefined;
    let listed = false;
    if (MARKETPLACE_ADDRESS) {
      try {
        const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, provider);
        const listing = await marketplace.listings(collectionAddress, BigInt(tokenId));
        const listingPrice = listing[1];
        if (listingPrice > 0n) {
          price = parseFloat(formatEther(listingPrice));
          listed = true;
        }
      } catch {
        // not listed
      }
    }

    // Try to fetch metadata from tokenURI
    let traits: { trait_type: string; value: string }[] = [];
    let nftName = `${collectionName} #${tokenId}`;
    if (tokenURI) {
      try {
        const metadataUrl = tokenURI.startsWith("ipfs://")
          ? tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
          : tokenURI;
        const resp = await fetch(metadataUrl, { signal: AbortSignal.timeout(5000) });
        const meta = await resp.json();
        if (meta.name) nftName = meta.name;
        if (Array.isArray(meta.attributes)) {
          traits = meta.attributes.map((a: { trait_type?: string; value?: string }) => ({
            trait_type: a.trait_type ?? "",
            value: String(a.value ?? ""),
          }));
        }
      } catch {
        // metadata unavailable
      }
    }

    return {
      tokenId,
      name: nftName,
      emoji: "",
      bgColor: generateColor(collectionAddress),
      collection: collectionName,
      collectionAddress,
      owner,
      price,
      rarity: 0,
      traits,
      listed,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Listings — read active listing info from Marketplace
// ---------------------------------------------------------------------------

export interface ListingInfo {
  seller: string;
  price: string; // formatted ether
  priceRaw: bigint;
  isActive: boolean;
}

export async function fetchListing(
  nftContract: string,
  tokenId: number
): Promise<ListingInfo | null> {
  if (!MARKETPLACE_ADDRESS) return null;
  const provider = getProvider();
  const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, provider);

  try {
    const listing = await marketplace.listings(nftContract, BigInt(tokenId));
    const seller = listing[0] as string;
    const priceRaw = listing[1] as bigint;

    if (priceRaw === 0n) return null;

    return {
      seller,
      price: formatEther(priceRaw),
      priceRaw,
      isActive: true,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auctions — read from AuctionHouse
// ---------------------------------------------------------------------------

export interface AuctionInfo {
  auctionId: number;
  seller: string;
  nftContract: string;
  tokenId: number;
  auctionType: number; // 0 = English, 1 = Dutch
  startPrice: string;
  endPrice: string;
  reservePrice: string;
  startTime: number;
  endTime: number;
  highestBidder: string;
  highestBid: string;
  settled: boolean;
}

export async function fetchAuction(auctionId: number): Promise<AuctionInfo | null> {
  if (!AUCTION_ADDRESS) return null;
  const provider = getProvider();
  const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, provider);

  try {
    const a = await auctionHouse.auctions(BigInt(auctionId));
    // Skip if seller is zero address (auction doesn't exist)
    if (a[0] === "0x0000000000000000000000000000000000000000") return null;
    return {
      auctionId,
      seller: a[0],
      nftContract: a[1],
      tokenId: Number(a[2]),
      auctionType: Number(a[5]),
      startPrice: formatEther(a[6]),
      endPrice: formatEther(a[7]),
      reservePrice: formatEther(a[8]),
      startTime: Number(a[9]),
      endTime: Number(a[10]),
      highestBidder: a[11],
      highestBid: formatEther(a[12]),
      settled: a[13],
    };
  } catch {
    return null;
  }
}

/** Find the active auction for a specific NFT by querying AuctionCreated events. */
export async function fetchNFTAuction(
  nftContract: string,
  tokenId: number
): Promise<AuctionInfo | null> {
  if (!AUCTION_ADDRESS) return null;
  const provider = getProvider();
  const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, provider);

  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000);

    // Query AuctionCreated events filtered by nftContract and tokenId
    const filter = auctionHouse.filters.AuctionCreated(null, nftContract, BigInt(tokenId));
    const events = await auctionHouse.queryFilter(filter, fromBlock, currentBlock);

    if (events.length === 0) return null;

    // Get the most recent auction
    const latestEvent = events[events.length - 1];
    const log = latestEvent as unknown as { args: [bigint, string, bigint, string, number, bigint, bigint] };
    const auctionId = Number(log.args[0]);

    // Fetch full auction data
    const auction = await fetchAuction(auctionId);
    if (!auction || auction.settled) return null;

    return auction;
  } catch {
    return null;
  }
}

/** Get current Dutch auction price. */
export async function fetchDutchAuctionPrice(auctionId: number): Promise<string | null> {
  if (!AUCTION_ADDRESS) return null;
  const provider = getProvider();
  const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, provider);

  try {
    const price = await auctionHouse.getDutchAuctionPrice(BigInt(auctionId));
    return formatEther(price);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Profile — fetch NFTs owned by a specific address across all collections
// ---------------------------------------------------------------------------

export async function fetchOwnedNFTs(ownerAddress: string): Promise<NFT[]> {
  // First get all collections, then check balance in each
  const collections = await fetchCollections();
  const provider = getProvider();
  const allNFTs: NFT[] = [];

  for (const collection of collections) {
    const col = new Contract(collection.address, QFC_COLLECTION_ABI, provider);
    try {
      const balance = Number(await col.balanceOf(ownerAddress));
      for (let i = 0; i < balance && i < 50; i++) {
        try {
          const tokenId = Number(await col.tokenOfOwnerByIndex(ownerAddress, BigInt(i)));

          // Check listing
          let price: number | undefined;
          let listed = false;
          if (MARKETPLACE_ADDRESS) {
            try {
              const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, provider);
              const listing = await marketplace.listings(collection.address, BigInt(tokenId));
              if (listing[1] > 0n) {
                price = parseFloat(formatEther(listing[1]));
                listed = true;
              }
            } catch {
              // not listed
            }
          }

          allNFTs.push({
            tokenId,
            name: `${collection.name} #${tokenId}`,
            emoji: "",
            bgColor: collection.bannerColor,
            collection: collection.name,
            collectionAddress: collection.address,
            owner: ownerAddress,
            price,
            rarity: 0,
            traits: [],
            listed,
          });
        } catch {
          // skip
        }
      }
    } catch {
      // collection doesn't support balanceOf or enumerable
    }
  }

  return allNFTs;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a deterministic hex color from an address string. */
function generateColor(address: string, offset = 0): string {
  let hash = offset;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 50%)`;
}

// ---------------------------------------------------------------------------
// Event-based activity (recent marketplace events)
// ---------------------------------------------------------------------------

export async function fetchRecentActivity(limit = 20): Promise<Activity[]> {
  if (!MARKETPLACE_ADDRESS) return [];
  const provider = getProvider();
  const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, provider);

  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 5000); // last ~5000 blocks

    const [soldEvents, listedEvents] = await Promise.all([
      marketplace.queryFilter(marketplace.filters.NFTSold(), fromBlock, currentBlock).catch(() => []),
      marketplace.queryFilter(marketplace.filters.NFTListed(), fromBlock, currentBlock).catch(() => []),
    ]);

    const activities: Activity[] = [];

    for (const ev of soldEvents) {
      const log = ev as unknown as { args: [string, bigint, string, bigint]; blockNumber: number };
      const block = await provider.getBlock(log.blockNumber);
      activities.push({
        type: "sale",
        nftName: `NFT #${Number(log.args[1])}`,
        from: "",
        to: log.args[2],
        price: parseFloat(formatEther(log.args[3])),
        timestamp: (block?.timestamp ?? 0) * 1000,
        collectionAddress: log.args[0],
        tokenId: Number(log.args[1]),
      });
    }

    for (const ev of listedEvents) {
      const log = ev as unknown as { args: [string, bigint, string, bigint]; blockNumber: number };
      const block = await provider.getBlock(log.blockNumber);
      activities.push({
        type: "list",
        nftName: `NFT #${Number(log.args[1])}`,
        from: log.args[2],
        to: "",
        price: parseFloat(formatEther(log.args[3])),
        timestamp: (block?.timestamp ?? 0) * 1000,
        collectionAddress: log.args[0],
        tokenId: Number(log.args[1]),
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  } catch {
    return [];
  }
}
