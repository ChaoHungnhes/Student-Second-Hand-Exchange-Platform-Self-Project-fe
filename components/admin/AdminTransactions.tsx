import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Transaction, TransactionStatus } from "../../types";
import {
  deleteAdminTransactionAPI,
  getAdminTransactionsAPI,
  getTransactionByProductAPI,
  updateAdminTransactionStatusAPI,
} from "../../config/api";

interface Props {
  transactions?: Transaction[];
  onUpdateStatus?: (id: string, newStatus: TransactionStatus) => void;
  onDeleteTransaction?: (id: string) => void;
}

const fieldClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100";

const getStatusStyle = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.COMPLETED:
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case TransactionStatus.CANCELLED:
      return "border-rose-100 bg-rose-50 text-rose-700";
    default:
      return "border-amber-100 bg-amber-50 text-amber-700";
  }
};

const getStatusLabel = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.COMPLETED:
      return "Hoàn tất";
    case TransactionStatus.CANCELLED:
      return "Đã hủy";
    default:
      return "Đang chờ";
  }
};

const AdminTransactions: React.FC<Props> = ({ transactions: initialTransactions = [], onUpdateStatus, onDeleteTransaction }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TransactionStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const resp = await getAdminTransactionsAPI({
        page: currentPage,
        size: pageSize,
        keyword: keyword || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sortBy: "createdAt",
        sortDir,
      });

      if (resp) {
        setTransactions(resp.result || []);
        setMeta(resp.meta || { page: currentPage, pageSize, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error("Fetch transactions error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: TransactionStatus) => {
    const prev = transactions;
    setTransactions((prevState) => prevState.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));

    try {
      const resp = await updateAdminTransactionStatusAPI(id, newStatus);
      if (resp) {
        setTransactions((prevState) => prevState.map((t) => (t.id === resp.id ? { ...t, ...resp } : t)));
        onUpdateStatus?.(id, newStatus);
      }
    } catch (error) {
      console.error("Update status failed", error);
      alert("Cập nhật trạng thái thất bại");
      setTransactions(prev);
    }
  };

  const viewDetails = async (productId: string) => {
    setDetailsLoading(true);
    try {
      const resp = await getTransactionByProductAPI(productId);
      if (resp) {
        setSelectedTransaction(resp);
      } else {
        setSelectedTransaction(null);
        alert("Không tìm thấy giao dịch cho sản phẩm này");
      }
    } catch (error) {
      console.error("Fetch transaction by product failed", error);
      alert("Lấy chi tiết giao dịch thất bại");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Xóa bản ghi giao dịch này?")) return;
    const prev = transactions;
    setTransactions((prevState) => prevState.filter((t) => t.id !== id));

    try {
      const resp = await deleteAdminTransactionAPI(id);
      if (typeof resp === "string") alert(resp);
      onDeleteTransaction?.(id);
      await fetchTransactions();
    } catch (error) {
      console.error("Delete transaction failed", error);
      alert("Xóa giao dịch thất bại");
      setTransactions(prev);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [keyword, statusFilter, currentPage, pageSize, sortDir]);

  const completedOnPage = useMemo(() => transactions.filter((t) => t.status === TransactionStatus.COMPLETED).length, [transactions]);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/10 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(20,184,166,0.34),transparent_26%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.24),transparent_24%)]" />
        <i className="fa-solid fa-handshake-angle absolute -bottom-10 right-8 text-[10rem] text-white/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-100 ring-1 ring-white/15">
              <i className="fa-solid fa-receipt" /> Transaction flow
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Quản lý giao dịch minh bạch hơn</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-300">Theo dõi trao đổi giữa sinh viên, cập nhật trạng thái và kiểm tra chi tiết giao dịch nhanh chóng.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tổng giao dịch</p>
              <p className="mt-2 text-4xl font-black tracking-tighter">{meta.total}</p>
            </div>
            <div className="rounded-[1.5rem] bg-amber-300 p-4 text-slate-950">
              <p className="text-[10px] font-black uppercase tracking-widest">Hoàn tất/trang</p>
              <p className="mt-2 text-4xl font-black tracking-tighter">{completedOnPage}</p>
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
              placeholder="Tìm sản phẩm, người mua, người bán hoặc mã giao dịch..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
              className={`${fieldClass} pl-12`}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className={fieldClass}>
            <option value="ALL">Tất cả trạng thái</option>
            {Object.values(TransactionStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortDir} onChange={(e) => { setSortDir(e.target.value as any); setCurrentPage(1); }} className={fieldClass}>
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className={fieldClass}>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={30}>30 / trang</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>{["Sản phẩm / Giá", "Người bán", "Người mua", "Trạng thái", "Thời gian", "Thao tác"].map((h) => <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center"><i className="fa-solid fa-circle-notch animate-spin text-3xl text-teal-500" /><p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">Đang tải</p></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center"><i className="fa-solid fa-receipt mb-4 text-5xl text-slate-100" /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Không tìm thấy giao dịch nào</p></td></tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-5"><div className="max-w-[240px]"><button onClick={() => navigate(`/products/${t.productId}`)} className="block truncate text-left text-sm font-black text-slate-950 hover:text-teal-700">{t.productTitle}</button><p className="mt-1 text-sm font-black text-teal-700">{t.productPrice.toLocaleString()}đ</p><p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-slate-300">ID: {t.id}</p></div></td>
                  <td className="px-6 py-5"><button onClick={() => navigate(`/user/${t.sellerId}`)} className="group text-left"><p className="text-sm font-bold text-slate-700 group-hover:text-teal-700">{t.sellerName}</p><p className="text-[10px] font-bold text-slate-400">ID: {t.sellerId}</p></button></td>
                  <td className="px-6 py-5"><button onClick={() => navigate(`/user/${t.buyerId}`)} className="group text-left"><p className="text-sm font-bold text-slate-700 group-hover:text-teal-700">{t.buyerName}</p><p className="text-[10px] font-bold text-slate-400">ID: {t.buyerId}</p></button></td>
                  <td className="px-6 py-5"><select value={t.status} onChange={(e) => handleChangeStatus(t.id, e.target.value as TransactionStatus)} className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none ${getStatusStyle(t.status)}`}>{Object.values(TransactionStatus).map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-400">{new Date(t.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-6 py-5"><div className="flex gap-2"><button onClick={() => viewDetails(t.productId)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition hover:bg-teal-600 hover:text-white" title="Xem chi tiết"><i className="fa-solid fa-eye" /></button><button onClick={() => handleDeleteTransaction(t.id)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white" title="Xóa"><i className="fa-solid fa-trash-can" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.pages > 1 && <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-black uppercase tracking-widest text-slate-400">Trang {meta.page} / {meta.pages}</span><div className="flex gap-2"><button disabled={meta.page === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black text-slate-600 disabled:opacity-30">Trước</button><button disabled={meta.page === meta.pages} onClick={() => setCurrentPage((p) => Math.min(meta.pages, p + 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black text-slate-600 disabled:opacity-30">Sau</button></div></div>}
      </section>

      {(selectedTransaction || detailsLoading) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)} />
          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {detailsLoading && !selectedTransaction ? (
              <div className="p-12 text-center"><i className="fa-solid fa-circle-notch animate-spin text-4xl text-teal-500" /><p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Đang tải chi tiết</p></div>
            ) : selectedTransaction && (
              <>
                <div className="relative overflow-hidden bg-slate-950 px-7 py-7 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(20,184,166,0.35),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(251,191,36,0.24),transparent_24%)]" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-200">Chi tiết giao dịch</p>
                      <h3 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-tight">{selectedTransaction.productTitle}</h3>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(selectedTransaction.status)}`}>{getStatusLabel(selectedTransaction.status)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-200">#{selectedTransaction.id}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedTransaction(null)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"><i className="fa-solid fa-xmark" /></button>
                  </div>
                </div>

                <div className="grid gap-5 p-7 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[1.5rem] border border-teal-100 bg-teal-50/60 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-700">Giá trị giao dịch</p>
                    <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{selectedTransaction.productPrice?.toLocaleString?.() ?? selectedTransaction.productPrice}đ</p>
                    <button onClick={() => navigate(`/products/${selectedTransaction.productId}`)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-teal-700">
                      Xem sản phẩm <i className="fa-solid fa-arrow-up-right-from-square" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-slate-50 p-5"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Người bán</p><button onClick={() => navigate(`/user/${selectedTransaction.sellerId}`)} className="mt-2 text-left text-lg font-black text-slate-950 hover:text-teal-700">{selectedTransaction.sellerName}</button><p className="mt-1 break-all text-xs font-bold text-slate-400">{selectedTransaction.sellerId}</p></div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-5"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Người mua</p><button onClick={() => navigate(`/user/${selectedTransaction.buyerId}`)} className="mt-2 text-left text-lg font-black text-slate-950 hover:text-teal-700">{selectedTransaction.buyerName}</button><p className="mt-1 break-all text-xs font-bold text-slate-400">{selectedTransaction.buyerId}</p></div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-5 sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian tạo</p><p className="mt-2 text-sm font-black text-slate-950">{new Date(selectedTransaction.createdAt).toLocaleString("vi-VN")}</p></div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-7 py-5">
                  <button onClick={() => setSelectedTransaction(null)} className="rounded-2xl px-6 py-3 text-sm font-black text-slate-500 hover:bg-white">Đóng</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
