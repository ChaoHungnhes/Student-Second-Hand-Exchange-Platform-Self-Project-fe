import React from "react";

interface ChatInputProps {
  chatClosed: boolean;
  connected: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  chatClosed,
  connected,
  input,
  onInputChange,
  onSend,
}) => (
  <div className="p-4 bg-white flex items-center gap-3 border-t border-gray-100">
    <button className="text-gray-400 hover:text-indigo-600 p-2 transition-colors">
      <i className="fa-solid fa-circle-plus text-xl"></i>
    </button>

    <div className="flex-1 relative">
      <input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        disabled={chatClosed}
        placeholder={chatClosed ? "Giao dịch đã đóng" : "Nhập tin nhắn..."}
        className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
      />
    </div>

    <button
      onClick={onSend}
      disabled={!input.trim() || !connected || chatClosed}
      className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 transition-all active:scale-95"
    >
      <i className="fa-solid fa-paper-plane"></i>
    </button>
  </div>
);

export default ChatInput;
