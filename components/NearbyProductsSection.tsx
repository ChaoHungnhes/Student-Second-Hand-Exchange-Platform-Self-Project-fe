import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNearbyProductsAPI } from '../config/api';
import type { MetaData, NearbyProduct, NearbyProductsResponse } from '../types/index';

type NearbyProductsSectionProps = {
  mode?: 'compact' | 'page';
};

const RADIUS_OPTIONS = [3, 5, 10];
const DEFAULT_META: MetaData = { page: 1, pageSize: 6, pages: 1, total: 0 };

const NearbyProductsSection: React.FC<NearbyProductsSectionProps> = ({ mode = 'compact' }) => {
  const isPageMode = mode === 'page';
  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [radius, setRadius] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
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
    if (!url) {
      return '';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `http://localhost:8089${url}`;
  };

  const fetchNearbyProducts = async (lat: number, lng: number, radiusKm: number, page: number) => {
    setLoading(true);
    setLocationError('');
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
      console.error('Lỗi tải sản phẩm gần đây:', error);
      setProducts([]);
      setMeta(DEFAULT_META);
      setLocationError('Không thể tải danh sách sản phẩm gần bạn lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }

    setLoading(true);
    setLocationError('');

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
          setLocationError('Bạn chưa cấp quyền vị trí. Hãy bật định vị để xem sản phẩm gần bạn.');
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationError('Hết thời gian lấy vị trí. Bạn thử lại giúp mình nhé.');
          return;
        }
        setLocationError('Không lấy được vị trí hiện tại.');
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
    if (!position) {
      return;
    }
    fetchNearbyProducts(position.lat, position.lng, radius, currentPage);
  }, [position, radius, currentPage]);

  const handleRadiusChange = (nextRadius: number) => {
    setCurrentPage(1);
    setRadius(nextRadius);
  };

  return (
    <section className={isPageMode ? 'relative overflow-hidden bg-gradient-to-br from-emerald-100 via-white to-cyan-100 border border-emerald-200 rounded-[2rem] p-6 md:p-8 shadow-sm' : 'bg-gradient-to-br from-emerald-50 via-white to-cyan-50 border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-sm'}>
      {isPageMode && (
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_55%)] pointer-events-none"></div>
      )}

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-[0.2em]">
            <i className="fa-solid fa-location-crosshairs"></i>
            Gợi ý theo vị trí
          </div>
          <h2 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">
            {isPageMode ? 'Sản phẩm ở gần bạn' : 'Sản phẩm gần bạn'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            {isPageMode
              ? 'Danh sách này được sắp xếp theo độ gần, giúp bạn chốt lịch hẹn và giao dịch nhanh hơn.'
              : 'Tìm nhanh những món đồ cũ ở quanh khu vực của bạn để hẹn giao dịch dễ hơn.'}
          </p>
          {position && (
            <p className="mt-3 text-xs font-medium text-emerald-700">
              Vị trí hiện tại: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Bán kính</label>
          <select
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="px-4 py-2 rounded-2xl border border-emerald-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} km
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={requestLocation}
            className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Dùng vị trí hiện tại
          </button>

          {!isPageMode && (
            <Link
              to="/nearby-products"
              className="px-4 py-2 rounded-2xl border border-emerald-200 bg-white text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"
            >
              Xem trang đầy đủ
            </Link>
          )}
        </div>
      </div>

      {isPageMode && (
        <div className="relative mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Tổng kết quả</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{meta.total}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Trang hiện tại</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{meta.page}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Bán kính đang tìm</p>
            <p className="mt-2 text-2xl font-extrabold text-gray-900">{radius} km</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-6 bg-white rounded-2xl border border-emerald-100 px-4 py-8 text-center text-gray-600">
          <i className="fa-solid fa-spinner animate-spin text-2xl text-emerald-600"></i>
          <p className="mt-3">Đang tìm sản phẩm phù hợp quanh bạn...</p>
        </div>
      )}

      {!loading && locationError && (
        <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p>{locationError}</p>
          <button
            type="button"
            onClick={requestLocation}
            className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-sm font-semibold hover:bg-amber-100 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !locationError && products.length === 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-dashed border-emerald-200 px-4 py-8 text-center text-gray-600">
          <i className="fa-regular fa-compass text-3xl text-emerald-400"></i>
          <p className="mt-3">Chưa có sản phẩm nào trong bán kính {radius} km.</p>
          <p className="text-sm text-gray-500 mt-1">Bạn có thể tăng bán kính tìm kiếm hoặc thử lại sau.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  {product.imageUrls?.[0] ? (
                    <img
                      src={getProductImageUrl(product.imageUrls[0])}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                      <i className="fa-regular fa-image"></i>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-gray-900 line-clamp-2">{product.title}</h3>
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      {product.distanceKm.toFixed(1)} km
                    </span>
                  </div>

                  <p className="text-lg font-extrabold text-emerald-700">
                    {Number(product.price || 0).toLocaleString('vi-VN')} d
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {product.categoryName && (
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                        {product.categoryName}
                      </span>
                    )}
                    {product.status && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        {product.status}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p className="line-clamp-1">
                      <i className="fa-solid fa-location-dot mr-2 text-emerald-500"></i>
                      {[product.ward, product.city].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ'}
                    </p>
                    <p className="line-clamp-1">
                      <i className="fa-regular fa-user mr-2 text-emerald-500"></i>
                      {product.sellerName || 'Người bán đang cập nhật'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {isPageMode && meta.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-11 h-11 rounded-2xl border border-emerald-200 bg-white text-emerald-700 disabled:opacity-30"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              <div className="flex gap-2">
                {Array.from({ length: meta.pages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-11 h-11 rounded-2xl text-sm font-bold transition-all ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                        : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, meta.pages))}
                disabled={currentPage === meta.pages}
                className="w-11 h-11 rounded-2xl border border-emerald-200 bg-white text-emerald-700 disabled:opacity-30"
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
