# QFC NFT Marketplace

NFT marketplace frontend for the QFC blockchain. Users can browse collections, buy/sell NFTs (fixed price or auction), create collections, and manage their profile. Part of the QFC ecosystem — served at `nft.testnet.qfc.network`.

**Status:** On-chain read/write integration complete. All pages fetch live data from deployed contracts with mock-data fallback. Write flows (create collection, list NFT, buy NFT) are fully wired.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Blockchain:** ethers.js v6 — read-only `JsonRpcProvider` for data fetching, `BrowserProvider` (MetaMask) for write transactions
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
│   ├── create/page.tsx           # Create new collection form → deploys via CollectionFactory
│   ├── list/page.tsx             # List an owned NFT for sale (fixed price or auction)
│   ├── collections/[address]/    # Collection detail — stats, NFT grid
│   ├── nft/[address]/[tokenId]/  # NFT detail — buy, offer, traits, activity
│   └── profile/[address]/        # User profile — owned, listed, offers tabs
├── components/
│   ├── Navbar.tsx                # Sticky nav with wallet connect, mobile menu
│   ├── NFTCard.tsx               # NFT card (links to /nft/[address]/[tokenId])
│   ├── CollectionCard.tsx        # Collection card (links to /collections/[address])
│   ├── ActivityTable.tsx         # Activity history table (sale/list/transfer/offer)
│   └── PriceInput.tsx            # Reusable price input with QFC suffix + USD conversion
├── context/
│   └── WalletContext.tsx         # React context: connect/disconnect wallet (MetaMask)
├── hooks/
│   └── useBlockchain.ts          # React hooks for on-chain data (useCollections, useNFT, etc.)
└── lib/
    ├── blockchain.ts             # On-chain read functions (JsonRpcProvider, no wallet needed)
    ├── contracts.ts              # Contract ABIs and deployed addresses (from env vars)
    └── mock-data.ts              # Types, mock data fallback, utility functions
```

## Key Files

- **`src/lib/blockchain.ts`** — All on-chain read functions: `fetchCollections`, `fetchCollectionNFTs`, `fetchNFT`, `fetchOwnedNFTs`, `fetchListing`, `fetchAuction`, `fetchRecentActivity`. Uses a singleton `JsonRpcProvider` — no wallet connection required. Gracefully returns empty/null on RPC errors.
- **`src/hooks/useBlockchain.ts`** — React hooks wrapping blockchain.ts with loading/error/refetch state: `useCollections`, `useCollection`, `useCollectionNFTs`, `useNFT`, `useOwnedNFTs`, `useListing`, `useRecentActivity`.
- **`src/lib/contracts.ts`** — ABI definitions and addresses for `QRCMarketplace`, `AuctionHouse`, `CollectionFactory`, `QFCCollection`. Addresses loaded from env vars.
- **`src/lib/mock-data.ts`** — TypeScript types (`NFT`, `Collection`, `Activity`, `Offer`), mock datasets (fallback when chain has no data), and utility functions (`shortenAddress`, `formatQFC`, `formatUSD`, `timeAgo`).
- **`src/context/WalletContext.tsx`** — Wallet provider. Handles MetaMask connection, QFC Testnet chain switching, account/chain change listeners.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.qfc.network
NEXT_PUBLIC_CHAIN_ID=9000
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_AUCTION_ADDRESS=0x...
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
```

## Conventions

### Adding a new page
Create a directory under `src/app/` with a `page.tsx` file. Use `"use client"` directive for pages needing React hooks or wallet context. Use hooks from `@/hooks/useBlockchain` for on-chain data, fall back to mock data when empty.

### Adding a new component
Add to `src/components/`. All current components are client components. Use Tailwind for styling. The path alias `@/*` maps to `./src/*`.

### On-chain data pattern
All pages follow the same pattern: fetch on-chain data via hooks, fall back to mock data if the result is empty, show loading skeletons while fetching. Write operations use `signer` from `WalletContext` + `ethers.Contract`.

