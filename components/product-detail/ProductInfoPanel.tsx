import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../../types/index";

interface ProductInfoPanelProps {
  canEdit: boolean;
  canManage: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isSold: boolean;
  product: Product;
  sellerAvatar: string;
  onContactSeller: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const getStatusClassName = (status: string) => {
  if (status === "APPROVED")
    return "border-green-100 bg-green-50 text-green-600";
  if (status === "PENDING")
    return "border-yellow-100 bg-yellow-50 text-yellow-600";
  if (status === "REJECTED") return "border-red-100 bg-red-50 text-red-600";
  if (status === "SOLD") return "border-gray-200 bg-gray-100 text-gray-600";
  return "border-gray-100 bg-gray-50 text-gray-500";
};

const ProductInfoPanel: React.FC<ProductInfoPanelProps> = ({
  canEdit,
  canManage,
  isAdmin,
  isOwner,
  isSold,
  product,
  sellerAvatar,
  onContactSeller,
  onDelete,
  onEdit,
}) => (
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
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border-2 whitespace-nowrap ${getStatusClassName(product.status)}`}
          >
            {product.status === "APPROVED" ? "ĐANG BÁN" : product.status}
          </div>
        )}
      </div>

      {canManage && (
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
                <i className="fa-solid fa-user-shield"></i> Tin nhắn từ Admin
              </div>
              <p className="text-xs text-red-800 font-medium">
                {product.adminNote}
              </p>
            </div>
          )}

          {isSold && product.buyerInfo && (
            <div className="bg-green-50 rounded-2xl p-5 border-2 border-green-100 space-y-3">
              <div className="flex items-center gap-2 text-green-800 font-bold">
                <i className="fa-solid fa-handshake"></i> Giao dịch thành công
              </div>
              <div className="bg-white/60 p-3 rounded-xl text-sm space-y-1">
                <p>
                  <span className="font-bold text-gray-500">Người mua:</span>{" "}
                  <span className="font-bold text-gray-900">
                    {product.buyerInfo.name}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-500">Thời gian:</span>{" "}
                  {new Date(product.buyerInfo.buyTime).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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
              {isOwner && (
                <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500 font-bold">
                  BẠN
                </span>
              )}
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

      {!isOwner && product.status === "APPROVED" && (
        <div className="pt-6 space-y-4">
          <button
            onClick={onContactSeller}
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
              onClick={onEdit}
              className={`py-4 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                canEdit
                  ? "bg-gray-900 text-white hover:bg-black shadow-gray-200 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
              }`}
            >
              <i className={`fa-solid ${canEdit ? "fa-pen" : "fa-lock"}`}></i>
              {canEdit ? "Chỉnh sửa" : "Đang khóa sửa"}
            </button>
            <button
              disabled={isSold}
              onClick={onDelete}
              className={`py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                !isSold
                  ? "bg-white text-red-600 border-2 border-red-100 hover:bg-red-50"
                  : "bg-gray-50 text-gray-300"
              }`}
            >
              <i className="fa-solid fa-trash-can"></i> Gỡ tin
            </button>
          </div>

          {isOwner && product.status === "APPROVED" && (
            <button className="w-full bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all border border-indigo-100">
              <i className="fa-solid fa-check-double mr-2"></i> Đánh dấu đã bán
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

export default ProductInfoPanel;
