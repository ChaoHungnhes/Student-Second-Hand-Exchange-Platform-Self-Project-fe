
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, TransactionStatus } from '../../types';
import { getAdminTransactionsAPI, updateAdminTransactionStatusAPI, deleteAdminTransactionAPI, getTransactionByProductAPI } from '../../config/api';

interface Props {
  transactions?: Transaction[];
  onUpdateStatus?: (id: string, newStatus: TransactionStatus) => void;
  onDeleteTransaction?: (id: string) => void;
}

const AdminTransactions: React.FC<Props> = ({ transactions: initialTransactions = [], onUpdateStatus, onDeleteTransaction }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'bg-green-50 text-green-600 border-green-100';
      case TransactionStatus.CANCELLED:
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const resp = await getAdminTransactionsAPI({
        page: currentPage,
        size: pageSize,
        keyword: keyword || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sortBy: 'createdAt',
        sortDir,
      });

      // axios-customize unwraps envelope and returns data (meta + result)
      if (resp) {
        setTransactions(resp.result || []);
        setMeta(resp.meta || { page: currentPage, pageSize, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Fetch transactions error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: TransactionStatus) => {
    // optimistic update
    const prev = transactions;
    setTransactions(prevState => prevState.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      const resp = await updateAdminTransactionStatusAPI(id, newStatus);
      if (resp) {
        // resp is the updated transaction object
        const updated = resp;
        setTransactions(prevState => prevState.map(t => t.id === updated.id ? { ...t, ...updated } : t));
        // let parent (if any) also update its mock state
        onUpdateStatus && onUpdateStatus(id, newStatus);
      }
    } catch (error) {
      console.error('Update status failed', error);
      alert('Cập nhật trạng thái thất bại');
      // revert
      setTransactions(prev);
    }
  };

  const viewDetails = async (productId: string) => {
    setDetailsLoading(true);
    try {
      const resp = await getTransactionByProductAPI(productId);
      if (resp) {
        setSelectedTransaction(resp);
      } else {
        setSelectedTransaction(null);
        alert('Không tìm thấy giao dịch cho sản phẩm này');
      }
    } catch (error) {
      console.error('Fetch transaction by product failed', error);
      alert('Lấy chi tiết giao dịch thất bại');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Xóa bản ghi giao dịch này?')) return;

    // optimistic remove
    const prev = transactions;
    setTransactions(prevState => prevState.filter(t => t.id !== id));

    try {
      const resp = await deleteAdminTransactionAPI(id);
      // backend returns plain message; assume deletion success if no error
      onDeleteTransaction && onDeleteTransaction(id);
    } catch (error) {
      console.error('Delete transaction failed', error);
      alert('Xóa giao dịch thất bại');
      setTransactions(prev);
    }
  };

  useEffect(() => {
    // whenever filters, paging, or sort change, fetch from server
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, statusFilter, currentPage, pageSize, sortDir]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý giao dịch</h1>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Tổng số: {meta.total}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <input 
            type="text" 
            placeholder="Tìm theo sản phẩm, người mua, người bán hoặc mã giao dịch..." 
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <div className="flex gap-2 items-center">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.values(TransactionStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={sortDir} onChange={(e) => { setSortDir(e.target.value as any); setCurrentPage(1); }} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm / Giá</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người bán</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người mua</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="max-w-[200px]">
                    <p 
                      onClick={() => navigate(`/products/${t.productId}`)}
                      className="text-sm font-black text-gray-900 truncate hover:text-indigo-600 cursor-pointer"
                    >
                      {t.productTitle}
                    </p>
                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter mt-1">
                      {t.productPrice.toLocaleString()}đ
                    </p>
                    <p className="text-[8px] text-gray-300 font-bold mt-0.5">ID: {t.id}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div 
                    onClick={() => navigate(`/user/${t.sellerId}`)}
                    className="cursor-pointer group"
                  >
                    <p className="text-sm font-bold text-gray-700 group-hover:text-indigo-600">{t.sellerName}</p>
                    <p className="text-[9px] text-gray-400 font-bold">ID: {t.sellerId}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div 
                    onClick={() => navigate(`/user/${t.buyerId}`)}
                    className="cursor-pointer group"
                  >
                    <p className="text-sm font-bold text-gray-700 group-hover:text-indigo-600">{t.buyerName}</p>
                    <p className="text-[9px] text-gray-400 font-bold">ID: {t.buyerId}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <select 
                    value={t.status}
                    onChange={(e) => handleChangeStatus(t.id, e.target.value as TransactionStatus)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight border outline-none cursor-pointer transition-colors ${getStatusStyle(t.status)}`}
                  >
                    {Object.values(TransactionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-8 py-5 text-[11px] font-bold text-gray-400">
                  {new Date(t.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDetails(t.productId)}
                        className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        title="Xem chi tiết"
                      >
                        <i className="fa-solid fa-eye text-xs"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!loading && transactions.length === 0) && (
          <div className="py-24 text-center">
            <i className="fa-solid fa-receipt text-5xl text-gray-100 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Không tìm thấy giao dịch nào</p>
          </div>
        )}
        {meta.pages > 1 && (
          <div className="px-8 py-5 bg-gray-50 flex justify-between items-center border-t border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trang {meta.page} / {meta.pages}</span>
            <div className="flex gap-2">
              <button disabled={meta.page === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Trước</button>
              <button disabled={meta.page === meta.pages} onClick={() => setCurrentPage(p => Math.min(meta.pages, p + 1))} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Sau</button>
            </div>
          </div>
        )}
      </div>
      {/* Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)}></div>
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black">Chi tiết giao dịch</h3>
              <button onClick={() => setSelectedTransaction(null)} className="text-gray-400">Đóng</button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong className="font-black">ID:</strong> {selectedTransaction.id}</div>
              <div><strong className="font-black">Sản phẩm:</strong> {selectedTransaction.productTitle}</div>
              <div><strong className="font-black">Giá:</strong> {selectedTransaction.productPrice?.toLocaleString?.() ?? selectedTransaction.productPrice}đ</div>
              <div><strong className="font-black">Người bán:</strong> {selectedTransaction.sellerName} (ID: {selectedTransaction.sellerId})</div>
              <div><strong className="font-black">Người mua:</strong> {selectedTransaction.buyerName} (ID: {selectedTransaction.buyerId})</div>
              <div><strong className="font-black">Trạng thái:</strong> {selectedTransaction.status}</div>
              <div><strong className="font-black">Thời gian:</strong> {new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
