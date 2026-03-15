"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Contract, parseEther } from "ethers";
import { useWallet } from "@/context/WalletContext";
import ActivityTable from "@/components/ActivityTable";
import {
  NFTS, ACTIVITIES, MOCK_OFFERS,
  formatQFC, formatUSD, shortenAddress, timeAgo,
} from "@/lib/mock-data";
import {
  QRC_MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
} from "@/lib/contracts";

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export default function NFTDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const tokenId = parseInt(params.tokenId as string);
  const { isConnected, connect, signer } = useWallet();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nft = NFTS.find((n) => n.collectionAddress === address && n.tokenId === tokenId);
  const nftActivities = ACTIVITIES.filter(
    (a) => a.collectionAddress === address && a.tokenId === tokenId
  );

  if (!nft) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-gray-400">NFT not found</p>
      </div>
    );
  }

  const handleBuy = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (!signer || !MARKETPLACE_ADDRESS) {
      setErrorMsg("Wallet not connected or marketplace address not configured.");
      return;
    }

    if (!nft.price) return;

    setErrorMsg(null);
    setTxHash(null);

    try {
      setTxStatus("pending");

      const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, signer);
      const priceWei = parseEther(nft.price.toString());

      const tx = await marketplace.buyNFT(nft.collectionAddress, BigInt(nft.tokenId), {
        value: priceWei,
      });

      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
    } catch (err: unknown) {
      setTxStatus("error");
      const message = (err as { reason?: string; message?: string })?.reason
        || (err as { message?: string })?.message
        || "Transaction failed";
      setErrorMsg(message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left — Image */}
        <div>
          <div
            className="flex aspect-square items-center justify-center rounded-2xl text-[8rem]"
            style={{ backgroundColor: nft.bgColor + "33" }}
          >
            {nft.emoji}
          </div>
        </div>

        {/* Right — Details */}
        <div>
          <Link
            href={`/collections/${nft.collectionAddress}`}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            {nft.collection}
          </Link>
          <h1 className="mt-1 text-3xl font-bold">{nft.name} #{nft.tokenId}</h1>
          <p className="mt-2 text-sm text-gray-400">
            Owned by <span className="text-purple-400">{shortenAddress(nft.owner)}</span>
          </p>

          {/* Transaction status feedback */}
          {txStatus === "confirming" && (
            <div className="mt-4 rounded-lg border border-yellow-600/50 bg-yellow-600/10 p-4 text-yellow-400">
              <p className="font-medium">Transaction submitted, waiting for confirmation...</p>
              {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
            </div>
          )}
          {txStatus === "success" && (
            <div className="mt-4 rounded-lg border border-green-600/50 bg-green-600/10 p-4 text-green-400">
              <p className="font-medium">Purchase successful! The NFT is now yours.</p>
              {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
            </div>
          )}
          {txStatus === "error" && errorMsg && (
            <div className="mt-4 rounded-lg border border-red-600/50 bg-red-600/10 p-4 text-red-400">
              <p className="font-medium">Transaction failed</p>
              <p className="mt-1 text-sm break-all">{errorMsg}</p>
            </div>
          )}

          {/* Price & Buy */}
          {nft.listed && nft.price && (
            <div className="mt-6 rounded-xl border border-gray-800 bg-gray-800/30 p-6">
              <p className="text-sm text-gray-400">Current Price</p>
              <p className="mt-1 text-3xl font-bold text-purple-400">{formatQFC(nft.price)}</p>
              <p className="text-sm text-gray-500">{formatUSD(nft.price)}</p>
              <button
                onClick={handleBuy}
                disabled={txStatus === "pending" || txStatus === "confirming"}
                className="mt-4 w-full rounded-xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!isConnected
                  ? "Connect Wallet to Buy"
                  : txStatus === "pending"
                  ? "Submitting..."
                  : txStatus === "confirming"
                  ? "Confirming..."
                  : "Buy Now"}
              </button>
            </div>
          )}

          {/* Make Offer */}
          <button
            onClick={() => !isConnected && connect()}
            className="mt-4 w-full rounded-xl border border-purple-600 py-3 font-medium text-purple-400 hover:bg-purple-600/10 transition"
          >
            {isConnected ? "Make Offer" : "Connect Wallet to Make Offer"}
          </button>

          {/* Traits */}
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Traits</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {nft.traits.map((t) => (
                <div key={t.trait_type} className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-center">
                  <p className="text-xs text-purple-400">{t.trait_type}</p>
                  <p className="mt-1 text-sm font-medium text-white">{t.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rarity */}
          <div className="mt-6 flex items-center gap-2">
            <span className="text-sm text-gray-400">Rarity Score:</span>
            <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-bold text-yellow-400">
              {nft.rarity}
            </span>
          </div>
        </div>
      </div>

      {/* Offers Table */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Offers</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-800/30 p-4">
          {MOCK_OFFERS.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No offers yet</p>
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
                    <td className="py-3 text-gray-500">{timeAgo(offer.expiry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Activity History */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Activity</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
          <ActivityTable activities={nftActivities.length > 0 ? nftActivities : ACTIVITIES.slice(0, 3)} />
        </div>
      </section>
    </div>
  );
}
