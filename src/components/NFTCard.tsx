"use client";

import Link from "next/link";
import { NFT, formatQFC } from "@/lib/mock-data";

export default function NFTCard({ nft }: { nft: NFT }) {
  return (
    <Link
      href={`/nft/${nft.collectionAddress}/${nft.tokenId}`}
      className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-800/50 transition hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
    >
      <div
        className="flex h-48 items-center justify-center text-6xl"
        style={{ backgroundColor: nft.bgColor + "33" }}
      >
        <span className="transition-transform group-hover:scale-110">{nft.emoji}</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-400">{nft.collection}</p>
        <p className="mt-1 font-semibold text-white">{nft.name} #{nft.tokenId}</p>
        <div className="mt-3 flex items-center justify-between">
          {nft.price ? (
            <div>
              <p className="text-xs text-gray-400">Price</p>
              <p className="text-sm font-medium text-purple-400">{formatQFC(nft.price)}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400">Not listed</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-gray-400">Rarity</p>
            <p className="text-sm font-medium text-yellow-400">{nft.rarity}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
