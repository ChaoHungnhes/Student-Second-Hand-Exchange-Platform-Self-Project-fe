import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Report } from '../../types';
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
        String(r.id).includes(kw) ||
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
  const todayReports = allReports.filter(r => new Date(r.createdAt).toDateString() === new Date().toDateString()).length;
  const scamReports = allReports.filter(r => ['SCAM', 'FRAUD'].includes(r.reason.toUpperCase())).length;
  const abuseReports = allReports.filter(r => r.reason.toUpperCase() === 'ABUSIVE_LANGUAGE').length;

  const getReasonColor = (reason: string) => {
    const upperReason = reason.toUpperCase();
    switch (upperReason) {
      case 'SCAM':
      case 'FRAUD':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'ABUSIVE_LANGUAGE':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SPAM':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="relative space-y-8 animate-in slide-in-from-bottom-3 duration-500">
      <div className="absolute -top-10 right-0 -z-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl"></div>
      <div className="absolute top-24 left-0 -z-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl"></div>

      <section className="overflow-hidden rounded-[36px] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-7 text-white shadow-2xl shadow-slate-200">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-teal-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]"></span>
              Trung tâm kiểm duyệt
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Báo cáo vi phạm</h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-300">Theo dõi, lọc và xử lý các báo cáo trong một giao diện rõ ràng hơn, ưu tiên những nội dung cần can thiệp nhanh.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Tổng', value: filteredReports.length, icon: 'fa-flag' },
              { label: 'Hôm nay', value: todayReports, icon: 'fa-calendar-day' },
              { label: 'Rủi ro cao', value: scamReports + abuseReports, icon: 'fa-triangle-exclamation' },
            ].map(item => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <i className={`fa-solid ${item.icon} mb-2 text-teal-200`}></i>
                <p className="text-2xl font-black">{item.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-[32px] border border-white bg-white/85 p-4 shadow-xl shadow-slate-100 backdrop-blur md:p-5">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo mã báo cáo, tên, ID hoặc nội dung..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-13 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
          <select
            title="Sắp xếp báo cáo"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="min-w-[190px] cursor-pointer appearance-none rounded-3xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
          >
            <option value="NEWEST">Mới nhất trước</option>
            <option value="OLDEST">Cũ nhất trước</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[36px] border border-slate-100 bg-white shadow-xl shadow-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ID báo cáo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Người báo cáo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Bị báo cáo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lý do</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-sm font-black uppercase tracking-widest text-slate-400">Đang tải báo cáo...</td></tr>
              ) : paginatedReports.map(r => (
                <tr key={r.id} className="group transition hover:bg-teal-50/40">
                  <td className="px-6 py-5"><span className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-lg shadow-slate-200">#{r.id}</span></td>
                  <td className="px-6 py-5"><button onClick={() => navigate(`/user/${r.reporterId}`)} className="text-left"><p className="text-sm font-black text-slate-900 transition group-hover:text-teal-700">{r.reporterName}</p><p className="text-[10px] font-bold text-slate-400">ID: {r.reporterId}</p></button></td>
                  <td className="px-6 py-5"><button onClick={() => navigate(`/user/${r.reportedUserId}`)} className="text-left"><p className="text-sm font-black text-rose-700">{r.reportedUserName}</p><p className="text-[10px] font-bold text-slate-400">ID: {r.reportedUserId}</p></button></td>
                  <td className="px-6 py-5"><span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-tight ${getReasonColor(r.reason)}`}>{r.reason}</span></td>
                  <td className="px-6 py-5"><p className="max-w-[210px] line-clamp-2 text-xs font-medium leading-5 text-slate-500">{r.note || 'Không có ghi chú'}</p></td>
                  <td className="px-6 py-5 text-[11px] font-bold text-slate-400">{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-5"><div className="flex gap-2"><button onClick={() => setSelectedReport(r)} title="Xem chi tiết báo cáo" className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-700 transition hover:-translate-y-0.5 hover:bg-teal-600 hover:text-white"><i className="fa-solid fa-eye text-xs"></i></button><button onClick={() => handleDeleteReport(r.id)} title="Xóa báo cáo" className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-600 hover:text-white"><i className="fa-solid fa-trash-can text-xs"></i></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && paginatedReports.length === 0 && (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-teal-50 text-teal-300"><i className="fa-solid fa-flag-checkered text-3xl"></i></div>
            <p className="font-black uppercase tracking-widest text-slate-400">Không tìm thấy báo cáo nào</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black disabled:opacity-30">Trước</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black disabled:opacity-30">Sau</button>
            </div>
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedReport(null)}></div>
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[40px] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-rose-600 to-slate-950 p-8 text-white">
              <div className="flex items-start justify-between gap-5">
                <div><p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-rose-100">Mã báo cáo #{selectedReport.id}</p><h3 className="text-3xl font-black tracking-tight">Chi tiết vi phạm</h3></div>
                <button onClick={() => setSelectedReport(null)} title="Đóng modal" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>
            <div className="space-y-6 p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <button onClick={() => navigate(`/user/${selectedReport.reporterId}`)} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:border-teal-200 hover:bg-teal-50"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Người báo cáo</p><p className="mt-1 text-sm font-black text-slate-900">{selectedReport.reporterName}</p><p className="text-[10px] font-bold text-teal-700">ID: {selectedReport.reporterId}</p></button>
                <button onClick={() => navigate(`/user/${selectedReport.reportedUserId}`)} className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-left transition hover:border-rose-300"><p className="text-[9px] font-black uppercase tracking-widest text-rose-400">Đối tượng bị báo cáo</p><p className="mt-1 text-sm font-black text-rose-800">{selectedReport.reportedUserName}</p><p className="text-[10px] font-bold text-rose-600">ID: {selectedReport.reportedUserId}</p></button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><span className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${getReasonColor(selectedReport.reason)}`}>{selectedReport.reason}</span><span className="text-xs font-bold text-slate-500"><i className="fa-solid fa-clock mr-2"></i>{new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</span></div>
              <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-6"><p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung ghi chú</p><p className="text-sm italic leading-7 text-slate-700">"{selectedReport.note || 'Không có ghi chú'}"</p></div>
            </div>
            <div className="flex gap-3 px-8 pb-8"><button onClick={() => navigate(`/user/${selectedReport.reportedUserId}`)} className="flex-1 rounded-2xl bg-slate-950 py-4 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-black">Hồ sơ đối tượng</button><button onClick={() => handleDeleteReport(selectedReport.id)} className="flex-1 rounded-2xl border-2 border-rose-100 py-4 text-[11px] font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-50">Xóa báo cáo</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
