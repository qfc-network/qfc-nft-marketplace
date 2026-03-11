"use client";

import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/mock-data";
import { useState } from "react";

export default function Navbar() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="text-2xl">💎</span>
          <span>QFC NFT</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/explore" className="text-gray-300 hover:text-white transition">Explore</Link>
          <Link href="/list" className="text-gray-300 hover:text-white transition">List NFT</Link>
          <Link href="/create" className="text-gray-300 hover:text-white transition">Create</Link>
          {isConnected && (
            <Link href={`/profile/${address}`} className="text-gray-300 hover:text-white transition">Profile</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${address}`}
                className="hidden rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition sm:block"
              >
                {shortenAddress(address!)}
              </Link>
              <button
                onClick={disconnect}
                className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-400 hover:bg-red-600/30 transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition"
            >
              Connect Wallet
            </button>
          )}
          <button
            className="text-gray-300 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-800 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/explore" className="text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Explore</Link>
            <Link href="/list" className="text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>List NFT</Link>
            <Link href="/create" className="text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Create</Link>
            {isConnected && (
              <Link href={`/profile/${address}`} className="text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Profile</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
