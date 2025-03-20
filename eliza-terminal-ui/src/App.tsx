import ConnectWallet from './components/ConnectWallet';
import ChatInterface from './components/ChatInterface';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

function App() {

const { primaryWallet } = useDynamicContext();

  return (
    <div className="min-h-screen bg-black text-green-500 p-4 font-mono">
      <div className="max-w-3xl mx-auto">
        {primaryWallet ? (
          <ChatInterface />
        ) : (
          <ConnectWallet/>
        )}
      </div>
    </div>
  );
}

export default App;