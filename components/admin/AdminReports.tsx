
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Report, ReportReason } from '../../types';
import { getReportsAPI, deleteReportAPI } from '../../config/api';

interface Props {
  reports?: Report[];
  onDeleteReport?: (id: string) => void;
}

interface ReportResponse {
  id: number;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  note: string;
  createdAt: string;
}

const AdminReports: React.FC<Props> = ({ reports: propReports = [], onDeleteReport }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
  const [allReports, setAllReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response: any = await getReportsAPI(1, 100);
        // Response is already unwrapped to { meta, result } by axios interceptor
        if (response && response.result && Array.isArray(response.result)) {
          setAllReports(response.result);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        if (propReports.length > 0) {
          setAllReports(propReports as any);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [propReports.length]);

  const handleDeleteReport = async (id: number | string) => {
    try {
      await deleteReportAPI(String(id));
      setAllReports(prev => prev.filter(r => r.id !== id));
      setSelectedReport(null);
      if (onDeleteReport) onDeleteReport(String(id));
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Xóa báo cáo thất bại');
    }
  };

  const filteredReports = useMemo(() => {
    let result = [...allReports];

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(r => 
        r.reporterName.toLowerCase().includes(kw) || 
        r.reportedUserName.toLowerCase().includes(kw) || 
        r.note.toLowerCase().includes(kw) ||
        r.reporterId.toLowerCase().includes(kw) ||
        r.reportedUserId.toLowerCase().includes(kw)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [allReports, keyword, sortBy]);

  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getReasonColor = (reason: string) => {
    const upperReason = reason.toUpperCase();
    switch (upperReason) {
      case 'SCAM':
      case 'FRAUD':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'ABUSIVE_LANGUAGE':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'SPAM':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Báo cáo vi phạm</h1>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Tổng báo cáo: {filteredReports.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Tìm theo tên, ID hoặc nội dung báo cáo..." 
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <select 
          title="Sắp xếp báo cáo"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer min-w-[180px]"
        >
          <option value="NEWEST">Mới nhất trước</option>
          <option value="OLDEST">Cũ nhất trước</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người báo cáo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bị báo cáo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lý do</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedReports.map(r => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div 
                    onClick={() => navigate(`/user/${r.reporterId}`)}
                    className="cursor-pointer group/user"
                  >
                    <p className="text-sm font-black text-gray-900 group-hover/user:text-indigo-600 transition-colors">{r.reporterName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {r.reporterId}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div 
                    onClick={() => navigate(`/user/${r.reportedUserId}`)}
                    className="cursor-pointer group/user"
                  >
                    <p className="text-sm font-black text-red-600 group-hover/user:underline">{r.reportedUserName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {r.reportedUserId}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-tight border ${getReasonColor(r.reason)}`}>
                    {r.reason}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <p className="text-xs text-gray-500 max-w-[150px] line-clamp-1 italic">
                    {r.note}
                  </p>
                </td>
                <td className="px-8 py-5 text-[11px] font-bold text-gray-400">
                  {new Date(r.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedReport(r)}
                      title="Xem chi tiết báo cáo"
                      className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <i className="fa-solid fa-clipboard-list text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteReport(r.id)}
                      title="Xóa báo cáo"
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

        {paginatedReports.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
              <i className="fa-solid fa-flag-checkered text-2xl"></i>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest">Không tìm thấy báo cáo nào</p>
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

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-red-600 p-8 text-white">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight uppercase">Chi tiết vi phạm</h3>
                  <p className="text-xs font-bold text-red-100 tracking-widest uppercase opacity-80">Mã báo cáo: #{selectedReport.id}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} title="Đóng modal" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div 
                  onClick={() => navigate(`/user/${selectedReport.reporterId}`)}
                  className="bg-gray-50 p-4 rounded-3xl border border-gray-100 cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Người báo cáo</p>
                  <p className="text-sm font-black text-gray-900">{selectedReport.reporterName}</p>
                  <p className="text-[10px] text-indigo-600 font-bold">ID: {selectedReport.reporterId}</p>
                </div>
                <div 
                  onClick={() => navigate(`/user/${selectedReport.reportedUserId}`)}
                  className="bg-red-50 p-4 rounded-3xl border border-red-100 cursor-pointer hover:border-red-300 transition-all"
                >
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Đối tượng bị báo cáo</p>
                  <p className="text-sm font-black text-red-700">{selectedReport.reportedUserName}</p>
                  <p className="text-[10px] text-red-600 font-bold">ID: {selectedReport.reportedUserId}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phân loại & Thời gian</p>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getReasonColor(selectedReport.reason)}`}>
                    {selectedReport.reason}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <i className="fa-solid fa-clock"></i>
                  {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nội dung ghi chú</p>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "{selectedReport.note}"
                </p>
              </div>
            </div>

            <div className="px-8 pb-8 flex gap-3">
              <button 
                onClick={() => navigate(`/user/${selectedReport.reportedUserId}`)}
                className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
              >
                Hồ sơ đối tượng
              </button>
              <button 
                onClick={() => handleDeleteReport(selectedReport.id)}
                className="flex-1 border-2 border-red-50 text-red-600 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-50 transition-all"
              >
                Xóa báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
