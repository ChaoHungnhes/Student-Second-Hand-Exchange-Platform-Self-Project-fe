import React from "react";
import { ConversationDetails } from "./types";

interface ChatHeaderProps {
  chatClosed: boolean;
  confirming: boolean;
  details: ConversationDetails | null;
  hasReviewed: boolean;
  isOwner: boolean;
  partnerOnline: boolean;
  transactionId: string | null;
  getImageUrl: (url?: string | null) => string;
  onBack: () => void;
  onConfirmTransaction: () => void;
  onOpenProduct: (productId: string) => void;
  onOpenReview: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatClosed,
  confirming,
  details,
  hasReviewed,
  isOwner,
  partnerOnline,
  transactionId,
  getImageUrl,
  onBack,
  onConfirmTransaction,
  onOpenProduct,
  onOpenReview,
}) => (
  <div className="bg-indigo-600 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md z-10">
    <div className="flex items-center gap-4 w-full md:w-auto">
      <button
        onClick={onBack}
        className="hover:bg-white/20 p-2 rounded-full transition-colors"
      >
        <i className="fa-solid fa-arrow-left"></i>
      </button>

      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={
              details?.partnerAvatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${details?.partnerName}`
            }
            className="w-10 h-10 rounded-full bg-white/20 p-1 object-cover"
            alt="partner"
          />

          {partnerOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
          )}
        </div>

        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            {details?.partnerName}

            {partnerOnline ? (
              <span className="text-[9px] bg-green-500/20 text-green-100 px-1.5 rounded border border-green-400/30">
                Online
              </span>
            ) : (
              <span className="text-[9px] bg-gray-500/40 text-gray-200 px-1.5 rounded">
                Offline
              </span>
            )}
          </h3>

          <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">
            {isOwner ? "Người mua" : "Người bán"}
          </p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
      {chatClosed && transactionId && !hasReviewed && (
        <button
          onClick={onOpenReview}
          className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 text-xs font-bold py-2 px-4 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 animate-pulse"
        >
          <i className="fa-solid fa-star"></i>
          ĐÁNH GIÁ
        </button>
      )}

      {hasReviewed && (
        <span className="bg-gray-400/50 text-white/80 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 cursor-default">
          <i className="fa-solid fa-check"></i>
          ĐÃ ĐÁNH GIÁ
        </span>
      )}

      {!isOwner && <span className="hidden">Không phải chủ</span>}
      {chatClosed && <span className="hidden">Đã đóng chat</span>}

      {isOwner && !chatClosed && (
        <button
          onClick={onConfirmTransaction}
          disabled={confirming}
          className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {confirming ? (
            <i className="fa-solid fa-circle-notch animate-spin"></i>
          ) : (
            <i className="fa-solid fa-handshake-simple"></i>
          )}
          CHỐT ĐƠN
        </button>
      )}

      {details && (
        <div
          onClick={() => onOpenProduct(details.productId)}
          className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-2 pr-4 flex items-center gap-3 cursor-pointer border border-white/10"
        >
          <img
            src={getImageUrl(details.productImage)}
            className="w-10 h-10 rounded-lg object-cover bg-white"
            alt="product"
          />

          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-xs font-bold truncate max-w-[100px]">
              {details.productTitle}
            </p>

            <p className="text-xs font-black text-indigo-200">
              {details.productPrice?.toLocaleString("vi-VN")}đ
            </p>
          </div>

          <i className="fa-solid fa-chevron-right text-[10px] opacity-50"></i>
        </div>
      )}
    </div>
  </div>
);

export default ChatHeader;
