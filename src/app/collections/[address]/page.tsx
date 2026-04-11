"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import NFTCard from "@/components/NFTCard";
import { useCollection, useCollectionNFTs } from "@/hooks/useBlockchain";
import { COLLECTIONS, NFTS, formatQFC } from "@/lib/mock-data";
import { shortenAddress } from "@/lib/mock-data";

export default function CollectionPage() {
  const params = useParams();
  const address = params.address as string;

  const { data: onChainCollection, loading: colLoading } = useCollection(address);
  const { data: onChainNFTs, loading: nftLoading } = useCollectionNFTs(
    address,
    onChainCollection?.name
  );

  // Fall back to mock data if on-chain fetch fails
  const mockCollection = COLLECTIONS.find((c) => c.address === address);
  const collection = onChainCollection ?? mockCollection;
  const nfts = onChainNFTs?.length ? onChainNFTs : NFTS.filter((n) => n.collectionAddress === address);
  const loading = colLoading || nftLoading;

  if (!loading && !collection) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-gray-400">Collection not found</p>
      </div>
    );
  }

  if (loading || !collection) {
    return (
      <div>
        <div className="flex h-48 items-center justify-center bg-gray-800/30 animate-pulse" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 -mt-12">
            <div className="mb-4 h-24 w-24 animate-pulse rounded-2xl bg-gray-800/50" />
            <div className="h-8 w-48 animate-pulse rounded bg-gray-800/50" />
          </div>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-800/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Generate initials for collections without emoji
  const displayChar = collection.emoji || collection.name.charAt(0).toUpperCase();

  return (
    <div>
      {/* Banner */}
      <div
        className="flex h-48 items-center justify-center"
        style={{ backgroundColor: collection.bannerColor + "44" }}
      >
        <span className="text-8xl">{displayChar}</span>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 -mt-12">
          <div
            className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-gray-900 text-4xl"
            style={{ backgroundColor: collection.logoColor }}
          >
            {displayChar}
          </div>
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{shortenAddress(address)}</p>
          <p className="mt-2 max-w-2xl text-gray-400">{collection.description}</p>
          <Link
            href={`/mint/${address}`}
            className="mt-3 inline-block rounded-xl bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 transition"
          >
            Mint NFT
          </Link>
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
        {nftLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-800/50" />
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No items in this collection yet</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nfts.map((nft) => (
              <NFTCard key={`${nft.collectionAddress}-${nft.tokenId}`} nft={nft} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
