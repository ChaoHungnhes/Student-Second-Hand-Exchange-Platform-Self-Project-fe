import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationsAPI, markAllNotificationsAsReadAPI } from "../config/api";
import type { MetaData, Notification, NotificationResponse } from "../types/index";
import { triggerRefreshNotificationUnreadCount } from "../utils/eventBus";

const DEFAULT_META: MetaData = { page: 1, pageSize: 10, pages: 1, total: 0 };

const normalizeNotificationsResponse = (response: any): NotificationResponse => {
  if (response?.result && Array.isArray(response.result)) {
    return {
      meta: response.meta || DEFAULT_META,
      result: response.result,
    };
  }

  if (Array.isArray(response)) {
    return {
      meta: {
        page: 1,
        pageSize: response.length,
        pages: 1,
        total: response.length,
      },
      result: response,
    };
  }

  return {
    meta: DEFAULT_META,
    result: [],
  };
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

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotificationsAPI({
        page: currentPage,
        size: 10,
        read: readFilter,
      });
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
        })),
      );
      triggerRefreshNotificationUnreadCount();
      if (readFilter === "false") {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Lỗi đánh dấu đọc tất cả thông báo:", error);
      alert("Không thể đánh dấu đọc tất cả thông báo lúc này.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Quay lại
          </button>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <i className="fa-solid fa-bell text-indigo-600"></i>
            Thông báo
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Theo dõi các cập nhật về sản phẩm, giao dịch, báo cáo và tin nhắn của bạn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto">
          <div className="flex bg-gray-100 p-1 rounded-2xl">
          {[
            { value: "ALL", label: "Tất cả" },
            { value: "false", label: "Chưa đọc" },
            { value: "true", label: "Đã đọc" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleFilterChange(item.value as "ALL" | "false" | "true")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                readFilter === item.value
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
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
            className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {markingAll ? (
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            ) : (
              "Đọc tất cả"
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <i className="fa-solid fa-circle-notch animate-spin text-3xl text-indigo-600"></i>
            <p className="mt-3 text-xs text-gray-400 font-bold uppercase tracking-widest">Đang tải...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => {
              const isRead = isNotificationRead(notification);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => navigate(`/notifications/${notification.id}`, { state: { notification } })}
                  className={`w-full text-left p-5 sm:p-6 flex gap-4 hover:bg-indigo-50/40 transition-all ${
                    isRead ? "bg-white" : "bg-indigo-50/25"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isRead ? "bg-gray-100 text-gray-400" : "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                    }`}
                  >
                    <i className={`fa-solid ${getNotificationIcon(notification.type)}`}></i>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className={`text-sm sm:text-base truncate ${isRead ? "font-bold text-gray-700" : "font-black text-gray-900"}`}>
                        {notification.title}
                      </h2>
                      {!isRead && (
                        <span
                          aria-label="Thông báo chưa đọc"
                          className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-2 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
                        ></span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {notification.content || "Không có nội dung chi tiết."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                        {notification.type}
                      </span>
                      {notification.targetType && (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
                          {notification.targetType}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="self-center text-gray-200">
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <i className="fa-regular fa-bell-slash text-5xl text-gray-200"></i>
            <h2 className="mt-5 text-lg font-black text-gray-900">Chưa có thông báo</h2>
            <p className="mt-2 text-sm text-gray-500">
              Khi có cập nhật mới, thông báo sẽ xuất hiện ở đây.
            </p>
          </div>
        )}
      </div>

      {!loading && meta.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            className="w-11 h-11 rounded-2xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <span className="text-sm font-bold text-gray-500">
            Trang {currentPage}/{meta.pages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, meta.pages))}
            disabled={currentPage === meta.pages}
            className="w-11 h-11 rounded-2xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
