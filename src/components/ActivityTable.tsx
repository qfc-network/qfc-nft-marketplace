"use client";

import { Activity, shortenAddress, formatQFC, timeAgo } from "@/lib/mock-data";

const TYPE_STYLES: Record<string, string> = {
  sale: "text-green-400 bg-green-400/10",
  list: "text-blue-400 bg-blue-400/10",
  transfer: "text-yellow-400 bg-yellow-400/10",
  offer: "text-purple-400 bg-purple-400/10",
};

export default function ActivityTable({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="py-8 text-center text-gray-500">No activity yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-gray-400">
            <th className="pb-3 pr-4">Event</th>
            <th className="pb-3 pr-4">Item</th>
            <th className="pb-3 pr-4">Price</th>
            <th className="pb-3 pr-4">From</th>
            <th className="pb-3 pr-4">To</th>
            <th className="pb-3">Time</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a, i) => (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="py-3 pr-4">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${TYPE_STYLES[a.type]}`}>
                  {a.type}
                </span>
              </td>
              <td className="py-3 pr-4 text-white">{a.nftName}</td>
              <td className="py-3 pr-4 text-purple-400">{a.price ? formatQFC(a.price) : "—"}</td>
              <td className="py-3 pr-4 text-gray-300">{shortenAddress(a.from)}</td>
              <td className="py-3 pr-4 text-gray-300">{a.to ? shortenAddress(a.to) : "—"}</td>
              <td className="py-3 text-gray-500">{timeAgo(a.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