### Styling
Dark theme by default (set on `<html>` in layout). Background is `#0a0a0a`, text is white. Use Tailwind utility classes — no CSS modules or styled-components.

## Contract Integration

| Contract | Purpose | Read | Write |
|---|---|---|---|
| `QRCMarketplace` | Buy/sell NFTs at fixed price | listings, events | buyNFT, listNFT, cancelListing, makeOffer, acceptOffer |
| `AuctionHouse` | Auction-based sales | auctions, getDutchAuctionPrice | createEnglishAuction, createDutchAuction, placeBid, settleAuction |
| `CollectionFactory` | Deploy new NFT collections | totalCollections, collections, getCreatorCollections | createCollection |
| `QFCCollection` | Individual ERC-721 collection | name, symbol, totalSupply, tokenByIndex, ownerOf, tokenURI, balanceOf, tokenOfOwnerByIndex | publicMint, whitelistMint, approve, setApprovalForAll |

## Roadmap

### Done
- [x] UI scaffolding — all pages, components, layout
- [x] Wallet connection — MetaMask, chain switching, account listeners
- [x] Contract ABIs and env-based addresses
- [x] Write: Create collection (CollectionFactory.createCollection)
- [x] Write: List NFT for sale — fixed price (Marketplace.listNFT) and auction (AuctionHouse.createEnglishAuction) with approval flow
- [x] Write: Buy NFT (Marketplace.buyNFT)
- [x] Read: On-chain data layer (blockchain.ts + useBlockchain hooks)
- [x] Read: All pages fetch live collections, NFTs, listings, activity from chain
- [x] Loading skeletons on all pages
- [x] Mock data fallback when chain has no data
- [x] Mint page (/mint/[address]) — publicMint with quantity selector, supply progress bar
- [x] Make Offer flow — makeOffer/acceptOffer/cancelOffer wired on NFT detail page
- [x] Cancel listing — owner sees cancel button instead of buy
- [x] NFTCard/CollectionCard — first-letter fallback when no emoji, hide rarity when 0
- [x] Navbar profile link (already existed), owner label on NFT detail page

- [x] Auction UI — English: place bid, countdown timer, settle. Dutch: live price, buy now. Cancel for seller.
- [x] Dutch auction listing — createDutchAuction with start/end price on list page
- [x] Countdown component — reusable timer with days/hours/minutes/seconds
- [x] 3-way listing toggle — Fixed Price / English Auction / Dutch Auction on list page

### Next
- [ ] tokenURI image rendering — fetch and display NFT images from IPFS/HTTP metadata

### Future
- [ ] Indexer integration — replace on-chain enumeration with qfc-nft-indexer API for faster loads
- [ ] Real-time updates — WebSocket/polling for new listings, sales, bids
- [ ] Search by address — search collections/NFTs by contract address
- [ ] Collection management — owner settings (whitelist, reveal, withdraw)
- [ ] CI/CD — docker.yml workflow for ghcr.io builds
- [ ] Tests — unit tests for hooks, e2e tests for key flows

## Deployment

- **Dockerfile:** Multi-stage build (deps → build → runner) producing a standalone Next.js app. Runs `node server.js` on port 3260.
- **CI:** `.github/workflows/docker.yml` exists but is currently empty. Intended to build and push to `ghcr.io` on `staging` branch push.
- **Production URL:** `nft.testnet.qfc.network`

## Gotchas

- Pages gracefully fall back to mock data when on-chain data is empty or RPC is unreachable.
- `fetchCollectionNFTs` caps at 100 NFTs per collection to avoid RPC overload. For larger collections, the indexer integration (future) is needed.
- `fetchOwnedNFTs` iterates all collections — will be slow with many collections. Indexer will fix this.
- `WalletContext` no longer falls back to a mock address — MetaMask is required for write operations.
- The Dockerfile has a formatting quirk: EXPOSE and ENV lines show `3260\n3250` — verify port config if modifying.
- No tests exist. No test runner is configured.
