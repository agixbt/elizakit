import React, { useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { sendMessage } from "../api/agent";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const ChatInput: React.FC = () => {
  const {
    input,
    setInput,
    isWalletConnected,
    isAgentRunning,
    isLoading,
    addMessage,
    setLoading,
  } = useChatStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const { primaryWallet } = useDynamicContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isWalletConnected || !isAgentRunning || isLoading)
      return;

    const userMessage = input.trim();
    addMessage("user", userMessage);
    setInput("");
    setLoading(true);

    try {
      /**
       * 1. check balance
       * 2. deduct aixbt token balance if exists
       * 3. send message to agent
       * 4. get response from agent
       * 5. add response to messages
       */

      if (!primaryWallet) {
        throw new Error("Primary wallet not found");
      }
      const txn = await primaryWallet.sendBalance({
        amount: ".0001",
        toAddress: "0x3942F3a6D7637d9F151B81063a9c5003B278231b",
      });
      console.log(`https://sepolia.basescan.org/tx/${txn}`, "view on explorer");

      const messages = await sendMessage(userMessage);
      messages.forEach((message: { text: string }) => {
        addMessage("bot", message.text);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("system", "Sorry, I encountered an error. Please try again, Check terminal for more info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <span className="mr-2">{">"}</span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!isWalletConnected || !isAgentRunning || isLoading}
        className="flex-1 bg-transparent border-none outline-none text-[#9BA3AF]"
        placeholder={
          !isWalletConnected
            ? "Connect wallet to start chatting..."
            : !isAgentRunning
            ? "Waiting for agent to be ready..."
            : isLoading
            ? "Processing..."
            : "Type your message..."
        }
      />
    </form>
  );
};

export default ChatInput;
