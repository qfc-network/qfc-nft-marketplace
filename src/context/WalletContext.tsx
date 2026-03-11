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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
    if (eth) {
      try {
        const accounts = await eth.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch {
        // User rejected or no provider — use mock address for demo
        setAddress("0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12");
      }
    } else {
      // No wallet extension — use mock address for demo
      setAddress("0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12");
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
