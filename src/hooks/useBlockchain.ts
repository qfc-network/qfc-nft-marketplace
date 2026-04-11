"use client";

import { useState, useEffect, useCallback } from "react";
import type { NFT, Collection, Activity } from "@/lib/mock-data";
import {
  fetchCollections,
  fetchCollection,
  fetchCollectionNFTs,
  fetchNFT,
  fetchOwnedNFTs,
  fetchRecentActivity,
  fetchListing,
  fetchNFTAuction,
  fetchDutchAuctionPrice,
  type ListingInfo,
  type AuctionInfo,
} from "@/lib/blockchain";

// ---------------------------------------------------------------------------
// Generic async hook
// ---------------------------------------------------------------------------

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to fetch data");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/** Fetch all collections from the CollectionFactory contract. */
export function useCollections(): AsyncState<Collection[]> {
  return useAsync(() => fetchCollections(), []);
}

/** Fetch a single collection by address. */
export function useCollection(address: string): AsyncState<Collection> {
  return useAsync(
    () =>
      fetchCollection(address).then((c) => {
        if (!c) throw new Error("Collection not found");
        return c;
      }),
    [address]
  );
}

// ---------------------------------------------------------------------------
// NFTs
// ---------------------------------------------------------------------------

/** Fetch all NFTs in a collection (ERC721Enumerable). */
export function useCollectionNFTs(
  collectionAddress: string,
  collectionName?: string
): AsyncState<NFT[]> {
  return useAsync(
    () => fetchCollectionNFTs(collectionAddress, collectionName),
    [collectionAddress, collectionName]
  );
}

/** Fetch a single NFT by collection address + token ID. */
export function useNFT(
  collectionAddress: string,
  tokenId: number
): AsyncState<NFT> {
  return useAsync(
    () =>
      fetchNFT(collectionAddress, tokenId).then((n) => {
        if (!n) throw new Error("NFT not found");
        return n;
      }),
    [collectionAddress, tokenId]
  );
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** Fetch all NFTs owned by an address across all collections. */
export function useOwnedNFTs(ownerAddress: string | null): AsyncState<NFT[]> {
  return useAsync(
    () => (ownerAddress ? fetchOwnedNFTs(ownerAddress) : Promise.resolve([])),
    [ownerAddress]
  );
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

/** Fetch listing info for a specific NFT. */
export function useListing(
  nftContract: string,
  tokenId: number
): AsyncState<ListingInfo | null> {
  return useAsync(() => fetchListing(nftContract, tokenId), [nftContract, tokenId]);
}

// ---------------------------------------------------------------------------
// Auctions
// ---------------------------------------------------------------------------

/** Find active auction for a specific NFT. */
export function useNFTAuction(
  nftContract: string,
  tokenId: number
): AsyncState<AuctionInfo | null> {
  return useAsync(() => fetchNFTAuction(nftContract, tokenId), [nftContract, tokenId]);
}

/** Fetch current Dutch auction price (updates on refetch). */
export function useDutchAuctionPrice(auctionId: number | null): AsyncState<string | null> {
  return useAsync(
    () => (auctionId !== null ? fetchDutchAuctionPrice(auctionId) : Promise.resolve(null)),
    [auctionId]
  );
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/** Fetch recent marketplace activity from on-chain events. */
export function useRecentActivity(limit = 20): AsyncState<Activity[]> {
  return useAsync(() => fetchRecentActivity(limit), [limit]);
}
