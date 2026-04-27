import React from "react";
import { Message } from "./types";

interface ChatMessagesProps {
  connected: boolean;
  currentUserId: string;
  messages: Message[];
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  formatTimeDisplay: (dateString: string) => string;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  connected,
  currentUserId,
  messages,
  messagesContainerRef,
  onScroll,
  formatTimeDisplay,
}) => (
  <div
    ref={messagesContainerRef}
    onScroll={onScroll}
    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50"
  >
    <div className="text-center py-4">
      <span className="bg-gray-200/50 text-gray-500 text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest">
        {connected ? "Đã kết nối" : "Đang kết nối..."}
      </span>
    </div>

    {messages.map((message) => {
      const isMe = message.senderId === currentUserId;

      return (
        <div
          key={message.id}
          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}
          >
            <div
              className={`px-4 py-3 rounded-2xl text-sm shadow-sm break-words ${
                isMe
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
              }`}
            >
              {message.content}
            </div>

            <span className="text-[9px] text-gray-400 font-medium px-2">
              {formatTimeDisplay(message.createdAt)}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

export default ChatMessages;
