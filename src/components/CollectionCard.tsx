"use client";

import Link from "next/link";
import { Collection, formatQFC } from "@/lib/mock-data";

export default function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.address}`}
      className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-800/50 transition hover:border-purple-500/50"
    >
      <div
        className="flex h-28 items-center justify-center"
        style={{ backgroundColor: collection.bannerColor + "44" }}
      >
        <span className="text-5xl">
          {collection.emoji || <span className="text-4xl font-bold text-white/40">{collection.name.charAt(0).toUpperCase()}</span>}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white">{collection.name}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-400">Floor</p>
            <p className="font-medium text-purple-400">{formatQFC(collection.floorPrice)}</p>
          </div>
          <div>
            <p className="text-gray-400">Volume</p>
            <p className="font-medium text-white">{formatQFC(collection.totalVolume)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
