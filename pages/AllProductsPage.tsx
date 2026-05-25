import React, { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { getProductsAPI, getCategoriesAPI } from "../config/api";
import { Product, ProductParams, MetaData, Category } from "../types/index";

const quickStats = [
  { icon: "fa-bolt", label: "Tin mới", value: "Cập nhật liên tục" },
  { icon: "fa-location-dot", label: "Gần campus", value: "Dễ hẹn nhận" },
  { icon: "fa-shield-heart", label: "An tâm", value: "Có kiểm duyệt" },
];

const AllProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | "ALL">("ALL");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res: any = await getCategoriesAPI();
        if (Array.isArray(res)) setCategories(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCats();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: ProductParams = {
        page: currentPage - 1,
        size: itemsPerPage,
        keyword: searchTerm,
        sortDir,
        sortBy: "createdAt",
      };

      if (statusFilter !== "ALL") params.status = statusFilter;
      if (activeCategoryId !== "ALL") params.categoryId = activeCategoryId;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res: any = await getProductsAPI(params);

      if (res && res.result) {
        setProducts(res.result);
        setMeta(res.meta);
      }
    } catch (error) {
      console.error("Lỗi fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, itemsPerPage, searchTerm, activeCategoryId, minPrice, maxPrice, sortDir, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (meta && newPage >= 1 && newPage <= meta.pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setActiveCategoryId("ALL");
    setMinPrice("");
    setMaxPrice("");
    setSortDir("desc");
    setStatusFilter("ALL");
    setItemsPerPage(8);
    setCurrentPage(1);
  };

  const pageNumbers = meta ? Array.from({ length: meta.pages }, (_, i) => i + 1) : [];

  return (
    <div className="relative -mx-4 -mt-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.34),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#f8fafc_100%)] px-4 pb-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-24 top-[460px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl space-y-8 pt-8">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:rounded-[2.5rem]">
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.28),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(251,191,36,0.18),transparent_24%)]"></div>
            <div className="relative z-10">
              <span className="inline-flex rounded-full bg-gradient-to-r from-teal-300 to-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-950">
                Marketplace campus
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Khám phá đồ dùng sinh viên theo cách nhanh và vui hơn.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Tìm giáo trình, laptop, đồ ký túc xá hoặc những món đang hot quanh trường. Lọc nhanh, xem rõ trạng thái và mua bán tự tin hơn.
              </p>
            </div>

            <div className="relative z-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/15">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                      <i className={`fa-solid ${item.icon}`}></i>
                    </span>
                    <div>
                      <div className="text-sm font-black">{item.label}</div>
                      <div className="text-xs font-semibold text-slate-300">{item.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Bộ lọc thông minh</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Tìm đúng món bạn cần</h2>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                {meta ? `Tìm thấy ${meta.total} món đồ phù hợp.` : "Đang tải dữ liệu..."}
              </p>
            </div>

            <div className="relative w-full lg:w-[420px]">
              <input
                type="text"
                placeholder="Tìm iPhone, sách, máy tính..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 shadow-inner transition-all placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Danh mục</label>
              <select
                value={activeCategoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveCategoryId(val === "ALL" ? "ALL" : Number(val));
                  setCurrentPage(1);
                }}
                className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              >
                <option value="ALL">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              >
                <option value="ALL">Tất cả: đang bán & đã bán</option>
                <option value="APPROVED">Đang bán</option>
                <option value="SOLD">Đã bán</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Giá từ</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Đến</label>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Sắp xếp</label>
              <select
                value={sortDir}
                onChange={(e) => {
                  setSortDir(e.target.value as "desc" | "asc");
                  setCurrentPage(1);
                }}
                className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              >
                <option value="desc">Mới đăng gần đây</option>
                <option value="asc">Tin cũ nhất</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Hiển thị</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              >
                <option value={8}>8 sản phẩm</option>
                <option value={12}>12 sản phẩm</option>
                <option value={16}>16 sản phẩm</option>
              </select>
            </div>

            <button onClick={resetFilters} className="mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-black text-slate-500 transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700">
              <i className="fa-solid fa-rotate-right"></i> Làm mới bộ lọc
            </button>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Kết quả tìm kiếm</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Tất cả sản phẩm</h2>
            </div>
            {meta && (
              <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
                Trang {currentPage}/{meta.pages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white py-24 text-center shadow-sm">
              <i className="fa-solid fa-spinner animate-spin text-4xl text-teal-500"></i>
              <p className="mt-4 font-semibold text-slate-500">Đang tải sản phẩm...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
                <i className="fa-solid fa-face-frown-open text-4xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-950">Không tìm thấy sản phẩm</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn nhé.
              </p>
              <button onClick={resetFilters} className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-teal-700">
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>

        {meta && meta.pages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`h-12 min-w-12 rounded-2xl px-4 text-sm font-black shadow-sm transition-all hover:-translate-y-0.5 ${currentPage === page ? "bg-slate-950 text-white shadow-slate-900/20" : "border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
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

export default AllProductsPage;
