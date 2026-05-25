import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNearbyProductsAPI } from "../config/api";
import type { MetaData, NearbyProduct, NearbyProductsResponse } from "../types/index";

type NearbyProductsSectionProps = {
  mode?: "compact" | "page";
};

const RADIUS_OPTIONS = [3, 5, 10];
const DEFAULT_META: MetaData = { page: 1, pageSize: 6, pages: 1, total: 0 };

const NearbyProductsSection: React.FC<NearbyProductsSectionProps> = ({ mode = "compact" }) => {
  const isPageMode = mode === "page";
  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [radius, setRadius] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<MetaData>(DEFAULT_META);

  const pageSize = isPageMode ? 10 : 6;

  const normalizeNearbyResponse = (response: any): NearbyProductsResponse => {
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

  const getProductImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8089${url}`;
  };

  const fetchNearbyProducts = async (lat: number, lng: number, radiusKm: number, page: number) => {
    setLoading(true);
    setLocationError("");
    try {
      const response = await getNearbyProductsAPI({
        lat,
        lng,
        radius: radiusKm,
        page,
        size: pageSize,
      });
      const normalized = normalizeNearbyResponse(response);
      setProducts(normalized.result || []);
      setMeta(normalized.meta || DEFAULT_META);
    } catch (error) {
      console.error("Lỗi tải sản phẩm gần đây:", error);
      setProducts([]);
      setMeta(DEFAULT_META);
      setLocationError("Không thể tải danh sách sản phẩm gần bạn lúc này.");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt của bạn không hỗ trợ định vị.");
      return;
    }

    setLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        setCurrentPage(1);
        setPosition({
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude,
        });
      },
      (error) => {
        setLoading(false);
        setProducts([]);
        setMeta(DEFAULT_META);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Bạn chưa cấp quyền vị trí. Hãy bật định vị để xem sản phẩm gần bạn.");
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationError("Hết thời gian lấy vị trí. Bạn thử lại giúp mình nhé.");
          return;
        }
        setLocationError("Không lấy được vị trí hiện tại.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!position) return;
    fetchNearbyProducts(position.lat, position.lng, radius, currentPage);
  }, [position, radius, currentPage]);

  const handleRadiusChange = (nextRadius: number) => {
    setCurrentPage(1);
    setRadius(nextRadius);
  };

  return (
    <section className={`relative overflow-hidden border shadow-xl shadow-slate-900/5 ${isPageMode ? "rounded-[2.5rem] border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.28),transparent_32%),linear-gradient(135deg,#f0fdfa,#ffffff_48%,#ecfeff)] p-5 sm:p-8" : "rounded-[2rem] border-slate-200 bg-white/90 p-5 backdrop-blur-md sm:p-6"}`}>
      <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-teal-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-amber-200/20 blur-3xl"></div>

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-teal-700 shadow-sm">
            <i className="fa-solid fa-location-crosshairs"></i>
            Gợi ý theo vị trí
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {isPageMode ? "Sản phẩm ở gần bạn" : "Sản phẩm gần bạn"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {isPageMode
              ? "Danh sách được sắp xếp theo độ gần, giúp bạn chốt lịch hẹn nhanh hơn và dễ kiểm tra món đồ trước khi mua."
              : "Tìm nhanh những món đồ cũ quanh khu vực của bạn để hẹn giao dịch thuận tiện hơn."}
          </p>
          {position && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700">
              <i className="fa-solid fa-map-pin"></i>
              Vị trí hiện tại: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/85 p-3 shadow-sm backdrop-blur-md">
          <span className="px-2 text-sm font-black text-slate-600">Bán kính</span>
          <select
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} km</option>
            ))}
          </select>

          <button
            type="button"
            onClick={requestLocation}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700"
          >
            <i className="fa-solid fa-location-arrow text-xs"></i>
            Dùng vị trí hiện tại
          </button>

          {!isPageMode && (
            <Link
              to="/nearby-products"
              className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-black text-teal-700 transition-all hover:-translate-y-0.5 hover:bg-teal-100"
            >
              Xem đầy đủ <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
          )}
        </div>
      </div>

      {isPageMode && (
        <div className="relative mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Tổng kết quả", value: meta.total, icon: "fa-box-open" },
            { label: "Trang hiện tại", value: meta.page, icon: "fa-layer-group" },
            { label: "Bán kính", value: `${radius} km`, icon: "fa-ruler-combined" },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white bg-white/85 px-5 py-4 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <i className={`fa-solid ${item.icon}`}></i>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="relative mt-6 rounded-[2rem] border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <i className="fa-solid fa-spinner animate-spin text-3xl text-teal-500"></i>
          <p className="mt-4 font-semibold text-slate-500">Đang tìm sản phẩm phù hợp quanh bạn...</p>
        </div>
      )}

      {!loading && locationError && (
        <div className="relative mt-6 flex flex-col gap-4 rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-5 text-amber-900 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </span>
            <p className="text-sm font-semibold leading-6">{locationError}</p>
          </div>
          <button
            type="button"
            onClick={requestLocation}
            className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-amber-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-100"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !locationError && products.length === 0 && (
        <div className="relative mt-6 rounded-[2rem] border border-dashed border-teal-200 bg-white px-4 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-500">
            <i className="fa-regular fa-compass text-3xl"></i>
          </div>
          <p className="mt-4 font-black text-slate-800">Chưa có sản phẩm nào trong bán kính {radius} km.</p>
          <p className="mt-1 text-sm text-slate-500">Bạn có thể tăng bán kính tìm kiếm hoặc thử lại sau.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className={`relative mt-6 grid grid-cols-1 gap-5 ${isPageMode ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/10"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {product.imageUrls?.[0] ? (
                    <img
                      src={getProductImageUrl(product.imageUrls[0])}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">
                      <i className="fa-regular fa-image"></i>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-2xl bg-white/90 px-3 py-1.5 text-xs font-black text-teal-700 shadow-sm backdrop-blur-md">
                    {product.distanceKm.toFixed(1)} km
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 font-black text-slate-950 transition-colors group-hover:text-teal-700">{product.title}</h3>
                  </div>

                  <p className="mt-3 text-xl font-black text-teal-700">
                    {Number(product.price || 0).toLocaleString("vi-VN")} đ
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {product.categoryName && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-600">{product.categoryName}</span>
                    )}
                    {product.status && (
                      <span className="rounded-full bg-teal-50 px-3 py-1.5 font-bold text-teal-700">{product.status}</span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <p className="line-clamp-1">
                      <i className="fa-solid fa-location-dot mr-2 text-teal-500"></i>
                      {[product.ward, product.city].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"}
                    </p>
                    <p className="line-clamp-1">
                      <i className="fa-regular fa-user mr-2 text-teal-500"></i>
                      {product.sellerName || "Người bán đang cập nhật"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {isPageMode && meta.pages > 1 && (
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              {Array.from({ length: meta.pages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-12 min-w-12 rounded-2xl px-4 text-sm font-black shadow-sm transition-all hover:-translate-y-0.5 ${currentPage === page ? "bg-slate-950 text-white shadow-slate-900/20" : "border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, meta.pages))}
                disabled={currentPage === meta.pages}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default NearbyProductsSection;
