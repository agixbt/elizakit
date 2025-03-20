import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { checkAgentStatus } from '../api/agent';
import { generateUUID } from '../utils/generateUUID';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export function useWallet() {
  const { 
    setWalletConnected, 
    setWalletAddress, 
    setLoading, 
    addMessage,
    setRoomId,
    clearSystemMessages
  } = useChatStore();

  const { primaryWallet } = useDynamicContext();

  const connectWallet = useCallback(async () => {
      try {
        setLoading(true);
        clearSystemMessages();
        addMessage('system', 'Connecting wallet...');
        
        if (!primaryWallet) {
          throw new Error('Primary wallet not found');
        }

        const walletBasedRoomId = `${primaryWallet.address.slice(0, 10)}-${generateUUID().slice(0, 8)}`;
        setRoomId(walletBasedRoomId);
        
        setWalletAddress(primaryWallet.address);
        setWalletConnected(true);
        
        addMessage('system', 'Wallet connected successfully');
        addMessage('system', 'Checking agent status...');
        
        await checkAgentStatus();
      } catch (error) {
        console.error('Error connecting wallet:', error);
        addMessage('system', 'Error connecting wallet. Please try again.');
      } finally {
        setLoading(false);
      }
  }, [setLoading, clearSystemMessages, addMessage, primaryWallet, setRoomId, setWalletAddress, setWalletConnected]);

  return { connectWallet };
}