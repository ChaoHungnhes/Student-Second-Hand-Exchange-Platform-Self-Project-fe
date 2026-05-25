import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyStatsAPI, updatePasswordAPI } from "../config/api";
import { UserStats } from "../types/index";

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [name, setName] = useState(user?.name || "");
  const [stats, setStats] = useState<UserStats>({ totalProducts: 0, soldProducts: 0, activeProducts: 0 });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res: any = await getMyStatsAPI();
        if (res) setStats(res);
      } catch (error) {
        console.error("Lỗi lấy thống kê", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  if (!user) {
    return (
      <div className="relative -mx-4 -mt-8 flex min-h-[520px] items-center justify-center bg-slate-50 px-4 sm:-mx-6 lg:-mx-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
            <i className="fa-solid fa-lock text-2xl"></i>
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-950">Bạn cần đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-500">Vui lòng đăng nhập để xem hồ sơ.</p>
        </div>
      </div>
    );
  }

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: "error", text: "Tên không được để trống" });
      return;
    }

    try {
      await updateUserProfile(name);
      setMessage({ type: "success", text: "Cập nhật tên thành công!" });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: "error", text: "Cập nhật thất bại. Vui lòng thử lại." });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới không khớp" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải từ 6 ký tự" });
      return;
    }

    try {
      await updatePasswordAPI({ oldPassWord: currentPassword, newPassWord: newPassword });
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.log(error);
      setMessage({ type: "error", text: "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ nhé." });
    }
  };

  const statCards = [
    { label: "Tổng tin đăng", value: stats.totalProducts, icon: "fa-box-open", color: "text-slate-950", bg: "bg-slate-100" },
    { label: "Đã giao dịch", value: stats.soldProducts, icon: "fa-circle-check", color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Đang rao bán", value: stats.activeProducts, icon: "fa-bolt", color: "text-teal-700", bg: "bg-teal-50" },
  ];

  return (
    <div className="relative -mx-4 -mt-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.34),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#f8fafc_100%)] px-4 pb-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute right-0 top-16 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-24 top-[430px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-6xl space-y-8 pt-8">
        {message && (
          <div className={`rounded-2xl border p-4 shadow-sm ${message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}>
            <div className="flex items-center gap-3 text-sm font-black">
              <i className={`fa-solid ${message.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}></i>
              {message.text}
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.28),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(251,191,36,0.16),transparent_24%)]"></div>

            <div className="relative z-10">
              <span className="inline-flex rounded-full bg-gradient-to-r from-teal-300 to-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-950">
                Hồ sơ sinh viên
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Quản lý danh tính và độ tin cậy của bạn.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Cập nhật thông tin cá nhân, theo dõi hoạt động giao dịch và bảo vệ tài khoản UniTrade của bạn.
              </p>
            </div>

            <div className="relative z-10 rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="h-20 w-20 rounded-3xl bg-white object-cover ring-2 ring-white/30"
                  />
                  <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 ${user.status === "ACTIVE" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-black">{user.name}</h2>
                  <p className="truncate text-sm font-semibold text-slate-300">{user.email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-3 py-1.5 text-xs font-black text-amber-100">
                      <i className="fa-solid fa-star"></i>
                      {user.rating ? user.rating.toFixed(1) : "0.0"}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-teal-100">
                      {user.roles && user.roles.length > 0 ? user.roles[0] : "MEMBER"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.5fr]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <i className="fa-solid fa-chart-simple"></i>
                </span>
                <div>
                  <h3 className="font-black text-slate-950">Hoạt động giao dịch</h3>
                  <p className="text-xs font-semibold text-slate-400">Tổng quan gian hàng</p>
                </div>
              </div>

              {loadingStats ? (
                <div className="rounded-2xl bg-slate-50 py-8 text-center text-sm font-bold text-slate-400">
                  <i className="fa-solid fa-circle-notch animate-spin mr-2 text-teal-500"></i>
                  Đang tải thống kê...
                </div>
              ) : (
                <div className="grid gap-3">
                  {statCards.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}>
                          <i className={`fa-solid ${item.icon}`}></i>
                        </span>
                        <span className="text-sm font-bold text-slate-500">{item.label}</span>
                      </div>
                      <span className={`text-2xl font-black ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-teal-100 bg-teal-50/80 p-5 shadow-sm backdrop-blur-md">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <i className="fa-solid fa-shield-heart"></i>
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-950">Mẹo an toàn</h3>
                  <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                    Dùng mật khẩu mạnh và không chia sẻ mã xác thực hoặc thông tin tài khoản cho người khác.
                  </p>
                </div>
              </div>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="font-black text-slate-950">Thông tin cơ bản</h3>
                  <p className="text-xs font-semibold text-slate-400">Thông tin hiển thị trong cộng đồng</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-2 text-sm font-black text-teal-700 transition-all hover:-translate-y-0.5 hover:bg-teal-100"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    Chỉnh sửa
                  </button>
                )}
              </div>

              <div className="p-5 sm:p-6">
                {isEditing ? (
                  <form onSubmit={handleUpdateInfo} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Họ và tên</label>
                      <input
                        type="text"
                        aria-label="Họ và tên"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setName(user.name);
                        }}
                        className="rounded-2xl px-4 py-2 text-sm font-black text-slate-500 transition-colors hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-2 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700">
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { label: "Tên hiển thị", value: user.name, icon: "fa-id-badge" },
                      { label: "Trạng thái tài khoản", value: user.status, icon: "fa-signal", active: user.status === "ACTIVE" },
                      { label: "Ngày tham gia", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Chưa cập nhật", icon: "fa-calendar-days" },
                      { label: "ID sinh viên", value: `#${user.id}`, icon: "fa-hashtag", mono: true },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          <i className={`fa-solid ${item.icon} text-teal-600`}></i>
                          {item.label}
                        </div>
                        <p className={`font-black text-slate-900 ${item.mono ? "inline-block rounded-xl bg-white px-3 py-1 font-mono text-xs" : ""}`}>
                          {item.active !== undefined && <span className={`mr-2 inline-block h-2 w-2 rounded-full ${item.active ? "bg-emerald-500" : "bg-amber-500"}`}></span>}
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-md">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h3 className="font-black text-slate-950">Bảo mật & mật khẩu</h3>
                <p className="text-xs font-semibold text-slate-400">Cập nhật mật khẩu để bảo vệ tài khoản</p>
              </div>
              <div className="p-5 sm:p-6">
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Mật khẩu mới</label>
                      <input
                        type="password"
                        placeholder="Tối thiểu 6 ký tự"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700">
                      <i className="fa-solid fa-key"></i>
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
