export interface NFT {
  tokenId: number;
  name: string;
  emoji: string;
  bgColor: string;
  collection: string;
  collectionAddress: string;
  owner: string;
  price?: number;
  rarity: number;
  traits: { trait_type: string; value: string }[];
  listed: boolean;
}

export interface Collection {
  address: string;
  name: string;
  symbol: string;
  description: string;
  emoji: string;
  bannerColor: string;
  logoColor: string;
  floorPrice: number;
  totalVolume: number;
  owners: number;
  items: number;
}

export interface Activity {
  type: "list" | "sale" | "transfer" | "offer";
  nftName: string;
  from: string;
  to: string;
  price?: number;
  timestamp: number;
  collectionAddress: string;
  tokenId: number;
}

export interface Offer {
  from: string;
  amount: number;
  expiry: number;
}

const MOCK_ADDRESSES = [
  "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12",
  "0x2b3C4d5E6f7890aBcDEf1234567890AbCdEf1234",
  "0x3c4D5e6F7890AbCdEf1234567890aBcDeF123456",
  "0x4d5E6f7890aBcDEf1234567890AbCdEf12345678",
  "0x5e6F7890AbCdEf1234567890aBcDeF1234567890",
];

export const COLLECTIONS: Collection[] = [
  {
    address: "0xCollection01",
    name: "Quantum Foxes",
    symbol: "QFOX",
    description: "A collection of 1,000 quantum-powered foxes living on the QFC blockchain. Each fox has unique traits and rarity attributes.",
    emoji: "🦊",
    bannerColor: "#f97316",
    logoColor: "#ea580c",
    floorPrice: 2.5,
    totalVolume: 1250,
    owners: 342,
    items: 1000,
  },
  {
    address: "0xCollection02",
    name: "Cyber Apes",
    symbol: "CAPE",
    description: "500 cybernetically enhanced apes with powerful abilities. Holders get exclusive access to the CyberDAO.",
    emoji: "🦍",
    bannerColor: "#8b5cf6",
    logoColor: "#7c3aed",
    floorPrice: 5.0,
    totalVolume: 3200,
    owners: 198,
    items: 500,
  },
  {
    address: "0xCollection03",
    name: "Pixel Dragons",
    symbol: "PXDG",
    description: "2,000 pixel art dragons guarding the blockchain treasures. Breathe fire and earn rewards.",
    emoji: "🐉",
    bannerColor: "#ef4444",
    logoColor: "#dc2626",
    floorPrice: 1.2,
    totalVolume: 890,
    owners: 567,
    items: 2000,
  },
  {
    address: "0xCollection04",
    name: "Space Cats",
    symbol: "SCAT",
    description: "Adventurous cats exploring the cosmos. 750 unique felines with interstellar traits.",
    emoji: "🐱",
    bannerColor: "#3b82f6",
    logoColor: "#2563eb",
    floorPrice: 3.8,
    totalVolume: 2100,
    owners: 289,
    items: 750,
  },
  {
    address: "0xCollection05",
    name: "Robot Birds",
    symbol: "RBIRD",
    description: "Mechanical birds of the future. 1,500 units with distinct plumage and flight capabilities.",
    emoji: "🤖",
    bannerColor: "#10b981",
    logoColor: "#059669",
    floorPrice: 0.8,
    totalVolume: 450,
    owners: 412,
    items: 1500,
  },
];

const TRAIT_POOLS: Record<string, { trait_type: string; values: string[] }[]> = {
  "0xCollection01": [
    { trait_type: "Fur", values: ["Red", "Silver", "Gold", "Arctic", "Shadow"] },
    { trait_type: "Eyes", values: ["Laser", "Quantum", "Void", "Crystal", "Normal"] },
    { trait_type: "Accessory", values: ["Crown", "Goggles", "Scarf", "None", "Chain"] },
  ],
  "0xCollection02": [
    { trait_type: "Cyber Part", values: ["Arm", "Eye", "Brain", "Spine", "Heart"] },
    { trait_type: "Skin", values: ["Chrome", "Neon", "Matte", "Holographic", "Rustic"] },
    { trait_type: "Weapon", values: ["Plasma Gun", "Katana", "Shield", "None", "Gauntlet"] },
  ],
  "0xCollection03": [
    { trait_type: "Element", values: ["Fire", "Ice", "Lightning", "Earth", "Shadow"] },
    { trait_type: "Size", values: ["Tiny", "Small", "Medium", "Large", "Colossal"] },
    { trait_type: "Wings", values: ["Feathered", "Bat", "Crystal", "Mechanical", "None"] },
  ],
  "0xCollection04": [
    { trait_type: "Suit", values: ["Astronaut", "Pilot", "Explorer", "Scientist", "Captain"] },
    { trait_type: "Planet", values: ["Mars", "Jupiter", "Saturn", "Neptune", "Pluto"] },
    { trait_type: "Gadget", values: ["Jetpack", "Telescope", "Ray Gun", "Map", "None"] },
  ],
  "0xCollection05": [
    { trait_type: "Metal", values: ["Steel", "Titanium", "Gold", "Copper", "Platinum"] },
    { trait_type: "Flight Mode", values: ["Hover", "Glide", "Turbo", "Stealth", "Warp"] },
    { trait_type: "Plumage", values: ["LED", "Feathered", "Holographic", "Solar", "None"] },
  ],
};

