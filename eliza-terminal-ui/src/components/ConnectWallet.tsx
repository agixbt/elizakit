import React from "react";
import { Terminal } from "lucide-react";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";

const ConnectWallet: React.FC = () => {
  const { sdkHasLoaded } = useDynamicContext();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="text-center mb-8">
        <Terminal className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">berathebot</h1>
        <p className="text-green-400 opacity-80">
          Connect your wallet to start chatting with the agent
        </p>
      </div>
       <p className="text-green-400 opacity-80 pt-4 max-w-xl">
          {"0."} You need to deposit some AIXBT tokens to your wallet to start chatting with the agent. 
        </p>
        <p className="text-green-400 opacity-80 pt-4 max-w-xl pb-8">
          {"1."} The bot has context on the berachain ecosystem, and can help you with latest news, token prices, and more.
        </p>
        <DynamicWidget />
      {sdkHasLoaded && (
        <p className="mt-4 text-yellow-500 animate-pulse">
          Awaiting connection...
        </p>
      )}
    </div>
  );
};

export default ConnectWallet;
