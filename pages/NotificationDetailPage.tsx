import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getNotificationDetailAPI,
  getNotificationsAPI,
  markNotificationAsReadAPI,
} from "../config/api";
import type { Notification } from "../types/index";
import { triggerRefreshNotificationUnreadCount } from "../utils/eventBus";

const isNotificationRead = (notification: Notification) =>
  notification.read ?? notification.isRead ?? false;

const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
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

const resolveTargetPath = (notification: Notification) => {
  const targetType = (notification.targetType || "").toUpperCase();
  const targetId = notification.targetId;

  if (!targetId) return "";
  if (targetType.includes("PRODUCT")) return `/products/${targetId}`;
  if (targetType.includes("CONVERSATION") || targetType.includes("CHAT")) return `/chat/${targetId}`;
  if (targetType.includes("USER")) return `/user/${targetId}`;
  if (targetType.includes("TRANSACTION")) return "/conversations";
  if (targetType.includes("REPORT")) return "/admin-dashboard";

  return "";
};

const NotificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchNotification = async () => {
      setLoading(true);
      setError("");

      try {
        const stateNotification = (location.state as { notification?: Notification } | null)?.notification;
        let data: Notification | null = stateNotification || null;

        if (!data) {
          try {
            const response: any = await getNotificationDetailAPI(id);
            data = response?.data?.data || response?.data || response;
          } catch (detailError) {
            const listResponse: any = await getNotificationsAPI({ page: 1, size: 100 });
            const list = listResponse?.result || listResponse?.data?.result || [];
            data = list.find((item: Notification) => String(item.id) === String(id)) || null;
          }
        }
        setNotification(data);

        if (data && !(data.read ?? data.isRead ?? false)) {
          try {
            const readResponse: any = await markNotificationAsReadAPI(id);
            const readNotification = readResponse?.data?.data || readResponse?.data || readResponse;
            setNotification({
              ...data,
              ...(typeof readNotification === "object" ? readNotification : {}),
              read: true,
              isRead: true,
              readAt: readNotification?.readAt || new Date().toISOString(),
            });
            triggerRefreshNotificationUnreadCount();
          } catch (markError) {
            console.error("Lỗi đánh dấu đã đọc:", markError);
          }
        }
      } catch (fetchError) {
        console.error("Lỗi tải chi tiết thông báo:", fetchError);
        setError("Không thể tải chi tiết thông báo.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="py-32 text-center">
        <i className="fa-solid fa-circle-notch animate-spin text-4xl text-indigo-600"></i>
        <p className="mt-4 text-sm text-gray-500 font-bold">Đang tải thông báo...</p>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <i className="fa-regular fa-bell-slash text-6xl text-gray-200"></i>
        <h1 className="mt-6 text-2xl font-black text-gray-900">Không tìm thấy thông báo</h1>
        <p className="mt-2 text-gray-500">{error || "Thông báo này không tồn tại hoặc bạn không có quyền xem."}</p>
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="mt-8 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const targetPath = resolveTargetPath(notification);
  const read = isNotificationRead(notification);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
      <button
        type="button"
        onClick={() => navigate("/notifications")}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <i className="fa-solid fa-arrow-left"></i>
        Tất cả thông báo
      </button>

      <article className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 sm:px-8 py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-3xl bg-white/15 flex items-center justify-center text-3xl flex-shrink-0">
              <i className={`fa-solid ${getNotificationIcon(notification.type)}`}></i>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-widest">
                  {notification.type}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  read ? "bg-white/15 text-white" : "bg-amber-300 text-amber-950"
                }`}>
                  {read ? "Đã đọc" : "Chưa đọc"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                {notification.title}
              </h1>
              <p className="mt-3 text-sm text-indigo-100 font-medium">
                Tạo lúc {formatDateTime(notification.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          <section>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              Nội dung
            </h2>
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <p className="text-gray-700 leading-7 whitespace-pre-line">
                {notification.content || "Thông báo này không có nội dung chi tiết."}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-gray-100 p-5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đọc lúc</p>
              <p className="mt-2 text-sm font-bold text-gray-800">{formatDateTime(notification.readAt)}</p>
            </div>

            <div className="rounded-3xl border border-gray-100 p-5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đối tượng liên quan</p>
              <p className="mt-2 text-sm font-bold text-gray-800">
                {notification.targetType || "Không có"}
              </p>
              {notification.targetId && (
                <p className="mt-1 text-xs text-gray-400 break-all">{notification.targetId}</p>
              )}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3">
            {targetPath && (
              <button
                type="button"
                onClick={() => navigate(targetPath)}
                className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                Mở nội dung liên quan
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="flex-1 border border-gray-200 text-gray-600 px-5 py-3 rounded-2xl text-sm font-black hover:bg-gray-50 transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default NotificationDetailPage;
