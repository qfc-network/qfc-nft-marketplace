"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import NFTCard from "@/components/NFTCard";
import PriceInput from "@/components/PriceInput";
import { NFTS } from "@/lib/mock-data";

export default function ListPage() {
  const { address, isConnected, connect } = useWallet();
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [listingType, setListingType] = useState<"fixed" | "auction">("fixed");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("24");

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="mb-4 text-4xl">🔗</p>
        <h1 className="mb-2 text-2xl font-bold">Connect Your Wallet</h1>
        <p className="mb-6 text-gray-400">Connect your wallet to list your NFTs for sale</p>
        <button
          onClick={connect}
          className="rounded-xl bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const ownedNFTs = NFTS.filter((n) => n.owner === address && !n.listed);
  const handleSubmit = () => {
    alert(`Listing submitted! Type: ${listingType}, Price: ${price} QFC${listingType === "auction" ? `, Duration: ${duration}h` : ""}`);
    setSelectedNFT(null);
    setPrice("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">List an NFT</h1>

      {/* Owned NFTs */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-300">Select an NFT to list</h2>
        {ownedNFTs.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-800/30 py-12 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-400">No unlisted NFTs in your wallet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ownedNFTs.map((nft) => (
              <div
                key={`${nft.collectionAddress}-${nft.tokenId}`}
                onClick={() => setSelectedNFT(selectedNFT === nft.tokenId ? null : nft.tokenId)}
                className={`cursor-pointer rounded-xl border-2 transition ${
                  selectedNFT === nft.tokenId
                    ? "border-purple-500 shadow-lg shadow-purple-500/20"
                    : "border-transparent"
                }`}
              >
                <NFTCard nft={nft} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Form */}
      {selectedNFT !== null && (
        <div className="mx-auto max-w-lg rounded-xl border border-gray-800 bg-gray-800/30 p-6">
          <h2 className="mb-6 text-xl font-bold">Listing Details</h2>

          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setListingType("fixed")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                listingType === "fixed"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Fixed Price
            </button>
            <button
              onClick={() => setListingType("auction")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                listingType === "auction"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Auction
            </button>
          </div>

          <div className="space-y-4">
            <PriceInput
              value={price}
              onChange={setPrice}
              label={listingType === "fixed" ? "Listing Price" : "Starting Price"}
            />

            {listingType === "auction" && (
              <div>
                <label className="mb-1 block text-sm text-gray-400">Duration (hours)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                >
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">7 days</option>
                </select>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!price || parseFloat(price) <= 0}
              className="mt-4 w-full rounded-xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {listingType === "fixed" ? "List for Sale" : "Start Auction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
