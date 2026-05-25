import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getConversationsAPI,
  checkUserOnlineAPI,
  searchConversationsAPI,
} from "../config/api";
import { getImageUrl } from "../utils/imageHelper";
import { triggerRefreshUnreadCount } from "../utils/eventBus";

interface ConversationItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  productId: string;
  productTitle: string;
  productImage: string | null;
  productPrice: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const formatTimeDisplay = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return time;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${time} ${day}/${month}`;
};

const ConversationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, boolean>>({});

  const unreadThreads = conversations.filter((c) => c.unreadCount > 0).length;
  const onlinePartners = Object.values(onlineStatusMap).filter(Boolean).length;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations(keyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchConversations = async (searchKey: string = "") => {
    try {
      setLoading(true);
      const res: any = searchKey.trim()
        ? await searchConversationsAPI(searchKey)
        : await getConversationsAPI();

      const list: ConversationItem[] = res?.data || res || [];
      setConversations(list);
      triggerRefreshUnreadCount();

      if (list.length > 0) checkPartnersOnline(list);
    } catch (e) {
      console.error("Lỗi tải hội thoại:", e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPartnersOnline = async (list: ConversationItem[]) => {
    const statusMap: Record<string, boolean> = {};
    const uniquePartnerIds = [...new Set(list.map((item) => item.partnerId))];

    await Promise.all(
      uniquePartnerIds.map(async (partnerId) => {
        try {
          const res: any = await checkUserOnlineAPI(partnerId);
          let isOnline = false;
          if (typeof res === "boolean") isOnline = res;
          else if (res?.data === true) isOnline = true;
          else if (res?.data?.data === true) isOnline = true;

          statusMap[partnerId] = isOnline;
        } catch (err) {
          statusMap[partnerId] = false;
        }
      })
    );

    setOnlineStatusMap((prev) => ({ ...prev, ...statusMap }));
  };

  const handleNavigate = (chat: ConversationItem) => {
    navigate(`/chat/${chat.id}`, { state: { conversationDetails: chat } });
  };

  useEffect(() => {
    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") fetchConversations(keyword);
    };

    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    return () => document.removeEventListener("visibilitychange", handleVisibilityRefresh);
  }, [keyword]);

  if (!user) {
    return (
      <div className="relative -mx-4 -mt-8 flex min-h-[520px] items-center justify-center bg-slate-50 px-4 sm:-mx-6 lg:-mx-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
            <i className="fa-solid fa-lock text-2xl"></i>
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-950">Bạn cần đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-500">Vui lòng đăng nhập để xem tin nhắn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative -mx-4 -mt-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.34),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#f8fafc_100%)] px-4 pb-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute right-0 top-16 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-24 top-[420px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-5xl space-y-8 pt-8">
        <section className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.28),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(251,191,36,0.16),transparent_24%)]"></div>

            <div className="relative z-10">
              <span className="inline-flex rounded-full bg-gradient-to-r from-teal-300 to-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-950">
                Messenger
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Trò chuyện để chốt deal an toàn hơn.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Theo dõi hội thoại, tin chưa đọc và trạng thái online của người bán/người mua trong một inbox gọn gàng.
              </p>
            </div>

            <div className="relative z-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Hội thoại</p>
                <p className="mt-2 text-3xl font-black">{conversations.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Chưa đọc</p>
                <p className="mt-2 text-3xl font-black">{unreadThreads}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Đang online</p>
                <p className="mt-2 text-3xl font-black">{onlinePartners}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Hộp thư UniTrade</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Danh sách hội thoại</h2>
            </div>

            <div className="relative w-full md:w-[360px]">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm tên bạn bè, tên sản phẩm..."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-11 text-sm font-semibold text-slate-700 shadow-inner transition-all placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              {keyword && (
                <button
                  onClick={() => setKeyword("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  aria-label="Xóa tìm kiếm"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm">
              <i className="fa-solid fa-inbox"></i>
              Tất cả
            </button>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              {loading ? "Đang đồng bộ" : `${conversations.length} cuộc trò chuyện`}
            </span>
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <i className="fa-solid fa-circle-notch animate-spin text-4xl text-teal-500"></i>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Đang tải...</p>
            </div>
          ) : conversations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {conversations.map((chat) => {
                const isUnread = chat.unreadCount > 0;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleNavigate(chat)}
                    className={`group flex w-full items-center gap-4 p-4 text-left transition-all hover:bg-teal-50/70 sm:p-5 ${isUnread ? "bg-teal-50/40" : "bg-white"}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 shadow-sm sm:h-18 sm:w-18">
                        <img
                          src={getImageUrl(chat.productImage)}
                          alt="product"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <img
                          src={chat.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.partnerName}`}
                          className="h-9 w-9 rounded-2xl border-2 border-white bg-white object-cover shadow-md"
                          alt="avatar"
                        />
                        {onlineStatusMap[chat.partnerId] && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm shadow-emerald-300 animate-pulse"></span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className={`truncate text-sm font-black sm:text-base ${isUnread ? "text-slate-950" : "text-slate-700"}`}>
                          {chat.partnerName}
                        </h3>
                        <span className="whitespace-nowrap text-[11px] font-bold text-slate-400">
                          {formatTimeDisplay(chat.lastMessageTime)}
                        </span>
                      </div>
                      <p className="mb-1 truncate text-[11px] font-black uppercase tracking-[0.08em] text-teal-600">
                        Sản phẩm: {chat.productTitle}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm ${isUnread ? "font-black text-slate-950" : "font-semibold text-slate-400"}`}>
                          {chat.lastMessage || "Chưa có tin nhắn"}
                        </p>
                        {isUnread && (
                          <span className="inline-flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-black text-white">
                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <i className="fa-solid fa-chevron-right flex-shrink-0 text-xs text-slate-200 transition-all group-hover:translate-x-1 group-hover:text-teal-500"></i>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              {keyword ? (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
                    <i className="fa-solid fa-magnifying-glass text-4xl"></i>
                  </div>
                  <h3 className="mt-5 text-lg font-black text-slate-950">Không tìm thấy kết quả</h3>
                  <p className="mt-2 text-sm text-slate-500">Không có hội thoại phù hợp với “{keyword}”.</p>
                </>
              ) : (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
                    <i className="fa-solid fa-message-slash text-4xl"></i>
                  </div>
                  <h3 className="mt-5 text-lg font-black text-slate-950">Chưa có cuộc hội thoại nào</h3>
                  <p className="mt-2 text-sm text-slate-500">Khi bạn nhắn cho người bán, cuộc trò chuyện sẽ xuất hiện tại đây.</p>
                </>
              )}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-teal-100 bg-teal-50/80 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
              <i className="fa-solid fa-shield-heart"></i>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.16em] text-slate-950">Giao dịch an toàn</h4>
              <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                Hãy nhắn tin hẹn gặp tại khu vực đông người trong khuôn viên trường. Không chuyển khoản trước khi kiểm tra trực tiếp sản phẩm.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ConversationListPage;
