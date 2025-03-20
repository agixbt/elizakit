import axios from 'axios';
import { useChatStore } from '../store/chatStore';

const API_BASE_URL = process.env.BOT_API_BASE_URL || 'http://localhost:3001';
const AGENT_ID = process.env.BOT_AGENT_ID || "972c6dc4-468b-0f8f-95c8-7dbc4552faf6";

export const checkAgentStatus = async () => {
  const { setAgentRunning, addMessage, roomId } = useChatStore.getState();
  
  try {
    const response = await axios.get(`${API_BASE_URL}/agents/${AGENT_ID}`);
    setAgentRunning(true);
    addMessage('system', `Agent is ready to chat (Room: ${roomId.slice(0, 8)}...)`);
    return response.data;
  } catch (error) {
    console.error('Error checking agent status:', error);
    setAgentRunning(false);
    addMessage('system', 'Agent is not available');
    throw error;
  }
};

export const sendMessage = async (text: string) => {
  const { walletAddress, roomId } = useChatStore.getState();
  
  try {
    const response = await axios.post(`${API_BASE_URL}/${AGENT_ID}/message`, {
      text,
      userId: walletAddress,
      userName: `User-${walletAddress.slice(0, 6)}`,
      roomId
    });
    
    await fetchMemories();
    
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const fetchMemories = async () => {
  const { roomId } = useChatStore.getState();
  
  try {
    const response = await axios.get(`${API_BASE_URL}/agents/${AGENT_ID}/${roomId}/memories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching memories:', error);
    throw error;
  }
};


// THIS DOES NOT WORK AS INTENTED, SAVING LAST 10 MESSAGES IN LOCAL STORAGE
// export const loadPreviousMessages = async () => {
//   const { roomId, walletAddress, addMessage } = useChatStore.getState();
  
//   try {
//     const memories = await axios.get(`${API_BASE_URL}/agents/${AGENT_ID}/${roomId}/memories`);
//     console.log('Previous messages:', memories.data);
    
//     if (memories.data && memories.data.memories && memories.data.memories.length > 0) {
//       // Clear existing messages first to avoid duplicates
//       useChatStore.getState().clearMessages();
      
//       // Add messages from memories
//       memories.data.memories.forEach((memory: any) => {
//         if (memory.userId === walletAddress) {
//           addMessage('user', memory.content.text);
//           addMessage('bot', memory.content.text);
//         } else {
//           addMessage('bot', memory.content.text);
//         }
//       });
      
//       return true;
//     }
    
//     return false;
//   } catch (error) {
//     console.error('Error loading previous messages:', error);
//     return false;
//   }
// };