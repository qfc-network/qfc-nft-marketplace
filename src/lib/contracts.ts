// ---------------------------------------------------------------------------
// Contract ABIs and addresses for the QFC NFT Marketplace
// ---------------------------------------------------------------------------
// Addresses are read from environment variables so the same build can target
// different deployments (testnet, mainnet, local).
// ---------------------------------------------------------------------------

/** QRC Marketplace — fixed-price listings & offers */
export const QRC_MARKETPLACE_ABI = [
  // ── mutations ──────────────────────────────────────────────────────────
  "function listNFT(address nftContract, uint256 tokenId, uint256 price) external",
  "function buyNFT(address nftContract, uint256 tokenId) external payable",
  "function cancelListing(address nftContract, uint256 tokenId) external",
  "function makeOffer(address nftContract, uint256 tokenId, uint256 amount) external payable",
  "function acceptOffer(address nftContract, uint256 tokenId, address offeror) external",
  "function cancelOffer(address nftContract, uint256 tokenId) external",

  // ── views ──────────────────────────────────────────────────────────────
  "function listings(address nftContract, uint256 tokenId) external view returns (address seller, uint256 price, uint8 standard, uint256 amount)",

  // ── events ─────────────────────────────────────────────────────────────
  "event NFTListed(address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price)",
  "event NFTSold(address indexed nftContract, uint256 indexed tokenId, address buyer, uint256 price)",
  "event ListingCancelled(address indexed nftContract, uint256 indexed tokenId)",
  "event OfferMade(address indexed nftContract, uint256 indexed tokenId, address offeror, uint256 amount)",
  "event OfferAccepted(address indexed nftContract, uint256 indexed tokenId, address offeror, uint256 amount)",
  "event OfferCancelled(address indexed nftContract, uint256 indexed tokenId, address offeror)",
] as const;

/** Auction House — English & Dutch auctions */
export const AUCTION_HOUSE_ABI = [
  // ── mutations ──────────────────────────────────────────────────────────
  "function createEnglishAuction(address nftContract, uint256 tokenId, uint256 startPrice, uint256 reservePrice, uint256 duration) external returns (uint256)",
  "function createDutchAuction(address nftContract, uint256 tokenId, uint256 startPrice, uint256 endPrice, uint256 duration) external returns (uint256)",
  "function placeBid(uint256 auctionId) external payable",
  "function buyDutchAuction(uint256 auctionId) external payable",
  "function settleAuction(uint256 auctionId) external",
  "function cancelAuction(uint256 auctionId) external",

  // ── views ──────────────────────────────────────────────────────────────
  "function getDutchAuctionPrice(uint256 auctionId) external view returns (uint256)",
  "function auctions(uint256 auctionId) external view returns (address seller, address nftContract, uint256 tokenId, uint8 standard, uint256 amount, uint8 auctionType, uint256 startPrice, uint256 endPrice, uint256 reservePrice, uint256 startTime, uint256 endTime, address highestBidder, uint256 highestBid, bool settled)",

  // ── events ─────────────────────────────────────────────────────────────
  "event AuctionCreated(uint256 indexed auctionId, address indexed nftContract, uint256 indexed tokenId, address seller, uint8 auctionType, uint256 startPrice, uint256 endTime)",
  "event BidPlaced(uint256 indexed auctionId, address bidder, uint256 amount)",
  "event AuctionExtended(uint256 indexed auctionId, uint256 newEndTime)",
  "event AuctionSettled(uint256 indexed auctionId, address winner, uint256 amount)",
  "event AuctionCancelled(uint256 indexed auctionId)",
] as const;

/** Collection Factory — deploy new ERC-721 collections */
export const COLLECTION_FACTORY_ABI = [
  // ── mutations ──────────────────────────────────────────────────────────
  "function createCollection(string name, string symbol, uint256 maxSupply, uint256 mintPrice, uint96 royaltyBps) external payable returns (address)",

  // ── views ──────────────────────────────────────────────────────────────
  "function collections(uint256 index) external view returns (address)",
  "function totalCollections() external view returns (uint256)",
  "function getCreatorCollections(address creator) external view returns (address[])",
  "function creationFee() external view returns (uint256)",

  // ── events ─────────────────────────────────────────────────────────────
  "event CollectionCreated(address indexed collection, address indexed creator, string name, string symbol)",
] as const;

/** QFCCollection (ERC-721 Enumerable) — individual NFT collection */
export const QFC_COLLECTION_ABI = [
  // ── ERC-721 core ───────────────────────────────────────────────────────
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",

  // ── ERC-721 Enumerable ─────────────────────────────────────────────────
  "function totalSupply() external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenByIndex(uint256 index) external view returns (uint256)",

  // ── QFC extensions ─────────────────────────────────────────────────────
  "function publicMint(uint256 quantity) external payable",
  "function whitelistMint(bytes32[] calldata proof) external payable",
  "function maxSupply() external view returns (uint256)",
  "function mintPrice() external view returns (uint256)",

  // ── ERC-721 approvals (needed for marketplace interaction) ─────────────
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
] as const;

// ---------------------------------------------------------------------------
// Deployed addresses (populated via environment variables)
// ---------------------------------------------------------------------------

export const MARKETPLACE_ADDRESS =
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ?? "";

export const AUCTION_ADDRESS =
  process.env.NEXT_PUBLIC_AUCTION_ADDRESS ?? "";

export const FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.testnet.qfc.network";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "9000");
