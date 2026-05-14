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
        const [resProduct, resCats]: any = await Promise.all([
          getProductDetailAPI(id),
          getCategoriesAPI(),
        ]);

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
            categoryId:
              resCats?.find((c: any) => c.name === resProduct.categoryName)
                ?.id || 3,
            city: resProduct.city || "",
            ward: resProduct.ward || "",
            addressDetail: resProduct.addressDetail || "",
            latitude:
              resProduct.latitude !== undefined &&
              resProduct.latitude !== null
                ? String(resProduct.latitude)
                : "",
            longitude:
              resProduct.longitude !== undefined &&
              resProduct.longitude !== null
                ? String(resProduct.longitude)
                : "",
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
      alert(
        "Cập nhật thất bại. Chỉ sản phẩm PENDING hoặc DRAFT mới được sửa.",
      );
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <i className="fa-solid fa-circle-notch animate-spin text-4xl text-indigo-500"></i>
        <p className="mt-4 text-gray-500 font-medium">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
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
  }

  const isOwner = product.owner;
  const isAdmin =
    user?.roles?.includes("ADMIN") ||
    user?.role === "ADMIN" ||
    (user as any)?.roles === "ADMIN";
  const canManage = isOwner || isAdmin;
  const isSold = product.status === "SOLD";
  const canEdit = product.status === "PENDING" || product.status === "DRAFT";
  const sellerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.sellerName}`;

  console.log("Quyền hiện tại:", {
    canManage,
    isOwner,
    isAdmin,
    userRole: user?.roles,
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 pb-24">
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
        <ProductImageGallery
          activeImage={activeImage}
          product={product}
          getImageUrl={getImageUrl}
          onSelectImage={setActiveImage}
        />

        <ProductInfoPanel
          canEdit={canEdit}
          canManage={canManage}
          isAdmin={isAdmin}
          isOwner={isOwner}
          isSold={isSold}
          product={product}
          sellerAvatar={sellerAvatar}
          onContactSeller={handleContactSeller}
          onDelete={handleDelete}
          onEdit={() => setShowEditModal(true)}
        />
      </div>

      {isSold && (loadingReviews || buyerReviews.length > 0) && (
        <section className="mt-14 bg-white rounded-[36px] border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] mb-2">Giao dịch đã hoàn tất</p>
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><i className="fa-solid fa-star text-yellow-400"></i>Đánh giá từ người mua</h2>
            </div>
            {buyerReviews.length > 0 && <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-2xl border border-yellow-100"><i className="fa-solid fa-star text-sm"></i><span className="font-black text-sm">{(buyerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / buyerReviews.length).toFixed(1)}</span><span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">/ {buyerReviews.length} đánh giá</span></div>}
          </div>
          {loadingReviews ? <div className="py-10 text-center text-gray-400"><i className="fa-solid fa-circle-notch animate-spin text-2xl"></i></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyerReviews.map((review) => (
                <article key={review.reviewId} className="rounded-[28px] bg-gray-50 border border-gray-100 p-5 relative overflow-hidden">
                  <i className="fa-solid fa-quote-left absolute -right-2 -bottom-3 text-7xl text-white"></i>
                  <div className="relative flex items-start gap-4"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerName}`} className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm p-1" alt={review.reviewerName} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 mb-1"><h3 className="font-black text-gray-900 text-sm truncate">{review.reviewerName}</h3><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((star) => <i key={star} className={`fa-solid fa-star text-[10px] ${star <= Math.round(review.rating) ? "text-yellow-400" : "text-gray-200"}`}></i>)}</div></div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p></div></div>
                  <p className="relative mt-4 text-sm text-gray-600 leading-relaxed font-medium italic">&quot;{review.comment}&quot;</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {showEditModal && (
        <ProductEditModal
          categories={categories}
          editForm={editForm}
          onClose={() => setShowEditModal(false)}
          onFormChange={setEditForm}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
