import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Product, ProductStatus } from "../../types";
import {
  changeProductStatusAPI,
  createAdminProductAPI,
  deleteAdminProductAPI,
  getAdminProductsAPI,
  updateAdminProductAPI,
} from "../../config/api";
import { getImageUrl } from "../../utils/imageHelper";
import { useAuth } from "../../context/AuthContext";

const AiStatusOptions = ["OK", "WARNING", "SCAM", "SPAM", "PENDING"];
const PAGE_SIZE = 10;

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100";
const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500";

const getStatusTheme = (status?: string) => {
  if (status === "APPROVED")
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "PENDING")
    return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "REJECTED") return "bg-rose-50 text-rose-700 border-rose-100";
  if (status === "SOLD") return "bg-sky-50 text-sky-700 border-sky-100";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const getAiTheme = (status?: string) => {
  if (status === "OK")
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "WARNING")
    return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "SCAM") return "bg-rose-50 text-rose-700 border-rose-100";
  if (status === "SPAM")
    return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const AdminProductManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [aiStatusFilter, setAiStatusFilter] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [sortDir, setSortDir] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    pages: 1,
    total: 0,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState<any>({
    sellerId: "",
    title: "",
    description: "",
    price: 0,
    categoryId: "",
    city: "",
    ward: "",
    addressDetail: "",
    latitude: "",
    longitude: "",
    status: "PENDING",
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDir,
      };
      if (keyword) params.keyword = keyword;
      if (categoryId) params.categoryId = categoryId;
      if (sellerId) params.sellerId = sellerId;
      if (statusFilter.length > 0) params.status = statusFilter;
      if (aiStatusFilter) params.aiStatus = aiStatusFilter;

      const res = (await getAdminProductsAPI(params)) as any;
      if (res) {
        setProducts(res.result || []);
        setMeta(
          res.meta || { page: 1, pageSize: PAGE_SIZE, pages: 1, total: 0 },
        );
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, aiStatusFilter, categoryId, sellerId, sortDir]);

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    keyword,
    statusFilter,
    aiStatusFilter,
    categoryId,
    sellerId,
    sortDir,
  ]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const openCreateModal = () => {
    setNewProductData({
      sellerId: "",
      title: "",
      description: "",
      price: 0,
      categoryId: "",
      city: "",
      ward: "",
      addressDetail: "",
      latitude: "",
      longitude: "",
      status: "PENDING",
    });
    setNewImages([]);
    setIsCreateModalOpen(true);
  };

  const normalizePayload = (data: any) => ({
    ...data,
    categoryId: data.categoryId ? Number(data.categoryId) : null,
    latitude: data.latitude ? Number(data.latitude) : null,
    longitude: data.longitude ? Number(data.longitude) : null,
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminProductAPI(normalizePayload(newProductData), newImages);
      alert("Tạo sản phẩm thành công!");
      setNewImages([]);
      setIsCreateModalOpen(false);
      await fetchProducts();
    } catch (err) {
      console.error("Create product failed", err);
      alert("Tạo sản phẩm thất bại");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImages((prev) => [...prev, ...Array.from(e.target.files || [])]);
      e.target.value = "";
    }
  };

  const openEditModal = (product: Product) => {
    const p = product as any;
    setEditingProduct({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      categoryId: p.categoryId || "",
      status: product.status,
      sellerId: product.sellerId,
      aiStatus: product.aiStatus || "PENDING",
      adminNote: product.adminNote || "",
      city: product.city || "",
      ward: product.ward || "",
      addressDetail: product.addressDetail || "",
      latitude:
        p.latitude !== undefined && p.latitude !== null
          ? String(p.latitude)
          : "",
      longitude:
        p.longitude !== undefined && p.longitude !== null
          ? String(p.longitude)
          : "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateAdminProductAPI(
        editingProduct.id,
        normalizePayload(editingProduct),
      );
      alert("Cập nhật thành công!");
      setIsEditModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      console.error("Update failed", err);
      alert("C?p nh?t th?t b?i");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (
      !window.confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này không? Hành động này không thể hoàn tác.",
      )
    )
      return;
    try {
      const response = await deleteAdminProductAPI(id);
      alert(
        typeof response === "string" ? response : "Xóa sản phẩm thành công!",
      );
      await fetchProducts();
    } catch (error) {
      console.error("Delete failed", error);
      alert("Xóa thất bại! Có thể sản phẩm không tồn tại hoặc lỗi mạng.");
    }
  };

  const handleChangeStatus = async (productId: string, newStatus: string) => {
    const oldProducts = [...products];
    setProducts(
      products.map((p) =>
        p.id === productId ? ({ ...p, status: newStatus } as Product) : p,
      ),
    );
    try {
      await changeProductStatusAPI(productId, newStatus);
    } catch (error) {
      console.error("Change status failed", error);
      alert("Cập nhật trạng thái thất bại!");
      setProducts(oldProducts);
    }
  };

  const activeFilters = useMemo(
    () =>
      statusFilter.length +
      Number(Boolean(aiStatusFilter)) +
      Number(Boolean(categoryId)) +
      Number(Boolean(sellerId)),
    [aiStatusFilter, categoryId, sellerId, statusFilter],
  );

  const renderProductForm = (mode: "create" | "edit") => {
    const data = mode === "create" ? newProductData : editingProduct;
    const setData = mode === "create" ? setNewProductData : setEditingProduct;
    const submit = mode === "create" ? handleCreateSubmit : handleUpdateSubmit;
    const close = () =>
      mode === "create"
        ? setIsCreateModalOpen(false)
        : setIsEditModalOpen(false);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          onClick={close}
        />
        <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-7 py-5 text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-200">
                Product studio
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-tight">
                {mode === "create" ? "Tạo sản phẩm mới" : "Chỉnh sửa sản phẩm"}
              </h3>
            </div>
            <button
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
              type="button"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto p-7">
              <section className="rounded-[1.5rem] border border-teal-100 bg-teal-50/60 p-5">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-teal-700">
                  <i className="fa-solid fa-user-shield mr-2" />
                  Quản trị
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Seller ID</label>
                    <input
                      disabled={mode === "edit"}
                      value={data.sellerId || ""}
                      onChange={(e) =>
                        setData((p: any) => ({
                          ...p,
                          sellerId: e.target.value,
                        }))
                      }
                      className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-white/60`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Trạng thái</label>
                    <select
                      value={data.status}
                      onChange={(e) =>
                        setData((p: any) => ({ ...p, status: e.target.value }))
                      }
                      className={fieldClass}
                    >
                      {Object.values(ProductStatus).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {mode === "edit" && (
                    <div>
                      <label className={labelClass}>AI Status</label>
                      <select
                        value={data.aiStatus}
                        onChange={(e) =>
                          setData((p: any) => ({
                            ...p,
                            aiStatus: e.target.value,
                          }))
                        }
                        className={fieldClass}
                      >
                        {AiStatusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {mode === "edit" && (
                    <div>
                      <label className={labelClass}>Ghi chú Admin</label>
                      <input
                        value={data.adminNote || ""}
                        onChange={(e) =>
                          setData((p: any) => ({
                            ...p,
                            adminNote: e.target.value,
                          }))
                        }
                        className={fieldClass}
                        placeholder="Lý do / ghi chú nội bộ"
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Tiêu đề sản phẩm</label>
                  <input
                    value={data.title || ""}
                    onChange={(e) =>
                      setData((p: any) => ({ ...p, title: e.target.value }))
                    }
                    className={fieldClass}
                    placeholder="VD: Giáo trình Kinh tế vi mô"
                  />
                </div>
                <div>
                  <label className={labelClass}>Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    value={data.price || 0}
                    onChange={(e) =>
                      setData((p: any) => ({
                        ...p,
                        price: Number(e.target.value),
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Category ID</label>
                  <input
                    value={data.categoryId || ""}
                    onChange={(e) =>
                      setData((p: any) => ({
                        ...p,
                        categoryId: e.target.value,
                      }))
                    }
                    className={fieldClass}
                    placeholder="ID danh m?c"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Mô tả chi tiết</label>
                  <textarea
                    rows={5}
                    value={data.description || ""}
                    onChange={(e) =>
                      setData((p: any) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className={`${fieldClass} resize-none`}
                    placeholder="Mô tả tình trạng, cách giao dịch, lưu ý..."
                  />
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-600">
                  <i className="fa-solid fa-location-dot mr-2 text-teal-600" />
                  Địa chỉ giao dịch
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    "city",
                    "ward",
                    "addressDetail",
                    "latitude",
                    "longitude",
                  ].map((key) => (
                    <div
                      key={key}
                      className={key === "addressDetail" ? "sm:col-span-2" : ""}
                    >
                      <label className={labelClass}>
                        {key === "city"
                          ? "Tỉnh / Thành phố"
                          : key === "ward"
                            ? "Phường / Xã"
                            : key === "addressDetail"
                              ? "Số nhà / Tên đường"
                              : key}
                      </label>
                      <input
                        type={key.includes("itude") ? "number" : "text"}
                        step="any"
                        value={data[key] || ""}
                        onChange={(e) =>
                          setData((p: any) => ({ ...p, [key]: e.target.value }))
                        }
                        className={fieldClass}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {mode === "create" && hasPermission("file:upload") && (
                <section>
                  <label className={labelClass}>Hình ảnh</label>
                  <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-teal-200 bg-teal-50/60 transition hover:bg-teal-50">
                    <i className="fa-solid fa-cloud-arrow-up mb-2 text-3xl text-teal-500" />
                    <p className="text-sm font-bold text-slate-600">
                      Bấm để tải ảnh sản phẩm
                    </p>
                    <input
                      id="product-images"
                      type="file"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {newImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {newImages.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="group relative h-24 overflow-hidden rounded-2xl bg-slate-100"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                          {hasPermission("file:delete") && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewImages((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-xs text-white hover:bg-rose-500"
                            >
                              <i className="fa-solid fa-xmark" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-7 py-5">
              <button
                type="button"
                onClick={close}
                className="rounded-2xl px-6 py-3 text-sm font-black text-slate-500 hover:bg-white"
              >
                H?y
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-teal-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-teal-700 active:scale-95"
              >
                {mode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/10 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(20,184,166,0.34),transparent_26%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.24),transparent_24%)]" />
        <i className="fa-solid fa-boxes-stacked absolute -bottom-10 right-8 text-[10rem] text-white/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-100 ring-1 ring-white/15">
              <i className="fa-solid fa-store" /> Product hub
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Quản lý toàn bộ sản phẩm trên sàn
            </h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-300">
              Theo dõi, chỉnh sửa trạng thái, kiểm tra AI và hỗ trợ sinh viên
              đăng bán minh bạch hơn.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Tổng sản phẩm
              </p>
              <p className="mt-2 text-4xl font-black tracking-tighter">
                {meta.total}
              </p>
            </div>
            {hasPermission("product:create") && (
              <button
                onClick={openCreateModal}
                className="rounded-[1.5rem] bg-amber-300 p-4 text-left text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
              >
                <i className="fa-solid fa-plus mb-3 text-xl" />
                <p className="text-xs font-black uppercase tracking-widest">
                  Thêm sản phẩm
                </p>
              </button>
            )}
          </div>
        </div>
      </section>

      {isCreateModalOpen && renderProductForm("create")}
      {isEditModalOpen && editingProduct && renderProductForm("edit")}

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-900/5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            placeholder="Từ khóa sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={`${fieldClass} xl:col-span-2`}
          />
          <select
            value={aiStatusFilter}
            onChange={(e) => setAiStatusFilter(e.target.value)}
            aria-label="Lọc theo AI Status"
            className={fieldClass}
          >
            <option value="">Tất cả AI Status</option>
            {AiStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Category ID"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={fieldClass}
          />
          <input
            type="text"
            placeholder="Seller ID"
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-black uppercase tracking-widest text-slate-400">
              Trạng thái
            </span>
            {Object.values(ProductStatus).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusFilterChange(status)}
                className={`rounded-full border px-4 py-2 text-xs font-black transition-all ${statusFilter.includes(status) ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white"}`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {activeFilters} bộ lọc
            </span>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
              aria-label="Sắp xếp theo thời gian"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600 outline-none"
            >
              <option value="DESC">Mới nhất</option>
              <option value="ASC">Cũ nhất</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {[
                  "Sản phẩm",
                  "Giá",
                  "Trạng thái",
                  "AI",
                  "Người bán",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <i className="fa-solid fa-circle-notch animate-spin text-3xl text-teal-500" />
                    <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">
                      Đang tải
                    </p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-sm font-bold text-slate-400"
                  >
                    Không có sản phẩm phù hợp
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        {p.imageUrls?.[0] ? (
                          <img
                            src={getImageUrl(p.imageUrls[0])}
                            className="h-14 w-14 rounded-2xl object-cover"
                            alt={p.title}
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                            <i className="fa-solid fa-image" />
                          </div>
                        )}
                        <div className="max-w-[260px]">
                          <p className="truncate text-sm font-black text-slate-950">
                            {p.title}
                          </p>
                          <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            #{p.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-teal-700">
                      {p.price.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-5">
                      {hasPermission("product:status:update") ? (
                        <select
                          value={p.status}
                          onChange={(e) =>
                            handleChangeStatus(p.id, e.target.value)
                          }
                          aria-label={`Trạng thái sản phẩm ${p.title}`}
                          className={`rounded-xl border px-3 py-2 text-xs font-black outline-none ${getStatusTheme(p.status)}`}
                        >
                          {Object.values(ProductStatus).map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`rounded-full border px-3 py-2 text-xs font-black ${getStatusTheme(p.status)}`}
                        >
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${getAiTheme(p.aiStatus)}`}
                      >
                        {p.aiStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-600">
                      {p.sellerName}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <Link
                          to={`/products/${p.id}`}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-950 hover:text-white"
                          title="Xem chi tiết"
                        >
                          <i className="fa-solid fa-eye" />
                        </Link>
                        {hasPermission("product:update") && (
                          <button
                            onClick={() => openEditModal(p)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition hover:bg-teal-600 hover:text-white"
                            title="Sửa sản phẩm"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                        )}
                        {hasPermission("product:delete") && (
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                            title="Xóa vĩnh viễn"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-500">
          Trang <span className="text-teal-700">{meta.page}</span> /{" "}
          {meta.pages} ({meta.total} sản phẩm)
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Trước
          </button>
          {Array.from({ length: meta.pages }, (_, i) => i + 1)
            .slice(0, 7)
            .map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`rounded-2xl px-4 py-2 text-sm font-black ${currentPage === page ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {page}
              </button>
            ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(meta.pages, prev + 1))
            }
            disabled={currentPage === meta.pages}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProductManagement;
