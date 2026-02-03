
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductStatus } from '../../types';
import { getAdminProductsAPI, createAdminProductAPI} from '../../config/api';

const AiStatusOptions = ['OK', 'WARNING', 'SCAM', 'SPAM', 'PENDING'];

const AdminProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [aiStatusFilter, setAiStatusFilter] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [sortDir, setSortDir] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, pages: 1, total: 0 });
  const pageSize = 10;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState<any>({
    sellerId: '', title: '', description: '', price: 0, categoryId: '', city: '', district: '', ward: '', addressDetail: '', status: 'PENDING'
  });
  const [newImages, setNewImages] = useState<FileList | null>(null);

  // Fetch products from server
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir
      };
      if (keyword) params.keyword = keyword;
      if (categoryId) params.categoryId = categoryId;
      if (sellerId) params.sellerId = sellerId;
      if (statusFilter.length > 0) params.status = statusFilter;
      if (aiStatusFilter) params.aiStatus = aiStatusFilter;

      const res = (await getAdminProductsAPI(params)) as any;
      if (res) {
        setProducts(res.result || []);
        setMeta(res.meta || { page: 1, pageSize: 10, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, aiStatusFilter, categoryId, sellerId, sortDir]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, keyword, statusFilter, aiStatusFilter, categoryId, sellerId, sortDir]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const openCreateModal = () => {
    setNewProductData({ sellerId: '', title: '', description: '', price: 0, categoryId: '', city: '', district: '', ward: '', addressDetail: '', status: 'PENDING' });
    setNewImages(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...newProductData };
      const imgs = newImages ? Array.from(newImages) : [];
      await createAdminProductAPI(payload, imgs);
      setIsCreateModalOpen(false);
      await fetchProducts();
    } catch (err) {
      console.error('Create product failed', err);
      alert('Tạo sản phẩm thất bại');
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tất cả sản phẩm</h1>
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tất cả sản phẩm</h1>
        <button onClick={openCreateModal} className="px-4 py-2 bg-indigo-600 text-white rounded-2xl font-bold">Thêm sản phẩm</button>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-2xl p-8 bg-white rounded-2xl shadow-lg z-10">
            <h3 className="text-xl font-black mb-4">Tạo sản phẩm mới</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Seller ID" value={newProductData.sellerId} onChange={e => setNewProductData(prev => ({ ...prev, sellerId: e.target.value }))} className="px-4 py-3 border rounded-2xl" />
                <input placeholder="Category ID" value={newProductData.categoryId} onChange={e => setNewProductData(prev => ({ ...prev, categoryId: e.target.value }))} className="px-4 py-3 border rounded-2xl" />
                <input placeholder="Title" value={newProductData.title} onChange={e => setNewProductData(prev => ({ ...prev, title: e.target.value }))} className="col-span-2 px-4 py-3 border rounded-2xl" />
                <textarea placeholder="Description" value={newProductData.description} onChange={e => setNewProductData(prev => ({ ...prev, description: e.target.value }))} className="col-span-2 px-4 py-3 border rounded-2xl" />
                <input placeholder="Price" type="number" value={newProductData.price} onChange={e => setNewProductData(prev => ({ ...prev, price: Number(e.target.value) }))} className="px-4 py-3 border rounded-2xl" />
                <select aria-label="Trạng thái sản phẩm mới" value={newProductData.status} onChange={e => setNewProductData(prev => ({ ...prev, status: e.target.value }))} className="px-4 py-3 border rounded-2xl">
                  {Object.values(ProductStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="City" value={newProductData.city} onChange={e => setNewProductData(prev => ({ ...prev, city: e.target.value }))} className="px-4 py-3 border rounded-2xl" />
                <input placeholder="District" value={newProductData.district} onChange={e => setNewProductData(prev => ({ ...prev, district: e.target.value }))} className="px-4 py-3 border rounded-2xl" />
                <input placeholder="Ward" value={newProductData.ward} onChange={e => setNewProductData(prev => ({ ...prev, ward: e.target.value }))} className="px-4 py-3 border rounded-2xl" />
                <input placeholder="Address detail" value={newProductData.addressDetail} onChange={e => setNewProductData(prev => ({ ...prev, addressDetail: e.target.value }))} className="col-span-2 px-4 py-3 border rounded-2xl" />
                <div className="col-span-2">
                  <label htmlFor="product-images" className="text-sm font-bold">Images</label>
                  <input id="product-images" title="Chọn ảnh sản phẩm" aria-label="Chọn ảnh sản phẩm" type="file" multiple onChange={e => setNewImages(e.target.files)} className="mt-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-2xl border">Hủy</button>
                <button type="submit" className="px-4 py-2 rounded-2xl bg-indigo-600 text-white">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input 
            type="text" 
            placeholder="Từ khóa..." 
            value={keyword} 
            onChange={e => setKeyword(e.target.value)} 
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium"
          />
          <select 
            value={aiStatusFilter} 
            onChange={e => setAiStatusFilter(e.target.value)}
            aria-label="Lọc theo AI Status"
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold"
          >
            <option value="">AI Status</option>
            {AiStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="Category ID..." 
            value={categoryId} 
            onChange={e => setCategoryId(e.target.value)} 
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium"
          />
          <input 
            type="text" 
            placeholder="Seller ID..." 
            value={sellerId} 
            onChange={e => setSellerId(e.target.value)} 
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium"
          />
        </div>

        {/* Status Multi-filter */}
        <div className="flex flex-wrap gap-3">
          <span className="text-xs font-bold text-gray-400 uppercase self-center">Trạng thái:</span>
          {Object.values(ProductStatus).map(status => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={statusFilter.includes(status)}
                onChange={() => handleStatusFilterChange(status)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                aria-label={`Lọc theo trạng thái ${status}`}
              />
              <span className="text-sm font-medium text-gray-700">{status}</span>
            </label>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-gray-400 uppercase">Sắp xếp:</span>
          <select 
            value={sortDir} 
            onChange={e => setSortDir(e.target.value)}
            aria-label="Sắp xếp theo thời gian"
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
          >
            <option value="DESC">Mới nhất</option>
            <option value="ASC">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người bán</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="px-8 py-5 text-center text-gray-400">Đang tải...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-8 py-5 text-center text-gray-400">Không có sản phẩm</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {p.imageUrls && p.imageUrls[0] && (
                        <img src={p.imageUrls[0]} className="w-12 h-12 rounded-2xl object-cover" alt="product" />
                      )}
                      <div className="max-w-[200px]">
                        <p className="text-sm font-black text-gray-900 truncate">{p.title}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">#{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-indigo-600">{p.price.toLocaleString()}đ</td>
                  <td className="px-8 py-5">
                    <select 
                      value={p.status} 
                      onChange={e => handleChangeStatus(p.id, e.target.value)}
                      aria-label={`Trạng thái sản phẩm ${p.title}`}
                      className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold"
                    >
                      {Object.values(ProductStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      p.aiStatus === 'OK' ? 'bg-green-100 text-green-700' :
                      p.aiStatus === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                      p.aiStatus === 'SCAM' ? 'bg-red-100 text-red-700' :
                      p.aiStatus === 'SPAM' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {p.aiStatus}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-gray-700">{p.sellerName}</td>
                  <td className="px-8 py-5 flex gap-2">
                    <Link to={`/products/${p.id}`} className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white transition-colors" title="Xem chi tiết">
                      <i className="fa-solid fa-eye"></i>
                    </Link>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                      title="Xóa sản phẩm"
                      aria-label={`Xóa sản phẩm ${p.title}`}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-600">
          Trang {meta.page} / {meta.pages} ({meta.total} sản phẩm)
        </p>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Trước
          </button>
          {Array.from({ length: meta.pages }, (_, i) => i + 1).map(page => (
            <button 
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 rounded-xl font-bold ${
                currentPage === page 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(meta.pages, prev + 1))}
            disabled={currentPage === meta.pages}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProductManagement;
