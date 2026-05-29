import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../../types/index";

interface ProductInfoPanelProps {
  canEdit: boolean;
  canManage: boolean;
  canDelete: boolean;
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
  if (status === "APPROVED") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "border-amber-100 bg-amber-50 text-amber-700";
  if (status === "REJECTED") return "border-rose-100 bg-rose-50 text-rose-700";
  if (status === "SOLD") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-slate-100 bg-slate-50 text-slate-500";
};

const ProductInfoPanel: React.FC<ProductInfoPanelProps> = ({
  canEdit,
  canManage,
  canDelete,
  isAdmin,
  isOwner,
  isSold,
  product,
  sellerAvatar,
  onContactSeller,
  onDelete,
  onEdit,
}) => (
  <div className="space-y-6 lg:col-span-5">
    <div className="space-y-6 rounded-[36px] border border-white bg-white p-7 shadow-2xl shadow-slate-100 md:p-8">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-700">{product.categoryName}</span>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950">{product.title}</h2>
          <p className="mt-2 text-4xl font-black tracking-tight text-orange-600">{product.price.toLocaleString("vi-VN")}đ</p>
        </div>
        {canManage && <div className={`whitespace-nowrap rounded-2xl border px-3 py-2 text-[10px] font-black uppercase ${getStatusClassName(product.status)}`}>{product.status === "APPROVED" ? "ĐANG BÁN" : product.status}</div>}
      </div>

      {canManage && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {product.aiStatus && (
            <div className={`rounded-3xl border p-5 ${product.aiStatus === "OK" ? "border-emerald-100 bg-emerald-50/50" : product.aiStatus === "WARNING" ? "border-amber-100 bg-amber-50/60" : "border-rose-100 bg-rose-50/60"}`}>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-950"><i className="fa-solid fa-robot text-orange-600"></i> Phân tích AI</div>
              <p className="text-xs italic text-slate-600">"{product.aiNote || "Không có ghi chú"}"</p>
            </div>
          )}
          {product.adminNote && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-700"><i className="fa-solid fa-user-shield"></i> Tin nhắn từ Admin</div>
              <p className="text-xs font-medium text-rose-800">{product.adminNote}</p>
            </div>
          )}
          {isSold && product.buyerInfo && (
            <div className="space-y-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 font-black text-emerald-800"><i className="fa-solid fa-handshake"></i> Giao dịch thành công</div>
              <div className="space-y-1 rounded-2xl bg-white/70 p-3 text-sm"><p><span className="font-bold text-slate-500">Người mua:</span> <span className="font-black text-slate-950">{product.buyerInfo.name}</span></p><p><span className="font-bold text-slate-500">Thời gian:</span> {new Date(product.buyerInfo.buyTime).toLocaleString("vi-VN")}</p></div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-5 pt-2">
        <div className="flex items-start gap-4 rounded-3xl bg-slate-50 p-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><i className={`fa-solid ${canManage ? "fa-user-check" : "fa-store"}`}></i></div>
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Người đăng tin</p><div className="mt-2 flex flex-wrap items-center gap-2"><Link to={`/user/${product.sellerId}`} className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-white"><img src={sellerAvatar} className="h-7 w-7 rounded-full border border-slate-200" alt="avatar" /><p className="text-sm font-black text-slate-700">{product.sellerName}</p></Link>{isOwner && <span className="rounded-lg bg-slate-200 px-2 py-0.5 text-[9px] font-black text-slate-500">BẠN</span>}{isAdmin && !isOwner && <span className="rounded-lg bg-slate-950 px-2 py-0.5 text-[9px] font-black text-white">QUẢN TRỊ VIÊN</span>}<div className="ml-1 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600"><span className="font-black">{product.sellerRating.toFixed(1)}</span><i className="fa-solid fa-star text-[10px]"></i></div></div></div>
        </div>

        <div className="flex items-start gap-4 rounded-3xl bg-slate-50 p-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><i className="fa-solid fa-map-location-dot"></i></div>
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khu vực giao dịch</p><p className="mt-1 text-sm font-semibold capitalize leading-relaxed text-slate-700">{product.addressDetail}, {product.ward}, {product.city}</p></div>
        </div>

        <div className="flex items-start gap-4 rounded-3xl bg-slate-50 p-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><i className="fa-solid fa-align-left"></i></div>
          <div className="flex-1"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Mô tả chi tiết</p><p className="whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p></div>
        </div>
      </div>

      {!isOwner && product.status === "APPROVED" && (
        <div className="pt-4"><button onClick={onContactSeller} className="group flex w-full items-center justify-center gap-4 rounded-3xl bg-slate-950 py-5 text-xl font-black text-white shadow-2xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-black active:scale-95"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition group-hover:rotate-12"><i className="fa-solid fa-comment-dots"></i></div>Nhắn tin cho người bán</button></div>
      )}

      {canManage && (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"><i className="fa-solid fa-gear mr-1"></i> {isAdmin && !isOwner ? "Quyền quản trị" : "Quản lý tin đăng"}</p>
          <div className="grid grid-cols-2 gap-4">
            <button disabled={!canEdit} onClick={onEdit} className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black shadow-lg transition ${canEdit ? "bg-slate-950 text-white shadow-slate-200 hover:bg-black active:scale-95" : "cursor-not-allowed bg-slate-100 text-slate-400 opacity-60"}`}><i className={`fa-solid ${canEdit ? "fa-pen" : "fa-lock"}`}></i>{canEdit ? "Chỉnh sửa" : "Đang khóa sửa"}</button>
            <button disabled={!canDelete} onClick={onDelete} className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition ${canDelete ? "border-2 border-rose-100 bg-white text-rose-600 hover:bg-rose-50" : "bg-slate-50 text-slate-300"}`}><i className="fa-solid fa-trash-can"></i> Gỡ tin</button>
          </div>
          {isOwner && product.status === "APPROVED" && <button className="w-full rounded-2xl border border-orange-100 bg-orange-50 py-4 text-sm font-black text-orange-700 transition hover:bg-orange-100"><i className="fa-solid fa-check-double mr-2"></i> Đánh dấu đã bán</button>}
        </div>
      )}
    </div>
  </div>
);

export default ProductInfoPanel;
