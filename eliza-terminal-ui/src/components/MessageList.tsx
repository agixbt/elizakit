import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageItem from './MessageItem';

const MessageList: React.FC = () => {
  const { messages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-[calc(100vh-200px)] overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-black">
      {messages.map((message, index) => (
        <div key={index}>
          <MessageItem message={message} />
        </div>
      ))}
      {isLoading && (
        <div className="mb-2 text-yellow-500">
          <span className="opacity-50">[{new Date().toLocaleTimeString()}] </span>
          <span># Processing...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;