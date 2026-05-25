import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Conversation, ConversationStatus } from "../../types";
import { getImageUrl } from "../../utils/imageHelper";
import {
  deleteConversationAPI,
  getAdminConversationsAPI,
  updateConversationStatusAPI,
} from "../../config/api";

interface Props {
  conversations?: Conversation[];
  onUpdateStatus?: (id: string, newStatus: ConversationStatus) => void;
  onDelete?: (id: string) => void;
}

const PAGE_SIZE = 10;
const fieldClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100";

const getStatusBadge = (status: ConversationStatus) => {
  switch (status) {
    case ConversationStatus.ACTIVE:
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case ConversationStatus.CLOSED:
      return "border-rose-100 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

const getStatusLabel = (status: ConversationStatus) => {
  switch (status) {
    case ConversationStatus.ACTIVE:
      return "Đang mở";
    case ConversationStatus.CLOSED:
      return "Đã đóng";
    default:
      return status;
  }
};

const AdminConversations: React.FC<Props> = ({ conversations: propConversations, onUpdateStatus, onDelete }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ConversationStatus>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [idFilter, setIdFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingConversationId, setUpdatingConversationId] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const fallbackConversations = propConversations ?? [];

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const params: any = { page: 1, size: 100 };
        if (idFilter) params.id = idFilter;
        if (keyword) params.keyword = keyword;
        if (statusFilter !== "ALL") params.status = statusFilter;
        const res: any = await getAdminConversationsAPI(params);

        if (res?.result && Array.isArray(res.result)) {
          setAllConversations(res.result);
        } else if (Array.isArray(res)) {
          setAllConversations(res);
        } else {
          setAllConversations(fallbackConversations as Conversation[]);
        }
      } catch (e) {
        console.error("Failed to fetch admin conversations", e);
        setAllConversations(fallbackConversations as Conversation[]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [idFilter, keyword, statusFilter, propConversations]);

  const filteredData = useMemo(() => {
    let result = [...allConversations];
    if (idFilter) result = result.filter((c) => c.id.includes(idFilter));
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (c) =>
          (c.productTitle || "").toLowerCase().includes(kw) ||
          (c.buyerName || "").toLowerCase().includes(kw) ||
          (c.sellerName || "").toLowerCase().includes(kw) ||
          (c.id || "").toLowerCase().includes(kw)
      );
    }
    if (statusFilter !== "ALL") result = result.filter((c) => c.status === statusFilter);

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "NEWEST" ? dateB - dateA : dateA - dateB;
    });
  }, [allConversations, idFilter, keyword, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = useMemo(() => filteredData.filter((c) => c.status === ConversationStatus.ACTIVE).length, [filteredData]);

  const handleStatusChange = async (id: string, newStatus: ConversationStatus) => {
    setUpdatingConversationId(id);
    try {
      await updateConversationStatusAPI(id, newStatus);
      setAllConversations((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
      onUpdateStatus?.(id, newStatus);
    } catch (e) {
      console.error("Update conversation status failed:", e);
      alert("Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingConversationId(null);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hội thoại ${id.substring(0, 8)}...?`)) return;

    setDeletingConversationId(id);
    try {
      const response = await deleteConversationAPI(id);
      setAllConversations((prev) => prev.filter((c) => c.id !== id));
      onDelete?.(id);
      alert(typeof response === "string" ? response : "Đã xóa cuộc hội thoại thành công!");
    } catch (error) {
      console.error("Delete conversation failed:", error);
      alert("Xóa thất bại. Vui lòng thử lại.");
    } finally {
      setDeletingConversationId(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/10 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(20,184,166,0.34),transparent_26%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.24),transparent_24%)]" />
        <i className="fa-solid fa-comments absolute -bottom-10 right-8 text-[10rem] text-white/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-100 ring-1 ring-white/15">
              <i className="fa-solid fa-message" /> Conversation watch
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Giám sát hội thoại gọn và an toàn</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-300">Theo dõi trao đổi giữa người mua và người bán, đóng hội thoại rủi ro và mở nhanh màn hình chat khi cần kiểm tra.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Đang giám sát</p>
              <p className="mt-2 text-4xl font-black tracking-tighter">{filteredData.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-amber-300 p-4 text-slate-950">
              <p className="text-[10px] font-black uppercase tracking-widest">Đang mở</p>
              <p className="mt-2 text-4xl font-black tracking-tighter">{activeCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-900/5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo sản phẩm, người mua, người bán..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
              className={`${fieldClass} pl-12`}
            />
          </div>
          <input
            type="text"
            placeholder="ID hội thoại..."
            value={idFilter}
            onChange={(e) => { setIdFilter(e.target.value); setCurrentPage(1); }}
            className={fieldClass}
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className={fieldClass}>
            <option value="ALL">Tất cả trạng thái</option>
            {Object.values(ConversationStatus).map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }} className={fieldClass}>
            <option value="NEWEST">Mới nhất trước</option>
            <option value="OLDEST">Cũ nhất trước</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>{["Sản phẩm thảo luận", "Cặp người dùng", "Trạng thái", "Khởi tạo", "Thao tác"].map((h) => <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center"><i className="fa-solid fa-circle-notch animate-spin text-3xl text-teal-500" /><p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">Đang tải hội thoại</p></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center"><i className="fa-solid fa-comments-slash mb-4 text-5xl text-slate-100" /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Không có hội thoại nào</p></td></tr>
              ) : paginatedData.map((c) => (
                <tr key={c.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-5">
                    <button className="group flex items-center gap-4 text-left" onClick={() => navigate(`/products/${c.productId}`)}>
                      <img src={getImageUrl(c.productImage)} className="h-14 w-14 rounded-2xl object-cover" alt={c.productTitle || "product"} />
                      <div className="max-w-[260px]"><p className="truncate text-sm font-black text-slate-950 group-hover:text-teal-700">{c.productTitle}</p><p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">#{c.id}</p></div>
                    </button>
                  </td>
                  <td className="px-6 py-5"><div className="space-y-2"><button className="group flex items-center gap-2 text-left" onClick={() => navigate(`/user/${c.buyerId}`)}><span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-black text-sky-600">BUYER</span><span className="text-xs font-bold text-slate-700 group-hover:text-teal-700">{c.buyerName}</span></button><button className="group flex items-center gap-2 text-left" onClick={() => navigate(`/user/${c.sellerId}`)}><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700">SELLER</span><span className="text-xs font-bold text-slate-700 group-hover:text-teal-700">{c.sellerName}</span></button></div></td>
                  <td className="px-6 py-5"><select value={c.status} onChange={(e) => handleStatusChange(c.id, e.target.value as ConversationStatus)} disabled={updatingConversationId === c.id} className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none transition ${updatingConversationId === c.id ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${getStatusBadge(c.status)}`}>{Object.values(ConversationStatus).map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}</select>{updatingConversationId === c.id && <div className="mt-1 text-[10px] font-bold text-slate-400">Đang cập nhật...</div>}</td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-400">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-6 py-5"><div className="flex gap-2"><button onClick={() => navigate(`/chat/${c.id}`, { state: { conversationDetails: c, adminView: true } })} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition hover:bg-teal-600 hover:text-white" title="Xem hội thoại"><i className="fa-solid fa-eye" /></button><button onClick={() => handleDeleteConversation(c.id)} disabled={deletingConversationId === c.id} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white disabled:opacity-50" title="Xóa bản ghi"><i className={`fa-solid ${deletingConversationId === c.id ? "fa-circle-notch animate-spin" : "fa-trash-can"}`} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black text-slate-600 disabled:opacity-30">Trước</button><button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black text-slate-600 disabled:opacity-30">Sau</button></div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminConversations;

