import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationsAPI, markAllNotificationsAsReadAPI } from "../config/api";
import type { MetaData, Notification, NotificationResponse } from "../types/index";
import { triggerRefreshNotificationUnreadCount } from "../utils/eventBus";

const DEFAULT_META: MetaData = { page: 1, pageSize: 10, pages: 1, total: 0 };

const normalizeNotificationsResponse = (response: any): NotificationResponse => {
  if (response?.result && Array.isArray(response.result)) {
    return { meta: response.meta || DEFAULT_META, result: response.result };
  }

  if (Array.isArray(response)) {
    return {
      meta: { page: 1, pageSize: response.length, pages: 1, total: response.length },
      result: response,
    };
  }

  return { meta: DEFAULT_META, result: [] };
};

const isNotificationRead = (notification: Notification) =>
  notification.read ?? notification.isRead ?? false;

const formatDateTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getNotificationIcon = (type?: string) => {
  const normalized = (type || "").toUpperCase();
  if (normalized.includes("PRODUCT")) return "fa-box-open";
  if (normalized.includes("TRANSACTION")) return "fa-handshake";
  if (normalized.includes("REPORT")) return "fa-triangle-exclamation";
  if (normalized.includes("REVIEW")) return "fa-star";
  if (normalized.includes("CHAT") || normalized.includes("MESSAGE")) return "fa-comment-dots";
  return "fa-bell";
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<MetaData>(DEFAULT_META);
  const [currentPage, setCurrentPage] = useState(1);
  const [readFilter, setReadFilter] = useState<"ALL" | "false" | "true">("ALL");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((item) => !isNotificationRead(item)).length;
  const readCount = notifications.length - unreadCount;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotificationsAPI({ page: currentPage, size: 10, read: readFilter });
      const normalized = normalizeNotificationsResponse(response);
      setNotifications(normalized.result);
      setMeta(normalized.meta || DEFAULT_META);
    } catch (error) {
      console.error("Lỗi tải thông báo:", error);
      setNotifications([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, readFilter]);

  const handleFilterChange = (nextFilter: "ALL" | "false" | "true") => {
    setReadFilter(nextFilter);
    setCurrentPage(1);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsReadAPI();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );
      triggerRefreshNotificationUnreadCount();
      if (readFilter === "false") fetchNotifications();
    } catch (error) {
      console.error("Lỗi đánh dấu đọc tất cả thông báo:", error);
      alert("Không thể đánh dấu đọc tất cả thông báo lúc này.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative -mx-4 -mt-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.34),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#f8fafc_100%)] px-4 pb-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute right-0 top-16 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-24 top-[430px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-5xl space-y-8 pt-8">
        <section className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.28),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(251,191,36,0.16),transparent_24%)]"></div>

            <div className="relative z-10">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white/20"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Quay lại
              </button>
              <span className="inline-flex rounded-full bg-gradient-to-r from-teal-300 to-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-950">
                Notification hub
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Bảng tin cập nhật cho mọi giao dịch.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Theo dõi tin nhắn, sản phẩm, giao dịch, đánh giá và các nhắc nhở quan trọng trong UniTrade.
              </p>
            </div>

            <div className="relative z-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "Tổng", value: meta.total, icon: "fa-bell" },
                { label: "Chưa đọc", value: unreadCount, icon: "fa-envelope" },
                { label: "Đã đọc", value: readCount, icon: "fa-envelope-open" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">{item.label}</p>
                      <p className="mt-2 text-3xl font-black">{item.value}</p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                      <i className={`fa-solid ${item.icon}`}></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Bộ lọc thông báo</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Chọn trạng thái cần xem</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-3 gap-1.5 rounded-3xl bg-slate-100 p-1.5">
                {[
                  { value: "ALL", label: "Tất cả" },
                  { value: "false", label: "Chưa đọc" },
                  { value: "true", label: "Đã đọc" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleFilterChange(item.value as "ALL" | "false" | "true")}
                    className={`rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition-all ${
                      readFilter === item.value ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-white hover:text-slate-950"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll || notifications.every(isNotificationRead)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5 hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {markingAll ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-check-double"></i>}
                Đọc tất cả
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          {loading ? (
            <div className="p-20 text-center">
              <i className="fa-solid fa-circle-notch animate-spin text-4xl text-teal-500"></i>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Đang tải...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const isRead = isNotificationRead(notification);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => navigate(`/notifications/${notification.id}`, { state: { notification } })}
                    className={`group flex w-full gap-4 p-4 text-left transition-all hover:bg-teal-50/70 sm:p-6 ${isRead ? "bg-white" : "bg-teal-50/40"}`}
                  >
                    <div className={`flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm ${isRead ? "bg-slate-100 text-slate-400" : "bg-slate-950 text-white shadow-slate-900/10"}`}>
                      <i className={`fa-solid ${getNotificationIcon(notification.type)}`}></i>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className={`truncate text-sm sm:text-base ${isRead ? "font-bold text-slate-700" : "font-black text-slate-950"}`}>
                          {notification.title}
                        </h2>
                        {!isRead && (
                          <span aria-label="Thông báo chưa đọc" className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"></span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                        {notification.content || "Không có nội dung chi tiết."}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-500">{notification.type}</span>
                        {notification.targetType && (
                          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-teal-700">{notification.targetType}</span>
                        )}
                        <span className="text-slate-400">{formatDateTime(notification.createdAt)}</span>
                      </div>
                    </div>

                    <i className="fa-solid fa-chevron-right self-center text-xs text-slate-200 transition-all group-hover:translate-x-1 group-hover:text-teal-500"></i>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
                <i className="fa-regular fa-bell-slash text-4xl"></i>
              </div>
              <h2 className="mt-5 text-lg font-black text-slate-950">Chưa có thông báo</h2>
              <p className="mt-2 text-sm text-slate-500">Khi có cập nhật mới, thông báo sẽ xuất hiện ở đây.</p>
            </div>
          )}
        </section>

        {!loading && meta.pages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
              Trang {currentPage}/{meta.pages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, meta.pages))}
              disabled={currentPage === meta.pages}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
