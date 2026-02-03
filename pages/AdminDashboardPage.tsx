import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

// Import các component con (Các component này tự lo việc fetch data)
import AdminOverview from '../components/admin/AdminOverview';
import AdminModeration from '../components/admin/AdminModeration';     // ✅ Đã tích hợp API
import AdminUserManagement from '../components/admin/AdminUserManagement'; 
import AdminProductManagement from '../components/admin/AdminProductManagement'; // ✅ Đã tích hợp API
import AdminReports from '../components/admin/AdminReports';
import AdminTransactions from '../components/admin/AdminTransactions';
import AdminConversations from '../components/admin/AdminConversations';
import AdminAuditLogs from '../components/admin/AdminAuditLogs';

type AdminTab = 'OVERVIEW' | 'MODERATION' | 'REPORTS' | 'USERS' | 'PRODUCTS' | 'TRANSACTIONS' | 'CONVERSATIONS' | 'AUDIT_LOGS';

const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  // ❌ Đã xóa toàn bộ Mock Data (mockReports, mockTransactions...)
  // ❌ Đã xóa toàn bộ Handlers (handleApprove, handleDeleteProduct...)
  // Vì logic này đã nằm trong từng Component con rồi.

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
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 space-y-8 min-w-0">
        {/* Các component con bây giờ được render gọn gàng, 
            không cần truyền props data giả vào nữa 
        */}

        {activeTab === 'OVERVIEW' && <AdminOverview />}
        
        {/* ✅ Component này tự fetch API status=PENDING */}
        {activeTab === 'MODERATION' && <AdminModeration />}

        {/* ✅ Component này tự fetch API full products, tự xử lý Modal Create/Edit */}
        {activeTab === 'PRODUCTS' && <AdminProductManagement />}

        {/* Các component dưới đây bạn cần tự viết logic fetch API bên trong chúng tương tự như 2 cái trên */}
        {activeTab === 'USERS' && <AdminUserManagement />}
        {activeTab === 'TRANSACTIONS' && <AdminTransactions />}
        {activeTab === 'CONVERSATIONS' && <AdminConversations />}
        {activeTab === 'REPORTS' && <AdminReports />}
        {activeTab === 'AUDIT_LOGS' && <AdminAuditLogs />}
      </main>
    </div>
  );
};

export default AdminDashboardPage;