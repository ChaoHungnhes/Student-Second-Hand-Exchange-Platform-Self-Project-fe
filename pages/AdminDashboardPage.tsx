import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

import AdminOverview from "../components/admin/AdminOverview";
import AdminModeration from "../components/admin/AdminModeration";
import AdminUserManagement from "../components/admin/AdminUserManagement";
import AdminProductManagement from "../components/admin/AdminProductManagement";
import AdminReports from "../components/admin/AdminReports";
import AdminTransactions from "../components/admin/AdminTransactions";
import AdminConversations from "../components/admin/AdminConversations";
import AdminAuditLogs from "../components/admin/AdminAuditLogs";
import AdminNotifications from "../components/admin/AdminNotifications";
import AdminCategoryManagement from "../components/admin/AdminCategoryManagement";

type AdminTab =
  | "OVERVIEW"
  | "MODERATION"
  | "REPORTS"
  | "USERS"
  | "PRODUCTS"
  | "CATEGORIES"
  | "TRANSACTIONS"
  | "CONVERSATIONS"
  | "NOTIFICATIONS"
  | "AUDIT_LOGS";

const adminTabs: Array<{
  id: AdminTab;
  icon: string;
  label: string;
  hint: string;
}> = [
  {
    id: "OVERVIEW",
    icon: "fa-chart-pie",
    label: "Tổng quan",
    hint: "Nhịp sàn",
  },
  {
    id: "MODERATION",
    icon: "fa-shield-halved",
    label: "Duyệt tin",
    hint: "An toàn",
  },
  { id: "PRODUCTS", icon: "fa-box-archive", label: "Sản phẩm", hint: "Kho đồ" },
  { id: "CATEGORIES", icon: "fa-layer-group", label: "Danh mục", hint: "Phân loại" },
  { id: "USERS", icon: "fa-users-gear", label: "Sinh viên", hint: "Tài khoản" },
  {
    id: "TRANSACTIONS",
    icon: "fa-handshake",
    label: "Giao dịch",
    hint: "Trao đổi",
  },
  {
    id: "CONVERSATIONS",
    icon: "fa-comments",
    label: "Hội thoại",
    hint: "Tin nhắn",
  },
  {
    id: "REPORTS",
    icon: "fa-triangle-exclamation",
    label: "Báo cáo",
    hint: "Cảnh báo",
  },
  {
    id: "NOTIFICATIONS",
    icon: "fa-bell",
    label: "Thông báo",
    hint: "Broadcast",
  },
  {
    id: "AUDIT_LOGS",
    icon: "fa-clock-rotate-left",
    label: "Nhật ký",
    hint: "Dấu vết",
  },
];

const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("OVERVIEW");
  const activeTabInfo =
    adminTabs.find((tab) => tab.id === activeTab) ?? adminTabs[0];

  if (!currentUser?.roles?.some((role) => [UserRole.ADMIN, "MANAGER"].includes(role as UserRole | "MANAGER"))) {
    return (
      <div className="relative mx-auto mt-12 max-w-xl overflow-hidden rounded-[2rem] border border-rose-100 bg-white p-10 text-center shadow-2xl shadow-rose-100">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
          <i className="fa-solid fa-lock text-2xl" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-400">
          Không đủ quyền
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          Truy cập bị từ chối
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Khu vực này chỉ dành cho quản trị viên hoặc quản lý của S2S.
        </p>
      </div>
    );
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-1.5rem)] max-w-screen-2xl -translate-x-1/2 overflow-hidden rounded-[2.5rem] bg-[#f6f3ea] p-3 pb-24 shadow-[0_30px_90px_rgba(15,23,42,0.10)] sm:w-[calc(100vw-3rem)] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(20,184,166,0.22),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(245,158,11,0.20),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.82),rgba(255,255,255,0.24))]" />
      <div className="pointer-events-none absolute -right-24 top-28 h-72 w-72 rounded-full border-[48px] border-white/45" />

      <section className="relative mb-5 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-900/20 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(20,184,166,0.36),transparent_42%),radial-gradient(circle_at_84%_24%,rgba(251,191,36,0.35),transparent_26%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-teal-100 backdrop-blur">
              <i className="fa-solid fa-graduation-cap" /> S2S campus control
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Bảng điều khiển thân thiện cho admin
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
              Quản lý duyệt tin, người dùng, giao dịch và thông báo trong một
              không gian rộng rãi hơn, dễ đọc hơn và gần gũi với nhịp sống
              campus.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-[1.6rem] border border-white/10 bg-white/10 p-3 backdrop-blur md:min-w-[420px]">
            {["Tin sạch", "Phản hồi nhanh", "An toàn"].map((item, index) => (
              <div
                key={item}
                className="rounded-2xl bg-white px-4 py-4 text-slate-950"
              >
                <p className="text-2xl font-black">0{index + 1}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative flex flex-col gap-5 xl:flex-row">
        <aside className="xl:w-72 2xl:w-80 flex-shrink-0">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3 rounded-[1.5rem] bg-teal-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-200">
                <i className="fa-solid fa-wand-magic-sparkles" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">
                  Đang xem
                </p>
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  {activeTabInfo.label}
                </h2>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
              {adminTabs.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                      isActive
                        ? "bg-slate-950 text-white shadow-xl shadow-slate-900/15"
                        : "bg-white/60 text-slate-500 hover:-translate-y-0.5 hover:bg-white hover:text-teal-700 hover:shadow-lg hover:shadow-slate-900/5"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${isActive ? "bg-teal-400 text-slate-950" : "bg-slate-100 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600"}`}
                    >
                      <i className={`fa-solid ${item.icon} text-sm`} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black uppercase tracking-wider">
                        {item.label}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-[10px] font-bold ${isActive ? "text-slate-300" : "text-slate-400"}`}
                      >
                        {item.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-[2rem] border border-white/70 bg-white/80 p-3 shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:p-5 lg:p-6 2xl:p-8">
          <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                {activeTabInfo.label}
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Sẵn sàng
              vận hành
            </div>
          </div>

          {activeTab === "OVERVIEW" && <AdminOverview />}
          {activeTab === "MODERATION" && <AdminModeration />}
          {activeTab === "PRODUCTS" && <AdminProductManagement />}
          {activeTab === "CATEGORIES" && <AdminCategoryManagement />}
          {activeTab === "USERS" && <AdminUserManagement />}
          {activeTab === "TRANSACTIONS" && <AdminTransactions />}
          {activeTab === "CONVERSATIONS" && <AdminConversations />}
          {activeTab === "NOTIFICATIONS" && <AdminNotifications />}
          {activeTab === "REPORTS" && <AdminReports />}
          {activeTab === "AUDIT_LOGS" && <AdminAuditLogs />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;



