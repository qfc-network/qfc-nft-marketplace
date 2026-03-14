"use client";

import { useState, useMemo } from "react";
import CollectionCard from "@/components/CollectionCard";
import { COLLECTIONS } from "@/lib/mock-data";

export default function CollectionsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return COLLECTIONS;
    const q = search.toLowerCase();
    return COLLECTIONS.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Collections</h1>

      {/* Search */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-800/30 p-4">
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p>No collections found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((collection) => (
            <CollectionCard key={collection.address} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
