import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { WalletProvider } from "@/context/WalletContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QFC NFT Marketplace",
  description: "Trade NFTs on the QFC blockchain",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-gray-900 text-white`}>
        <WalletProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
            <p>QFC NFT Marketplace &copy; 2026. Built on QFC Blockchain.</p>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
