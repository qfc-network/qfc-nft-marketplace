"use client";

import { formatUSD } from "@/lib/mock-data";

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function PriceInput({ value, onChange, label = "Price" }: PriceInputProps) {
  const numVal = parseFloat(value) || 0;

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-400">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="0.00"
        />
        <span className="text-sm font-medium text-purple-400">QFC</span>
      </div>
      {numVal > 0 && (
        <p className="mt-1 text-xs text-gray-500">≈ {formatUSD(numVal)}</p>
      )}
    </div>
  );
}
