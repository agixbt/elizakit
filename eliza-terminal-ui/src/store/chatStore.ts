import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { generateUUID } from '../utils/generateUUID';
import type { ChatState } from '../types';

export const useChatStore = create<ChatState>()(
  persist(
    immer((set) => ({
      messages: [],
      roomId: generateUUID(),
      isWalletConnected: false,
      walletAddress: '',
      isLoading: false,
      isAgentRunning: false,
      input: '',
      
      addMessage: (role, content) => set((state) => {
        state.messages.push({
          role,
          content,
          timestamp: new Date().toLocaleTimeString()
        });
      
        if (state.messages.length > 20) {
          const userAndBotMessages = state.messages.filter(
            msg => msg.role === 'user' || msg.role === 'bot'
          );
          if (userAndBotMessages.length > 10) {
            const messagesToKeep = userAndBotMessages.slice(-10);
            state.messages = messagesToKeep;
          }
        }
      }),
      
      setInput: (input) => set((state) => {
        state.input = input;
      }),
      
      setWalletConnected: (isConnected) => set((state) => {
        state.isWalletConnected = isConnected;
        if (isConnected) {
          state.messages = state.messages.filter(msg => msg.role !== 'system');
        }
      }),
      
      setWalletAddress: (address) => set((state) => {
        state.walletAddress = address;
      }),
      
      setLoading: (isLoading) => set((state) => {
        state.isLoading = isLoading;
      }),
      
      setAgentRunning: (isRunning) => set((state) => {
        state.isAgentRunning = isRunning;
      }),
      
      clearMessages: () => set((state) => {
        state.messages = [];
      }),
      
      clearSystemMessages: () => set((state) => {
        state.messages = state.messages.filter(msg => msg.role !== 'system');
      }),
      
      setRoomId: (roomId) => set((state) => {
        state.roomId = roomId;
      }),
    })),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messages: state.messages.filter(msg => msg.role === 'user' || msg.role === 'bot'),
        roomId: state.roomId,
        walletAddress: state.walletAddress,
        isWalletConnected: state.isWalletConnected,
      }),
    }
  )
);