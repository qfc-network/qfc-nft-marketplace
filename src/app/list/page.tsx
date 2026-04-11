"use client";

import { useState } from "react";
import { Contract, parseEther } from "ethers";
import { useWallet } from "@/context/WalletContext";
import NFTCard from "@/components/NFTCard";
import PriceInput from "@/components/PriceInput";
import { NFTS } from "@/lib/mock-data";
import { useOwnedNFTs } from "@/hooks/useBlockchain";
import {
  QRC_MARKETPLACE_ABI,
  AUCTION_HOUSE_ABI,
  QFC_COLLECTION_ABI,
  MARKETPLACE_ADDRESS,
  AUCTION_ADDRESS,
} from "@/lib/contracts";

type TxStatus = "idle" | "approving" | "pending" | "confirming" | "success" | "error";

export default function ListPage() {
  const { address, isConnected, connect, signer } = useWallet();
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [listingType, setListingType] = useState<"fixed" | "english" | "dutch">("fixed");
  const [price, setPrice] = useState("");
  const [endPrice, setEndPrice] = useState("");
  const [duration, setDuration] = useState("24");

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // For manual NFT entry when user has real NFTs not in mock data
  const [manualAddress, setManualAddress] = useState("");
  const [manualTokenId, setManualTokenId] = useState("");
  const [useManual, setUseManual] = useState(false);

  const { data: onChainOwned, loading: ownedLoading } = useOwnedNFTs(address);
  const mockOwned = NFTS.filter((n) => n.owner === address && !n.listed);
  const ownedNFTs = (onChainOwned?.length ? onChainOwned : mockOwned).filter((n) => !n.listed);

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

  const handleSubmit = async () => {
    setErrorMsg(null);
    setTxHash(null);

    if (!signer) {
      setErrorMsg("Wallet not connected.");
      return;
    }

    // Determine NFT contract address and token ID
    let nftAddress: string;
    let tokenId: bigint;

    if (useManual) {
      if (!manualAddress || !manualTokenId) {
        setErrorMsg("Please enter the NFT contract address and token ID.");
        return;
      }
      nftAddress = manualAddress;
      tokenId = BigInt(manualTokenId);
    } else if (selectedNFT !== null && selectedCollection) {
      nftAddress = selectedCollection;
      tokenId = BigInt(selectedNFT);
    } else {
      setErrorMsg("Please select an NFT to list.");
      return;
    }

    const priceWei = parseEther(price);

    try {
      // Step 1: Approve the marketplace/auction contract
      setTxStatus("approving");

      const nftContract = new Contract(nftAddress, QFC_COLLECTION_ABI, signer);
      const isAuction = listingType === "english" || listingType === "dutch";
      const operatorAddress = isAuction ? AUCTION_ADDRESS : MARKETPLACE_ADDRESS;

      if (!operatorAddress) {
        setErrorMsg("Marketplace/Auction contract address not configured.");
        setTxStatus("error");
        return;
      }

      // Check if already approved
      const signerAddress = await signer.getAddress();
      const isApproved = await nftContract.isApprovedForAll(signerAddress, operatorAddress);

      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(operatorAddress, true);
        await approveTx.wait();
      }

      // Step 2: List or create auction
      setTxStatus("pending");

      if (listingType === "fixed") {
        const marketplace = new Contract(MARKETPLACE_ADDRESS, QRC_MARKETPLACE_ABI, signer);
        const tx = await marketplace.listNFT(nftAddress, tokenId, priceWei);
        setTxHash(tx.hash);
        setTxStatus("confirming");
        await tx.wait();
      } else if (listingType === "english") {
        const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, signer);
        const durationSeconds = BigInt(parseInt(duration) * 3600);
        const tx = await auctionHouse.createEnglishAuction(
          nftAddress,
          tokenId,
          priceWei,       // startPrice
          priceWei,       // reservePrice (same as start)
          durationSeconds
        );
        setTxHash(tx.hash);
        setTxStatus("confirming");
        await tx.wait();
      } else {
        // Dutch auction
        const auctionHouse = new Contract(AUCTION_ADDRESS, AUCTION_HOUSE_ABI, signer);
        const durationSeconds = BigInt(parseInt(duration) * 3600);
        const endPriceWei = parseEther(endPrice || "0");
        const tx = await auctionHouse.createDutchAuction(
          nftAddress,
          tokenId,
          priceWei,       // startPrice (high)
          endPriceWei,    // endPrice (low)
          durationSeconds
        );
        setTxHash(tx.hash);
        setTxStatus("confirming");
        await tx.wait();
      }

      setTxStatus("success");
      setSelectedNFT(null);
      setSelectedCollection(null);
      setPrice("");
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
      <h1 className="mb-8 text-3xl font-bold">List an NFT</h1>

      {/* Transaction status feedback */}
      {txStatus === "approving" && (
        <div className="mb-6 rounded-lg border border-yellow-600/50 bg-yellow-600/10 p-4 text-yellow-400">
          <p className="font-medium">Approving marketplace access... Please confirm in your wallet.</p>
        </div>
      )}
      {txStatus === "confirming" && (
        <div className="mb-6 rounded-lg border border-yellow-600/50 bg-yellow-600/10 p-4 text-yellow-400">
          <p className="font-medium">Transaction submitted, waiting for confirmation...</p>
          {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
        </div>
      )}
      {txStatus === "success" && (
        <div className="mb-6 rounded-lg border border-green-600/50 bg-green-600/10 p-4 text-green-400">
          <p className="font-medium">NFT listed successfully!</p>
          {txHash && <p className="mt-1 text-sm break-all">Tx: {txHash}</p>}
        </div>
      )}
      {txStatus === "error" && errorMsg && (
        <div className="mb-6 rounded-lg border border-red-600/50 bg-red-600/10 p-4 text-red-400">
          <p className="font-medium">Transaction failed</p>
          <p className="mt-1 text-sm break-all">{errorMsg}</p>
        </div>
      )}

      {/* Toggle between mock NFTs and manual entry */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setUseManual(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            !useManual ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          My NFTs
        </button>
        <button
          onClick={() => setUseManual(true)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            useManual ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          Enter Manually
        </button>
      </div>

      {!useManual && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-300">Select an NFT to list</h2>
          {ownedLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-800/50" />
              ))}
            </div>
          ) : ownedNFTs.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-800/30 py-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400">No unlisted NFTs in your wallet</p>
              <p className="mt-2 text-sm text-gray-500">Try &quot;Enter Manually&quot; if you have NFTs on-chain.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {ownedNFTs.map((nft) => (
                <div
                  key={`${nft.collectionAddress}-${nft.tokenId}`}
                  onClick={() => {
                    if (selectedNFT === nft.tokenId && selectedCollection === nft.collectionAddress) {
                      setSelectedNFT(null);
                      setSelectedCollection(null);
                    } else {
                      setSelectedNFT(nft.tokenId);
                      setSelectedCollection(nft.collectionAddress);
                    }
                  }}
                  className={`cursor-pointer rounded-xl border-2 transition ${
                    selectedNFT === nft.tokenId && selectedCollection === nft.collectionAddress
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
      )}

      {useManual && (
        <div className="mb-8 space-y-4 rounded-xl border border-gray-800 bg-gray-800/30 p-6">
          <h2 className="text-lg font-semibold text-gray-300">Enter NFT Details</h2>
          <div>
            <label className="mb-1 block text-sm text-gray-400">NFT Contract Address</label>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Token ID</label>
            <input
              type="number"
              min="0"
              value={manualTokenId}
              onChange={(e) => setManualTokenId(e.target.value)}
              placeholder="e.g. 1"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      )}

      {/* Listing Form */}
      {(selectedNFT !== null || useManual) && (
        <div className="mx-auto max-w-lg rounded-xl border border-gray-800 bg-gray-800/30 p-6">
          <h2 className="mb-6 text-xl font-bold">Listing Details</h2>

          <div className="mb-6 flex gap-1 rounded-lg bg-gray-800/50 p-1">
            {([
              { id: "fixed" as const, label: "Fixed Price" },
              { id: "english" as const, label: "English Auction" },
              { id: "dutch" as const, label: "Dutch Auction" },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setListingType(opt.id)}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition ${
                  listingType === opt.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <PriceInput
              value={price}
              onChange={setPrice}
              label={
                listingType === "fixed"
                  ? "Listing Price"
                  : listingType === "dutch"
                  ? "Start Price (high)"
                  : "Starting Price"
              }
            />

            {listingType === "dutch" && (
              <PriceInput
                value={endPrice}
                onChange={setEndPrice}
                label="End Price (low)"
              />
            )}

            {(listingType === "english" || listingType === "dutch") && (
              <div>
                <label className="mb-1 block text-sm text-gray-400">Duration</label>
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

            {listingType === "dutch" && (
              <p className="text-xs text-gray-500">
                Price decreases linearly from start to end over the duration. First buyer wins.
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={
                !price || parseFloat(price) <= 0
                || (listingType === "dutch" && (!endPrice || parseFloat(endPrice) <= 0 || parseFloat(endPrice) >= parseFloat(price)))
                || txStatus === "approving" || txStatus === "pending" || txStatus === "confirming"
              }
              className="mt-4 w-full rounded-xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {txStatus === "approving"
                ? "Approving..."
                : txStatus === "pending"
                ? "Submitting..."
                : txStatus === "confirming"
                ? "Confirming..."
                : listingType === "fixed"
                ? "List for Sale"
                : listingType === "english"
                ? "Start English Auction"
                : "Start Dutch Auction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
