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
  if (normalized === "PRODUCT") return "bg-sky-100 text-sky-700 border-sky-200";
  if (normalized === "CONVERSATION") return "bg-cyan-100 text-cyan-700 border-cyan-200";
  if (normalized === "REPORT") return "bg-rose-100 text-rose-700 border-rose-200";
  if (normalized === "SYSTEM") return "bg-slate-900 text-white border-slate-800";
  if (normalized === "USER") return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "TRANSACTION") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
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

  const readRate = stats.totalCount ? Math.round((stats.readCount / stats.totalCount) * 100) : 0;
  const statsCards = [
    { label: "Tổng thông báo", value: stats.totalCount, icon: "fa-bell", tone: "from-slate-900 to-slate-700", helper: "Tất cả chiến dịch" },
    { label: "Đã đọc", value: stats.readCount, icon: "fa-envelope-open-text", tone: "from-emerald-500 to-teal-600", helper: `${readRate}% tương tác` },
    { label: "Chưa đọc", value: stats.unreadCount, icon: "fa-bolt", tone: "from-orange-500 to-rose-500", helper: "Cần tối ưu tiêu đề" },
  ];

  return (
    <div className="relative space-y-8 animate-in slide-in-from-bottom-3 duration-500">
      <div className="absolute -top-10 left-6 -z-10 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"></div>
      <div className="absolute top-40 right-0 -z-10 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl"></div>

      <section className="overflow-hidden rounded-[38px] border border-white/70 bg-[#f8f3e8] shadow-2xl shadow-stone-100">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative p-7 md:p-9">
            <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border-[18px] border-orange-200/70 md:block"></div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-stone-600">
              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.9)]"></span>
              Broadcast studio
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-stone-950 md:text-5xl">Quản lý thông báo</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-stone-500">Soạn, lọc và chăm sóc các thông báo gửi đến người dùng bằng giao diện sáng, rõ ràng và dễ thao tác hơn.</p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-7 inline-flex items-center gap-3 rounded-3xl bg-stone-950 px-7 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-stone-300 transition hover:-translate-y-0.5 hover:bg-black"
            >
              <i className="fa-solid fa-paper-plane"></i>
              Tạo thông báo
            </button>
          </div>
          <div className="bg-stone-950 p-7 text-white md:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-200">Tỷ lệ đã đọc</p>
            <div className="mt-6 flex items-end gap-3">
              <span className="text-6xl font-black tracking-tighter">{statsLoading ? "--" : readRate}</span>
              <span className="mb-2 text-2xl font-black text-orange-200">%</span>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-300 transition-all" style={{ width: `${readRate}%` }}></div>
            </div>
            <p className="mt-5 text-sm font-medium leading-6 text-stone-300">Theo dõi nhanh mức độ người dùng đã mở thông báo để điều chỉnh nội dung phù hợp.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statsCards.map((card) => (
          <div key={card.label} className="group overflow-hidden rounded-[32px] border border-white bg-white p-5 shadow-xl shadow-stone-100 transition hover:-translate-y-1">
            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${card.tone} text-white shadow-lg`}>
              <i className={`fa-solid ${card.icon}`}></i>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{card.label}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-3xl font-black text-stone-950">{statsLoading ? "..." : card.value}</p>
              <p className="text-[10px] font-bold text-stone-400">{card.helper}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[34px] border border-white bg-white/85 p-5 shadow-xl shadow-stone-100 backdrop-blur">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            placeholder="ID người nhận..."
            value={recipientId}
            onChange={(event) => {
              setRecipientId(event.target.value);
              setCurrentPage(1);
            }}
            className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-bold text-stone-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
          <select
            value={readFilter}
            onChange={(event) => {
              setReadFilter(event.target.value as "ALL" | "false" | "true");
              setCurrentPage(1);
            }}
            className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-black text-stone-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            aria-label="Lọc theo trạng thái đọc"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="false">Chưa đọc</option>
            <option value="true">Đã đọc</option>
          </select>
          <input type="datetime-local" value={createdFrom} onChange={(event) => { setCreatedFrom(event.target.value); setCurrentPage(1); }} className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-bold text-stone-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" aria-label="Từ ngày" />
          <input type="datetime-local" value={createdTo} onChange={(event) => { setCreatedTo(event.target.value); setCurrentPage(1); }} className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-bold text-stone-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" aria-label="Đến ngày" />
          <button type="button" onClick={resetFilters} className="rounded-3xl border border-stone-200 px-5 py-4 text-xs font-black uppercase tracking-widest text-stone-500 transition hover:bg-stone-50">Xóa bộ lọc</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[38px] border border-stone-100 bg-white shadow-xl shadow-stone-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed text-left">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[18%]" />
              <col className="w-[31%]" />
              <col className="w-[15%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead className="bg-stone-50">
              <tr>
                <th className="px-5 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">ID</th>
                <th className="px-5 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Người nhận</th>
                <th className="px-5 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Nội dung</th>
                <th className="px-5 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Đối tượng</th>
                <th className="px-5 py-5 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">Trạng thái</th>
                <th className="px-5 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">Thời gian</th>
                <th className="px-5 py-5 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center font-bold text-stone-400">Đang tải thông báo...</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center font-bold text-stone-400">Không có thông báo phù hợp.</td></tr>
              ) : notifications.map((notification) => (
                <tr key={notification.id} className="align-top transition hover:bg-orange-50/40">
                  <td className="px-5 py-5"><span className="inline-flex rounded-2xl bg-stone-950 px-3 py-2 text-xs font-black text-white">#{notification.id}</span></td>
                  <td className="px-5 py-5"><p className="truncate text-sm font-black text-stone-900" title={notification.recipientName || ""}>{notification.recipientName || "-"}</p><p className="mt-1 break-all text-[10px] font-bold text-stone-400">#{notification.recipientId || "-"}</p></td>
                  <td className="px-5 py-5"><div className="flex items-start gap-3">{!notification.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.14)]"></span>}<div className="min-w-0"><p className="line-clamp-1 text-sm font-black text-stone-950">{notification.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{notification.content}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">{notification.type}</p></div></div></td>
                  <td className="px-5 py-5"><span className={`inline-flex h-8 min-w-[96px] items-center justify-center rounded-2xl border px-3 text-[10px] font-black uppercase tracking-wider ${getTargetTone(notification.targetType)}`}>{notification.targetType || "NONE"}</span>{notification.targetId && <p className="mt-2 truncate text-[10px] font-bold text-stone-400" title={notification.targetId}>{notification.targetId}</p>}</td>
                  <td className="px-5 py-5"><div className="flex justify-center"><span className={`inline-flex h-9 w-24 items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-wider ${notification.read ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{notification.read ? "Đã đọc" : "Chưa đọc"}</span></div></td>
                  <td className="px-5 py-5"><p className="text-xs font-bold text-stone-600">{formatDateTime(notification.createdAt)}</p>{notification.readAt && <p className="mt-1 text-[10px] text-stone-400">Đọc: {formatDateTime(notification.readAt)}</p>}</td>
                  <td className="px-5 py-5"><div className="flex justify-center gap-2"><button type="button" onClick={() => openEdit(notification)} className="h-9 w-9 rounded-2xl bg-stone-100 text-stone-700 transition hover:bg-stone-950 hover:text-white" title="Sửa thông báo"><i className="fa-solid fa-pen text-xs"></i></button><button type="button" onClick={() => handleDelete(notification)} className="h-9 w-9 rounded-2xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white" title="Xóa thông báo"><i className="fa-solid fa-trash-can text-xs"></i></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Trang {meta.page} / {meta.pages} - Tổng {meta.total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-2xl border border-stone-200 bg-white px-5 py-2 text-xs font-black disabled:opacity-30">Trước</button>
            <button type="button" disabled={currentPage >= meta.pages} onClick={() => setCurrentPage((page) => Math.min(meta.pages, page + 1))} className="rounded-2xl border border-stone-200 bg-white px-5 py-2 text-xs font-black disabled:opacity-30">Sau</button>
          </div>
        </div>
      </div>

      {(isCreateOpen || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm" onClick={() => { if (!submitting) { setIsCreateOpen(false); setEditing(null); } }}></div>
          <form onSubmit={editing ? handleUpdate : handleCreate} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[36px] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-stone-950 to-orange-900 px-8 py-7 text-white">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-200">{editing ? `ID #${editing.id}` : "Tin nhắn mới"}</p><h2 className="mt-1 text-2xl font-black tracking-tight">{editing ? "Cập nhật thông báo" : "Tạo thông báo mới"}</h2></div>
                <button type="button" onClick={() => { setIsCreateOpen(false); setEditing(null); }} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Đóng"><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-8">
              {!editing && (
                <div className="rounded-3xl border border-stone-100 bg-stone-50 p-5">
                  <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={form.sendToAll} onChange={(event) => setForm((prev) => ({ ...prev, sendToAll: event.target.checked }))} className="h-4 w-4 accent-orange-600" /><span className="text-sm font-black text-stone-700">Gửi đến tất cả người dùng</span></label>
                  {!form.sendToAll && <input type="text" placeholder="ID người nhận, ví dụ u002" value={form.recipientId} onChange={(event) => setForm((prev) => ({ ...prev, recipientId: event.target.value }))} className="mt-4 w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />}
                </div>
              )}
              <input type="text" placeholder="Tiêu đề" value={editing ? editForm.title : form.title} onChange={(event) => editing ? setEditForm((prev) => ({ ...prev, title: event.target.value })) : setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-bold outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
              <textarea placeholder="Nội dung" rows={5} value={editing ? editForm.content : form.content} onChange={(event) => editing ? setEditForm((prev) => ({ ...prev, content: event.target.value })) : setForm((prev) => ({ ...prev, content: event.target.value }))} className="w-full resize-y rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input type="text" placeholder="Target ID" value={editing ? editForm.targetId : form.targetId} onChange={(event) => editing ? setEditForm((prev) => ({ ...prev, targetId: event.target.value })) : setForm((prev) => ({ ...prev, targetId: event.target.value }))} className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
                <select value={editing ? editForm.targetType : form.targetType} onChange={(event) => editing ? setEditForm((prev) => ({ ...prev, targetType: event.target.value })) : setForm((prev) => ({ ...prev, targetType: event.target.value }))} className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm font-black outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" aria-label="Loại đối tượng liên quan">
                  {TARGET_TYPES.map((target) => <option key={target} value={target}>{target}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-stone-100 bg-stone-50 px-8 py-5">
              <button type="button" onClick={() => { setIsCreateOpen(false); setEditing(null); }} className="rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-stone-500 hover:bg-white">Hủy</button>
              <button type="submit" disabled={submitting} className="rounded-2xl bg-stone-950 px-7 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-black disabled:opacity-50">{submitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : editing ? "Lưu thay đổi" : "Gửi thông báo"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
