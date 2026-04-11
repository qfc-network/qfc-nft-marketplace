"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Contract, JsonRpcProvider, formatEther } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { useCollection } from "@/hooks/useBlockchain";
import { shortenAddress } from "@/lib/mock-data";
import {
  QFC_COLLECTION_ABI,
  RPC_URL,
} from "@/lib/contracts";

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export default function MintPage() {
  const params = useParams();
  const collectionAddress = params.address as string;
  const { isConnected, connect, signer } = useWallet();

  const { data: collection, loading: colLoading } = useCollection(collectionAddress);

  const [quantity, setQuantity] = useState(1);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch live supply info
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [maxSupply, setMaxSupply] = useState<number | null>(null);
  const [mintPrice, setMintPrice] = useState<bigint | null>(null);

  // Fetch on-chain supply data
  useEffect(() => {
    if (!collectionAddress) return;
    const provider = new JsonRpcProvider(RPC_URL);
    const col = new Contract(collectionAddress, QFC_COLLECTION_ABI, provider);

    Promise.all([
      col.totalSupply().then(Number).catch(() => null),
      col.maxSupply().then(Number).catch(() => null),
      col.mintPrice().then((v: bigint) => v).catch(() => null),
    ]).then(([ts, ms, mp]) => {
      setTotalSupply(ts);
      setMaxSupply(ms);
      setMintPrice(mp);
    });
  }, [collectionAddress]);

  const handleMint = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!signer) {
      setErrorMsg("Wallet not connected.");
      return;
    }

    setErrorMsg(null);
    setTxHash(null);

    try {
      setTxStatus("pending");

      const col = new Contract(collectionAddress, QFC_COLLECTION_ABI, signer);

      // Calculate total cost
      const price = mintPrice ?? 0n;
      const totalCost = price * BigInt(quantity);

      const tx = await col.publicMint(BigInt(quantity), { value: totalCost });

      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");

      // Refresh supply
      if (totalSupply !== null) {
        setTotalSupply(totalSupply + quantity);
      }
    } catch (err: unknown) {
      setTxStatus("error");
      const message =
        (err as { reason?: string; message?: string })?.reason ||
        (err as { message?: string })?.message ||
        "Transaction failed";
      setErrorMsg(message);
    }
  };

  if (colLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-800/50 mb-4" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-800/50" />
      </div>
    );
  }

  const displayChar = collection?.emoji || collection?.name?.charAt(0).toUpperCase() || "?";
  const priceFormatted = mintPrice !== null ? formatEther(mintPrice) : "...";
  const totalCostFormatted =
    mintPrice !== null ? formatEther(mintPrice * BigInt(quantity)) : "...";
  const soldOut = maxSupply !== null && totalSupply !== null && totalSupply >= maxSupply;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Collection header */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ backgroundColor: collection?.bannerColor ?? "#6b21a8" }}
        >
          {displayChar}
        </div>
        <div>
          <Link
            href={`/collections/${collectionAddress}`}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            View Collection
          </Link>
          <h1 className="text-2xl font-bold">{collection?.name ?? shortenAddress(collectionAddress)}</h1>
          <p className="text-sm text-gray-500">{shortenAddress(collectionAddress)}</p>
        </div>
      </div>

      {/* Supply progress */}
      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-800/30 p-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Minted</span>
          <span>
            {totalSupply ?? "..."} / {maxSupply ?? "..."}
          </span>
        </div>
        {maxSupply !== null && totalSupply !== null && (
          <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, (totalSupply / maxSupply) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Tx feedback */}
      {txStatus === "confirming" && (
        <div className="mb-6 rounded-lg border border-yellow-600/50 bg-yellow-600/10 p-4 text-yellow-400">
          <p className="font-medium">Transaction submitted, waiting for confirmation...</p>
          {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
        </div>
      )}
      {txStatus === "success" && (
        <div className="mb-6 rounded-lg border border-green-600/50 bg-green-600/10 p-4 text-green-400">
          <p className="font-medium">Minted successfully!</p>
          {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
          <Link
            href={`/collections/${collectionAddress}`}
            className="mt-2 inline-block text-sm underline"
          >
            View in collection
          </Link>
        </div>
      )}
      {txStatus === "error" && errorMsg && (
        <div className="mb-6 rounded-lg border border-red-600/50 bg-red-600/10 p-4 text-red-400">
          <p className="font-medium">Transaction failed</p>
          <p className="mt-1 text-sm break-all">{errorMsg}</p>
        </div>
      )}

      {/* Mint form */}
      <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-6 space-y-5">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Mint Price</label>
          <p className="text-2xl font-bold text-purple-400">
            {priceFormatted} QFC
            <span className="ml-2 text-sm font-normal text-gray-500">per NFT</span>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 transition"
            >
              -
            </button>
            <span className="w-12 text-center text-xl font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 transition"
            >
              +
            </button>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
            <span>Total Cost</span>
            <span className="text-lg font-bold text-white">{totalCostFormatted} QFC</span>
          </div>
        </div>

        <button
          onClick={handleMint}
          disabled={soldOut || txStatus === "pending" || txStatus === "confirming"}
          className="w-full rounded-xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!isConnected
            ? "Connect Wallet to Mint"
            : soldOut
            ? "Sold Out"
            : txStatus === "pending"
            ? "Submitting..."
            : txStatus === "confirming"
            ? "Confirming..."
            : `Mint ${quantity} NFT${quantity > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
