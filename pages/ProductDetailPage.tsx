import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Product, Category } from "../types/index";
import {
  getProductDetailAPI,
  createConversationAPI,
  updateProductAPI,
  deleteProductAPI,
  getCategoriesAPI,
} from "../config/api";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  // States cho việc Chỉnh sửa
  const [categories, setCategories] = useState<Category[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: 0,
    categoryId: 3,
    city: "",
    ward: "",
    addressDetail: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!id) return; // nếu không có id vẫn phải tắt loading để không treo
        const [resProduct, resCats]: any = await Promise.all([
          getProductDetailAPI(id),
          getCategoriesAPI(),
        ]);

        if (resProduct) {
          setProduct(resProduct);
          setEditForm({
            title: resProduct.title,
            description: resProduct.description,
            price: resProduct.price,
            categoryId:
              resCats?.find((c: any) => c.name === resProduct.categoryName)
                ?.id || 3, // Logic động
            city: resProduct.city || "",
            ward: resProduct.ward || "",
            addressDetail: resProduct.addressDetail || "",
          });
        }
        // Vì axios-customize trả về envelope.data nên resCats lúc này là mảng categories trực tiếp
        if (resCats) setCategories(resCats);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getImageUrl = (url?: string) => {
    if (!url) return "https://via.placeholder.com/800x800?text=No+Image";
    if (url.startsWith("http")) return url;
    return `http://localhost:8089${url}`;
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res: any = await createConversationAPI(product!.id);
      const conversationId = res?.id || res?.result?.id;
      if (conversationId) navigate(`/chat/${conversationId}`);
    } catch (err) {
      alert("Không thể mở cuộc trò chuyện.");
    }
  };

  const handleDelete = async () => {
    if (product?.status === "SOLD") {
      alert("Sản phẩm đã bán không thể xóa!");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn gỡ tin đăng này không?")) {
      try {
        await deleteProductAPI(product!.id);
        alert("Xóa sản phẩm thành công!");
        setTimeout(() => navigate("/my-shop"), 500);
      } catch (error) {
        alert("Lỗi khi xóa sản phẩm");
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await updateProductAPI(product!.id, editForm);
      // res lúc này chính là object Product do interceptor đã bóc tách data
      if (res) {
        setProduct(res);
        setShowEditModal(false);
        alert("Cập nhật thành công!");
      }
    } catch (error) {
      alert("Cập nhật thất bại. Chỉ sản phẩm PENDING hoặc DRAFT mới được sửa.");
    }
  };

  // chỉ hiển thị loading khi dữ liệu sản phẩm đang tải
  if (loading)
    return (
      <div className="py-32 text-center">
        <i className="fa-solid fa-circle-notch animate-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-gray-500 font-medium">Đang tải sản phẩm...</p>
      </div>
    );

  if (!product)
    return (
      <div className="py-32 text-center space-y-4">
        <i className="fa-solid fa-magnifying-glass-blur text-6xl text-gray-200"></i>
        <h2 className="text-xl font-bold text-gray-900">
          Không tìm thấy sản phẩm
        </h2>
        <button
          onClick={() => navigate("/")}
          className="text-indigo-600 font-bold hover:underline"
        >
          Quay lại trang chủ
        </button>
      </div>
    );

  // Thay đổi logic kiểm tra ở đây
  const isOwner = product?.owner;

  // Kiểm tra Admin (Sửa lại logic này cho chắc chắn dựa trên API response của bạn)
  const isAdmin =
    user?.roles?.includes("ADMIN") ||
    user?.role === "ADMIN" ||
    (user as any)?.roles === "ADMIN";

  const canManage = isOwner || isAdmin;

  // Log để debug (Bạn sẽ thấy nó vẫn log false lần đầu nếu không xử lý loading ở dưới)
  console.log("Quyền hiện tại:", {
    canManage,
    isOwner,
    isAdmin,
    userRole: user?.roles,
  });

  const isSold = product.status === "SOLD";
  const canEdit = product.status === "PENDING" || product.status === "DRAFT";
  const sellerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.sellerName}`;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 pb-24">
      {/* Breadcrumb */}
      <nav className="flex mb-8 text-sm text-gray-500 gap-2 items-center">
        <button
          onClick={() => navigate("/")}
          className="hover:text-indigo-600 transition-colors"
        >
          Trang chủ
        </button>
        <i className="fa-solid fa-chevron-right text-[10px]"></i>
        <button
          onClick={() => navigate("/products")}
          className="hover:text-indigo-600 transition-colors"
        >
          Sản phẩm
        </button>
        <i className="fa-solid fa-chevron-right text-[10px]"></i>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">
          {product.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* --- LEFT SIDE: IMAGES --- */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm group">
            <img
              src={
                product.imageUrls.length > 0
                  ? getImageUrl(product.imageUrls[activeImage])
                  : getImageUrl()
              }
              alt={product.title}
              className={`w-full h-full object-cover transition-all duration-500 ${isSold ? "grayscale blur-[1px]" : ""}`}
            />
            {isSold && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <span className="text-white font-black text-6xl border-8 border-white px-10 py-4 transform -rotate-12 inline-block uppercase tracking-tighter shadow-2xl">
                  ĐÃ BÁN
                </span>
              </div>
            )}
            {product.status === "REJECTED" && (
              <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center z-10">
                <span className="text-white font-black text-4xl border-4 border-white px-8 py-3 transform -rotate-12 uppercase">
                  BỊ TỪ CHỐI
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {product.imageUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? "border-indigo-600 scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <img
                  src={getImageUrl(url)}
                  className="w-full h-full object-cover"
                  alt="thumb"
                />
              </button>
            ))}
          </div>
        </div>

        {/* --- RIGHT SIDE: INFO --- */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 flex justify-between items-start">
              <div className="flex-1 pr-4">
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  {product.categoryName}
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mt-3 mb-2">
                  {product.title}
                </h1>
                <p className="text-4xl font-black text-indigo-600 tracking-tight">
                  {product.price.toLocaleString("vi-VN")}đ
                </p>
              </div>

              {canManage && (
                <div
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border-2 whitespace-nowrap ${
                    product.status === "APPROVED"
                      ? "border-green-100 bg-green-50 text-green-600"
                      : product.status === "PENDING"
                        ? "border-yellow-100 bg-yellow-50 text-yellow-600"
                        : product.status === "REJECTED"
                          ? "border-red-100 bg-red-50 text-red-600"
                          : product.status === "SOLD"
                            ? "border-gray-200 bg-gray-100 text-gray-600"
                            : "border-gray-100 bg-gray-50 text-gray-500"
                  }`}
                >
                  {product.status === "APPROVED" ? "ĐANG BÁN" : product.status}
                </div>
              )}
            </div>

            {/* OWNER DASHBOARD */}
            {canManage &&
              (console.log(
                "Rendering owner/admin dashboard notes...: ",
                canManage,
              ),
              (
                <div className="space-y-4 animate-in fade-in duration-500">
                  {product.aiStatus && (
                    <div
                      className={`p-5 rounded-2xl border ${
                        product.aiStatus === "OK"
                          ? "bg-green-50/30 border-green-100"
                          : product.aiStatus === "WARNING"
                            ? "bg-yellow-50/50 border-yellow-100"
                            : "bg-red-50/50 border-red-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-widest mb-2">
                        <i className="fa-solid fa-robot text-indigo-600"></i>{" "}
                        Phân tích AI
                      </div>
                      <p className="text-xs text-gray-600 italic">
                        "{product.aiNote || "Không có ghi chú"}"
                      </p>
                    </div>
                  )}

                  {product.adminNote && (
                    <div className="p-5 rounded-2xl bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 text-xs font-black text-red-700 uppercase tracking-widest mb-2">
                        <i className="fa-solid fa-user-shield"></i> Tin nhắn từ
                        Admin
                      </div>
                      <p className="text-xs text-red-800 font-medium">
                        {product.adminNote}
                      </p>
                    </div>
                  )}

                  {isSold && product.buyerInfo && (
                    <div className="bg-green-50 rounded-2xl p-5 border-2 border-green-100 space-y-3">
                      <div className="flex items-center gap-2 text-green-800 font-bold">
                        <i className="fa-solid fa-handshake"></i> Giao dịch
                        thành công
                      </div>
                      <div className="bg-white/60 p-3 rounded-xl text-sm space-y-1">
                        <p>
                          <span className="font-bold text-gray-500">
                            Người mua:
                          </span>{" "}
                          <span className="font-bold text-gray-900">
                            {product.buyerInfo.name}
                          </span>
                        </p>
                        <p>
                          <span className="font-bold text-gray-500">
                            Thời gian:
                          </span>{" "}
                          {new Date(product.buyerInfo.buyTime).toLocaleString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {/* THÔNG TIN CHUNG */}
            <div className="space-y-6 pt-2">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                  {canManage ? (
                    <i className="fa-solid fa-user-check"></i>
                  ) : (
                    <i className="fa-solid fa-store"></i>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Người đăng tin
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Link
                      to={`/user/${product.sellerId}`}
                      className="flex items-center gap-2 hover:bg-gray-50 p-1 -ml-1 rounded-lg transition-colors"
                    >
                      <img
                        src={sellerAvatar}
                        className="w-6 h-6 rounded-full border border-gray-200"
                        alt="avatar"
                      />
                      <p className="text-sm text-gray-700 font-bold">
                        {product.sellerName}
                      </p>
                    </Link>
                    {/* CHỖ NÀY CHỈ HIỆN "BẠN" NẾU LÀ CHỦ THỰC SỰ */}
                    {isOwner && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500 font-bold">
                        BẠN
                      </span>
                    )}
                    {/* HIỆN BADGE ADMIN NẾU LÀ ADMIN ĐANG XEM */}
                    {isAdmin && !isOwner && (
                      <span className="px-2 py-0.5 bg-indigo-600 rounded text-[9px] text-white font-bold tracking-tighter">
                        QUẢN TRỊ VIÊN
                      </span>
                    )}
                    <div className="flex items-center text-yellow-500 text-xs gap-1 ml-2 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <span className="font-bold">
                        {product.sellerRating.toFixed(1)}
                      </span>
                      <i className="fa-solid fa-star text-[10px]"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Khu vực giao dịch
                  </p>
                  <p className="text-sm text-gray-700 font-medium mt-1 leading-relaxed capitalize">
                    {product.addressDetail}, {product.ward}, {product.city}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <i className="fa-solid fa-align-left"></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Mô tả chi tiết
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {!isOwner && product.status === "APPROVED" && (
              <div className="pt-6 space-y-4">
                <button
                  onClick={handleContactSeller}
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-4 active:scale-95 group"
                >
                  <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <i className="fa-solid fa-comment-dots"></i>
                  </div>
                  Nhắn tin cho người bán
                </button>
              </div>
            )}
            {canManage && (
              <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                  <i className="fa-solid fa-gear mr-1"></i>{" "}
                  {isAdmin && !isOwner ? "Quyền quản trị" : "Quản lý tin đăng"}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={!canEdit}
                    onClick={() => setShowEditModal(true)}
                    className={`py-4 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                      canEdit
                        ? "bg-gray-900 text-white hover:bg-black shadow-gray-200 active:scale-95"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <i
                      className={`fa-solid ${canEdit ? "fa-pen" : "fa-lock"}`}
                    ></i>
                    {canEdit ? "Chỉnh sửa" : "Đang khóa sửa"}
                  </button>
                  <button
                    disabled={isSold}
                    onClick={handleDelete}
                    className={`py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      !isSold
                        ? "bg-white text-red-600 border-2 border-red-100 hover:bg-red-50"
                        : "bg-gray-50 text-gray-300"
                    }`}
                  >
                    <i className="fa-solid fa-trash-can"></i> Gỡ tin
                  </button>
                </div>

                {/* Chỉ hiện nút Đánh dấu đã bán cho chủ sở hữu (Admin thường không làm thay việc này) */}
                {isOwner && product.status === "APPROVED" && (
                  <button className="w-full bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all border border-indigo-100">
                    <i className="fa-solid fa-check-double mr-2"></i> Đánh dấu
                    đã bán
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL EDIT (GIỮ NGUYÊN STYLE SANG TRỌNG) */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowEditModal(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  Chỉnh sửa tin đăng
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Tiêu đề sản phẩm
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                      Giá bán (VNĐ)
                    </label>
                    <input
                      type="number"
                      required
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-gray-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                      Danh mục
                    </label>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          categoryId: Number(e.target.value),
                        })
                      }
                      className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-gray-900 appearance-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700"
                  ></textarea>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    placeholder="Tỉnh/Thành"
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-100 font-bold text-sm"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm({ ...editForm, city: e.target.value })
                    }
                  />
                  <input
                    placeholder="Phường/Xã"
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-100 font-bold text-sm"
                    value={editForm.ward}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ward: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Địa chỉ cụ thể
                  </label>
                  <input
                    value={editForm.addressDetail}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        addressDetail: e.target.value,
                      })
                    }
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 transition-all outline-none font-bold text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  LƯU THAY ĐỔI
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
