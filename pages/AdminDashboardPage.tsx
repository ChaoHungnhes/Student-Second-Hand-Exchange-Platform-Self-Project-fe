import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Product, ProductStatus, User, UserStatus, UserRole, 
  Report, ReportReason, Transaction, TransactionStatus, 
  Conversation, ConversationStatus, AuditLog, AuditAction, AuditTargetType 
} from '../types';
import { MOCK_PRODUCTS } from './Home';
import AdminOverview from '../components/admin/AdminOverview';
import AdminModeration from '../components/admin/AdminModeration';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminProductManagement from '../components/admin/AdminProductManagement';
import AdminReports from '../components/admin/AdminReports';
import AdminTransactions from '../components/admin/AdminTransactions';
import AdminConversations from '../components/admin/AdminConversations';
import AdminAuditLogs from '../components/admin/AdminAuditLogs';

type AdminTab = 'OVERVIEW' | 'MODERATION' | 'REPORTS' | 'USERS' | 'PRODUCTS' | 'TRANSACTIONS' | 'CONVERSATIONS' | 'AUDIT_LOGS';

const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserAddModalOpen, setIsUserAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<{ name: string; email: string; password: string; roles: any[] }>({ name: '', email: '', password: '', roles: [UserRole.USER] });

  const [mockUsers, setMockUsers] = useState<any[]>([
    {
      id: "bb31783e-78b4-4ca4-874b-6778772b6b0f",
      name: "Nguyen Van A",
      email: "thanhhung2k4@gmail.com",
      roles: [UserRole.USER],
      status: UserStatus.WARNING,
      rating: 1.0,
      countByReview: 0,
      totalProducts: 0,
      soldProducts: 0,
      activeProducts: 0,
      createdAt: "2026-01-23T12:07:38.122745",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=A"
    },
    {
      id: "mod-support-id",
      name: "Mod Support",
      email: "mod@s2s.com",
      roles: [UserRole.ADMIN],
      status: UserStatus.ACTIVE,
      rating: 5.0,
      countByReview: 0,
      totalProducts: 0,
      soldProducts: 0,
      activeProducts: 0,
      createdAt: "2026-01-25T14:28:46",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mod"
    },
    {
      id: "s3",
      name: "Lê Minh Hoàng",
      email: "hoanglm@sis.hust.edu.vn",
      roles: [UserRole.USER],
      status: UserStatus.ACTIVE,
      rating: 4.8,
      countByReview: 5,
      totalProducts: 10,
      soldProducts: 6,
      activeProducts: 4,
      createdAt: "2024-02-15T08:00:00",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hoang"
    }
  ]);

  const [mockReports, setMockReports] = useState<Report[]>([
    {
      id: 'rep-001',
      reporterId: 'bb31783e-78b4-4ca4-874b-6778772b6b0f',
      reporterName: 'Nguyen Van A',
      targetUserId: 's3',
      targetUserName: 'Lê Minh Hoàng',
      reason: ReportReason.SCAM,
      note: 'Người bán yêu cầu chuyển khoản trước 50% tiền cọc máy tính Casio nhưng sau đó không phản hồi tin nhắn.',
      createdAt: '2026-01-25T10:30:00'
    },
    {
      id: 'rep-002',
      reporterId: 'eb6570db-c5c6-4d49-846b-2ac994d791e1',
      reporterName: 'Sinh Viên Ẩn Danh',
      targetUserId: 'bb31783e-78b4-4ca4-874b-6778772b6b0f',
      targetUserName: 'Nguyen Van A',
      reason: ReportReason.ABUSIVE_LANGUAGE,
      note: 'Dùng ngôn ngữ không chuẩn mực khi mặc cả giá trong phần tin nhắn.',
      createdAt: '2026-01-26T14:20:00'
    }
  ]);

  const [mockTransactions, setMockTransactions] = useState<Transaction[]>([
    {
      id: 'txn-101',
      productId: '1',
      productTitle: 'Giáo trình Giải tích 1 - ĐH Bách Khoa',
      productPrice: 35000,
      sellerId: 's1',
      sellerName: 'Nguyễn Văn Nam',
      buyerId: 'u101',
      buyerName: 'Lê Văn Tùng',
      status: TransactionStatus.COMPLETED,
      createdAt: '2024-03-05T10:00:00Z'
    }
  ]);

  const [mockConversations, setMockConversations] = useState<Conversation[]>([
    {
      id: 'conv-001',
      productId: '1',
      productTitle: 'Giáo trình Giải tích 1 - ĐH Bách Khoa',
      productImage: 'https://picsum.photos/seed/book1/200/200',
      buyerId: 'u101',
      buyerName: 'Lê Văn Tùng',
      sellerId: 's1',
      sellerName: 'Nguyễn Văn Nam',
      status: ConversationStatus.ACTIVE,
      createdAt: '2026-01-20T10:00:00'
    }
  ]);

  const [mockAuditLogs, setMockAuditLogs] = useState<AuditLog[]>([
    {
      id: 1,
      actorId: 'adm-001',
      actorRole: 'ADMIN',
      action: AuditAction.APPROVE,
      targetType: AuditTargetType.PRODUCT,
      targetId: '1',
      oldValue: 'PENDING',
      newValue: 'APPROVED',
      reason: 'Sản phẩm hợp lệ, đầy đủ thông tin.',
      createdAt: '2026-01-25T08:30:00'
    },
    {
      id: 2,
      actorId: 'AI_MODERATOR',
      actorRole: 'SYSTEM',
      action: AuditAction.REJECT,
      targetType: AuditTargetType.PRODUCT,
      targetId: 'p3',
      oldValue: 'PENDING',
      newValue: 'REJECTED',
      reason: 'Phát hiện hàng cấm (Hóa chất thí nghiệm).',
      createdAt: '2026-01-24T14:15:00'
    },
    {
      id: 3,
      actorId: 'adm-001',
      actorRole: 'ADMIN',
      action: AuditAction.BLOCK,
      targetType: AuditTargetType.USER,
      targetId: 'bb31783e-78b4-4ca4-874b-6778772b6b0f',
      oldValue: 'ACTIVE',
      newValue: 'BLOCKED',
      reason: 'Báo cáo lừa đảo txn-101 được xác minh là đúng.',
      createdAt: '2026-01-26T10:00:00'
    }
  ]);

  // --- HANDLERS ---
  const handleUpdateConvStatus = (id: string, newStatus: ConversationStatus) => {
    setMockConversations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handleDeleteConv = (id: string) => {
    if (window.confirm("Xóa bản ghi hội thoại này? (Dữ liệu tin nhắn sẽ không bị ảnh hưởng)")) {
      setMockConversations(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleApprove = (id: string) => { 
    alert(`Duyệt sản phẩm #${id} thành công!`); 
    // Giả lập log
    const newLog: AuditLog = {
      id: Date.now(),
      actorId: currentUser?.id || 'admin',
      actorRole: 'ADMIN',
      action: AuditAction.APPROVE,
      targetType: AuditTargetType.PRODUCT,
      targetId: id,
      oldValue: 'PENDING',
      newValue: 'APPROVED',
      reason: 'Đã duyệt bằng tay bởi Admin.',
      createdAt: new Date().toISOString()
    };
    setMockAuditLogs(prev => [newLog, ...prev]);
  };

  const handleReject = (id: string) => { alert(`Từ chối sản phẩm #${id}`); };
  const handleDeleteProduct = (id: string) => { if (window.confirm("Xóa sản phẩm này?")) alert(`Đã xóa ${id}`); };
  
  const handleToggleUserStatus = (id: string, current: UserStatus) => {
    const next = current === UserStatus.BLOCKED ? UserStatus.ACTIVE : UserStatus.BLOCKED;
    setMockUsers(prev => prev.map(u => u.id === id ? { ...u, status: next } : u));
  };
  const handleDeleteUser = (id: string) => {
    if (window.confirm("Xóa người dùng này?")) setMockUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u: any = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9),
      status: UserStatus.ACTIVE,
      rating: 5.0,
      countByReview: 0,
      totalProducts: 0, soldProducts: 0, activeProducts: 0,
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
    };
    setMockUsers(prev => [...prev, u]);
    setIsUserAddModalOpen(false);
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setMockUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      setIsUserModalOpen(false);
    }
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm("Xóa báo cáo này khỏi hệ thống?")) {
      setMockReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleUpdateTxnStatus = (id: string, newStatus: TransactionStatus) => {
    setMockTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTxn = (id: string) => {
    if (window.confirm("Xóa bản ghi giao dịch này?")) {
      setMockTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  if (currentUser?.roles[0] !== UserRole.ADMIN) {
    return <div className="p-20 text-center font-black text-red-600 uppercase tracking-widest">Truy cập bị từ chối</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-24">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-[40px] border border-gray-100 p-5 shadow-sm sticky top-24">
          <div className="mb-10 px-4 py-2">
            <h2 className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em]">Hệ thống</h2>
            <p className="text-2xl font-black text-gray-900 tracking-tighter">UniAdmin</p>
          </div>
          <nav className="space-y-3">
            {[
              { id: 'OVERVIEW', icon: 'fa-chart-pie', label: 'Tổng quan' },
              { id: 'MODERATION', icon: 'fa-shield-halved', label: 'Duyệt tin' },
              { id: 'PRODUCTS', icon: 'fa-box-archive', label: 'Sản phẩm' },
              { id: 'USERS', icon: 'fa-users-gear', label: 'Người dùng' },
              { id: 'TRANSACTIONS', icon: 'fa-handshake', label: 'Giao dịch' },
              { id: 'CONVERSATIONS', icon: 'fa-comments', label: 'Hội thoại' },
              { id: 'REPORTS', icon: 'fa-triangle-exclamation', label: 'Báo cáo' },
              { id: 'AUDIT_LOGS', icon: 'fa-clock-rotate-left', label: 'Check Log' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                  activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <i className={`fa-solid ${item.icon} text-sm`}></i>
                  <span className="text-[11px] font-black uppercase tracking-wider">{item.label}</span>
                </div>
                {item.id === 'REPORTS' && mockReports.length > 0 && (
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black ${activeTab === 'REPORTS' ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>
                    {mockReports.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 space-y-8 min-w-0">
        {activeTab === 'OVERVIEW' && <AdminOverview users={mockUsers} products={MOCK_PRODUCTS} />}
        
        {activeTab === 'MODERATION' && (
          <AdminModeration 
            products={MOCK_PRODUCTS} 
            onApprove={handleApprove} 
            onReject={handleReject} 
            onDelete={handleDeleteProduct} 
          />
        )}

        {activeTab === 'PRODUCTS' && (
          <AdminProductManagement 
            products={MOCK_PRODUCTS} 
            onEdit={(p) => { setEditingProduct(p); setIsProdModalOpen(true); }} 
            onDelete={handleDeleteProduct} 
          />
        )}

        {activeTab === 'USERS' && (
          <AdminUserManagement 
            users={mockUsers} 
            onAdd={() => setIsUserAddModalOpen(true)} 
            onEdit={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} 
            onDelete={handleDeleteUser} 
            onToggleStatus={handleToggleUserStatus} 
          />
        )}
        
        {activeTab === 'TRANSACTIONS' && (
          <AdminTransactions 
            transactions={mockTransactions} 
            onUpdateStatus={handleUpdateTxnStatus} 
            onDeleteTransaction={handleDeleteTxn} 
          />
        )}

        {activeTab === 'CONVERSATIONS' && (
          <AdminConversations 
            conversations={mockConversations} 
            onUpdateStatus={handleUpdateConvStatus} 
            onDelete={handleDeleteConv} 
          />
        )}

        {activeTab === 'REPORTS' && (
          <AdminReports 
            reports={mockReports} 
            onDeleteReport={handleDeleteReport} 
          />
        )}

        {activeTab === 'AUDIT_LOGS' && (
          <AdminAuditLogs 
            logs={mockAuditLogs} 
          />
        )}
      </main>

      {/* --- MODALS --- */}
      {isUserAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsUserAddModalOpen(false)}></div>
          <form onSubmit={handleAddUserSubmit} className="bg-white w-full max-md rounded-[40px] shadow-2xl relative z-10 p-10 space-y-6">
            <h3 className="text-xl font-black text-gray-900 uppercase">Thêm nhân sự mới</h3>
            <div className="space-y-4">
              <input required placeholder="Họ tên" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl" />
              <input required type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl" />
              <input required type="password" placeholder="Mật khẩu" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl" />
              <select value={newUser.roles[0]} onChange={e => setNewUser({...newUser, roles: [e.target.value]})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold">
                <option value={UserRole.USER}>USER</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setIsUserAddModalOpen(false)} className="flex-1 py-4 text-xs font-black uppercase text-gray-400">Hủy</button>
              <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100">Xác nhận</button>
            </div>
          </form>
        </div>
      )}

      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
          <form onSubmit={handleEditUserSubmit} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 space-y-6">
            <h3 className="text-xl font-black text-gray-900 uppercase">Cập nhật tài khoản</h3>
            <div className="space-y-4">
              <input required value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl" />
              <select value={editingUser?.roles?.[0]} onChange={e => setEditingUser({...editingUser, roles: [e.target.value]})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold">
                <option value={UserRole.USER}>USER</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
              </select>
              <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold">
                {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Lưu thay đổi</button>
          </form>
        </div>
      )}

      {isProdModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsProdModalOpen(false)}></div>
          <form onSubmit={(e) => { e.preventDefault(); setIsProdModalOpen(false); }} className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 p-10 space-y-6">
            <h3 className="text-xl font-black text-gray-900 uppercase">Sửa sản phẩm</h3>
            <div className="grid grid-cols-2 gap-4">
              <input value={editingProduct.title} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} className="col-span-2 px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl" />
              <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl" />
              <select value={editingProduct.status} onChange={e => setEditingProduct({...editingProduct, status: e.target.value as ProductStatus})} className="px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold">
                {Object.values(ProductStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Cập nhật</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
