import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, AIStatus } from '../../types';
import { Category } from '../../types/index';
import { 
  getAdminProductsAPI, 
  getCategoriesAPI, 
  deleteAdminProductAPI, 
  approveProductAPI, 
  rejectProductAPI 
} from '../../config/api';
import { getImageUrl } from '../../utils/imageHelper';

const AdminModeration: React.FC = () => {
  // --- STATE DỮ LIỆU ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE BỘ LỌC ---
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const [sortDir, setSortDir] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, pageSize: 8, pages: 1, total: 0 });

  // --- STATE MODAL HÀNH ĐỘNG (APPROVE/REJECT) ---
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'REJECT' | null;
    product: Product | null;
  }>({ isOpen: false, type: null, product: null });
  
  const [adminNote, setAdminNote] = useState('');

  // 1. FETCH DANH MỤC
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = (await getCategoriesAPI()) as any;
        if (res) setCategories(res || []);
      } catch (e) { console.error(e); }
    };
    fetchCats();
  }, []);

  // 2. FETCH SẢN PHẨM
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: 8,
        status: 'PENDING', // Luôn chỉ lấy PENDING
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        aiStatus: aiStatus || undefined,
        sortBy: 'createdAt',
        sortDir
      };
      const res = (await getAdminProductsAPI(params)) as any;
      if (res) {
        setProducts(res.result || []);
        setMeta(res.meta || { page: 1, pageSize: 8, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [currentPage, categoryId, aiStatus, sortDir]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // --- XỬ LÝ DELETE ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("⚠️ Bạn có chắc chắn muốn XÓA VĨNH VIỄN bài đăng này?")) return;
    try {
      await deleteAdminProductAPI(id);
      alert("Đã xóa sản phẩm thành công");
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại");
    }
  };

  // --- XỬ LÝ MỞ MODAL DUYỆT/TỪ CHỐI ---
  const openActionModal = (product: Product, type: 'APPROVE' | 'REJECT') => {
    setActionModal({ isOpen: true, type, product });
    // Gợi ý nội dung note mặc định cho nhanh
    setAdminNote(type === 'APPROVE' ? 'Nội dung hợp lệ, duyệt.' : 'Vi phạm quy tắc cộng đồng.');
  };

  // --- SUBMIT DUYỆT/TỪ CHỐI ---
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { type, product } = actionModal;
    if (!product || !type) return;

    try {
      const payload = {
        adminNote: adminNote,
        version: product.version // ⚠️ QUAN TRỌNG: API yêu cầu version để optimistic locking
      };

      if (type === 'APPROVE') {
        await approveProductAPI(product.id, payload);
        alert(`✅ Đã duyệt bài: ${product.title}`);
      } else {
        await rejectProductAPI(product.id, payload);
        alert(`🚫 Đã từ chối bài: ${product.title}`);
      }

      // Reset & Refresh
      setActionModal({ isOpen: false, type: null, product: null });
      setAdminNote('');
      fetchProducts();

    } catch (error) {
      console.error(error);
      alert("Thao tác thất bại! Có thể phiên bản dữ liệu đã cũ, vui lòng tải lại trang.");
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 relative">
      
      {/* HEADER & FILTER (Giữ nguyên code UI cũ của bạn ở đây...) */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Duyệt sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Kiểm tra và phê duyệt các bài đăng mới</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Hàng chờ:</span>
             <span className="text-xl font-black text-indigo-600">{meta.total}</span>
        </div>
      </div>

       {/* FILTER BAR */}
       <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        {/* Hàng 1: Search */}
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm, người bán..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-12 pr-32 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <button type="submit" className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">Tìm kiếm</button>
        </form>

        {/* Hàng 2: Dropdown filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setCurrentPage(1); }} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Tất cả danh mục</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={aiStatus} onChange={e => { setAiStatus(e.target.value); setCurrentPage(1); }} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Tất cả trạng thái AI</option>
                {Object.values(AIStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sortDir} onChange={e => { setSortDir(e.target.value); setCurrentPage(1); }} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="DESC">Mới nhất trước</option>
                <option value="ASC">Cũ nhất trước</option>
            </select>
        </div>
      </div>

      {/* LIST SẢN PHẨM */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
           <div className="py-20 text-center text-gray-400 font-medium">Đang tải dữ liệu...</div>
        ) : products.length === 0 ? (
           <div className="py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
            <i className="fa-solid fa-check-double text-5xl text-gray-100 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase tracking-widest">Không có sản phẩm nào đang chờ duyệt</p>
          </div>
        ) : (
           products.map(p => (
            <div key={p.id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm flex flex-col lg:flex-row gap-8 hover:border-indigo-100 transition-all group">
                {/* ẢNH & BADGE AI (Giữ nguyên) */}
                <div className="w-full lg:w-56 h-56 rounded-3xl overflow-hidden bg-gray-50 flex-shrink-0 relative group-hover:shadow-md transition-all">
                  <img src={getImageUrl(p.imageUrls[0])} className="w-full h-full object-cover" alt={p.title} />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-xl text-[9px] font-black uppercase shadow-lg border border-white/20 backdrop-blur-sm ${
                      p.aiStatus === AIStatus.OK ? 'bg-green-500/90 text-white' : 
                      p.aiStatus === AIStatus.WARNING ? 'bg-yellow-500/90 text-white' : 'bg-red-600/90 text-white'
                  }`}>
                      AI: {p.aiStatus}
                  </div>
                </div>
                
                {/* INFO */}
                <div className="flex-1 space-y-5">
                  <div className="flex justify-between items-start">
                      <div className="space-y-1">
                      <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">@{p.sellerName}</span>
                          <span>• {new Date(p.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      </div>
                      <p className="text-2xl font-black text-indigo-600">{p.price.toLocaleString()}đ</p>
                  </div>

                  {/* AI NOTE */}
                  <div className={`p-5 rounded-3xl border ${
                      p.aiStatus === AIStatus.OK ? 'bg-green-50 border-green-100' :
                      p.aiStatus === AIStatus.WARNING ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
                  }`}>
                      <div className={`flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest ${
                          p.aiStatus === AIStatus.OK ? 'text-green-600' :
                          p.aiStatus === AIStatus.WARNING ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      <i className="fa-solid fa-robot"></i> Phân tích AI
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed italic">"{p.aiNote || 'An toàn'}"</p>
                  </div>

                  {/* ACTION BUTTONS (Đã gắn hàm) */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button 
                          onClick={() => openActionModal(p, 'APPROVE')} 
                          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                      >
                          <i className="fa-solid fa-check"></i> Approve
                      </button>
                      <button 
                          onClick={() => openActionModal(p, 'REJECT')} 
                          className="bg-white text-red-600 border-2 border-red-50 px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 flex items-center gap-2"
                      >
                          <i className="fa-solid fa-xmark"></i> Reject
                      </button>
                      <button 
                          onClick={() => handleDelete(p.id)} 
                          className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Xóa vĩnh viễn"
                      >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                      <Link to={`/products/${p.id}`} target="_blank" className="ml-auto text-xs font-black text-gray-400 uppercase hover:text-indigo-600 flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all">
                          Xem chi tiết <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                  </div>
                </div>
            </div>
           ))
        )}
      </div>

      {/* PAGINATION */}
      {meta.pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="bg-white border border-gray-100 px-6 py-3 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest shadow-sm">
             Trang <span className="text-indigo-600 text-sm mx-1">{currentPage}</span> / {meta.pages}
          </div>
          <button disabled={currentPage === meta.pages} onClick={() => setCurrentPage(p => p + 1)} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* ========== MODAL XÁC NHẬN (APPROVE/REJECT) ========== */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActionModal({ ...actionModal, isOpen: false })} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className={`px-8 py-6 ${actionModal.type === 'APPROVE' ? 'bg-indigo-600' : 'bg-red-600'}`}>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <i className={`fa-solid ${actionModal.type === 'APPROVE' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                {actionModal.type === 'APPROVE' ? 'Duyệt bài đăng' : 'Từ chối bài đăng'}
              </h3>
              <p className="text-white/80 text-sm mt-1 truncate">{actionModal.product?.title}</p>
            </div>

            <form onSubmit={handleActionSubmit} className="p-8">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Ghi chú của Admin (Bắt buộc)
              </label>
              <textarea 
                required
                rows={4}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder={actionModal.type === 'APPROVE' ? "Nhập lý do duyệt (VD: Hợp lệ)..." : "Nhập lý do từ chối (VD: Spam, Sai danh mục)..."}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium mb-6"
              />

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setActionModal({ ...actionModal, isOpen: false })} 
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
                    actionModal.type === 'APPROVE' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminModeration;