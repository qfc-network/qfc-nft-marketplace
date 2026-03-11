"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = typeof window !== "undefined" ? (window as any).ethereum : null;

    if (eth) {
      try {
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (accounts?.length > 0) {
          setAddress(accounts[0]);
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
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, isConnected: !!address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
