import React, { useEffect, useState } from "react";
import {
  createAdminNotificationAPI,
  deleteAdminNotificationAPI,
  getAdminNotificationStatsAPI,
  getAdminNotificationsAPI,
  updateAdminNotificationAPI,
} from "../../config/api";
import type { MetaData, Notification } from "../../types/index";

type AdminNotificationStats = {
  totalCount: number;
  readCount: number;
  unreadCount: number;
};

type NotificationForm = {
  recipientId: string;
  sendToAll: boolean;
  title: string;
  content: string;
  targetId: string;
  targetType: string;
};

const DEFAULT_META: MetaData = { page: 1, pageSize: 10, pages: 1, total: 0 };
const DEFAULT_STATS: AdminNotificationStats = {
  totalCount: 0,
  readCount: 0,
  unreadCount: 0,
};

const EMPTY_FORM: NotificationForm = {
  recipientId: "",
  sendToAll: false,
  title: "",
  content: "",
  targetId: "",
  targetType: "SYSTEM",
};

const TARGET_TYPES = ["SYSTEM", "PRODUCT", "CONVERSATION", "REPORT", "USER", "TRANSACTION"];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeNotificationsResponse = (response: any) => ({
  meta: response?.meta || DEFAULT_META,
  result: Array.isArray(response?.result) ? response.result : [],
});

