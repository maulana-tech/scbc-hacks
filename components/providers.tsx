"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { avalancheFuji, avalanche, hardhat } from "wagmi/chains";

import { SidebarProvider } from "./sidebar-context";

import "@rainbow-me/rainbowkit/styles.css";

const enableLocal =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_CHAIN === "true" ||
  process.env.NODE_ENV !== "production";

const config = getDefaultConfig({
  appName: "Vaxa",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: enableLocal
    ? [hardhat, avalancheFuji]
    : [avalancheFuji, avalanche],
  ssr: true,
  multiInjectedProviderDiscovery: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
