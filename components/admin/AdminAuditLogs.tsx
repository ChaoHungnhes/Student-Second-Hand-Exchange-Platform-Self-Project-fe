import React, { useState, useMemo, useEffect } from 'react';
import { AuditLog } from '../../types';
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
    return [...allLogs].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });
  }, [allLogs, sortBy]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const todayLogs = allLogs.filter(log => new Date(log.createdAt).toDateString() === new Date().toDateString()).length;
  const rejectLogs = allLogs.filter(log => ['REJECT_PRODUCT', 'DELETE'].includes(log.action.toUpperCase())).length;
  const uniqueActors = new Set(allLogs.map(log => log.actorId)).size;

  const getActionBadge = (action: string) => {
    const upperAction = action.toUpperCase();
    switch (upperAction) {
      case 'APPROVE_PRODUCT':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECT_PRODUCT':
      case 'DELETE':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'SUBMIT_PRODUCT':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'CREATE_PRODUCT':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'CONFIRM_BUYER':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CHANGE_PRODUCT_STATUS':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getTargetBadge = (targetType: string) => {
    const normalized = targetType.toUpperCase();
    if (normalized === 'PRODUCT') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (normalized === 'TRANSACTION') return 'bg-teal-100 text-teal-700 border-teal-200';
    if (normalized === 'USER') return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="relative space-y-8 animate-in slide-in-from-bottom-3 duration-500">
      <div className="absolute -top-12 right-8 -z-10 h-72 w-72 rounded-full bg-lime-200/40 blur-3xl"></div>
      <div className="absolute top-52 left-0 -z-10 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"></div>

      <section className="overflow-hidden rounded-[40px] border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-200">
        <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(190,242,100,0.35),transparent_35%),linear-gradient(135deg,#020617,#0f172a)] p-8 lg:border-b-0 lg:border-r">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-lime-200">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(190,242,100,0.9)]"></span>
              Security trail
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Nhật ký hệ thống</h1>
            <p className="mt-4 text-sm font-medium leading-6 text-slate-300">Theo dấu mọi thao tác quan trọng, kiểm tra thay đổi và truy vết trách nhiệm trong hệ thống.</p>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-3 lg:p-8">
            {[
              { label: 'Tổng bản ghi', value: filteredLogs.length, icon: 'fa-database' },
              { label: 'Hôm nay', value: todayLogs, icon: 'fa-clock-rotate-left' },
              { label: 'Người thao tác', value: uniqueActors, icon: 'fa-user-shield' },
            ].map(item => (
              <div key={item.label} className="rounded-[30px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition hover:bg-white/[0.09]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300 text-slate-950">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <p className="text-3xl font-black tracking-tight">{loading ? '...' : item.value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-[34px] border border-white bg-white/90 p-5 shadow-xl shadow-slate-100 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo ID actor, ID target hoặc lý do..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-lime-400 focus:bg-white focus:ring-4 focus:ring-lime-100"
            />
            <i className="fa-solid fa-fingerprint absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select title="Lọc theo hành động" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value as any); setCurrentPage(1); }} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-black text-slate-700 outline-none transition focus:border-lime-400 focus:ring-4 focus:ring-lime-100">
              <option value="ALL">Mọi hành động</option>
              <option value="CREATE_PRODUCT">CREATE_PRODUCT</option>
              <option value="SUBMIT_PRODUCT">SUBMIT_PRODUCT</option>
              <option value="APPROVE_PRODUCT">APPROVE_PRODUCT</option>
              <option value="REJECT_PRODUCT">REJECT_PRODUCT</option>
              <option value="CHANGE_PRODUCT_STATUS">CHANGE_PRODUCT_STATUS</option>
              <option value="CONFIRM_BUYER">CONFIRM_BUYER</option>
            </select>
            <select title="Lọc theo đối tượng" value={targetFilter} onChange={(e) => { setTargetFilter(e.target.value as any); setCurrentPage(1); }} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-black text-slate-700 outline-none transition focus:border-lime-400 focus:ring-4 focus:ring-lime-100">
              <option value="ALL">Mọi đối tượng</option>
              <option value="PRODUCT">PRODUCT</option>
              <option value="TRANSACTION">TRANSACTION</option>
              <option value="USER">USER</option>
            </select>
            <select title="Sắp xếp theo ngày" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-black text-slate-700 outline-none transition focus:border-lime-400 focus:ring-4 focus:ring-lime-100">
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[38px] border border-slate-100 bg-white shadow-xl shadow-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ID log</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Người thực hiện</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Hành động</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Đối tượng</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thay đổi</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-sm font-black uppercase tracking-widest text-slate-400">Đang tải nhật ký...</td></tr>
              ) : paginatedLogs.map(log => (
                <tr key={log.id} className="group cursor-pointer transition hover:bg-lime-50/45" onClick={() => setSelectedLog(log)}>
                  <td className="px-6 py-5"><span className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">#{log.id}</span></td>
                  <td className="px-6 py-5"><p className="text-[11px] font-black tabular-nums text-slate-500">{new Date(log.createdAt).toLocaleString('vi-VN')}</p></td>
                  <td className="px-6 py-5"><p className="text-xs font-black text-slate-900 transition group-hover:text-lime-700">{log.actorId.substring(0, 16)}</p><p className="text-[9px] font-bold uppercase tracking-tighter text-lime-700">{log.actorRole}</p></td>
                  <td className="px-6 py-5"><span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-tight ${getActionBadge(log.action)}`}>{log.action}</span></td>
                  <td className="px-6 py-5"><span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-tight ${getTargetBadge(log.targetType)}`}>{log.targetType}</span><p className="mt-2 text-[9px] font-bold uppercase tracking-tighter text-slate-400">ID: {log.targetId.substring(0, 12)}</p></td>
                  <td className="px-6 py-5"><div className="flex max-w-[230px] items-center gap-2"><span className="truncate rounded-xl bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">{log.oldValue || 'N/A'}</span><i className="fa-solid fa-arrow-right text-[10px] text-slate-300"></i><span className="truncate rounded-xl bg-lime-100 px-3 py-1 text-[10px] font-bold text-lime-800">{log.newValue || 'N/A'}</span></div></td>
                  <td className="px-6 py-5"><p className="line-clamp-2 max-w-[250px] text-xs italic text-slate-500">{log.reason || 'Không có ghi chú'}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && paginatedLogs.length === 0 && (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-lime-50 text-lime-300"><i className="fa-solid fa-database text-3xl"></i></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Hệ thống chưa ghi nhận log nào khớp</p>
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

      {selectedLog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[40px] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-lime-950 p-8 text-white">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-200">Mã bản ghi #{selectedLog.id}</p><h3 className="mt-1 text-3xl font-black tracking-tight">Chi tiết nhật ký</h3></div><button onClick={() => setSelectedLog(null)} title="Đóng modal" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"><i className="fa-solid fa-xmark"></i></button></div>
            </div>
            <div className="max-h-[76vh] space-y-6 overflow-y-auto p-8">
              <div className="rounded-[32px] border border-lime-100 bg-lime-50 p-6"><p className="mb-3 text-[10px] font-black uppercase tracking-widest text-lime-700">Người thực hiện</p><div className="grid gap-4 md:grid-cols-2"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID Actor</p><p className="break-all text-sm font-black text-slate-900">{selectedLog.actorId}</p></div><div><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Vai trò</p><p className="text-sm font-black text-lime-800">{selectedLog.actorRole}</p></div></div></div>
              <div className="grid gap-4 md:grid-cols-2"><div className="rounded-[26px] border border-slate-100 bg-slate-50 p-5"><p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Hành động</p><span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-tight ${getActionBadge(selectedLog.action)}`}>{selectedLog.action}</span></div><div className="rounded-[26px] border border-slate-100 bg-slate-50 p-5"><p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Đối tượng</p><span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-tight ${getTargetBadge(selectedLog.targetType)}`}>{selectedLog.targetType}</span></div></div>
              <div className="rounded-[26px] border border-slate-100 bg-slate-50 p-5"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">ID đối tượng</p><p className="break-all font-mono text-xs text-slate-700">{selectedLog.targetId}</p></div>
              <div><p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Thay đổi</p><div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]"><div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Giá trị cũ</p><p className="break-all font-mono text-sm text-slate-700">{selectedLog.oldValue || 'Không có'}</p></div><div className="flex items-center justify-center text-slate-300"><i className="fa-solid fa-arrow-right text-lg"></i></div><div className="rounded-3xl border border-lime-200 bg-lime-50 p-4"><p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-lime-700">Giá trị mới</p><p className="break-all font-mono text-sm text-lime-800">{selectedLog.newValue || 'Không có'}</p></div></div></div>
              <div className="rounded-[32px] border border-amber-100 bg-amber-50 p-6"><p className="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-700">Ghi chú / Lý do</p><p className="text-sm italic leading-7 text-slate-700">"{selectedLog.reason || 'Không có ghi chú'}"</p></div>
              <div className="flex items-center gap-3 rounded-[26px] border border-slate-100 bg-slate-50 p-5"><i className="fa-solid fa-clock text-lg text-slate-400"></i><div><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Thời gian</p><p className="font-mono text-sm text-slate-700">{new Date(selectedLog.createdAt).toLocaleString('vi-VN')}</p></div></div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-8 py-6"><button onClick={() => setSelectedLog(null)} className="w-full rounded-2xl bg-slate-950 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-black">Đóng</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
