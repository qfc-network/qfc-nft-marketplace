"use client";

import Link from "next/link";
import NFTCard from "@/components/NFTCard";
import CollectionCard from "@/components/CollectionCard";
import ActivityTable from "@/components/ActivityTable";
import { useCollections, useRecentActivity } from "@/hooks/useBlockchain";
import { NFTS, COLLECTIONS, ACTIVITIES } from "@/lib/mock-data";
import { FACTORY_ADDRESS } from "@/lib/contracts";
import { useState, useEffect } from "react";
import type { NFT } from "@/lib/mock-data";
import { fetchCollectionNFTs } from "@/lib/blockchain";

export default function Home() {
  const hasContracts = !!FACTORY_ADDRESS;
  const { data: onChainCollections, loading: colLoading } = useCollections();
  const { data: onChainActivity, loading: actLoading } = useRecentActivity(5);

  const [onChainNFTs, setOnChainNFTs] = useState<NFT[]>([]);
  const [nftLoading, setNftLoading] = useState(true);

  // Fetch NFTs from all on-chain collections
  useEffect(() => {
    if (!onChainCollections?.length) {
      setNftLoading(false);
      return;
    }
    let cancelled = false;
    setNftLoading(true);
    Promise.all(
      onChainCollections.slice(0, 8).map((c) => fetchCollectionNFTs(c.address, c.name))
    ).then((results) => {
      if (!cancelled) {
        setOnChainNFTs(results.flat());
        setNftLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setNftLoading(false);
    });
    return () => { cancelled = true; };
  }, [onChainCollections]);

  // Use on-chain data if available, fall back to mock
  const collections = hasContracts && onChainCollections?.length ? onChainCollections : COLLECTIONS;
  const allNFTs = hasContracts && onChainNFTs.length ? onChainNFTs : NFTS;
  const activities = hasContracts && onChainActivity?.length ? onChainActivity : ACTIVITIES;

  const featuredNFTs = allNFTs.filter((n) => n.listed).slice(0, 4);
  const trendingCollections = [...collections]
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 4);
  const recentSales = activities.filter((a) => a.type === "sale").slice(0, 5);

  const loading = hasContracts && (colLoading || nftLoading || actLoading);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="mb-16 rounded-2xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-8 text-center md:p-16">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          Discover, Collect & Trade <span className="text-purple-400">NFTs</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
          The premier NFT marketplace on the QFC blockchain. Buy, sell, and create unique digital collectibles.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/explore"
            className="rounded-xl bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 transition"
          >
            Explore NFTs
          </Link>
          <Link
            href="/create"
            className="rounded-xl border border-purple-600 px-6 py-3 font-medium text-purple-400 hover:bg-purple-600/10 transition"
          >
            Create Collection
          </Link>
        </div>
      </section>

      {/* Trending Collections */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trending Collections</h2>
          <Link href="/explore" className="text-sm text-purple-400 hover:text-purple-300">View all &rarr;</Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-800/50" />
            ))}
          </div>
        ) : trendingCollections.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No collections yet. Be the first to create one!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trendingCollections.map((col) => (
              <CollectionCard key={col.address} collection={col} />
            ))}
          </div>
        )}
      </section>

      {/* Featured NFTs */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured NFTs</h2>
          <Link href="/explore" className="text-sm text-purple-400 hover:text-purple-300">View all &rarr;</Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-800/50" />
            ))}
          </div>
        ) : featuredNFTs.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No listed NFTs yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredNFTs.map((nft) => (
              <NFTCard key={`${nft.collectionAddress}-${nft.tokenId}`} nft={nft} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Sales */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">Recent Sales</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-800/50" />
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No sales yet.</p>
          ) : (
            <ActivityTable activities={recentSales} />
          )}
        </div>
      </section>
    </div>
  );
}
