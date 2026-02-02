
import React, { useState, useMemo, useEffect } from 'react';
import { AuditLog, AuditAction, AuditTargetType } from '../../types';
import { getAuditLogsAPI } from '../../config/api';

interface Props {
  logs?: AuditLog[];
}

interface AuditLogResponse {
  id: number;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValue: string;
  newValue: string;
  reason: string;
  createdAt: string;
}

const AdminAuditLogs: React.FC<Props> = ({ logs: propLogs = [] }) => {
  const [keyword, setKeyword] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | string>('ALL');
  const [targetFilter, setTargetFilter] = useState<'ALL' | string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [allLogs, setAllLogs] = useState<AuditLogResponse[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: any = { page: 1, size: 100 };
        if (keyword) params.keyword = keyword;
        if (actionFilter !== 'ALL') params.action = actionFilter;
        if (targetFilter !== 'ALL') params.targetType = targetFilter;

        const response: any = await getAuditLogsAPI(params);
        if (response && response.result && Array.isArray(response.result)) {
          setAllLogs(response.result);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        if (propLogs.length > 0) {
          setAllLogs(propLogs as any);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [keyword, actionFilter, targetFilter, propLogs.length]);

  const filteredLogs = useMemo(() => {
    return allLogs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });
  }, [allLogs, sortBy]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionBadge = (action: string) => {
    const upperAction = action.toUpperCase();
    switch (upperAction) {
      case 'APPROVE_PRODUCT':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'REJECT_PRODUCT':
      case 'DELETE':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'SUBMIT_PRODUCT':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'CREATE_PRODUCT':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'CONFIRM_BUYER':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'CHANGE_PRODUCT_STATUS':
        return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Nhật ký hệ thống (Audit Logs)</h1>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Tổng số bản ghi: {filteredLogs.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Tìm theo ID Actor, ID Target hoặc lý do..." 
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          />
          <i className="fa-solid fa-history absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <div className="flex gap-2">
          <select 
            title="Lọc theo hành động"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value as any); setCurrentPage(1); }}
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Mọi hành động</option>
            <option value="CREATE_PRODUCT">CREATE_PRODUCT</option>
            <option value="SUBMIT_PRODUCT">SUBMIT_PRODUCT</option>
            <option value="APPROVE_PRODUCT">APPROVE_PRODUCT</option>
            <option value="REJECT_PRODUCT">REJECT_PRODUCT</option>
            <option value="CHANGE_PRODUCT_STATUS">CHANGE_PRODUCT_STATUS</option>
            <option value="CONFIRM_BUYER">CONFIRM_BUYER</option>
          </select>
          <select 
            title="Lọc theo đối tượng"
            value={targetFilter}
            onChange={(e) => { setTargetFilter(e.target.value as any); setCurrentPage(1); }}
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Mọi đối tượng</option>
            <option value="PRODUCT">PRODUCT</option>
            <option value="TRANSACTION">TRANSACTION</option>
            <option value="USER">USER</option>
          </select>
          <select 
            title="Sắp xếp theo ngày"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="NEWEST">Mới nhất trước</option>
            <option value="OLDEST">Cũ nhất trước</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người thực hiện</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành động</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Đối tượng</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thay đổi</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghi chú/Lý do</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedLog(log)}>
                <td className="px-8 py-5">
                  <p className="text-[11px] font-black text-gray-400 tabular-nums">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </p>
                </td>
                <td className="px-8 py-5">
                  <div>
                    <p className="text-xs font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{log.actorId.substring(0, 16)}</p>
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{log.actorRole}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-tight border ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div>
                    <p className="text-xs font-bold text-gray-700">{log.targetType}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ID: {log.targetId.substring(0, 12)}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded truncate">{log.oldValue || 'N/A'}</span>
                    <i className="fa-solid fa-arrow-right text-[10px] text-gray-300"></i>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded truncate">{log.newValue || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs text-gray-500 italic max-w-[250px] line-clamp-2">
                    {log.reason || 'Không có ghi chú'}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedLogs.length === 0 && (
          <div className="py-24 text-center">
            <i className="fa-solid fa-database text-5xl text-gray-100 mb-4"></i>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Hệ thống chưa ghi nhận log nào khớp</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-8 py-5 bg-gray-50 flex justify-between items-center border-t border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200 shadow-sm">Trước</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200 shadow-sm">Sau</button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight uppercase">Chi tiết Nhật ký</h3>
                  <p className="text-xs font-bold text-indigo-100 tracking-widest uppercase opacity-80">Mã bản ghi: #{selectedLog.id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} title="Đóng modal" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Actor Info */}
              <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Người thực hiện</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">ID Actor</p>
                    <p className="text-sm font-black text-gray-900 break-all">{selectedLog.actorId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Vai trò</p>
                    <p className="text-sm font-black text-indigo-600">{selectedLog.actorRole}</p>
                  </div>
                </div>
              </div>

              {/* Action & Target */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-[24px] border border-blue-100">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Hành động</p>
                  <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight border ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="bg-green-50 p-4 rounded-[24px] border border-green-100">
                  <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2">Đối tượng</p>
                  <p className="text-sm font-black text-gray-900">{selectedLog.targetType}</p>
                </div>
              </div>

              {/* Target ID */}
              <div className="bg-gray-50 p-4 rounded-[24px] border border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">ID Đối tượng</p>
                <p className="text-xs font-mono text-gray-700 break-all">{selectedLog.targetId}</p>
              </div>

              {/* Changes */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Thay đổi</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Giá trị cũ</p>
                    <div className="bg-gray-100 p-3 rounded-2xl border border-gray-200">
                      <p className="text-sm font-mono text-gray-700">{selectedLog.oldValue || 'Không có'}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <i className="fa-solid fa-arrow-down text-gray-300 text-lg"></i>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Giá trị mới</p>
                    <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200">
                      <p className="text-sm font-mono text-indigo-700">{selectedLog.newValue || 'Không có'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason/Note */}
              <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Ghi chú / Lý do</p>
                <p className="text-sm text-gray-700 leading-relaxed italic font-medium">
                  "{selectedLog.reason || 'Không có ghi chú'}"
                </p>
              </div>

              {/* Timestamp */}
              <div className="bg-gray-50 p-4 rounded-[24px] border border-gray-100 flex items-center gap-3">
                <i className="fa-solid fa-clock text-gray-400 text-lg"></i>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Thời gian</p>
                  <p className="text-sm font-mono text-gray-700">{new Date(selectedLog.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setSelectedLog(null)}
                className="flex-1 bg-gray-900 text-white py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
