import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProductsAPI, getRecommendedProductsAPI } from "../config/api";
import { useAuth } from "../context/AuthContext";
import type { MetaData, Product, ProductResponse } from "../types/index";
import ProductCard from "./ProductCard";

const DEFAULT_META: MetaData = { page: 1, pageSize: 10, pages: 1, total: 0 };

const normalizeRecommendationsResponse = (response: any): ProductResponse => {
  if (response?.result && Array.isArray(response.result)) {
    return {
      meta: response.meta || DEFAULT_META,
      result: response.result,
    };
  }

  if (Array.isArray(response)) {
    return {
      meta: {
        page: 1,
        pageSize: response.length,
        pages: 1,
        total: response.length,
      },
      result: response,
    };
  }

  return {
    meta: DEFAULT_META,
    result: [],
  };
};

const RecommendedProductsSection: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<MetaData>(DEFAULT_META);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const response = user
          ? await getRecommendedProductsAPI(1, 10)
          : await getProductsAPI({ page: 1, size: 10, sortBy: "createdAt", sortDir: "desc" });
        const normalized = normalizeRecommendationsResponse(response);
        setProducts(normalized.result || []);
        setMeta(normalized.meta || DEFAULT_META);
      } catch (error) {
        console.error("Lỗi tải gợi ý sản phẩm:", error);
        try {
          const fallback = await getProductsAPI({ page: 1, size: 10, sortBy: "createdAt", sortDir: "desc" });
          const normalized = normalizeRecommendationsResponse(fallback);
          setProducts(normalized.result || []);
          setMeta(normalized.meta || DEFAULT_META);
        } catch (fallbackError) {
          console.error("Lỗi tải sản phẩm thay thế:", fallbackError);
          setProducts([]);
          setMeta(DEFAULT_META);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [authLoading, user]);

  if (authLoading) {
    return null;
  }

  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-[0.18em]">
            <i className="fa-solid fa-sparkles"></i>
            Gợi ý cá nhân
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">Dành riêng cho bạn</h2>
          <p className="mt-1 text-sm text-gray-500">
            Dựa trên lịch sử xem và tìm kiếm gần đây của bạn.
          </p>
        </div>

        <Link
          to="/products"
          className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-2 self-start md:self-auto"
        >
          Xem thêm
          <i className="fa-solid fa-arrow-right text-xs"></i>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-80 rounded-xl border border-gray-100 bg-gray-50 animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {products.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>

          {meta.total > products.length && (
            <p className="mt-4 text-xs text-gray-400 text-right">
              Đang hiển thị {products.length}/{meta.total} gợi ý phù hợp.
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default RecommendedProductsSection;