function generateTraits(collectionAddress: string, seed: number) {
  const pool = TRAIT_POOLS[collectionAddress] || TRAIT_POOLS["0xCollection01"];
  return pool.map((t) => ({
    trait_type: t.trait_type,
    value: t.values[seed % t.values.length],
  }));
}

const NFT_NAMES: Record<string, string[]> = {
  "0xCollection01": ["Blaze Fox", "Arctic Fox", "Shadow Fox", "Crystal Fox", "Neon Fox", "Phantom Fox", "Solar Fox", "Storm Fox"],
  "0xCollection02": ["Alpha Ape", "Omega Ape", "Cyber Kong", "Neon Gorilla", "Chrome Chimp", "Plasma Primate", "Steel Simian", "Quantum Ape"],
  "0xCollection03": ["Inferno Drake", "Frost Wyrm", "Thunder Dragon", "Earth Serpent", "Void Dragon", "Storm Drake", "Crystal Dragon", "Shadow Wyrm"],
  "0xCollection04": ["Major Tom", "Luna Cat", "Astro Whiskers", "Cosmo Paws", "Nebula Cat", "Star Cat", "Orbit Kitty", "Galaxy Cat"],
  "0xCollection05": ["Steel Wing", "Neon Hawk", "Chrome Sparrow", "Titan Eagle", "Bolt Bird", "Plasma Parrot", "Iron Owl", "Copper Crow"],
};

export const NFTS: NFT[] = [];

COLLECTIONS.forEach((col) => {
  const names = NFT_NAMES[col.address] || NFT_NAMES["0xCollection01"];
  for (let i = 0; i < 8; i++) {
    NFTS.push({
      tokenId: i + 1,
      name: names[i],
      emoji: col.emoji,
      bgColor: col.bannerColor,
      collection: col.name,
      collectionAddress: col.address,
      owner: MOCK_ADDRESSES[i % MOCK_ADDRESSES.length],
      price: i % 3 === 0 ? undefined : parseFloat((col.floorPrice + (i * 0.3)).toFixed(2)),
      rarity: parseFloat((Math.max(10, 100 - i * 12 + (col.floorPrice * 5))).toFixed(1)),
      traits: generateTraits(col.address, i),
      listed: i % 3 !== 0,
    });
  }
});

export const ACTIVITIES: Activity[] = [
  { type: "sale", nftName: "Blaze Fox #1", from: MOCK_ADDRESSES[0], to: MOCK_ADDRESSES[1], price: 3.2, timestamp: Date.now() - 300000, collectionAddress: "0xCollection01", tokenId: 1 },
  { type: "list", nftName: "Alpha Ape #2", from: MOCK_ADDRESSES[2], to: "", price: 5.5, timestamp: Date.now() - 600000, collectionAddress: "0xCollection02", tokenId: 2 },
  { type: "transfer", nftName: "Inferno Drake #3", from: MOCK_ADDRESSES[3], to: MOCK_ADDRESSES[4], timestamp: Date.now() - 900000, collectionAddress: "0xCollection03", tokenId: 3 },
  { type: "sale", nftName: "Major Tom #1", from: MOCK_ADDRESSES[1], to: MOCK_ADDRESSES[0], price: 4.1, timestamp: Date.now() - 1200000, collectionAddress: "0xCollection04", tokenId: 1 },
  { type: "offer", nftName: "Steel Wing #5", from: MOCK_ADDRESSES[4], to: MOCK_ADDRESSES[2], price: 1.0, timestamp: Date.now() - 1500000, collectionAddress: "0xCollection05", tokenId: 5 },
  { type: "sale", nftName: "Crystal Fox #4", from: MOCK_ADDRESSES[3], to: MOCK_ADDRESSES[1], price: 2.8, timestamp: Date.now() - 1800000, collectionAddress: "0xCollection01", tokenId: 4 },
  { type: "list", nftName: "Neon Gorilla #4", from: MOCK_ADDRESSES[0], to: "", price: 6.2, timestamp: Date.now() - 2100000, collectionAddress: "0xCollection02", tokenId: 4 },
  { type: "sale", nftName: "Frost Wyrm #2", from: MOCK_ADDRESSES[2], to: MOCK_ADDRESSES[4], price: 1.5, timestamp: Date.now() - 2400000, collectionAddress: "0xCollection03", tokenId: 2 },
];

export const MOCK_OFFERS: Offer[] = [
  { from: MOCK_ADDRESSES[1], amount: 2.0, expiry: Date.now() + 86400000 },
  { from: MOCK_ADDRESSES[3], amount: 2.5, expiry: Date.now() + 172800000 },
  { from: MOCK_ADDRESSES[4], amount: 1.8, expiry: Date.now() + 43200000 },
];

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatQFC(amount: number): string {
  return `${amount.toFixed(2)} QFC`;
}

export function formatUSD(qfcAmount: number): string {
  const rate = 12.5; // mock QFC/USD rate
  return `$${(qfcAmount * rate).toFixed(2)}`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
