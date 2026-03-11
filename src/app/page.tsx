"use client";

import Link from "next/link";
import NFTCard from "@/components/NFTCard";
import CollectionCard from "@/components/CollectionCard";
import ActivityTable from "@/components/ActivityTable";
import { NFTS, COLLECTIONS, ACTIVITIES } from "@/lib/mock-data";

export default function Home() {
  const featuredNFTs = NFTS.filter((n) => n.listed).slice(0, 4);
  const trendingCollections = [...COLLECTIONS].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 4);
  const recentSales = ACTIVITIES.filter((a) => a.type === "sale").slice(0, 5);

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
          <Link href="/explore" className="text-sm text-purple-400 hover:text-purple-300">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trendingCollections.map((col) => (
            <CollectionCard key={col.address} collection={col} />
          ))}
        </div>
      </section>

      {/* Featured NFTs */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured NFTs</h2>
          <Link href="/explore" className="text-sm text-purple-400 hover:text-purple-300">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredNFTs.map((nft) => (
            <NFTCard key={`${nft.collectionAddress}-${nft.tokenId}`} nft={nft} />
          ))}
        </div>
      </section>

      {/* Recent Sales */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">Recent Sales</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
          <ActivityTable activities={recentSales} />
        </div>
      </section>
    </div>
  );
}
