import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Product, ProductStatus } from "../../types";
import {
  getAdminProductsAPI,
  createAdminProductAPI,
  changeProductStatusAPI,
  updateAdminProductAPI,
  deleteAdminProductAPI,
} from "../../config/api";
import { getImageUrl } from "../../utils/imageHelper";

const AiStatusOptions = ["OK", "WARNING", "SCAM", "SPAM", "PENDING"];

const AdminProductManagement: React.FC = () => {
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
    pageSize: 10,
    pages: 1,
    total: 0,
  });
  const pageSize = 10;

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
    status: "PENDING",
  });
  // CŨ: const [newImages, setNewImages] = useState<FileList | null>(null);
  // MỚI: Khởi tạo mảng rỗng
  const [newImages, setNewImages] = useState<File[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Fetch products from server
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        size: pageSize,
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
        setMeta(res.meta || { page: 1, pageSize: 10, pages: 1, total: 0 });
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
      status: "PENDING",
    });
    setNewImages([]);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...newProductData };

      // ✅ SỬA: newImages đã là mảng rồi, dùng trực tiếp luôn
      const imgs = newImages;

      await createAdminProductAPI(payload, imgs);
      alert("Tạo sản phẩm thành công!");

      // Reset về mảng rỗng sau khi thành công
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
      // 1. Chuyển FileList thành Array
      const selectedFiles = Array.from(e.target.files);

      // 2. Cộng dồn vào state cũ
      setNewImages((prev) => [...prev, ...selectedFiles]);

      // 3. (Quan trọng) Reset input để nếu user chọn lại file vừa chọn thì onChange vẫn nổ
      e.target.value = "";
    }
  };
  const handleRemoveImage = (indexToRemove: number) => {
    setNewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // ✅ HÀM MỚI: Mở Modal Sửa & Fill dữ liệu cũ vào
  const openEditModal = (product: Product) => {
    setEditingProduct({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId || "", // Đảm bảo API trả về field này hoặc mapping đúng
      status: product.status,

      // Các field Admin quyền lực
      sellerId: product.sellerId,
      aiStatus: product.aiStatus || "PENDING",
      adminNote: product.adminNote || "",

      // Địa chỉ
      city: product.city || "",
      ward: product.ward || "",
      addressDetail: product.addressDetail || "",
    });
    setIsEditModalOpen(true);
  };

  // ✅ HÀM MỚI: Submit Update
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingProduct) return;

      // Gọi API PUT
      await updateAdminProductAPI(editingProduct.id, editingProduct);

      alert("Cập nhật thành công!");
      setIsEditModalOpen(false);
      setEditingProduct(null);
      await fetchProducts(); // Refresh lại bảng
    } catch (err) {
      console.error("Update failed", err);
      alert("Cập nhật thất bại");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (
      !window.confirm(
        "⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN sản phẩm này không?\nHành động này không thể hoàn tác.",
      )
    ) {
      return;
    }

    try {
      const response = await deleteAdminProductAPI(id);

      alert(
        typeof response === "string" ? response : "Xóa sản phẩm thành công!",
      );

      await fetchProducts();
    } catch (error) {
      console.error("Delete failed", error);
      alert("❌ Xóa thất bại! Có thể sản phẩm không tồn tại hoặc lỗi mạng.");
    }
  };

  const handleChangeStatus = async (productId: string, newStatus: string) => {
    const oldProducts = [...products];
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, status: newStatus } : p,
    );
    setProducts(updatedProducts as Product[]); // Ép kiểu nếu cần

    try {
      // 3. Gọi API
      await changeProductStatusAPI(productId, newStatus);
    } catch (error) {
      console.error("Change status failed", error);
      alert("Cập nhật trạng thái thất bại!");
      setProducts(oldProducts);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">
        Tất cả sản phẩm
      </h1>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Tất cả sản phẩm
        </h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-2xl font-bold"
        >
          Thêm sản phẩm
        </button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {" "}
          {/* Thêm p-4 để cách lề màn hình mobile */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          {/* ✅ SỬA 1: Thêm max-h-[90vh], flex flex-col để chia bố cục */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
            {/* ✅ HEADER: Cố định */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-xl font-black text-gray-800">
                Tạo sản phẩm mới
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* FORM WRAPPER */}
            <form
              onSubmit={handleCreateSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* ✅ BODY: Cuộn dọc (overflow-y-auto) */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Seller ID"
                    value={newProductData.sellerId}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        sellerId: e.target.value,
                      }))
                    }
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    placeholder="Category ID"
                    value={newProductData.categoryId}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                      }))
                    }
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    placeholder="Title"
                    value={newProductData.title}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="col-span-2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <textarea
                    placeholder="Description"
                    rows={3}
                    value={newProductData.description}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="col-span-2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                  <input
                    placeholder="Price"
                    type="number"
                    value={newProductData.price}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  <select
                    aria-label="Trạng thái"
                    value={newProductData.status}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {Object.values(ProductStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="City"
                    value={newProductData.city}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    placeholder="Ward"
                    value={newProductData.ward}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        ward: e.target.value,
                      }))
                    }
                    className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    placeholder="Address detail"
                    value={newProductData.addressDetail}
                    onChange={(e) =>
                      setNewProductData((prev) => ({
                        ...prev,
                        addressDetail: e.target.value,
                      }))
                    }
                    className="col-span-2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  {/* Phần chọn ảnh */}
                  <div className="col-span-2">
                    <label
                      htmlFor="product-images"
                      className="text-sm font-bold block mb-2 text-gray-700"
                    >
                      Images
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <i className="fa-solid fa-cloud-arrow-up text-2xl text-gray-400 mb-2"></i>
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                      </div>
                      <input
                        id="product-images"
                        type="file"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    {/* Preview ảnh */}
                    {newImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-3">
                        {newImages.map((file, index) => (
                          <div
                            key={index}
                            className="relative group border rounded-lg overflow-hidden h-20 bg-gray-100"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-all"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ✅ FOOTER: Cố định ở dưới cùng */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                >
                  Tạo sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-xl font-black text-gray-800">
                Chỉnh sửa sản phẩm
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleUpdateSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-6">
                  {" "}
                  {/* Tăng khoảng cách giữa các nhóm */}
                  {/* 1. KHỐI ADMIN ONLY (Giữ nguyên, chỉ chỉnh lại chút label) */}
                  <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                    <p className="text-xs font-black text-indigo-800 uppercase mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-user-shield"></i> Thông tin quản
                      trị
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                          Người bán (Seller ID)
                        </label>
                        <input
                          disabled // Thường admin không nên sửa seller ID tùy tiện
                          value={editingProduct.sellerId || ""}
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 bg-white/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                          Trạng thái (Status)
                        </label>
                        <select
                          value={editingProduct.status}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              status: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {Object.values(ProductStatus).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                          AI Status
                        </label>
                        <select
                          value={editingProduct.aiStatus}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              aiStatus: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-bold bg-white outline-none ${
                            editingProduct.aiStatus === "OK"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {AiStatusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                          Ghi chú Admin (Lý do)
                        </label>
                        <input
                          placeholder="VD: Vi phạm chính sách..."
                          value={editingProduct.adminNote || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              adminNote: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  {/* 2. THÔNG TIN SẢN PHẨM CƠ BẢN */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm font-bold text-gray-700 mb-1 block">
                        Tiêu đề sản phẩm <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Nhập tên sản phẩm..."
                        value={editingProduct.title || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1 block">
                        Giá bán (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={editingProduct.price || 0}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            price: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1 block">
                        Danh mục (Category ID)
                      </label>
                      <input
                        placeholder="Nhập ID danh mục"
                        value={editingProduct.categoryId || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            categoryId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-bold text-gray-700 mb-1 block">
                        Mô tả chi tiết
                      </label>
                      <textarea
                        placeholder="Mô tả chi tiết về sản phẩm..."
                        rows={6}
                        value={editingProduct.description || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-y font-medium text-gray-600"
                      />
                    </div>
                  </div>
                  {/* 3. KHỐI ĐỊA CHỈ (Đã sửa lại rõ ràng) */}
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="text-sm font-black text-gray-800 uppercase mb-4 flex items-center gap-2">
                      <i className="fa-solid fa-location-dot text-indigo-500"></i>{" "}
                      Địa chỉ giao dịch
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                      {/* Ô 1: Tỉnh/Thành */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">
                          Tỉnh / Thành phố
                        </label>
                        <input
                          placeholder="VD: Hà Nội"
                          value={editingProduct.city || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              city: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none bg-white"
                        />
                      </div>

                      {/* Ô 3: Phường/Xã */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">
                          Phường / Xã
                        </label>
                        <input
                          placeholder="VD: Láng Hạ"
                          value={editingProduct.ward || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              ward: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none bg-white"
                        />
                      </div>

                      {/* Ô 4: Chi tiết */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">
                          Số nhà / Tên đường
                        </label>
                        <input
                          placeholder="VD: Số 15 ngõ 99"
                          value={editingProduct.addressDetail || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              addressDetail: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Từ khóa..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium"
          />
          <select
            value={aiStatusFilter}
            onChange={(e) => setAiStatusFilter(e.target.value)}
            aria-label="Lọc theo AI Status"
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold"
          >
            <option value="">AI Status</option>
            {AiStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Category ID..."
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium"
          />
          <input
            type="text"
            placeholder="Seller ID..."
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium"
          />
        </div>

        {/* Status Multi-filter */}
        <div className="flex flex-wrap gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase self-center">
            Trạng thái:
          </span>
          {Object.values(ProductStatus).map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={statusFilter.includes(status)}
                onChange={() => handleStatusFilterChange(status)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                aria-label={`Lọc theo trạng thái ${status}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {status}
              </span>
            </label>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-gray-400 uppercase">
            Sắp xếp:
          </span>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
            aria-label="Sắp xếp theo thời gian"
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
          >
            <option value="DESC">Mới nhất</option>
            <option value="ASC">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Sản phẩm
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Giá
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Trạng thái
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                AI Status
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Người bán
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-8 py-5 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-5 text-center text-gray-400">
                  Không có sản phẩm
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {p.imageUrls && p.imageUrls[0] && (
                        <img
                          src={getImageUrl(p.imageUrls[0])}
                          className="w-12 h-12 rounded-2xl object-cover"
                          alt="product"
                        />
                      )}
                      <div className="max-w-[200px]">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {p.title}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                          #{p.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-indigo-600">
                    {p.price.toLocaleString()}đ
                  </td>
                  <td className="px-8 py-5">
                    <select
                      value={p.status}
                      onChange={(e) => handleChangeStatus(p.id, e.target.value)}
                      aria-label={`Trạng thái sản phẩm ${p.title}`}
                      className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      {Object.values(ProductStatus).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        p.aiStatus === "OK"
                          ? "bg-green-100 text-green-700"
                          : p.aiStatus === "WARNING"
                            ? "bg-yellow-100 text-yellow-700"
                            : p.aiStatus === "SCAM"
                              ? "bg-red-100 text-red-700"
                              : p.aiStatus === "SPAM"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {p.aiStatus}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-gray-700">
                    {p.sellerName}
                  </td>
                  <td className="px-8 py-5 flex gap-2">
                    <Link
                      to={`/products/${p.id}`}
                      className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white transition-colors"
                      title="Xem chi tiết"
                    >
                      <i className="fa-solid fa-eye"></i>
                    </Link>
                    <button
                      onClick={() => openEditModal(p)}
                      className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                      title="Sửa sản phẩm"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-red-200"
                      title="Xóa vĩnh viễn"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-600">
          Trang {meta.page} / {meta.pages} ({meta.total} sản phẩm)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Trước
          </button>
          {Array.from({ length: meta.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-xl font-bold ${
                currentPage === page
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(meta.pages, prev + 1))
            }
            disabled={currentPage === meta.pages}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProductManagement;