const getTargetTone = (targetType?: string | null) => {
  const normalized = (targetType || "").toUpperCase();
  if (normalized === "PRODUCT") return "bg-blue-50 text-blue-700 border-blue-100";
  if (normalized === "CONVERSATION") return "bg-cyan-50 text-cyan-700 border-cyan-100";
  if (normalized === "REPORT") return "bg-red-50 text-red-700 border-red-100";
  if (normalized === "SYSTEM") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (normalized === "USER") return "bg-violet-50 text-violet-700 border-violet-100";
  if (normalized === "TRANSACTION") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
};

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<MetaData>(DEFAULT_META);
  const [stats, setStats] = useState<AdminNotificationStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [recipientId, setRecipientId] = useState("");
  const [readFilter, setReadFilter] = useState<"ALL" | "false" | "true">("ALL");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<NotificationForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Notification | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    targetId: "",
    targetType: "SYSTEM",
  });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response: any = await getAdminNotificationStatsAPI();
      setStats({
        totalCount: Number(response?.totalCount || 0),
        readCount: Number(response?.readCount || 0),
        unreadCount: Number(response?.unreadCount || 0),
      });
    } catch (error) {
      console.error("Không thể tải thống kê thông báo:", error);
      setStats(DEFAULT_STATS);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getAdminNotificationsAPI({
        page: currentPage,
        size: 10,
        recipientId: recipientId.trim() || undefined,
        read: readFilter,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
      });
      const normalized = normalizeNotificationsResponse(response);
      setNotifications(normalized.result);
      setMeta(normalized.meta);
    } catch (error) {
      console.error("Không thể tải danh sách thông báo:", error);
      setNotifications([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, recipientId, readFilter, createdFrom, createdTo]);

  const resetFilters = () => {
    setRecipientId("");
    setReadFilter("ALL");
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.sendToAll && !form.recipientId.trim()) {
      alert("Vui lòng nhập ID người nhận hoặc chọn gửi đến tất cả người dùng.");
      return;
    }
    if (!form.title.trim() || !form.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        sendToAll: form.sendToAll,
        title: form.title.trim(),
        content: form.content.trim(),
        targetType: form.targetType.trim() || "SYSTEM",
      };
      if (!form.sendToAll) payload.recipientId = form.recipientId.trim();
      if (form.targetId.trim()) payload.targetId = form.targetId.trim();

      await createAdminNotificationAPI(payload);
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      setCurrentPage(1);
      await Promise.all([fetchNotifications(), fetchStats()]);
      alert("Tạo thông báo thành công.");
    } catch (error) {
      console.error("Tạo thông báo thất bại:", error);
      alert("Tạo thông báo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (notification: Notification) => {
    setEditing(notification);
    setEditForm({
      title: notification.title || "",
      content: notification.content || "",
      targetId: notification.targetId || "",
      targetType: notification.targetType || "SYSTEM",
    });
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        targetType: editForm.targetType.trim() || "SYSTEM",
      };
      if (editForm.targetId.trim()) payload.targetId = editForm.targetId.trim();

      await updateAdminNotificationAPI(editing.id, payload);
      setEditing(null);
      await fetchNotifications();
      alert("Cập nhật thông báo thành công.");
    } catch (error) {
      console.error("Cập nhật thông báo thất bại:", error);
      alert("Cập nhật thông báo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (notification: Notification) => {
    if (!window.confirm(`Xóa thông báo #${notification.id}?`)) return;

    try {
      await deleteAdminNotificationAPI(notification.id);
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      await fetchStats();
    } catch (error) {
      console.error("Xóa thông báo thất bại:", error);
      alert("Xóa thông báo thất bại.");
    }
  };

  const statsCards = [
    { label: "Tổng thông báo", value: stats.totalCount, icon: "fa-bell", tone: "text-indigo-600 bg-indigo-50" },
    { label: "Đã đọc", value: stats.readCount, icon: "fa-envelope-open", tone: "text-emerald-600 bg-emerald-50" },
    { label: "Chưa đọc", value: stats.unreadCount, icon: "fa-envelope", tone: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý thông báo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo, lọc, cập nhật và xóa thông báo gửi đến người dùng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 text-white px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
        >
          <i className="fa-solid fa-paper-plane"></i>
          Tạo thông báo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((card) => (
          <div key={card.label} className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.tone}`}>
              <i className={`fa-solid ${card.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-black text-gray-900">{statsLoading ? "..." : card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="ID người nhận..."
            value={recipientId}
            onChange={(event) => {
              setRecipientId(event.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={readFilter}
            onChange={(event) => {
              setReadFilter(event.target.value as "ALL" | "false" | "true");
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Lọc theo trạng thái đọc"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="false">Chưa đọc</option>
            <option value="true">Đã đọc</option>
          </select>
          <input
            type="datetime-local"
            value={createdFrom}
            onChange={(event) => {
              setCreatedFrom(event.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Từ ngày"
          />
          <input
            type="datetime-local"
            value={createdTo}
            onChange={(event) => {
              setCreatedTo(event.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Đến ngày"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full min-w-[1120px] table-fixed text-left">
          <colgroup>
            <col className="w-[19%]" />
            <col className="w-[31%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người nhận</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Đối tượng</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold">
                  Đang tải thông báo...
                </td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400 font-bold">
                  Không có thông báo phù hợp.
                </td>
              </tr>
            ) : (
              notifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50/70 transition-colors align-top">
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-gray-900 truncate" title={notification.recipientName || ""}>
                      {notification.recipientName || "-"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 break-all mt-1">#{notification.recipientId || "-"}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"></span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 line-clamp-1">{notification.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{notification.content}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">{notification.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex h-7 min-w-[92px] items-center justify-center rounded-xl border px-3 text-[10px] font-black uppercase tracking-wider ${getTargetTone(notification.targetType)}`}>
                      {notification.targetType || "NONE"}
                    </span>
                    {notification.targetId && (
                      <p className="mt-2 text-[10px] text-gray-400 font-bold truncate" title={notification.targetId}>
                        {notification.targetId}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex h-8 w-24 items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          notification.read ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {notification.read ? "Đã đọc" : "Chưa đọc"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-gray-600">{formatDateTime(notification.createdAt)}</p>
                    {notification.readAt && (
                      <p className="text-[10px] text-gray-400 mt-1">Đọc: {formatDateTime(notification.readAt)}</p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(notification)}
                        className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                        title="Sửa thông báo"
                      >
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(notification)}
                        className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                        title="Xóa thông báo"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-6 py-5 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Trang {meta.page} / {meta.pages} - Tổng {meta.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={currentPage >= meta.pages}
              onClick={() => setCurrentPage((page) => Math.min(meta.pages, page + 1))}
              className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {(isCreateOpen || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => {
              if (!submitting) {
                setIsCreateOpen(false);
                setEditing(null);
              }
            }}
          ></div>

          <form
            onSubmit={editing ? handleUpdate : handleCreate}
            className="relative z-10 bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {editing ? "Cập nhật thông báo" : "Tạo thông báo mới"}
                </h2>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  {editing ? `ID #${editing.id}` : "Gửi riêng cho một người dùng hoặc toàn bộ người dùng"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditing(null);
                }}
                className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 hover:text-gray-700"
                aria-label="Đóng"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              {!editing && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sendToAll}
                      onChange={(event) => setForm((prev) => ({ ...prev, sendToAll: event.target.checked }))}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm font-black text-gray-700">Gửi đến tất cả người dùng</span>
                  </label>

                  {!form.sendToAll && (
                    <input
                      type="text"
                      placeholder="ID người nhận, ví dụ u002"
                      value={form.recipientId}
                      onChange={(event) => setForm((prev) => ({ ...prev, recipientId: event.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Tiêu đề"
                value={editing ? editForm.title : form.title}
                onChange={(event) =>
                  editing
                    ? setEditForm((prev) => ({ ...prev, title: event.target.value }))
                    : setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <textarea
                placeholder="Nội dung"
                rows={5}
                value={editing ? editForm.content : form.content}
                onChange={(event) =>
                  editing
                    ? setEditForm((prev) => ({ ...prev, content: event.target.value }))
                    : setForm((prev) => ({ ...prev, content: event.target.value }))
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Target ID"
                  value={editing ? editForm.targetId : form.targetId}
                  onChange={(event) =>
                    editing
                      ? setEditForm((prev) => ({ ...prev, targetId: event.target.value }))
                      : setForm((prev) => ({ ...prev, targetId: event.target.value }))
                  }
                  className="px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={editing ? editForm.targetType : form.targetType}
                  onChange={(event) =>
                    editing
                      ? setEditForm((prev) => ({ ...prev, targetType: event.target.value }))
                      : setForm((prev) => ({ ...prev, targetType: event.target.value }))
                  }
                  className="px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Loại đối tượng liên quan"
                >
                  {TARGET_TYPES.map((target) => (
                    <option key={target} value={target}>
                      {target}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditing(null);
                }}
                className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : editing ? "Lưu thay đổi" : "Gửi thông báo"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
