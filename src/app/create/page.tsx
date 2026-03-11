"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";

export default function CreatePage() {
  const { isConnected, connect } = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [maxSupply, setMaxSupply] = useState("");
  const [mintPrice, setMintPrice] = useState("");
  const [royalty, setRoyalty] = useState("");

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="mb-4 text-4xl">🔗</p>
        <h1 className="mb-2 text-2xl font-bold">Connect Your Wallet</h1>
        <p className="mb-6 text-gray-400">Connect your wallet to create a new collection</p>
        <button
          onClick={connect}
          className="rounded-xl bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Collection created!\nName: ${name}\nSymbol: ${symbol}\nMax Supply: ${maxSupply}\nMint Price: ${mintPrice} QFC\nRoyalty: ${royalty}%`
    );
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Create Collection</h1>
      <p className="mb-8 text-gray-400">Deploy a new NFT collection via the CollectionFactory contract</p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-800 bg-gray-800/30 p-6">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Collection Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quantum Foxes"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Symbol</label>
          <input
            type="text"
            required
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. QFOX"
            maxLength={10}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white uppercase outline-none placeholder:text-gray-500 placeholder:normal-case focus:border-purple-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Max Supply</label>
          <input
            type="number"
            required
            min="1"
            value={maxSupply}
            onChange={(e) => setMaxSupply(e.target.value)}
            placeholder="e.g. 10000"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Mint Price (QFC)</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={mintPrice}
            onChange={(e) => setMintPrice(e.target.value)}
            placeholder="e.g. 0.5"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Royalty %</label>
          <input
            type="number"
            required
            min="0"
            max="25"
            step="0.1"
            value={royalty}
            onChange={(e) => setRoyalty(e.target.value)}
            placeholder="e.g. 5"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <p className="mt-1 text-xs text-gray-500">Max 25%. Applied on secondary sales.</p>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 transition"
        >
          Deploy Collection
        </button>
      </form>
    </div>
  );
}
