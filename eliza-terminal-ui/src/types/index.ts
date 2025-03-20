export interface Message {
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatState {
  messages: Message[];
  roomId: string;
  isWalletConnected: boolean;
  walletAddress: string;
  isLoading: boolean;
  isAgentRunning: boolean;
  input: string;
  
  // Actions
  addMessage: (role: 'user' | 'bot' | 'system', content: string) => void;
  setInput: (input: string) => void;
  setWalletConnected: (isConnected: boolean) => void;
  setWalletAddress: (address: string) => void;
  setLoading: (isLoading: boolean) => void;
  setAgentRunning: (isRunning: boolean) => void;
  clearMessages: () => void;
  clearSystemMessages: () => void;
  setRoomId: (roomId: string) => void;
}