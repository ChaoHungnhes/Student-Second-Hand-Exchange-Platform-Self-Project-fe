import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation, ConversationStatus } from '../../types';
import { getImageUrl } from '../../utils/imageHelper';
import { getAdminConversationsAPI, updateConversationStatusAPI, deleteConversationAPI } from '../../config/api';

interface Props {
  conversations?: Conversation[];
  onUpdateStatus?: (id: string, newStatus: ConversationStatus) => void;
  onDelete?: (id: string) => void;
}

const AdminConversations: React.FC<Props> = ({ conversations: propConversations = [], onUpdateStatus, onDelete }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConversationStatus>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [idFilter, setIdFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingConversationId, setUpdatingConversationId] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const fetchConvs = async () => {
      setLoading(true);
      try {
        const params: any = { page: 1, size: 100 };
        if (idFilter) params.id = idFilter;
        if (keyword) params.keyword = keyword;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        const res: any = await getAdminConversationsAPI(params);
        if (res && res.result && Array.isArray(res.result)) {
          setAllConversations(res.result);
        } else if (Array.isArray(res)) {
          setAllConversations(res);
        } else {
          setAllConversations(propConversations as any);
        }
      } catch (e) {
        console.error('Failed to fetch admin conversations', e);
        setAllConversations(propConversations as any);
      } finally {
        setLoading(false);
      }
    };
    fetchConvs();
  }, [idFilter, keyword, statusFilter, propConversations]);

    const filteredData = useMemo(() => {
      let result = [...allConversations];
      if (idFilter) {
        result = result.filter(c => c.id.includes(idFilter));
      }
      if (keyword) {
        const kw = keyword.toLowerCase();
        result = result.filter(c => 
          (c.productName || c.productTitle || '').toLowerCase().includes(kw) || 
          (c.buyerName || '').toLowerCase().includes(kw) || 
          (c.sellerName || '').toLowerCase().includes(kw) ||
          (c.id || '').toLowerCase().includes(kw)
        );
      }
      if (statusFilter !== 'ALL') {
        result = result.filter(c => c.status === statusFilter);
      }
      return result.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
      });
    }, [allConversations, idFilter, keyword, statusFilter, sortBy]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: ConversationStatus) => {
    switch (status) {
      case ConversationStatus.ACTIVE: return 'bg-green-50 text-green-600 border-green-100';
      case ConversationStatus.CLOSED: return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  const handleStatusChange = async (id: string, newStatus: ConversationStatus) => {
    console.log("🔥 Bắt đầu đổi status:", id, newStatus); // Log debug
    setUpdatingConversationId(id);
    
    try {
      // 1. Gọi API luôn, không quan tâm prop onUpdateStatus
      await updateConversationStatusAPI(id, newStatus);
      console.log("✅ API gọi thành công");

      // 2. Cập nhật giao diện
      setAllConversations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

      // 3. Gọi callback cha nếu cần (để cha biết mà cập nhật cái khác)
      if (onUpdateStatus) {
        onUpdateStatus(id, newStatus);
      }
    } catch (e) {
      console.error('Lỗi gọi API:', e);
      alert('Cập nhật thất bại');
    } finally {
      setUpdatingConversationId(null);
    }
};

const handleDeleteConversation = async (id: string) => {
    // Xác nhận trước khi xóa
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hội thoại: ${id.substring(0, 8)}...?`)) {
      return;
    }

    try {
      // Gọi API xóa
      await deleteConversationAPI(id);
      
      // Cập nhật UI: Loại bỏ item đã xóa khỏi danh sách
      setAllConversations(prev => prev.filter(c => c.id !== id));
      
      // Thông báo cho component cha (nếu cần)
      if (onDelete) onDelete(id);
      
      alert("Đã xóa cuộc hội thoại thành công!");
    } catch (error) {
      console.error("Lỗi xóa hội thoại:", error);
      alert("Xóa thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý hội thoại</h1>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang giám sát: {filteredData.length}</div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <input 
            type="text" 
            placeholder="Tìm theo sản phẩm, người mua, người bán..." 
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <input
          type="text"
          placeholder="Tìm theo ID hội thoại..."
          value={idFilter}
          onChange={(e) => { setIdFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none"
        />
        <select 
          title="Lọc trạng thái"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.values(ConversationStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          title="Sắp xếp theo ngày"
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
          className="px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm cursor-pointer"
        >
          <option value="NEWEST">Mới nhất trước</option>
          <option value="OLDEST">Cũ nhất trước</option>
        </select>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm thảo luận</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cặp người dùng</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Khởi tạo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/products/${c.productId}`)}>
                    <img src={getImageUrl(c.productImage)} className="w-10 h-10 rounded-xl object-cover" alt={c.productName || c.productTitle || 'product'} />
                    <div className="max-w-[150px]">
                      <p className="text-sm font-black text-gray-900 truncate group-hover:text-indigo-600">{c.productName || c.productTitle}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">ID: {c.id.substring(0,8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate(`/user/${c.buyerId}`)}>
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">B:</span>
                      <span className="text-xs font-bold text-gray-700 group-hover:underline">{c.buyerName}</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate(`/user/${c.sellerId}`)}>
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">S:</span>
                      <span className="text-xs font-bold text-gray-700 group-hover:underline">{c.sellerName}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <select 
                    title="Thay đổi trạng thái hội thoại"
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value as ConversationStatus)}
                    disabled={updatingConversationId === c.id}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight border outline-none cursor-pointer transition-colors ${updatingConversationId === c.id ? 'opacity-50 cursor-not-allowed' : ''} ${getStatusBadge(c.status)}`}
                  >
                    {Object.values(ConversationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {updatingConversationId === c.id && (
                    <div className="text-[8px] text-gray-400 mt-1">Đang cập nhật...</div>
                  )}
                </td>
                <td className="px-8 py-5 text-[11px] font-bold text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/chat/${c.productId}`)} // Giả lập xem nội dung nếu ID trùng khớp
                      className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      title="Xem hội thoại"
                    >
                      <i className="fa-solid fa-eye text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteConversation(c.id)}
                      className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      title="Xóa bản ghi"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="py-24 text-center">
            <i className="fa-solid fa-comments-slash text-5xl text-gray-100 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không có hội thoại nào</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-8 py-5 bg-gray-50 flex justify-between items-center border-t border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Trước</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConversations;
