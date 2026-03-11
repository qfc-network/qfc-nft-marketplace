"use client";

import { useParams } from "next/navigation";
import NFTCard from "@/components/NFTCard";
import { COLLECTIONS, NFTS, formatQFC } from "@/lib/mock-data";

export default function CollectionPage() {
  const params = useParams();
  const address = params.address as string;
  const collection = COLLECTIONS.find((c) => c.address === address);
  const nfts = NFTS.filter((n) => n.collectionAddress === address);

  if (!collection) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-gray-400">Collection not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div
        className="flex h-48 items-center justify-center"
        style={{ backgroundColor: collection.bannerColor + "44" }}
      >
        <span className="text-8xl">{collection.emoji}</span>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 -mt-12">
          <div
            className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-gray-900 text-4xl"
            style={{ backgroundColor: collection.logoColor }}
          >
            {collection.emoji}
          </div>
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          <p className="mt-2 max-w-2xl text-gray-400">{collection.description}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Floor Price", value: formatQFC(collection.floorPrice), color: "text-purple-400" },
            { label: "Total Volume", value: formatQFC(collection.totalVolume), color: "text-green-400" },
            { label: "Owners", value: collection.owners.toLocaleString(), color: "text-blue-400" },
            { label: "Items", value: collection.items.toLocaleString(), color: "text-yellow-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-800/30 p-4 text-center">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className={`mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* NFT Grid */}
        <h2 className="mb-4 text-xl font-bold">Items</h2>
        {nfts.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No items in this collection</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nfts.map((nft) => (
              <NFTCard key={nft.tokenId} nft={nft} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
