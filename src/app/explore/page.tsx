"use client";

import { useState, useMemo } from "react";
import NFTCard from "@/components/NFTCard";
import { NFTS, COLLECTIONS } from "@/lib/mock-data";

type SortOption = "price-asc" | "price-desc" | "recent" | "rarity";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  const filtered = useMemo(() => {
    let results = [...NFTS];

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (n) => n.name.toLowerCase().includes(q) || n.collection.toLowerCase().includes(q)
      );
    }

    if (selectedCollection) {
      results = results.filter((n) => n.collectionAddress === selectedCollection);
    }

    const min = parseFloat(minPrice);
    if (!isNaN(min)) {
      results = results.filter((n) => n.price !== undefined && n.price >= min);
    }

    const max = parseFloat(maxPrice);
    if (!isNaN(max)) {
      results = results.filter((n) => n.price !== undefined && n.price <= max);
    }

    switch (sort) {
      case "price-asc":
        results.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "price-desc":
        results.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "rarity":
        results.sort((a, b) => b.rarity - a.rarity);
        break;
      case "recent":
      default:
        break;
    }

    return results;
  }, [search, selectedCollection, minPrice, maxPrice, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Explore NFTs</h1>

      {/* Filters */}
      <div className="mb-8 grid gap-4 rounded-xl border border-gray-800 bg-gray-800/30 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Search by name or collection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
          />
        </div>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-purple-500"
        >
          <option value="">All Collections</option>
          {COLLECTIONS.map((c) => (
            <option key={c.address} value={c.address}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-purple-500"
        >
          <option value="recent">Recently Added</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rarity">Rarity</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p>No NFTs found matching your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((nft) => (
            <NFTCard key={`${nft.collectionAddress}-${nft.tokenId}`} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}
