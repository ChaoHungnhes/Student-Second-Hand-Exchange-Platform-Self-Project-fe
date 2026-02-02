
import React, { useEffect, useState } from 'react';
import { User, UserStatus, UserRole } from '../../types';
import { getUsersAPI, deleteUserAPI, updateUserAPI, patchUserStatusAPI, createUserAPI, getUserByIdAPI } from '../../config/api';

interface Props {
  users: User[];
  onAdd: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, current: UserStatus) => void;
}

const AdminUserManagement: React.FC<Props> = ({ users: initialUsers = [], onAdd, onEdit, onDelete, onToggleStatus }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'rating'>('createdAt');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [meta, setMeta] = useState({ page: 1, pageSize: 8, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.USER });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await getUsersAPI({ page: currentPage, size: pageSize, keyword: keyword || undefined, status: statusFilter === 'ALL' ? undefined : statusFilter, sortBy, sortDir });
      if (resp) {
        setUsers(resp.result || []);
        setMeta(resp.meta || { page: currentPage, pageSize, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Fetch users error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, statusFilter, sortBy, sortDir, currentPage, pageSize]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Xóa / Vô hiệu hoá người dùng này?')) return;
    const prev = users;
    setUsers(prevState => prevState.filter(u => u.id !== id));
    try {
      await deleteUserAPI(id);
    } catch (error) {
      console.error('Delete user failed', error);
      alert('Xóa người dùng thất bại');
      setUsers(prev);
    }
  };

  const handlePatchStatus = async (id: string, nextStatus: UserStatus) => {
    const prev = users;
    setUsers(prevState => prevState.map(u => u.id === id ? { ...u, status: nextStatus } : u));
    try {
      await patchUserStatusAPI(id, nextStatus);
    } catch (error) {
      console.error('Patch status failed', error);
      alert('Cập nhật trạng thái thất bại');
      setUsers(prev);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setCreateLoading(true);
    try {
      const resp = await createUserAPI({ name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role });
      if (resp) {
        setUsers(prev => [resp, ...prev]);
        setIsAddModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: UserRole.USER });
        alert('Tạo người dùng thành công');
      }
    } catch (error) {
      console.error('Create user failed', error);
      alert('Tạo người dùng thất bại');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewUser = async (id: string) => {
    setDetailsLoading(true);
    try {
      const resp = await getUserByIdAPI(id);
      if (resp) {
        setSelectedUser(resp);
      }
    } catch (error) {
      console.error('Fetch user details failed', error);
      alert('Lấy thông tin người dùng thất bại');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    const payload = { name: editingUser.name, role: editingUser.role, status: editingUser.status };
    try {
      const resp = await updateUserAPI(editingUser.id, payload);
      if (resp) {
        const updated = resp;
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Update user failed', error);
      alert('Cập nhật người dùng thất bại');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý người dùng</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3">
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
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
            <option value="ALL">Mọi trạng thái</option>
            {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }} className="px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
            <option value="createdAt">Mới gia nhập</option>
            <option value="rating">Uy tín cao nhất</option>
          </select>

          <select value={sortDir} onChange={(e) => { setSortDir(e.target.value as any); setCurrentPage(1); }} className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>
        </div>
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
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} 
                alt={u.name}  className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="av" />
                    <div className="max-w-[180px]">
                      <p className="text-sm font-black text-gray-900 truncate">{u.name}</p>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
              <form onSubmit={handleCreateUser} className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black">Thêm người dùng mới</h3>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400">Đóng</button>
                </div>
                <div className="space-y-4">
                  <input placeholder="Tên" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-2xl" />
                  <input placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-2xl" />
                  <input placeholder="Mật khẩu" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-2xl" />
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 border border-gray-200 rounded-2xl">
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-xs font-black uppercase text-gray-400">Hủy</button>
                  <button type="submit" disabled={createLoading} className="flex-2 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase">Tạo</button>
                </div>
              </form>
            </div>
          )}

          {editingUser && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
              <form onSubmit={handleSubmitEdit} className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black">Cập nhật người dùng</h3>
                  <button type="button" onClick={() => setEditingUser(null)} className="text-gray-400">Đóng</button>
                </div>
                <div className="space-y-4">
                  <input value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-2xl" />
                  <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-4 py-3 border border-gray-200 rounded-2xl">
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})} className="w-full px-4 py-3 border border-gray-200 rounded-2xl">
                    {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 text-xs font-black uppercase text-gray-400">Hủy</button>
                  <button type="submit" disabled={editLoading} className="flex-2 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase">Lưu</button>
                </div>
              </form>
            </div>
          )}

          {selectedUser && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black">Chi tiết người dùng</h3>
                  <button type="button" onClick={() => setSelectedUser(null)} className="text-gray-400">Đóng</button>
                </div>
                {detailsLoading ? (
                  <p className="text-center text-gray-400">Đang tải...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <img src={selectedUser.avatar} className="w-20 h-20 rounded-full mx-auto border-2 border-indigo-200" alt="av" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Tên</p>
                      <p className="font-black text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                      <p className="font-black text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">ID</p>
                      <p className="font-black text-gray-900 break-all">#{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Vai trò</p>
                      <p className="font-black text-gray-900">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Trạng thái</p>
                      <p className="font-black text-gray-900">{selectedUser.status}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Uy tín</p>
                        <p className="font-black text-gray-900">{typeof selectedUser.rating === 'number' ? selectedUser.rating.toFixed(1) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Đánh giá</p>
                        <p className="font-black text-gray-900">{selectedUser.countByReview ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Tổng sản phẩm</p>
                        <p className="font-black text-gray-900">{selectedUser.totalProducts ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Đã bán</p>
                        <p className="font-black text-gray-900">{selectedUser.soldProducts ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Đang bán</p>
                        <p className="font-black text-gray-900">{selectedUser.activeProducts ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Ngày tạo</p>
                        <p className="font-black text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 py-3 text-xs font-black uppercase text-gray-400">Đóng</button>
                </div>
              </div>
            </div>
          )}
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
                    <i className="fa-solid fa-star mr-1"></i> {typeof u.rating === 'number' ? u.rating.toFixed(1) : '-'}
                  </div>
                </td>
                <td className="px-8 py-5 text-[11px] font-bold text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-2">
                    <button onClick={() => handleViewUser(u.id)} className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center hover:bg-cyan-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-eye text-sm"></i></button>
                    <button onClick={() => handleOpenEdit(u)} className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-user-pen text-sm"></i></button>
                    <button onClick={() => handlePatchStatus(u.id, u.status === UserStatus.BLOCKED ? UserStatus.ACTIVE : UserStatus.BLOCKED)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm ${u.status === UserStatus.BLOCKED ? 'bg-green-50 text-green-600 hover:bg-green-600' : 'bg-orange-50 text-orange-600 hover:bg-orange-600'} hover:text-white`}>
                      <i className={`fa-solid ${u.status === UserStatus.BLOCKED ? 'fa-unlock' : 'fa-ban'} text-sm`}></i>
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)} className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-trash text-sm"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="px-8 py-5 bg-gray-50 flex justify-between items-center border-t border-gray-100">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trang {meta.page} / {meta.pages} (Tổng: {meta.total})</span>
          <div className="flex gap-2">
            <button disabled={meta.page === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Trước</button>
            <button disabled={meta.page === meta.pages} onClick={() => setCurrentPage(p => Math.min(meta.pages, p + 1))} className="px-5 py-2 bg-white rounded-xl text-xs font-black disabled:opacity-30 border border-gray-200">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
