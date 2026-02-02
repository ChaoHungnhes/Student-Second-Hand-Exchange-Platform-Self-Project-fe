import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Product, ProductParams, Category } from '../types/index';
import { getProductsAPI, getCategoriesAPI } from '../config/api';

// Lightweight mock exported for admin pages which expect sample products
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Giáo trình Giải tích 1 - ĐH Bách Khoa',
    description: 'Giáo trình dùng cho sinh viên kỹ thuật, còn mới.',
    price: 35000,
    imageUrls: ['https://picsum.photos/seed/book1/400/300'],
    categoryName: 'Sách Giáo Khoa',
    sellerName: 'Nguyễn Văn Nam',
    sellerId: 's1',
    sellerRating: 4.5,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seller1',
    status: 'APPROVED',
    aiStatus: 'OK' as any,
    aiNote: undefined,
    createdAt: new Date().toISOString(),
    city: 'Hà Nội',
    district: '',
    ward: '',
    addressDetail: '',
    owner: false,
    buyerInfo: null
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter State
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'ALL'>('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // 1. Fetch Danh mục khi load trang
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await getCategoriesAPI();
        if (res && Array.isArray(res)) {
          setCategories(res);
        }
      } catch (error) {
        console.error("Lỗi lấy danh mục", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Sản phẩm (Có filter status APPROVED,SOLD)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: ProductParams = {
        page: 0, // Backend bắt đầu từ 0
        size: 8,
        sortDir: sortDir,
        sortBy: 'createdAt',
        // KHÔNG TRUYỀN STATUS Ở ĐÂY
        // Backend sẽ tự động nhảy vào nhánh else: lấy cả APPROVED và SOLD
      };

      // Nếu chọn danh mục cụ thể (khác ALL)
      if (activeCategoryId !== 'ALL') {
         params.categoryId = activeCategoryId; 
      }
      
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res: any = await getProductsAPI(params);
      if (res && res.result) {
        setProducts(res.result);
      }
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce fetch products khi filter thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeCategoryId, minPrice, maxPrice, sortDir]);

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden bg-indigo-900 text-white flex items-center">
        <img src="https://images.unsplash.com/photo-1523050335192-ce1dee71a01f?auto=format&fit=crop&q=80&w=2070" alt="campus" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative z-10 px-8 md:px-16 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Cách Thông Minh Để Sinh Viên <span className="text-indigo-400">Trao Đổi</span>.</h1>
          <p className="text-lg text-indigo-100 mb-8">Chợ nội bộ sinh viên đã xác thực. Mua rẻ hơn, bán nhanh hơn và cùng nhau xây dựng cộng đồng bền vững.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/products')} className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors">Bắt đầu mua sắm</button>
            <button className="bg-indigo-600/50 backdrop-blur-md border border-indigo-400 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-600 transition-colors">Tìm hiểu thêm</button>
          </div>
        </div>
      </section>

      {/* Category Selection (Dynamic) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Khám phá danh mục</h2>
          <button onClick={() => navigate('/products')} className="text-indigo-600 text-sm font-semibold hover:underline">Xem tất cả</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setActiveCategoryId('ALL')}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeCategoryId === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeCategoryId === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Filters Bar */}
      <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Giá tối thiểu</label>
                <input type="number" placeholder="VD: 50,000" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Giá tối đa</label>
                <input type="number" placeholder="VD: 500,000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Sắp xếp</label>
                 <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="desc">Mới nhất</option>
                    <option value="asc">Cũ nhất</option>
                </select>
            </div>
             <button onClick={() => { setMinPrice(''); setMaxPrice(''); setActiveCategoryId('ALL'); }} className="text-gray-500 text-sm font-medium hover:text-indigo-600 transition-colors h-10 flex items-center justify-center"><i className="fa-solid fa-rotate-right mr-2"></i> Đặt lại</button>
         </div>
      </section>

      {/* AI Moderation Highlight */}
      <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-shield-halved text-white text-2xl"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-indigo-900 mb-1">An toàn với Kiểm duyệt AI</h3>
          <p className="text-indigo-700 text-sm">
            Mọi bài đăng trên UniTrade đều được phân tích bởi hệ thống AI để ngăn chặn lừa đảo và hàng cấm.
          </p>
        </div>
        <button className="md:ml-auto bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 whitespace-nowrap">
          Tìm hiểu quy trình
        </button>
      </section>

      {/* Product List */}
      <section>
         <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Gợi ý dành cho bạn</h2>
          <span className="text-sm text-gray-400">{loading ? 'Đang tải...' : `Tìm thấy ${products.length} sản phẩm`}</span>
        </div>
        
        {loading ? (
             <div className="text-center py-20"><i className="fa-solid fa-circle-notch animate-spin text-4xl text-indigo-500"></i><p className="mt-4 text-gray-500">Đang tìm kiếm sản phẩm...</p></div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <i className="fa-solid fa-filter-circle-xmark text-4xl text-gray-200 mb-4"></i>
            <h3 className="text-gray-900 font-bold">Không có kết quả</h3>
            <p className="text-gray-500 text-sm">Vui lòng điều chỉnh lại bộ lọc giá hoặc danh mục.</p>
          </div>
        )}
        
        <div className="flex justify-center mt-12">
          <button onClick={() => navigate('/products')} className="border-2 border-indigo-600 text-indigo-600 px-10 py-3 rounded-full font-bold hover:bg-indigo-600 hover:text-white transition-all">
            Xem thêm sản phẩm
          </button> 
        </div>
      </section>
    </div>
  );
};

export default Home;