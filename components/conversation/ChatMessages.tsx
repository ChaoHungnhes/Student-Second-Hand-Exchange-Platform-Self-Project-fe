import React from "react";
import { Message } from "./types";

interface ChatMessagesProps {
  connected: boolean;
  currentUserId: string;
  isAdminView?: boolean;
  buyerId?: string;
  sellerId?: string;
  messages: Message[];
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  formatTimeDisplay: (dateString: string) => string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  connected,
  currentUserId,
  isAdminView = false,
  buyerId,
  sellerId,
  messages,
  messagesContainerRef,
  onScroll,
  formatTimeDisplay,
}) => (
  <div
    ref={messagesContainerRef}
    onScroll={onScroll}
    className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.22),transparent_30%),linear-gradient(180deg,#f8fafc,#ffffff)] p-4 sm:p-6"
  >
    <div className="text-center">
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${connected ? "border-teal-100 bg-teal-50 text-teal-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></span>
        {connected ? "Đã kết nối" : "Đang kết nối..."}
      </span>
    </div>

    {messages.length === 0 && (
      <div className="flex min-h-[280px] items-center justify-center text-center">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-200 shadow-sm">
            <i className="fa-regular fa-comments text-3xl"></i>
          </div>
          <p className="mt-4 text-sm font-bold text-slate-400">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện nhé.</p>
        </div>
      </div>
    )}

    {messages.map((message) => {
      const isBuyer = Boolean(buyerId && String(message.senderId) === String(buyerId));
      const isSeller = Boolean(sellerId && String(message.senderId) === String(sellerId));
      const isMe = !isAdminView && String(message.senderId) === String(currentUserId);
      const alignRight = isAdminView ? isSeller : isMe;
      const senderLabel = isBuyer ? "Người mua" : isSeller ? "Người bán" : "Người gửi";

      return (
        <div key={message.id} className={`flex ${alignRight ? "justify-end" : "justify-start"}`}>
          <div className={`flex max-w-[86%] flex-col gap-1 sm:max-w-[74%] ${alignRight ? "items-end" : "items-start"}`}>
            {isAdminView && (
              <span className={`px-2 text-[10px] font-black uppercase tracking-widest ${isSeller ? "text-amber-600" : "text-sky-600"}`}>
                {senderLabel}
              </span>
            )}
            <div
              className={`break-words rounded-[1.35rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                alignRight
                  ? isAdminView
                    ? "rounded-br-md bg-amber-100 text-slate-900 shadow-amber-100"
                    : "rounded-br-md bg-slate-950 text-white shadow-slate-900/10"
                  : isAdminView
                    ? "rounded-bl-md bg-sky-100 text-slate-900 shadow-sky-100"
                    : "rounded-bl-md border border-slate-100 bg-white text-slate-800"
              }`}
            >
              {message.content}
            </div>

            <span className="px-2 text-[10px] font-bold text-slate-400">
              {formatTimeDisplay(message.createdAt)}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

export default ChatMessages;
