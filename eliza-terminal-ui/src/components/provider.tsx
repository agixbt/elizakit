import {
    DynamicContextProvider,
  } from "@dynamic-labs/sdk-react-core";
  import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
  import { createConfig, WagmiProvider } from "wagmi";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { http } from "viem";
  import { baseSepolia } from "viem/chains";
  import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
  
  const config = createConfig({
    chains: [baseSepolia],
    multiInjectedProviderDiscovery: false,
    transports: {
      [baseSepolia.id]: http(),
    },
  });
  
  const queryClient = new QueryClient();
  
  export default function App({ children }: { children: React.ReactNode }) {
    return (
      <DynamicContextProvider
        settings={{
          environmentId: "8edb183b-ed12-4dc6-8837-f6e6db47b95a",
          walletConnectors: [EthereumWalletConnectors],
        }}
      >
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <DynamicWagmiConnector>
              {children}
            </DynamicWagmiConnector>
          </QueryClientProvider>
        </WagmiProvider>
      </DynamicContextProvider>
    );
  }
  