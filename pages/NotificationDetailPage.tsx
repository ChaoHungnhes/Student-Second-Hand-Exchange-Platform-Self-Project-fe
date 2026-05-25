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
      <div className="relative -mx-4 -mt-8 flex min-h-[520px] items-center justify-center bg-slate-50 px-4 sm:-mx-6 lg:-mx-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-10 py-8 text-center shadow-xl shadow-slate-900/5">
          <i className="fa-solid fa-circle-notch animate-spin text-4xl text-teal-500"></i>
          <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-slate-400">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="relative -mx-4 -mt-8 flex min-h-[520px] items-center justify-center bg-slate-50 px-4 sm:-mx-6 lg:-mx-8">
        <div className="max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
            <i className="fa-regular fa-bell-slash text-4xl"></i>
          </div>
          <h1 className="mt-6 text-2xl font-black text-slate-950">Không tìm thấy thông báo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "Thông báo này không tồn tại hoặc bạn không có quyền xem."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="mt-8 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const targetPath = resolveTargetPath(notification);
  const read = isNotificationRead(notification);

  return (
    <div className="relative -mx-4 -mt-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.34),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#f8fafc_100%)] px-4 pb-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute right-0 top-16 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-24 top-[430px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-4xl space-y-6 pt-8">
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Tất cả thông báo
        </button>

        <article className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
          <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-teal-400/20 blur-3xl"></div>
            <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl"></div>

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-white/10 text-3xl ring-1 ring-white/10">
                <i className={`fa-solid ${getNotificationIcon(notification.type)}`}></i>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-teal-100">
                    {notification.type}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${read ? "bg-white/10 text-white" : "bg-amber-300 text-amber-950"}`}>
                    {read ? "Đã đọc" : "Chưa đọc"}
                  </span>
                </div>

                <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  {notification.title}
                </h1>
                <p className="mt-4 text-sm font-semibold text-slate-300">
                  Tạo lúc {formatDateTime(notification.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <section>
              <h2 className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-teal-600">Nội dung</h2>
              <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
                  {notification.content || "Thông báo này không có nội dung chi tiết."}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <i className="fa-regular fa-clock"></i>
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Đọc lúc</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{formatDateTime(notification.readAt)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <i className="fa-solid fa-link"></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Đối tượng liên quan</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{notification.targetType || "Không có"}</p>
                    {notification.targetId && <p className="mt-1 break-all text-xs font-semibold text-slate-400">{notification.targetId}</p>}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              {targetPath && (
                <button
                  type="button"
                  onClick={() => navigate(targetPath)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700"
                >
                  Mở nội dung liên quan
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/notifications")}
                className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default NotificationDetailPage;
