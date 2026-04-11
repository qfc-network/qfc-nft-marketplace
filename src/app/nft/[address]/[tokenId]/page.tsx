"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Contract, parseEther } from "ethers";
import { useWallet } from "@/context/WalletContext";
import ActivityTable from "@/components/ActivityTable";
import PriceInput from "@/components/PriceInput";
import Countdown from "@/components/Countdown";
import { useNFT, useRecentActivity, useNFTAuction, useDutchAuctionPrice } from "@/hooks/useBlockchain";
import {
  NFTS, ACTIVITIES, MOCK_OFFERS,
  formatQFC, formatUSD, shortenAddress,
} from "@/lib/mock-data";
import {
  QRC_MARKETPLACE_ABI,
  AUCTION_HOUSE_ABI,
  MARKETPLACE_ADDRESS,
  AUCTION_ADDRESS,
} from "@/lib/contracts";

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export default function NFTDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const tokenId = parseInt(params.tokenId as string);
  const { address: walletAddress, isConnected, connect, signer } = useWallet();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [auctionEnded, setAuctionEnded] = useState(false);

  const { data: onChainNFT, loading, refetch } = useNFT(address, tokenId);
  const { data: onChainActivity } = useRecentActivity(10);
  const { data: auction, refetch: refetchAuction } = useNFTAuction(address, tokenId);
  const { data: dutchPrice, refetch: refetchDutchPrice } = useDutchAuctionPrice(
    auction?.auctionType === 1 ? auction.auctionId : null
  );

  // Auto-refresh Dutch price every 10s
  useEffect(() => {
    if (auction?.auctionType !== 1 || auctionEnded) return;
    const interval = setInterval(() => refetchDutchPrice(), 10000);
    return () => clearInterval(interval);
  }, [auction, auctionEnded, refetchDutchPrice]);

  // Fall back to mock data
  const mockNFT = NFTS.find((n) => n.collectionAddress === address && n.tokenId === tokenId);
  const nft = onChainNFT ?? mockNFT;

  const nftActivities = onChainActivity?.filter(
    (a) => a.collectionAddress.toLowerCase() === address.toLowerCase() && a.tokenId === tokenId
  ) ?? ACTIVITIES.filter(
    (a) => a.collectionAddress === address && a.tokenId === tokenId
  );

  const isOwner = walletAddress && nft?.owner
    ? walletAddress.toLowerCase() === nft.owner.toLowerCase()
    : false;

  const isAuctionSeller = walletAddress && auction
    ? walletAddress.toLowerCase() === auction.seller.toLowerCase()
    : false;

  const isEnglish = auction?.auctionType === 0;
  const isDutch = auction?.auctionType === 1;

  const handleAuctionEnd = useCallback(() => setAuctionEnded(true), []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-gray-800/50" />
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-800/50" />
            <div className="h-8 w-64 animate-pulse rounded bg-gray-800/50" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-800/50" />
            <div className="mt-6 h-32 animate-pulse rounded-xl bg-gray-800/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-gray-400">NFT not found</p>
      </div>
    );
  }

  const resetTxState = () => {
    setTxStatus("idle");
    setTxHash(null);
    setErrorMsg(null);
  };

  // --- Marketplace handlers ---

  const handleBuy = async () => {
    if (!isConnected) { connect(); return; }
    if (!signer || !MARKETPLACE_ADDRESS || !nft.price) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, signer);
      const tx = await marketplace.buyNFT(nft.collectionAddress, BigInt(nft.tokenId), {
        value: parseEther(nft.price.toString()),
      });
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      refetch();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const handleMakeOffer = async () => {
    if (!isConnected) { connect(); return; }
    if (!signer || !MARKETPLACE_ADDRESS || !offerAmount || parseFloat(offerAmount) <= 0) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, signer);
      const amountWei = parseEther(offerAmount);
      const tx = await marketplace.makeOffer(address, BigInt(tokenId), amountWei, { value: amountWei });
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      setShowOfferModal(false);
      setOfferAmount("");
      refetch();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const handleCancelOffer = async () => {
    if (!signer || !MARKETPLACE_ADDRESS) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, signer);
      const tx = await marketplace.cancelOffer(address, BigInt(tokenId));
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      refetch();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const handleCancelListing = async () => {
    if (!signer || !MARKETPLACE_ADDRESS) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, signer);
      const tx = await marketplace.cancelListing(address, BigInt(tokenId));
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      refetch();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const handleAcceptOffer = async (offeror: string) => {
    if (!signer || !MARKETPLACE_ADDRESS) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, signer);
      const tx = await marketplace.acceptOffer(address, BigInt(tokenId), offeror);
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      refetch();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  // --- Auction handlers ---

  const handlePlaceBid = async () => {
    if (!isConnected) { connect(); return; }
    if (!signer || !AUCTION_ADDRESS || !auction || !bidAmount) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, signer);
      const tx = await auctionHouse.placeBid(BigInt(auction.auctionId), {
        value: parseEther(bidAmount),
      });
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      setBidAmount("");
      refetchAuction();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const handleBuyDutch = async () => {
    if (!isConnected) { connect(); return; }
    if (!signer || !AUCTION_ADDRESS || !auction || !dutchPrice) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, signer);
      const tx = await auctionHouse.buyDutchAuction(BigInt(auction.auctionId), {
        value: parseEther(dutchPrice),
      });
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      refetch();
      refetchAuction();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const handleSettleAuction = async () => {
    if (!signer || !AUCTION_ADDRESS || !auction) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, signer);
      const tx = await auctionHouse.settleAuction(BigInt(auction.auctionId));
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      refetch();
      refetchAuction();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const handleCancelAuction = async () => {
    if (!signer || !AUCTION_ADDRESS || !auction) return;
    resetTxState();
    try {
      setTxStatus("pending");
      const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, signer);
      const tx = await auctionHouse.cancelAuction(BigInt(auction.auctionId));
      setTxHash(tx.hash);
      setTxStatus("confirming");
      await tx.wait();
      setTxStatus("success");
      refetch();
      refetchAuction();
    } catch (err: unknown) {
      setTxStatus("error");
      setErrorMsg((err as { reason?: string })?.reason || (err as { message?: string })?.message || "Transaction failed");
    }
  };

  const displayChar = nft.emoji || nft.name.charAt(0).toUpperCase();
  const minBid = auction
    ? parseFloat(auction.highestBid) > 0
      ? (parseFloat(auction.highestBid) * 1.05).toFixed(4) // 5% increment
      : auction.startPrice
    : "0";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left — Image */}
        <div>
          <div
            className="flex aspect-square items-center justify-center rounded-2xl text-[8rem]"
            style={{ backgroundColor: nft.bgColor + "33" }}
          >
            {nft.emoji ? displayChar : (
              <span className="text-[6rem] font-bold text-white/30">{displayChar}</span>
            )}
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
          <h1 className="mt-1 text-3xl font-bold">{nft.name}</h1>
          <p className="mt-2 text-sm text-gray-400">
            Owned by{" "}
            <Link href={`/profile/${nft.owner}`} className="text-purple-400 hover:text-purple-300">
              {isOwner ? "you" : shortenAddress(nft.owner)}
            </Link>
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
              <p className="font-medium">Transaction successful!</p>
              {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
            </div>
          )}
          {txStatus === "error" && errorMsg && (
            <div className="mt-4 rounded-lg border border-red-600/50 bg-red-600/10 p-4 text-red-400">
              <p className="font-medium">Transaction failed</p>
              <p className="mt-1 text-sm break-all">{errorMsg}</p>
            </div>
          )}

          {/* ============================================================= */}
          {/* AUCTION UI                                                     */}
          {/* ============================================================= */}
          {auction && !auction.settled && (
            <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
                  {isEnglish ? "English Auction" : "Dutch Auction"}
                </span>
                <Countdown endTime={auction.endTime} onEnd={handleAuctionEnd} />
              </div>

              {/* English Auction */}
              {isEnglish && (
                <>
                  <div>
                    <p className="text-sm text-gray-400">
                      {parseFloat(auction.highestBid) > 0 ? "Current Bid" : "Starting Price"}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-blue-400">
                      {parseFloat(auction.highestBid) > 0
                        ? formatQFC(parseFloat(auction.highestBid))
                        : formatQFC(parseFloat(auction.startPrice))}
                    </p>
                    {parseFloat(auction.highestBid) > 0 && (
                      <p className="text-sm text-gray-500">
                        by {shortenAddress(auction.highestBidder)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Reserve: {formatQFC(parseFloat(auction.reservePrice))}
                    </p>
                  </div>

                  {!auctionEnded && !isAuctionSeller && (
                    <div className="space-y-3">
                      <PriceInput
                        value={bidAmount}
                        onChange={setBidAmount}
                        label={`Bid Amount (min ${minBid} QFC)`}
                      />
                      <button
                        onClick={handlePlaceBid}
                        disabled={!bidAmount || parseFloat(bidAmount) < parseFloat(minBid) || txStatus === "pending" || txStatus === "confirming"}
                        className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {!isConnected
                          ? "Connect Wallet to Bid"
                          : txStatus === "pending"
                          ? "Submitting..."
                          : txStatus === "confirming"
                          ? "Confirming..."
                          : "Place Bid"}
                      </button>
                    </div>
                  )}

                  {/* Settle button — available to anyone after auction ends */}
                  {auctionEnded && (
                    <button
                      onClick={handleSettleAuction}
                      disabled={txStatus === "pending" || txStatus === "confirming"}
                      className="w-full rounded-xl bg-green-600 py-3 font-medium text-white hover:bg-green-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {txStatus === "pending" ? "Submitting..." : txStatus === "confirming" ? "Confirming..." : "Settle Auction"}
                    </button>
                  )}
                </>
              )}

              {/* Dutch Auction */}
              {isDutch && (
                <>
                  <div>
                    <p className="text-sm text-gray-400">Current Price</p>
                    <p className="mt-1 text-3xl font-bold text-blue-400">
                      {dutchPrice ? `${parseFloat(dutchPrice).toFixed(4)} QFC` : "..."}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Start: {formatQFC(parseFloat(auction.startPrice))} &rarr; End: {formatQFC(parseFloat(auction.endPrice))}
                    </p>
                  </div>

                  {!auctionEnded && !isAuctionSeller && (
                    <button
                      onClick={handleBuyDutch}
                      disabled={!dutchPrice || txStatus === "pending" || txStatus === "confirming"}
                      className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {!isConnected
                        ? "Connect Wallet to Buy"
                        : txStatus === "pending"
                        ? "Submitting..."
                        : txStatus === "confirming"
                        ? "Confirming..."
                        : `Buy Now for ${dutchPrice ? parseFloat(dutchPrice).toFixed(4) : "..."} QFC`}
                    </button>
                  )}
                </>
              )}

              {/* Cancel — only seller, only if no bids (English) or not ended */}
              {isAuctionSeller && !auctionEnded && (
                <button
                  onClick={handleCancelAuction}
                  disabled={txStatus === "pending" || txStatus === "confirming"}
                  className="w-full rounded-xl bg-red-600/20 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30 transition disabled:opacity-50"
                >
                  Cancel Auction
                </button>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* FIXED PRICE LISTING UI (only show if no active auction)        */}
          {/* ============================================================= */}
          {!auction && nft.listed && nft.price && (
            <div className="mt-6 rounded-xl border border-gray-800 bg-gray-800/30 p-6">
              <p className="text-sm text-gray-400">Current Price</p>
              <p className="mt-1 text-3xl font-bold text-purple-400">{formatQFC(nft.price)}</p>
              <p className="text-sm text-gray-500">{formatUSD(nft.price)}</p>
              {isOwner ? (
                <button
                  onClick={handleCancelListing}
                  disabled={txStatus === "pending" || txStatus === "confirming"}
                  className="mt-4 w-full rounded-xl bg-red-600 py-3 font-medium text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {txStatus === "pending" ? "Submitting..." : txStatus === "confirming" ? "Confirming..." : "Cancel Listing"}
                </button>
              ) : (
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
              )}
            </div>
          )}

          {/* Make Offer (only for fixed-price / unlisted, not during auction) */}
          {!auction && !isOwner && (
            <>
              <button
                onClick={() => {
                  if (!isConnected) { connect(); return; }
                  setShowOfferModal(!showOfferModal);
                }}
                className="mt-4 w-full rounded-xl border border-purple-600 py-3 font-medium text-purple-400 hover:bg-purple-600/10 transition"
              >
                {isConnected ? "Make Offer" : "Connect Wallet to Make Offer"}
              </button>

              {showOfferModal && (
                <div className="mt-3 rounded-xl border border-gray-800 bg-gray-800/30 p-4 space-y-4">
                  <PriceInput value={offerAmount} onChange={setOfferAmount} label="Offer Amount" />
                  <div className="flex gap-2">
                    <button
                      onClick={handleMakeOffer}
                      disabled={!offerAmount || parseFloat(offerAmount) <= 0 || txStatus === "pending" || txStatus === "confirming"}
                      className="flex-1 rounded-xl bg-purple-600 py-2 font-medium text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {txStatus === "pending" ? "Submitting..." : txStatus === "confirming" ? "Confirming..." : "Submit Offer"}
                    </button>
                    <button
                      onClick={() => { setShowOfferModal(false); setOfferAmount(""); }}
                      className="rounded-xl border border-gray-700 px-4 py-2 text-gray-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Traits */}
          {nft.traits.length > 0 && (
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
          )}

          {/* Rarity */}
          {nft.rarity > 0 && (
            <div className="mt-6 flex items-center gap-2">
              <span className="text-sm text-gray-400">Rarity Score:</span>
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-bold text-yellow-400">
                {nft.rarity}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Offers Table */}
      {!auction && (
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
                    <th className="pb-3 pr-4">Expires</th>
                    {isOwner && <th className="pb-3">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_OFFERS.map((offer, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-3 pr-4 text-gray-300">{shortenAddress(offer.from)}</td>
                      <td className="py-3 pr-4 text-purple-400">{formatQFC(offer.amount)}</td>
                      <td className="py-3 pr-4 text-gray-500">{new Date(offer.expiry).toLocaleDateString()}</td>
                      {isOwner && (
                        <td className="py-3">
                          <button
                            onClick={() => handleAcceptOffer(offer.from)}
                            className="rounded-lg bg-green-600/20 px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-600/30 transition"
                          >
                            Accept
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cancel own offer */}
          {isConnected && !isOwner && (
            <div className="mt-4 text-center">
              <button
                onClick={handleCancelOffer}
                disabled={txStatus === "pending" || txStatus === "confirming"}
                className="text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
              >
                Cancel my offer
              </button>
            </div>
          )}
        </section>
      )}

      {/* Activity History */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold">Activity</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
          {nftActivities.length > 0 ? (
            <ActivityTable activities={nftActivities} />
          ) : (
            <p className="py-4 text-center text-gray-500">No activity yet</p>
          )}
        </div>
      </section>
    </div>
  );
}
