// Contract addresses — update these when deployed
export const CONTRACTS = {
  QRCMarketplace: {
    address: "0x0000000000000000000000000000000000000000", // TBD
    abi: [
      "function listNFT(address nftContract, uint256 tokenId, uint256 price) external",
      "function buyNFT(address nftContract, uint256 tokenId) external payable",
      "function cancelListing(address nftContract, uint256 tokenId) external",
      "function getListing(address nftContract, uint256 tokenId) external view returns (address seller, uint256 price, bool active)",
      "function getListingsByCollection(address nftContract) external view returns (uint256[] memory)",
      "event NFTListed(address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price)",
      "event NFTSold(address indexed nftContract, uint256 indexed tokenId, address buyer, uint256 price)",
      "event ListingCancelled(address indexed nftContract, uint256 indexed tokenId)",
    ],
  },
  AuctionHouse: {
    address: "0x0000000000000000000000000000000000000000", // TBD
    abi: [
      "function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration) external",
      "function placeBid(address nftContract, uint256 tokenId) external payable",
      "function endAuction(address nftContract, uint256 tokenId) external",
      "function getAuction(address nftContract, uint256 tokenId) external view returns (address seller, uint256 highestBid, address highestBidder, uint256 endTime, bool active)",
      "event AuctionCreated(address indexed nftContract, uint256 indexed tokenId, address seller, uint256 startingPrice, uint256 endTime)",
      "event BidPlaced(address indexed nftContract, uint256 indexed tokenId, address bidder, uint256 amount)",
      "event AuctionEnded(address indexed nftContract, uint256 indexed tokenId, address winner, uint256 amount)",
    ],
  },
  CollectionFactory: {
    address: "0x0000000000000000000000000000000000000000", // TBD
    abi: [
      "function createCollection(string name, string symbol, uint256 maxSupply, uint256 mintPrice, uint96 royaltyBps) external returns (address)",
      "function getCollections() external view returns (address[] memory)",
      "function getCollectionsByOwner(address owner) external view returns (address[] memory)",
      "event CollectionCreated(address indexed collection, address indexed owner, string name, string symbol)",
    ],
  },
};
