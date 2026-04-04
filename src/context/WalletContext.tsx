"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { CHAIN_ID, RPC_URL } from "@/lib/contracts";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  signer: null,
});

function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openMetaMaskDeepLink() {
  if (typeof window === "undefined") return;
  const dappUrl = `${window.location.host}${window.location.pathname}${window.location.search}`;
  const deepLink = `https://metamask.app.link/dapp/${dappUrl}`;
  window.location.href = deepLink;
}

const QFC_CHAIN_HEX = "0x" + CHAIN_ID.toString(16);

const QFC_NETWORK_PARAMS = {
  chainId: QFC_CHAIN_HEX,
  chainName: "QFC Testnet",
  nativeCurrency: { name: "QFC", symbol: "QFC", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureQFCNetwork(eth: any): Promise<void> {
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: QFC_CHAIN_HEX }],
    });
  } catch (switchError: unknown) {
    // 4902 = chain not added yet
    const code = (switchError as { code?: number })?.code;
    if (code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [QFC_NETWORK_PARAMS],
      });
    } else {
      throw switchError;
    }
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getEth = (): any =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof window !== "undefined" ? (window as any).ethereum : null;

  const setupProviderAndSigner = useCallback(async (account: string) => {
    const eth = getEth();
    if (!eth) return;
    const bp = new BrowserProvider(eth);
    const s = await bp.getSigner(account);
    setProvider(bp);
    setSigner(s);
  }, []);

  const connect = useCallback(async () => {
    const eth = getEth();

    if (eth) {
      try {
        // Switch/add QFC network first
        await ensureQFCNetwork(eth);

        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (accounts?.length > 0) {
          setAddress(accounts[0]);
          await setupProviderAndSigner(accounts[0]);
        }
      } catch {
        // user rejected request; keep disconnected
      }
      return;
    }

    // No injected provider: on mobile, open MetaMask app deep link.
    if (isMobileBrowser()) {
      openMetaMaskDeepLink();
    }
  }, [setupProviderAndSigner]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    const eth = getEth();
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        setupProviderAndSigner(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload provider/signer on chain change
      if (address) {
        setupProviderAndSigner(address);
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [address, disconnect, setupProviderAndSigner]);

  return (
    <WalletContext.Provider
      value={{ address, isConnected: !!address, connect, disconnect, provider, signer }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
