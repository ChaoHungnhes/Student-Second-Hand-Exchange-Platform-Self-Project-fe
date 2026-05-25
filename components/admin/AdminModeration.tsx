import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AIStatus, Product } from "../../types";
import { Category } from "../../types/index";
import {
  approveProductAPI,
  deleteAdminProductAPI,
  getAdminProductsAPI,
  getCategoriesAPI,
  rejectProductAPI,
} from "../../config/api";
import { getImageUrl } from "../../utils/imageHelper";

const PAGE_SIZE = 8;

const getAiTheme = (status?: string) => {
  if (status === AIStatus.OK) {
    return {
      badge: "bg-emerald-500 text-white",
      box: "border-emerald-100 bg-emerald-50",
      text: "text-emerald-700",
      icon: "fa-circle-check",
      label: "An toàn",
    };
  }

  if (status === AIStatus.WARNING) {
    return {
      badge: "bg-amber-400 text-slate-950",
      box: "border-amber-100 bg-amber-50",
      text: "text-amber-700",
      icon: "fa-triangle-exclamation",
      label: "Cần xem kỹ",
    };
  }

  return {
    badge: "bg-rose-500 text-white",
    box: "border-rose-100 bg-rose-50",
    text: "text-rose-700",
    icon: "fa-ban",
    label: "Rủi ro cao",
  };
};

