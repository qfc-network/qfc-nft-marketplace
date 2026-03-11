# QFC NFT Marketplace

NFT marketplace frontend for the QFC blockchain. Users can browse collections, buy/sell NFTs (fixed price or auction), create collections, and manage their profile. Part of the QFC ecosystem — served at `nft.testnet.qfc.network`.

**Status:** UI scaffolding complete with mock data. Contract addresses are placeholders (all zeros). No live blockchain integration yet.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Blockchain:** ethers.js v6 (wallet connection works via MetaMask; contract calls not yet wired)
- **Port:** 3260 (dev and production)
- **Node:** 20 (per Dockerfile)

## Commands

```bash
npm run dev      # Start dev server on port 3260
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
```

No test framework is configured yet.

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (dark theme, WalletProvider, Navbar, footer)
│   ├── page.tsx                  # Home — hero, trending collections, featured NFTs, recent sales
│   ├── globals.css               # Tailwind directives, CSS vars, custom scrollbar
│   ├── explore/page.tsx          # Browse NFTs with search, filters, sort
│   ├── create/page.tsx           # Create new collection form
│   ├── list/page.tsx             # List an owned NFT for sale (fixed price or auction)
│   ├── collections/[address]/    # Collection detail — stats, NFT grid
│   ├── nft/[address]/[tokenId]/  # NFT detail — image, buy/offer, traits, activity
│   └── profile/[address]/        # User profile — owned, listed, offers tabs
├── components/
│   ├── Navbar.tsx                # Sticky nav with wallet connect, mobile menu
│   ├── NFTCard.tsx               # NFT card (links to /nft/[address]/[tokenId])
│   ├── CollectionCard.tsx        # Collection card (links to /collections/[address])
│   ├── ActivityTable.tsx         # Activity history table (sale/list/transfer/offer)
│   └── PriceInput.tsx            # Reusable price input with QFC suffix + USD conversion
├── context/
│   └── WalletContext.tsx         # React context: connect/disconnect wallet (MetaMask or mock fallback)
└── lib/
    ├── contracts.ts              # Contract ABIs and addresses (placeholder)
    └── mock-data.ts              # Types, mock data (5 collections, 40 NFTs), utility functions
```

## Key Files

- **`src/lib/contracts.ts`** — ABI definitions and addresses for `QRCMarketplace`, `AuctionHouse`, `CollectionFactory`. All addresses are currently `0x0000...` placeholders. When contracts are deployed, update addresses here.
- **`src/lib/mock-data.ts`** — All TypeScript types (`NFT`, `Collection`, `Activity`, `Offer`), mock datasets, and utility functions (`shortenAddress`, `formatQFC`, `formatUSD`, `timeAgo`). Mock QFC/USD rate is hardcoded at $12.50.
- **`src/context/WalletContext.tsx`** — Wallet provider wrapping the entire app. Tries `window.ethereum` (MetaMask), falls back to a mock address for development.

## Environment Variables

None currently required. The app runs entirely on mock data. When blockchain integration is added, expect variables like `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_CHAIN_ID`, and contract addresses.

## Conventions

### Adding a new page
Create a directory under `src/app/` with a `page.tsx` file. Use `"use client"` directive for pages needing React hooks or wallet context. Import mock data from `@/lib/mock-data` and contracts from `@/lib/contracts`.

### Adding a new component
Add to `src/components/`. All current components are client components. Use Tailwind for styling. The path alias `@/*` maps to `./src/*`.

### Styling
Dark theme by default (set on `<html>` in layout). Background is `#0a0a0a`, text is white. Use Tailwind utility classes — no CSS modules or styled-components.

## Contract Integration

`src/lib/contracts.ts` exports three contracts:

| Contract | Purpose | Status |
|---|---|---|
| `QRCMarketplace` | Buy/sell NFTs at fixed price | ABI defined, address TBD |
| `AuctionHouse` | Auction-based sales | ABI defined, address TBD |
| `CollectionFactory` | Deploy new NFT collections | ABI defined, address TBD |

To wire up a contract call: use `ethers.Contract` with the ABI and address from this file, connected to the provider from `WalletContext`.

## Deployment

- **Dockerfile:** Multi-stage build (deps → build → runner) producing a standalone Next.js app. Runs `node server.js` on port 3260.
- **CI:** `.github/workflows/docker.yml` exists but is currently empty. Intended to build and push to `ghcr.io` on `staging` branch push.
- **Production URL:** `nft.testnet.qfc.network`

## Gotchas

- The entire app uses mock data — no real blockchain calls happen yet. All NFTs, collections, and activities come from `src/lib/mock-data.ts`.
- `WalletContext` silently falls back to a mock address (`0xd8dA...`) if MetaMask is unavailable. Check for this during testing.
- The Dockerfile has a formatting quirk: EXPOSE and ENV lines show `3260\n3250` — verify port config if modifying.
- The `docker.yml` workflow is an empty file. Needs to be written when CI is ready.
- No tests exist. No test runner is configured.
- The default README is the create-next-app boilerplate — not project-specific.
