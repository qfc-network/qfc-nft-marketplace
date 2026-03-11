"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";

export default function ProfileIndexPage() {
  const { address, isConnected, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) {
      router.replace(`/profile/${address}`);
    }
  }, [isConnected, address, router]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-6 text-6xl">👤</div>
        <h1 className="mb-4 text-2xl font-bold">Connect Your Wallet</h1>
        <p className="mb-8 text-gray-400">
          Connect your wallet to view your profile, owned NFTs, and activity.
        </p>
        <button
          onClick={connect}
          className="rounded-lg bg-purple-600 px-8 py-3 font-semibold text-white transition hover:bg-purple-700"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
