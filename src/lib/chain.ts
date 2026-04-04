// ---------------------------------------------------------------------------
// chain.ts — helpers that wrap ethers.js contract calls
// ---------------------------------------------------------------------------
// All on-chain reads go through the JSON-RPC provider. Writes require a
// browser wallet (MetaMask / injected provider via window.ethereum).
// ---------------------------------------------------------------------------

import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import type { Signer, ContractRunner } from "ethers";

import {
  QRC_MARKETPLACE_ABI,
  AUCTION_HOUSE_ABI,
  COLLECTION_FACTORY_ABI,
  QFC_COLLECTION_ABI,
  MARKETPLACE_ADDRESS,
  AUCTION_ADDRESS,
  FACTORY_ADDRESS,
  RPC_URL,
} from "./contracts";

// ---------------------------------------------------------------------------
// Provider / Signer helpers
// ---------------------------------------------------------------------------

let _cachedProvider: JsonRpcProvider | null = null;

/** Returns a read-only JSON-RPC provider (singleton). */
export function getProvider(): JsonRpcProvider {
  if (!_cachedProvider) {
    _cachedProvider = new JsonRpcProvider(RPC_URL);
  }
  return _cachedProvider;
}

/**
 * Returns a signer from the injected browser wallet (e.g. MetaMask).
 * Throws if `window.ethereum` is not available.
 */
export async function getSigner(): Promise<Signer> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "No injected wallet found. Please install MetaMask or another browser wallet.",
    );
  }
  const browserProvider = new BrowserProvider(window.ethereum);
  return browserProvider.getSigner();
}

// ---------------------------------------------------------------------------
// Contract factories
// ---------------------------------------------------------------------------

/** QRCMarketplace contract instance. */
export function getMarketplace(signerOrProvider?: ContractRunner): Contract {
  return new Contract(
    MARKETPLACE_ADDRESS,
    QRC_MARKETPLACE_ABI,
    signerOrProvider ?? getProvider(),
  );
}

/** AuctionHouse contract instance. */
export function getAuctionHouse(signerOrProvider?: ContractRunner): Contract {
  return new Contract(
    AUCTION_ADDRESS,
    AUCTION_HOUSE_ABI,
    signerOrProvider ?? getProvider(),
  );
}

/** CollectionFactory contract instance. */
export function getFactory(signerOrProvider?: ContractRunner): Contract {
  return new Contract(
    FACTORY_ADDRESS,
    COLLECTION_FACTORY_ABI,
    signerOrProvider ?? getProvider(),
  );
}

/** Returns a QFCCollection (ERC-721) contract bound to a specific address. */
export function getCollection(
  address: string,
  signerOrProvider?: ContractRunner,
): Contract {
  return new Contract(
    address,
    QFC_COLLECTION_ABI,
    signerOrProvider ?? getProvider(),
  );
}

// ---------------------------------------------------------------------------
// Types returned by on-chain reads
// ---------------------------------------------------------------------------

export interface OnChainCollection {
  address: string;
  name: string;
  symbol: string;
  maxSupply: bigint;
  totalSupply: bigint;
  mintPrice: bigint;
}

export interface Listing {
  seller: string;
  price: bigint;
  standard: number;
  amount: bigint;
}

export interface NFTDetail {
  collectionAddress: string;
  tokenId: bigint;
  tokenURI: string;
  owner: string;
  listing: Listing | null;
}

// ---------------------------------------------------------------------------
// Data-fetching helpers
// ---------------------------------------------------------------------------

/**
 * Reads the CollectionFactory to enumerate all deployed collections and
 * fetches basic metadata (name, symbol, supply info) for each one.
 */
export async function fetchCollections(): Promise<OnChainCollection[]> {
  const provider = getProvider();
  const factory = getFactory(provider);

  const total: bigint = await factory.totalCollections();
  const count = Number(total);

  const collections: OnChainCollection[] = [];

  for (let i = 0; i < count; i++) {
    const addr: string = await factory.collections(i);
    const col = getCollection(addr, provider);

    const [name, symbol, maxSupply, totalSupply, mintPrice] = await Promise.all([
      col.name() as Promise<string>,
      col.symbol() as Promise<string>,
      col.maxSupply() as Promise<bigint>,
      col.totalSupply() as Promise<bigint>,
      col.mintPrice() as Promise<bigint>,
    ]);

    collections.push({ address: addr, name, symbol, maxSupply, totalSupply, mintPrice });
  }

  return collections;
}

/**
 * Fetches listed NFTs for a given collection (or all collections).
 *
 * TODO: This requires an indexer or subgraph to efficiently enumerate listed
 * tokens. The marketplace contract stores listings by (nftContract, tokenId)
 * but does not expose an enumeration function. For now this returns an empty
 * array. Wire up once an indexer / event-log scanner is available.
 */
export async function fetchListedNFTs(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _collectionAddress?: string,
): Promise<NFTDetail[]> {
  // TODO: Implement via indexer / subgraph. The on-chain `listings` mapping
  // cannot be iterated without knowing which tokenIds have been listed.
  return [];
}

/**
 * Reads on-chain data for a single NFT: tokenURI, current owner, and
 * whether it is currently listed on the marketplace.
 */
export async function fetchNFTDetail(
  collectionAddress: string,
  tokenId: bigint | number,
): Promise<NFTDetail> {
  const provider = getProvider();
  const col = getCollection(collectionAddress, provider);
  const marketplace = getMarketplace(provider);

  const id = BigInt(tokenId);

  const [tokenURI, owner, listingResult] = await Promise.all([
    col.tokenURI(id) as Promise<string>,
    col.ownerOf(id) as Promise<string>,
    marketplace.listings(collectionAddress, id) as Promise<
      [string, bigint, number, bigint]
    >,
  ]);

  const [seller, price, standard, amount] = listingResult;

  // A zero-address seller means the token is not listed.
  const isListed =
    seller !== "0x0000000000000000000000000000000000000000";

  return {
    collectionAddress,
    tokenId: id,
    tokenURI,
    owner,
    listing: isListed ? { seller, price, standard, amount } : null,
  };
}

/**
 * Fetches NFTs owned by a given user address.
 *
 * TODO: Requires iterating collections the user interacted with. Without an
 * indexer we would need to scan every collection's balanceOf / tokenOfOwnerByIndex,
 * which is expensive. Returns an empty array until an indexer is available.
 */
export async function fetchUserNFTs(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userAddress: string,
): Promise<NFTDetail[]> {
  // TODO: Implement via indexer or subgraph. Enumerating across all
  // collections on-chain is prohibitively expensive without knowing which
  // collections the user holds tokens in.
  return [];
}
