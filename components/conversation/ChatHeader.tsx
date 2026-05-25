import React from "react";
import { ConversationDetails } from "./types";

interface ChatHeaderProps {
  chatClosed: boolean;
  confirming: boolean;
  details: ConversationDetails | null;
  hasReviewed: boolean;
  isOwner: boolean;
  isAdminView?: boolean;
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
  isAdminView = false,
  partnerOnline,
  transactionId,
  getImageUrl,
  onBack,
  onConfirmTransaction,
  onOpenProduct,
  onOpenReview,
}) => (
  <div className="relative z-10 overflow-hidden border-b border-white/10 bg-slate-950 text-white">
    <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl"></div>
    <div className="pointer-events-none absolute right-0 bottom-0 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl"></div>

    <div className="relative flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/20"
          aria-label="Quay lại"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        <div className="relative flex-shrink-0">
          <img
            src={
              details?.partnerAvatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${details?.partnerName || details?.buyerName || "chat"}`
            }
            className="h-12 w-12 rounded-2xl bg-white/10 object-cover ring-2 ring-white/20"
            alt="partner"
          />
          {!isAdminView && partnerOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-slate-950 bg-emerald-400 shadow-sm shadow-emerald-300"></span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black sm:text-lg">
              {isAdminView
                ? "Hội thoại sinh viên"
                : details?.partnerName || "Đối tác"}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${partnerOnline ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-slate-300"}`}
            >
              {isAdminView
                ? "Admin view"
                : partnerOnline
                  ? "Online"
                  : "Offline"}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-teal-200">
            {isAdminView
              ? "Admin đang xem - không phải người tham gia"
              : isOwner
                ? "Người mua"
                : "Người bán"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {chatClosed && transactionId && !hasReviewed && !isAdminView && (
            <button
              onClick={onOpenReview}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-200"
            >
              <i className="fa-solid fa-star"></i>
              Đánh giá
            </button>
          )}

          {hasReviewed && !isAdminView && (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-black text-slate-200">
              <i className="fa-solid fa-check"></i>
              Đã đánh giá
            </span>
          )}

          {isOwner && !chatClosed && !isAdminView && (
            <button
              onClick={onConfirmTransaction}
              disabled={confirming}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {confirming ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <i className="fa-solid fa-handshake-simple"></i>
              )}
              Chốt đơn
            </button>
          )}
        </div>

        {isAdminView && details && (
          <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/10 p-3 text-xs font-bold text-slate-200 sm:min-w-[260px]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-black uppercase tracking-[0.18em] text-sky-200">
                Người mua
              </span>
              <span className="truncate text-right">
                {details.buyerName || details.buyerId || "Chưa rõ"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-black uppercase tracking-[0.18em] text-amber-200">
                Người bán
              </span>
              <span className="truncate text-right">
                {details.sellerName || details.sellerId || "Chưa rõ"}
              </span>
            </div>
          </div>
        )}

        {details && (
          <button
            type="button"
            onClick={() => onOpenProduct(details.productId)}
            className="group flex min-w-0 items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-2 pr-3 text-left transition-all hover:-translate-y-0.5 hover:bg-white/15 sm:min-w-[260px]"
          >
            <img
              src={getImageUrl(details.productImage)}
              className="h-12 w-12 flex-shrink-0 rounded-2xl bg-white object-cover"
              alt="product"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-white">
                {details.productTitle || "Xem chi tiết sản phẩm"}
              </p>
              <p className="mt-1 text-sm font-black text-teal-200">
                {typeof details.productPrice === "number"
                  ? `${details.productPrice.toLocaleString("vi-VN")}đ`
                  : "Xem giá"}
              </p>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-teal-200"></i>
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ChatHeader;
