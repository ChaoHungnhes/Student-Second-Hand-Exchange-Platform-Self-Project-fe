import React from "react";

interface ChatInputProps {
  chatClosed: boolean;
  connected: boolean;
  canSendMessage: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  chatClosed,
  connected,
  canSendMessage,
  input,
  onInputChange,
  onSend,
}) => (
  <div className="border-t border-slate-100 bg-white/95 p-3 backdrop-blur-md sm:p-4">
    <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-2 shadow-inner">
      <button
        type="button"
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-white hover:text-teal-600"
        aria-label="Thêm nội dung"
      >
        <i className="fa-solid fa-circle-plus text-xl"></i>
      </button>

      <input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        disabled={chatClosed || !canSendMessage}
        placeholder={
          chatClosed
            ? "Giao dịch đã đóng"
            : canSendMessage
              ? "Nhập tin nhắn..."
              : "Chỉ người mua hoặc bán mới được nhắn tin"
        }
        className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
      />

      <button
        onClick={onSend}
        disabled={!input.trim() || !connected || chatClosed || !canSendMessage}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        aria-label="Gửi tin nhắn"
      >
        <i className="fa-solid fa-paper-plane"></i>
      </button>
    </div>
  </div>
);

export default ChatInput;
