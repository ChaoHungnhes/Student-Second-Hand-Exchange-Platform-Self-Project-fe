import React, { useEffect, useMemo, useState } from "react";
import { User, UserRole, UserStatus } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  createUserAPI,
  deleteUserAPI,
  getUserByIdAPI,
  getUsersAPI,
  patchUserStatusAPI,
  updateUserAPI,
} from "../../config/api";

interface Props {
  users?: User[];
  onAdd?: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, current: UserStatus) => void;
}

const fieldClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100";
const labelClass = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500";

const getRoleTheme = (role?: UserRole) =>
  role === UserRole.ADMIN
    ? "border-rose-100 bg-rose-50 text-rose-700"
    : "border-sky-100 bg-sky-50 text-sky-700";

const ROLE_LEVEL: Record<string, number> = { ADMIN: 1, MANAGER: 2, USER: 3 };

const canManageUser = (currentRole?: string, targetRole?: string) => {
  if (!currentRole || !targetRole) return false;
  return (ROLE_LEVEL[currentRole] ?? 99) < (ROLE_LEVEL[targetRole] ?? 99);
};

const getStatusTheme = (status?: UserStatus) => {
  if (status === UserStatus.ACTIVE) return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === UserStatus.BLOCKED) return "border-rose-100 bg-rose-50 text-rose-700";
  if (status === UserStatus.RESTRICTED) return "border-orange-100 bg-orange-50 text-orange-700";
  if (status === UserStatus.WARNING) return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
};

