"use client";

import { useState } from "react";
import { Contract, parseEther } from "ethers";
import { useWallet } from "@/context/WalletContext";
import {
  COLLECTION_FACTORY_ABI,
  FACTORY_ADDRESS,
} from "@/lib/contracts";

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export default function CreatePage() {
  const { isConnected, connect, signer } = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [maxSupply, setMaxSupply] = useState("");
  const [mintPrice, setMintPrice] = useState("");
  const [royalty, setRoyalty] = useState("");

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [newCollectionAddress, setNewCollectionAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTxHash(null);
    setNewCollectionAddress(null);

    if (!signer || !FACTORY_ADDRESS) {
      setErrorMsg("Wallet not connected or contract address not configured.");
      return;
    }

    try {
      setTxStatus("pending");

      const factory = new Contract(FACTORY_ADDRESS, COLLECTION_FACTORY_ABI, signer);

      // Fetch creation fee from the contract
      let creationFee = 0n;
      try {
        creationFee = await factory.creationFee();
      } catch {
        // If creationFee() reverts or doesn't exist, assume 0
      }

      const royaltyBps = Math.round(parseFloat(royalty) * 100); // e.g. 5% -> 500 bps
      const mintPriceWei = parseEther(mintPrice);

      const tx = await factory.createCollection(
        name,
        symbol,
        BigInt(maxSupply),
        mintPriceWei,
        BigInt(royaltyBps),
        { value: creationFee }
      );

      setTxHash(tx.hash);
      setTxStatus("confirming");

      const receipt = await tx.wait();
      setTxStatus("success");

      // Try to extract the new collection address from CollectionCreated event
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === "CollectionCreated") {
            setNewCollectionAddress(parsed.args[0]); // first arg is collection address
            break;
          }
        } catch {
          // skip logs that don't match
        }
      }
    } catch (err: unknown) {
      setTxStatus("error");
      const message = (err as { reason?: string; message?: string })?.reason
        || (err as { message?: string })?.message
        || "Transaction failed";
      setErrorMsg(message);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Create Collection</h1>
      <p className="mb-8 text-gray-400">Deploy a new NFT collection via the CollectionFactory contract</p>

      {/* Transaction status feedback */}
      {txStatus === "confirming" && (
        <div className="mb-6 rounded-lg border border-yellow-600/50 bg-yellow-600/10 p-4 text-yellow-400">
          <p className="font-medium">Transaction submitted, waiting for confirmation...</p>
          {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
        </div>
      )}
      {txStatus === "success" && (
        <div className="mb-6 rounded-lg border border-green-600/50 bg-green-600/10 p-4 text-green-400">
          <p className="font-medium">Collection deployed successfully!</p>
          {newCollectionAddress && (
            <p className="mt-1 text-sm break-all">Contract: {newCollectionAddress}</p>
          )}
          {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
        </div>
      )}
      {txStatus === "error" && errorMsg && (
        <div className="mb-6 rounded-lg border border-red-600/50 bg-red-600/10 p-4 text-red-400">
          <p className="font-medium">Transaction failed</p>
          <p className="mt-1 text-sm break-all">{errorMsg}</p>
        </div>
      )}

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
          disabled={txStatus === "pending" || txStatus === "confirming"}
          className="w-full rounded-xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {txStatus === "pending"
            ? "Submitting..."
            : txStatus === "confirming"
            ? "Confirming..."
            : "Deploy Collection"}
        </button>
      </form>
    </div>
  );
}
