"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import NFTCard from "@/components/NFTCard";
import { useOwnedNFTs } from "@/hooks/useBlockchain";
import { NFTS, MOCK_OFFERS, shortenAddress, formatQFC } from "@/lib/mock-data";

type Tab = "owned" | "listed" | "offers";

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [tab, setTab] = useState<Tab>("owned");

  const { data: onChainOwned, loading } = useOwnedNFTs(address);

  // Fall back to mock data
  const mockOwned = NFTS.filter((n) => n.owner === address);
  const owned = onChainOwned?.length ? onChainOwned : mockOwned;
  const listed = owned.filter((n) => n.listed);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "owned", label: "Owned", count: owned.length },
    { id: "listed", label: "Listed", count: listed.length },
    { id: "offers", label: "Offers", count: MOCK_OFFERS.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-800/30 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl">
            👤
          </div>
          <div>
            <h1 className="text-xl font-bold">{shortenAddress(address)}</h1>
            <p className="text-sm text-gray-400 break-all">{address}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-purple-400">{loading ? "..." : owned.length}</p>
            <p className="text-sm text-gray-400">Owned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{loading ? "..." : listed.length}</p>
            <p className="text-sm text-gray-400">Listed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">-</p>
            <p className="text-sm text-gray-400">Transactions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-800/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label} ({loading ? "..." : t.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-800/50" />
          ))}
        </div>
      ) : (
        <>
          {tab === "owned" && (
            owned.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No NFTs owned</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {owned.map((nft) => (
                  <NFTCard key={`${nft.collectionAddress}-${nft.tokenId}`} nft={nft} />
                ))}
              </div>
            )
          )}

          {tab === "listed" && (
            listed.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No active listings</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {listed.map((nft) => (
                  <NFTCard key={`${nft.collectionAddress}-${nft.tokenId}`} nft={nft} />
                ))}
              </div>
            )
          )}

          {tab === "offers" && (
            <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-800/30 p-4">
              {MOCK_OFFERS.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No offers</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400">
                      <th className="pb-3 pr-4">From</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_OFFERS.map((offer, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="py-3 pr-4 text-gray-300">{shortenAddress(offer.from)}</td>
                        <td className="py-3 pr-4 text-purple-400">{formatQFC(offer.amount)}</td>
                        <td className="py-3 text-gray-500">{new Date(offer.expiry).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
