
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductStatus, AIStatus } from '../../types';

interface Props {
  products: Product[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

const AdminModeration: React.FC<Props> = ({ products, onApprove, onReject, onDelete }) => {
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const pendingList = useMemo(() => {
    let result = products.filter(p => p.status === ProductStatus.PENDING);
    if (keyword) {
      result = result.filter(p => 
        p.title.toLowerCase().includes(keyword.toLowerCase()) || 
        p.sellerName.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [products, keyword]);

  const totalPages = Math.ceil(pendingList.length / pageSize);
  const paginatedList = pendingList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Duyệt sản phẩm</h1>
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Hàng chờ: {pendingList.length}</div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm, người bán..." 
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {paginatedList.map(p => (
          <div key={p.id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm flex flex-col lg:flex-row gap-8 hover:border-indigo-100 transition-all">
            <div className="w-full lg:w-56 h-56 rounded-3xl overflow-hidden bg-gray-50 flex-shrink-0 relative">
              <img src={p.imageUrls[0]} className="w-full h-full object-cover" alt="p" />
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-xl text-[9px] font-black uppercase shadow-lg ${
                p.aiStatus === AIStatus.OK ? 'bg-green-500 text-white' : 
                p.aiStatus === AIStatus.WARNING ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'
              }`}>
                AI: {p.aiStatus}
              </div>
            </div>
            
            <div className="flex-1 space-y-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">{p.title}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span className="text-indigo-600">@{p.sellerName}</span> • {new Date(p.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <p className="text-2xl font-black text-indigo-600">{p.price.toLocaleString()}đ</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <i className="fa-solid fa-robot text-indigo-500"></i> AI Ghi chú (aiNote)
                </div>
                <p className="text-xs text-gray-600 leading-relaxed italic">"{p.aiNote || 'Không có cảnh báo đặc biệt.'}"</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button onClick={() => onApprove(p.id)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                  Approve
                </button>
                <button onClick={() => onReject(p.id)} className="bg-white text-red-600 border-2 border-red-50 px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95">
                  Reject
                </button>
                <button onClick={() => onDelete(p.id)} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm">
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
                <Link to={`/product/${p.id}`} className="ml-auto text-xs font-black text-gray-400 uppercase hover:text-indigo-600 flex items-center gap-2">
                  Chi tiết sản phẩm <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {paginatedList.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
            <i className="fa-solid fa-check-double text-5xl text-gray-100 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase tracking-widest">Không có sản phẩm nào đang chờ duyệt</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-30">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Trang {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-30">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
