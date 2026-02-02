
import React, { useState, useMemo } from 'react';
import { User, UserStatus, UserRole } from '../../types';

interface Props {
  users: User[];
  onAdd: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, current: UserStatus) => void;
}

const AdminUserManagement: React.FC<Props> = ({ users, onAdd, onEdit, onDelete, onToggleStatus }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'rating'>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (keyword) {
      result = result.filter(u => u.name.toLowerCase().includes(keyword.toLowerCase()) || u.email.toLowerCase().includes(keyword.toLowerCase()) || u.id.includes(keyword.toLowerCase()));
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(u => u.status === statusFilter);
    }
    result.sort((a, b) => {
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.rating - a.rating;
    });
    return result;
  }, [users, keyword, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý người dùng</h1>
        <button onClick={onAdd} className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3">
          <i className="fa-solid fa-user-plus"></i> Thêm Admin/Mod
        </button>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-2 relative">
          <input 
            type="text" placeholder="Tìm tên, email hoặc ID sinh viên..." 
            value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
          <option value="ALL">Mọi trạng thái</option>
          {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
          <option value="createdAt">Mới gia nhập</option>
          <option value="rating">Uy tín cao nhất</option>
        </select>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Người dùng / ID</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vai trò</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Uy tín</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày tạo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <img src={u.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="av" />
                    <div className="max-w-[180px]">
                      <p className="text-sm font-black text-gray-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold truncate">#{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${u.role === UserRole.ADMIN ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${
                    u.status === UserStatus.ACTIVE ? 'border-green-100 text-green-600 bg-green-50' :
                    u.status === UserStatus.BLOCKED ? 'border-red-100 text-red-600 bg-red-50' :
                    'border-yellow-100 text-yellow-600 bg-yellow-50'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center text-yellow-500 font-black text-xs">
                    <i className="fa-solid fa-star mr-1"></i> {u.rating.toFixed(1)}
                  </div>
                </td>
                <td className="px-8 py-5 text-[11px] font-bold text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(u)} className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-user-pen text-sm"></i></button>
                    <button onClick={() => onToggleStatus(u.id, u.status)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm ${u.status === UserStatus.BLOCKED ? 'bg-green-50 text-green-600 hover:bg-green-600' : 'bg-orange-50 text-orange-600 hover:bg-orange-600'} hover:text-white`}>
                      <i className={`fa-solid ${u.status === UserStatus.BLOCKED ? 'fa-unlock' : 'fa-ban'} text-sm`}></i>
                    </button>
                    <button onClick={() => onDelete(u.id)} className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-trash text-sm"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="px-8 py-5 bg-gray-50 flex justify-between items-center border-t border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trang {currentPage} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Trước</button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
