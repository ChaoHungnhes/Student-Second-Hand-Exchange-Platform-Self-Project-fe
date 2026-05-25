import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductEditModal from "../components/product-detail/ProductEditModal";
import ProductImageGallery from "../components/product-detail/ProductImageGallery";
import ProductInfoPanel from "../components/product-detail/ProductInfoPanel";
import { ProductEditForm } from "../components/product-detail/types";
import { useAuth } from "../context/AuthContext";
import { Category, Product } from "../types/index";
import {
  createConversationAPI,
  deleteProductAPI,
  getBuyerReviewsByProductAPI,
  getCategoriesAPI,
  getProductDetailAPI,
  updateProductAPI,
} from "../config/api";

interface BuyerReview {
  reviewId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  productId: string;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [buyerReviews, setBuyerReviews] = useState<BuyerReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<ProductEditForm>({
    title: "",
    description: "",
    price: 0,
    categoryId: 3,
    city: "",
    ward: "",
    addressDetail: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const [resProduct, resCats]: any = await Promise.all([getProductDetailAPI(id), getCategoriesAPI()]);

        if (resProduct) {
          setProduct(resProduct);
          setBuyerReviews([]);

          if (resProduct.status === "SOLD") {
            setLoadingReviews(true);
            getBuyerReviewsByProductAPI(resProduct.id)
              .then((res: any) => setBuyerReviews(res?.result || []))
              .catch((error: any) => console.error("Lỗi tải đánh giá người mua:", error))
              .finally(() => setLoadingReviews(false));
          }
          setEditForm({
            title: resProduct.title,
            description: resProduct.description,
            price: resProduct.price,
            categoryId: resCats?.find((c: any) => c.name === resProduct.categoryName)?.id || 3,
            city: resProduct.city || "",
            ward: resProduct.ward || "",
            addressDetail: resProduct.addressDetail || "",
            latitude: resProduct.latitude !== undefined && resProduct.latitude !== null ? String(resProduct.latitude) : "",
            longitude: resProduct.longitude !== undefined && resProduct.longitude !== null ? String(resProduct.longitude) : "",
          });
        }

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
      const payload = {
        ...editForm,
        latitude: editForm.latitude ? Number(editForm.latitude) : null,
        longitude: editForm.longitude ? Number(editForm.longitude) : null,
      };
      const res: any = await updateProductAPI(product!.id, payload);
      if (res) {
        setProduct(res);
        setShowEditModal(false);
        alert("Cập nhật thành công!");
      }
    } catch (error) {
      alert("Cập nhật thất bại. Chỉ sản phẩm PENDING hoặc DRAFT mới được sửa.");
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <i className="fa-solid fa-circle-notch animate-spin text-4xl text-orange-500"></i>
        <p className="mt-4 font-bold text-slate-500">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-32 text-center space-y-4">
        <i className="fa-solid fa-magnifying-glass text-6xl text-slate-200"></i>
        <h2 className="text-xl font-black text-slate-950">Không tìm thấy sản phẩm</h2>
        <button onClick={() => navigate("/")} className="font-black text-orange-600 hover:underline">Quay lại trang chủ</button>
      </div>
    );
  }

  const isOwner = product.owner;
  const isAdmin = user?.roles?.includes("ADMIN") || user?.role === "ADMIN" || (user as any)?.roles === "ADMIN";
  const canManage = isOwner || isAdmin;
  const isSold = product.status === "SOLD";
  const canEdit = product.status === "PENDING" || product.status === "DRAFT";
  const sellerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.sellerName}`;
  const averageReview = buyerReviews.length ? (buyerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / buyerReviews.length).toFixed(1) : "0.0";

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 pb-24">
      <div className="absolute -top-16 right-0 -z-10 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl"></div>
      <div className="absolute top-96 left-0 -z-10 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl"></div>

      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
        <button onClick={() => navigate("/")} className="rounded-full bg-white px-4 py-2 shadow-sm transition hover:text-orange-600">Trang chủ</button>
        <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
        <button onClick={() => navigate("/products")} className="rounded-full bg-white px-4 py-2 shadow-sm transition hover:text-orange-600">Sản phẩm</button>
        <i className="fa-solid fa-chevron-right text-[10px] text-slate-300"></i>
        <span className="max-w-[260px] truncate rounded-full bg-orange-50 px-4 py-2 text-orange-700">{product.title}</span>
      </nav>

      <section className="mb-8 overflow-hidden rounded-[44px] border border-white bg-[#fff7ed] shadow-2xl shadow-orange-100/70">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-7 md:p-9">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.9)]"></span>
              Product spotlight
            </p>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{product.title}</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-500">Xem chi tiết sản phẩm, thông tin người bán và lịch sử đánh giá để đưa ra quyết định giao dịch an toàn hơn.</p>
          </div>
          <div className="relative bg-slate-950 p-7 text-white md:p-9">
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full border-[16px] border-white/10"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-200">Giá bán</p>
            <p className="mt-4 text-5xl font-black tracking-tighter text-white">{product.price.toLocaleString("vi-VN")}đ</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-orange-100">{product.categoryName}</span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-200">{product.status}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <ProductImageGallery activeImage={activeImage} product={product} getImageUrl={getImageUrl} onSelectImage={setActiveImage} />
        <ProductInfoPanel canEdit={canEdit} canManage={canManage} isAdmin={isAdmin} isOwner={isOwner} isSold={isSold} product={product} sellerAvatar={sellerAvatar} onContactSeller={handleContactSeller} onDelete={handleDelete} onEdit={() => setShowEditModal(true)} />
      </div>

      {isSold && (loadingReviews || buyerReviews.length > 0) && (
        <section className="mt-14 overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-xl shadow-slate-100">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-slate-950 to-emerald-950 p-8 text-white md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">Giao dịch đã hoàn tất</p>
              <h2 className="flex items-center gap-3 text-3xl font-black"><i className="fa-solid fa-star text-amber-300"></i>Đánh giá từ người mua</h2>
            </div>
            {buyerReviews.length > 0 && <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3"><i className="fa-solid fa-star text-amber-300"></i><span className="text-xl font-black">{averageReview}</span><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">/ {buyerReviews.length} đánh giá</span></div>}
          </div>
          {loadingReviews ? <div className="py-12 text-center text-slate-400"><i className="fa-solid fa-circle-notch animate-spin text-2xl"></i></div> : (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:p-8">
              {buyerReviews.map((review) => (
                <article key={review.reviewId} className="relative overflow-hidden rounded-[30px] border border-slate-100 bg-slate-50 p-6">
                  <i className="fa-solid fa-quote-left absolute -right-2 -bottom-3 text-7xl text-white"></i>
                  <div className="relative flex items-start gap-4"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerName}`} className="h-14 w-14 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm" alt={review.reviewerName} /><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-black text-slate-950">{review.reviewerName}</h3><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((star) => <i key={star} className={`fa-solid fa-star text-[10px] ${star <= Math.round(review.rating) ? "text-amber-400" : "text-slate-200"}`}></i>)}</div></div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p></div></div>
                  <p className="relative mt-4 text-sm italic leading-7 text-slate-600">&quot;{review.comment}&quot;</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {showEditModal && <ProductEditModal categories={categories} editForm={editForm} onClose={() => setShowEditModal(false)} onFormChange={setEditForm} onSubmit={handleUpdate} />}
    </div>
  );
};

export default ProductDetailPage;