const AdminModeration: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [sortDir, setSortDir] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, pages: 1, total: 0 });

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "APPROVE" | "REJECT" | null;
    product: Product | null;
  }>({ isOpen: false, type: null, product: null });

  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = (await getCategoriesAPI()) as any;
        if (res) setCategories(res || []);
      } catch (e) {
        console.error(e);
      }
    };

    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = (await getAdminProductsAPI({
        page: currentPage,
        size: PAGE_SIZE,
        status: "PENDING",
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        aiStatus: aiStatus || undefined,
        sortBy: "createdAt",
        sortDir,
      })) as any;

      if (res) {
        setProducts(res.result || []);
        setMeta(res.meta || { page: 1, pageSize: PAGE_SIZE, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryId, aiStatus, sortDir]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng này?")) return;

    try {
      await deleteAdminProductAPI(id);
      alert("Đã xóa sản phẩm thành công");
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại");
    }
  };

  const openActionModal = (product: Product, type: "APPROVE" | "REJECT") => {
    setActionModal({ isOpen: true, type, product });
    setAdminNote(type === "APPROVE" ? "Nội dung hợp lệ, duyệt." : "Vi phạm quy tắc cộng đồng.");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { type, product } = actionModal;
    if (!product || !type) return;

    try {
      const payload = {
        adminNote,
        version: (product as any).version,
      };

      if (type === "APPROVE") {
        await approveProductAPI(product.id, payload);
        alert(`Đã duyệt bài: ${product.title}`);
      } else {
        await rejectProductAPI(product.id, payload);
        alert(`Đã từ chối bài: ${product.title}`);
      }

      setActionModal({ isOpen: false, type: null, product: null });
      setAdminNote("");
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Thao tác thất bại. Có thể dữ liệu đã cũ, vui lòng tải lại trang.");
    }
  };

  const queueLabel = useMemo(() => {
    if (meta.total === 0) return "Hàng chờ sạch";
    if (meta.total < 5) return "Có thể xử lý nhanh";
    return "Cần ưu tiên trong hôm nay";
  }, [meta.total]);

  return (
    <div className="relative animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/10 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(45,212,191,0.35),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(251,191,36,0.25),transparent_24%)]" />
        <i className="fa-solid fa-shield-halved absolute -bottom-8 right-8 text-[10rem] text-white/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-100 ring-1 ring-white/15">
              <i className="fa-solid fa-seedling" /> Moderation desk
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Duyệt sản phẩm rõ ràng, nhanh và công bằng</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-300">Kiểm tra bài đăng mới trước khi lên sàn để sinh viên mua bán an toàn hơn, ít spam hơn và dễ tin tưởng nhau hơn.</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">Hàng chờ</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-5xl font-black tracking-tighter">{meta.total}</span>
              <span className="mb-2 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">Pending</span>
            </div>
            <p className="mt-2 text-xs font-bold text-teal-100">{queueLabel}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-5">
        <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, người bán..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
          </div>
          <button type="submit" className="rounded-2xl bg-slate-950 px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700">
            Tìm kiếm
          </button>
        </form>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setCurrentPage(1); }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-100">
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={aiStatus} onChange={(e) => { setAiStatus(e.target.value); setCurrentPage(1); }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-100">
            <option value="">Tất cả trạng thái AI</option>
            {Object.values(AIStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortDir} onChange={(e) => { setSortDir(e.target.value); setCurrentPage(1); }} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-100">
            <option value="DESC">Mới nhất trước</option>
            <option value="ASC">Cũ nhất trước</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-[2rem] border border-slate-100 bg-white py-20 text-center shadow-xl shadow-slate-900/5">
            <i className="fa-solid fa-circle-notch animate-spin text-3xl text-teal-500" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-slate-400">Đang tải dữ liệu</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 py-20 text-center">
            <i className="fa-solid fa-check-double text-5xl text-emerald-300" />
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Không có sản phẩm nào đang chờ duyệt</p>
            <p className="mt-2 text-sm text-emerald-600">Tuyệt vời, hàng chờ đang sạch.</p>
          </div>
        ) : (
          products.map((p) => {
            const aiTheme = getAiTheme(p.aiStatus);
            return (
              <article key={p.id} className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-2xl hover:shadow-slate-900/10 sm:p-5">
                <div className="grid gap-5 lg:grid-cols-[220px_1fr] xl:grid-cols-[250px_1fr]">
                  <div className="relative h-56 overflow-hidden rounded-[1.5rem] bg-slate-100 lg:h-full lg:min-h-[230px]">
                    <img src={getImageUrl(p.imageUrls?.[0])} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt={p.title} />
                    <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg ${aiTheme.badge}`}>
                      AI: {aiTheme.label}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 p-3 backdrop-blur">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giá đề xuất</p>
                      <p className="text-2xl font-black tracking-tight text-slate-950">{p.price.toLocaleString()}đ</p>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-2xl font-black leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-teal-700">{p.title}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">@{p.sellerName}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">{p.categoryName || "Chưa phân loại"}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(p.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                      </div>
                      <Link to={`/products/${p.id}`} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-950 hover:text-white">
                        Xem chi tiết <i className="fa-solid fa-arrow-up-right-from-square" />
                      </Link>
                    </div>

                    <p className="line-clamp-2 text-sm leading-7 text-slate-500">{p.description || "Bài đăng chưa có mô tả chi tiết."}</p>

                    <div className={`rounded-[1.5rem] border p-4 ${aiTheme.box}`}>
                      <div className={`mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${aiTheme.text}`}>
                        <i className={`fa-solid ${aiTheme.icon}`} /> Phân tích AI
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-700">{p.aiNote || "AI chưa ghi nhận vấn đề đáng chú ý."}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button onClick={() => openActionModal(p, "APPROVE")} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 active:scale-95">
                        <i className="fa-solid fa-check" /> Duyệt
                      </button>
                      <button onClick={() => openActionModal(p, "REJECT")} className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-rose-600 transition-all hover:-translate-y-0.5 hover:bg-rose-100 active:scale-95">
                        <i className="fa-solid fa-xmark" /> Từ chối
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-all hover:bg-rose-500 hover:text-white" title="Xóa vĩnh viễn">
                        <i className="fa-solid fa-trash-can text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-30">
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 shadow-sm">
            Trang <span className="mx-1 text-sm text-teal-600">{currentPage}</span> / {meta.pages}
          </div>
          <button disabled={currentPage === meta.pages} onClick={() => setCurrentPage((p) => p + 1)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-30">
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      )}

      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setActionModal({ ...actionModal, isOpen: false })} />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`p-7 text-white ${actionModal.type === "APPROVE" ? "bg-emerald-600" : "bg-rose-600"}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">Xác nhận thao tác</p>
              <h3 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight">
                <i className={`fa-solid ${actionModal.type === "APPROVE" ? "fa-circle-check" : "fa-circle-exclamation"}`} />
                {actionModal.type === "APPROVE" ? "Duyệt bài đăng" : "Từ chối bài đăng"}
              </h3>
              <p className="mt-2 truncate text-sm font-medium text-white/80">{actionModal.product?.title}</p>
            </div>

            <form onSubmit={handleActionSubmit} className="p-7">
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Ghi chú của Admin</label>
              <textarea
                required
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={actionModal.type === "APPROVE" ? "Ví dụ: Nội dung hợp lệ, hình ảnh rõ ràng..." : "Ví dụ: Sai danh mục, nội dung spam, hình ảnh không phù hợp..."}
                className="mb-6 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="rounded-2xl px-6 py-3 text-sm font-black text-slate-500 transition-colors hover:bg-slate-100">
                  Hủy
                </button>
                <button type="submit" className={`rounded-2xl px-7 py-3 text-sm font-black text-white shadow-lg transition-all active:scale-95 ${actionModal.type === "APPROVE" ? "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700" : "bg-rose-600 shadow-rose-100 hover:bg-rose-700"}`}>
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