const AdminUserManagement: React.FC<Props> = ({ users: initialUsers = [] }) => {
  const { user: currentUser, hasPermission, isAdmin } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "rating">("createdAt");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [meta, setMeta] = useState({ page: 1, pageSize: 8, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: UserRole.USER, status: UserStatus.ACTIVE });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await getUsersAPI({
        page: currentPage,
        size: pageSize,
        keyword: keyword || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sortBy,
        sortDir,
      });
      if (resp) {
        setUsers(resp.result || []);
        setMeta(resp.meta || { page: currentPage, pageSize, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error("Fetch users error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [keyword, statusFilter, sortBy, sortDir, currentPage, pageSize]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa người dùng này?")) return;
    const prev = users;
    setUsers((prevState) => prevState.filter((u) => u.id !== id));
    try {
      const response = await deleteUserAPI(id);
      alert(typeof response === "string" ? response : "Vô hiệu hóa người dùng thành công");
      await fetchUsers();
    } catch (error) {
      console.error("Delete user failed", error);
      alert("Vô hiệu hóa người dùng thất bại");
      setUsers(prev);
    }
  };

  const handlePatchStatus = async (id: string, nextStatus: UserStatus) => {
    const prev = users;
    setUsers((prevState) => prevState.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)));
    try {
      await patchUserStatusAPI(id, nextStatus);
    } catch (error) {
      console.error("Patch status failed", error);
      alert("Cập nhật trạng thái thất bại");
      setUsers(prev);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setCreateLoading(true);
    try {
      const resp = await createUserAPI({ name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role });
      if (resp) {
        setIsAddModalOpen(false);
        setNewUser({ name: "", email: "", password: "", role: UserRole.USER, status: UserStatus.ACTIVE });
        alert("Tạo người dùng thành công");
        await fetchUsers();
      }
    } catch (error) {
      console.error("Create user failed", error);
      alert("Tạo người dùng thất bại");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewUser = async (id: string) => {
    setDetailsLoading(true);
    try {
      const resp = await getUserByIdAPI(id);
      if (resp) setSelectedUser(resp);
    } catch (error) {
      console.error("Fetch user details failed", error);
      alert("Lấy thông tin người dùng thất bại");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const resp = await updateUserAPI(editingUser.id, { name: editingUser.name, role: editingUser.role, status: editingUser.status });
      if (resp) {
        setUsers((prev) => prev.map((u) => (u.id === resp.id ? { ...u, ...resp } : u)));
        setEditingUser(null);
        alert("Cập nhật người dùng thành công");
      }
    } catch (error) {
      console.error("Update user failed", error);
      alert("Cập nhật người dùng thất bại");
    } finally {
      setEditLoading(false);
    }
  };

  const activeCount = useMemo(() => users.filter((u) => u.status === UserStatus.ACTIVE).length, [users]);
  const currentRole = currentUser?.role || currentUser?.roles?.[0];
  const roleOptions = isAdmin ? [UserRole.USER, UserRole.MANAGER] : [UserRole.USER];
  const canManageTarget = (target?: User | null) => canManageUser(currentRole, target?.role);

  const renderUserModal = (mode: "create" | "edit") => {
    const isCreate = mode === "create";
    const userData: any = isCreate ? newUser : editingUser;
    const setData = isCreate ? setNewUser : setEditingUser;
    const close = () => (isCreate ? setIsAddModalOpen(false) : setEditingUser(null));
    const submit = isCreate ? handleCreateUser : handleSubmitEdit;
    const busy = isCreate ? createLoading : editLoading;

    if (!userData) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={close} />
        <form onSubmit={submit} className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-slate-950 px-7 py-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-200">User studio</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">{isCreate ? "Thêm người dùng mới" : "Cập nhật người dùng"}</h3>
                <p className="mt-2 text-sm text-slate-300">{isCreate ? "Tạo tài khoản hỗ trợ vận hành sàn sinh viên." : "Điều chỉnh vai trò và trạng thái tài khoản."}</p>
              </div>
              <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20"><i className="fa-solid fa-xmark" /></button>
            </div>
          </div>

          <div className="space-y-5 p-7">
            <div>
              <label className={labelClass}>Họ tên</label>
              <input value={userData.name || ""} onChange={(e) => setData((p: any) => ({ ...p, name: e.target.value }))} className={fieldClass} placeholder="Tên hiển thị" />
            </div>
            {isCreate && <div><label className={labelClass}>Email</label><input type="email" value={userData.email || ""} onChange={(e) => setData((p: any) => ({ ...p, email: e.target.value }))} className={fieldClass} placeholder="student@s2s.edu.vn" /></div>}
            {isCreate && <div><label className={labelClass}>Mật khẩu</label><input type="password" value={userData.password || ""} onChange={(e) => setData((p: any) => ({ ...p, password: e.target.value }))} className={fieldClass} placeholder="Mật khẩu đăng nhập" /></div>}
            {!isCreate && <div><label className={labelClass}>Email</label><input disabled value={userData.email || ""} className={`${fieldClass} cursor-not-allowed bg-slate-100 text-slate-400`} /></div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelClass}>Vai trò</label><select value={userData.role} onChange={(e) => setData((p: any) => ({ ...p, role: e.target.value }))} className={fieldClass}>{roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
              <div><label className={labelClass}>Trạng thái</label><select disabled={isCreate} value={userData.status || UserStatus.ACTIVE} onChange={(e) => setData((p: any) => ({ ...p, status: e.target.value }))} className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}>{Object.values(UserStatus).map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-7 py-5">
            <button type="button" onClick={close} className="rounded-2xl px-6 py-3 text-sm font-black text-slate-500 hover:bg-white">Hủy</button>
            <button type="submit" disabled={busy || (!isCreate && !canManageTarget(editingUser))} className="rounded-2xl bg-teal-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-teal-700 disabled:opacity-60">{busy ? "Đang lưu..." : isCreate ? "Tạo người dùng" : "Lưu thay đổi"}</button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/10 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(20,184,166,0.34),transparent_26%),radial-gradient(circle_at_88%_8%,rgba(251,191,36,0.24),transparent_24%)]" />
        <i className="fa-solid fa-users-gear absolute -bottom-10 right-8 text-[10rem] text-white/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-100 ring-1 ring-white/15"><i className="fa-solid fa-id-card" /> Student accounts</span>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Quản lý người dùng rõ ràng và an toàn</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-300">Theo dõi tài khoản sinh viên, phân quyền admin và xử lý nhanh các trường hợp cần hạn chế.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10"><p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tổng tài khoản</p><p className="mt-2 text-4xl font-black tracking-tighter">{meta.total}</p></div>
            {hasPermission("user:create") && <button onClick={() => setIsAddModalOpen(true)} className="rounded-[1.5rem] bg-amber-300 p-4 text-left text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-200"><i className="fa-solid fa-user-plus mb-3 text-xl" /><p className="text-xs font-black uppercase tracking-widest">Thêm user</p></button>}
          </div>
        </div>
      </section>

      {isAddModalOpen && renderUserModal("create")}
      {editingUser && renderUserModal("edit")}

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-900/5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative"><i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Tìm tên, email hoặc ID sinh viên..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }} className={`${fieldClass} pl-12`} /></div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }} className={fieldClass}><option value="ALL">Mọi trạng thái</option>{Object.values(UserStatus).map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }} className={fieldClass}><option value="createdAt">Mới gia nhập</option><option value="rating">Uy tín cao nhất</option></select>
          <select value={sortDir} onChange={(e) => { setSortDir(e.target.value as any); setCurrentPage(1); }} className={fieldClass}><option value="desc">Giảm dần</option><option value="asc">Tăng dần</option></select>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className={fieldClass}><option value={8}>8 / trang</option><option value={12}>12 / trang</option><option value={20}>20 / trang</option></select>
        </div>
        <p className="mt-4 text-xs font-bold text-slate-400">Đang hiển thị {users.length} tài khoản, {activeCount} tài khoản đang hoạt động trong trang này.</p>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-100 bg-slate-50"><tr>{["Người dùng / ID", "Vai trò", "Trạng thái", "Uy tín", "Ngày tạo", "Thao tác"].map((h) => <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? <tr><td colSpan={6} className="px-6 py-16 text-center"><i className="fa-solid fa-circle-notch animate-spin text-3xl text-teal-500" /><p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">Đang tải</p></td></tr> : users.length === 0 ? <tr><td colSpan={6} className="px-6 py-16 text-center text-sm font-bold text-slate-400">Không có người dùng phù hợp</td></tr> : users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-5"><div className="flex items-center gap-4"><img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm" /><div className="max-w-[230px]"><p className="truncate text-sm font-black text-slate-950">{u.name}</p><p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">#{u.id}</p><p className="truncate text-xs font-medium text-slate-400">{u.email}</p></div></div></td>
                  <td className="px-6 py-5"><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getRoleTheme(u.role)}`}>{u.role}</span></td>
                  <td className="px-6 py-5"><span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusTheme(u.status)}`}>{u.status}</span></td>
                  <td className="px-6 py-5"><div className="flex items-center text-sm font-black text-amber-500"><i className="fa-solid fa-star mr-1" />{typeof u.rating === "number" ? u.rating.toFixed(1) : "-"}</div></td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                  <td className="px-6 py-5"><div className="flex gap-2"><button onClick={() => handleViewUser(u.id)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 transition hover:bg-cyan-600 hover:text-white"><i className="fa-solid fa-eye" /></button>{hasPermission("user:update") && canManageTarget(u) && <button onClick={() => setEditingUser(u)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition hover:bg-teal-600 hover:text-white"><i className="fa-solid fa-user-pen" /></button>}{hasPermission("user:status:update") && canManageTarget(u) && <button onClick={() => handlePatchStatus(u.id, u.status === UserStatus.BLOCKED ? UserStatus.ACTIVE : UserStatus.BLOCKED)} className={`flex h-10 w-10 items-center justify-center rounded-2xl transition hover:text-white ${u.status === UserStatus.BLOCKED ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600" : "bg-orange-50 text-orange-600 hover:bg-orange-600"}`}><i className={`fa-solid ${u.status === UserStatus.BLOCKED ? "fa-unlock" : "fa-ban"}`} /></button>}{hasPermission("user:delete") && canManageTarget(u) && <button onClick={() => handleDeleteUser(u.id)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"><i className="fa-solid fa-trash" /></button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-black uppercase tracking-widest text-slate-400">Trang {meta.page} / {meta.pages} (Tổng: {meta.total})</span><div className="flex gap-2"><button disabled={meta.page === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black text-slate-600 disabled:opacity-30">Trước</button><button disabled={meta.page === meta.pages} onClick={() => setCurrentPage((p) => Math.min(meta.pages, p + 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-2 text-xs font-black text-slate-600 disabled:opacity-30">Sau</button></div></div>
      </section>

      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="bg-slate-950 px-7 py-6 text-white"><div className="flex justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-200">Hồ sơ người dùng</p><h3 className="mt-2 text-2xl font-black">Chi tiết tài khoản</h3></div><button type="button" onClick={() => setSelectedUser(null)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20"><i className="fa-solid fa-xmark" /></button></div></div>
            <div className="p-7">{detailsLoading ? <p className="text-center text-slate-400">Đang tải...</p> : <div className="space-y-5"><div className="flex items-center gap-4"><img src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`} className="h-20 w-20 rounded-full border-4 border-teal-50 object-cover" alt={selectedUser.name} /><div><h4 className="text-2xl font-black text-slate-950">{selectedUser.name}</h4><p className="text-sm font-bold text-slate-400">{selectedUser.email}</p></div></div><div className="grid gap-3 sm:grid-cols-2">{[["ID", selectedUser.id], ["Vai trò", selectedUser.role], ["Trạng thái", selectedUser.status], ["Uy tín", typeof selectedUser.rating === "number" ? selectedUser.rating.toFixed(1) : "-"], ["Đánh giá", (selectedUser as any).countByReview ?? 0], ["Tổng sản phẩm", selectedUser.totalProducts ?? 0], ["Đã bán", selectedUser.soldProducts ?? 0], ["Đang bán", selectedUser.activeProducts ?? 0], ["Ngày tạo", selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("vi-VN") : "-"]].map(([k, v]) => <div key={String(k)} className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k}</p><p className="mt-1 break-all text-sm font-black text-slate-900">{v}</p></div>)}</div></div>}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;



