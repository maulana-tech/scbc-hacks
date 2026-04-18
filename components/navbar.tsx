"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="max-w-[1200px] mx-auto h-14 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <span className="text-bg font-bold text-[10px]">A</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">AgentMarket</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/" className="type-caption text-text-3 hover:text-text transition-colors">
            Marketplace
          </Link>
          <Link
            href="/dashboard"
            className="type-caption text-text-3 hover:text-text transition-colors"
          >
            Dashboard
          </Link>
          <span className="w-px h-3.5 bg-border" />
          <span className="type-caption text-text-3">Fuji</span>
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
        </nav>
      </div>
    </header>
  );
}
