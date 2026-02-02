import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { getProductsAPI, getCategoriesAPI } from '../config/api';
import { Product, ProductParams, MetaData, Category } from '../types/index';

const AllProductsPage: React.FC = () => {
  // --- STATE DỮ LIỆU ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(false);

  // --- STATE BỘ LỌC ---
  const [currentPage, setCurrentPage] = useState(1); // UI đếm từ 1
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'ALL'>('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  
  // State Status: 'ALL' (Frontend quy ước) -> Backend nhận null -> Lấy cả APPROVED & SOLD
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); 

  // 1. Fetch Categories khi load trang
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res: any = await getCategoriesAPI();
        if (Array.isArray(res)) setCategories(res);
      } catch (e) { console.error(e); }
    };
    fetchCats();
  }, []);

  // 2. Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: ProductParams = {
        page: currentPage - 1, // QUAN TRỌNG: Backend bắt đầu từ 0
        size: itemsPerPage,
        keyword: searchTerm,
        sortDir: sortDir,
        sortBy: 'createdAt',
        // Status sẽ xử lý bên dưới
      };

      // Xử lý logic Status:
      // Nếu != ALL thì gửi status cụ thể (APPROVED hoặc SOLD)
      // Nếu == ALL thì KHÔNG gửi status (để backend nhận null => lấy tất cả)
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      if (activeCategoryId !== 'ALL') params.categoryId = activeCategoryId;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res: any = await getProductsAPI(params);
      
      // Axios interceptor đã unwrap data, res sẽ là { meta: ..., result: ... }
      if (res && res.result) {
        setProducts(res.result);
        setMeta(res.meta);
      }
    } catch (error) {
      console.error("Lỗi fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce: Gọi API khi bộ lọc thay đổi (sau 500ms dừng gõ)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, itemsPerPage, searchTerm, activeCategoryId, minPrice, maxPrice, sortDir, statusFilter]);

  // Handle Logic Phân trang
  const handlePageChange = (newPage: number) => {
    if (meta && newPage >= 1 && newPage <= meta.pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset Filters
  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategoryId('ALL');
    setMinPrice('');
    setMaxPrice('');
    setSortDir('desc');
    setStatusFilter('ALL'); 
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header & Main Search */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Khám phá sản phẩm</h1>
            <p className="text-gray-500 mt-1">{meta ? `Tìm thấy ${meta.total} món đồ phù hợp.` : 'Đang tải dữ liệu...'}</p>
          </div>
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm (iPhone, Sách...)" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-6 border-t border-gray-100">
          
          {/* 1. Danh mục */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Danh mục</label>
            <select 
              value={activeCategoryId}
              onChange={(e) => { 
                const val = e.target.value;
                setActiveCategoryId(val === 'ALL' ? 'ALL' : Number(val)); 
                setCurrentPage(1); 
              }}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {/* 2. Trạng thái (SỬA VALUE THÀNH ALL) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trạng thái</label>
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer"
            >
              <option value="ALL">Tất cả (Đang bán & Đã bán)</option>
              <option value="APPROVED">Đang bán (Active)</option>
              <option value="SOLD">Đã bán (Sold)</option>
            </select>
          </div>

          {/* 3. Giá Min */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giá từ</label>
            <input 
              type="number" 
              placeholder="0" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* 4. Giá Max */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đến</label>
            <input 
              type="number" 
              placeholder="Max" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* 5. Sắp xếp */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sắp xếp</label>
            <select 
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium cursor-pointer"
            >
              <option value="desc">Mới đăng gần đây</option>
              <option value="asc">Tin cũ nhất</option>
            </select>
          </div>

        </div>

        <div className="flex justify-end pt-2">
          <button onClick={resetFilters} className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
            <i className="fa-solid fa-rotate-right"></i> Làm mới bộ lọc
          </button>
        </div>
      </div>
      
      {/* Grid Results */}
      {loading ? (
        <div className="text-center py-20">
            <i className="fa-solid fa-spinner animate-spin text-4xl text-indigo-500"></i>
            <p className="mt-4 text-gray-500">Đang tải sản phẩm...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
            <i className="fa-solid fa-face-frown-open text-4xl"></i>
          </div>
           <h3 className="text-xl font-bold text-gray-900">Không tìm thấy sản phẩm</h3>
           <p className="text-gray-500 mt-2 max-w-sm mx-auto">Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm bạn nhé.</p>
           <button onClick={resetFilters} className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Xóa bộ lọc</button>
        </div>
      )}

      {/* Pagination Controls */}
      {meta && meta.pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-12">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="w-12 h-12 rounded-2xl border border-gray-200 hover:bg-indigo-50 disabled:opacity-30 flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></button>
          
          <div className="flex gap-2">
            {[...Array(meta.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`w-12 h-12 rounded-2xl font-bold text-sm transition-all shadow-sm ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'}`}
              > 
                {i + 1}
              </button>
            ))}
          </div>

          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === meta.pages} className="w-12 h-12 rounded-2xl border border-gray-200 hover:bg-indigo-50 disabled:opacity-30 flex items-center justify-center"><i className="fa-solid fa-chevron-right"></i></button>
        </div>
      )}
    </div>
  );
};

export default AllProductsPage;