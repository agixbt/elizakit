import React, { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { checkAgentStatus } from '../api/agent';
import Header from './Header';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatInterface: React.FC = () => {
  const { walletAddress, addMessage, clearSystemMessages } = useChatStore();

  useEffect(() => {
    if (walletAddress) {
      clearSystemMessages();
      addMessage('system', 'Welcome back! Checking agent status...');
      checkAgentStatus().catch(console.error);
    }
  }, [walletAddress, addMessage, clearSystemMessages]);

  return (
    <>
      <Header />
      <MessageList />
      <ChatInput />
    </>
  );
};

export default ChatInterface;