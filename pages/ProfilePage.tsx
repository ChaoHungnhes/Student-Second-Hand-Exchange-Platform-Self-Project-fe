import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyStatsAPI, updatePasswordAPI } from '../config/api';
import { UserStats } from '../types/index';

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  
  // State UI
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // State Data
  const [name, setName] = useState(user?.name || '');
  const [stats, setStats] = useState<UserStats>({ totalProducts: 0, soldProducts: 0, activeProducts: 0 });
  
  // State Password Form
  const [currentPassword, setCurrentPassword] = useState(''); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State Message
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. Fetch Stats khi vào trang
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res: any = await getMyStatsAPI();
        if (res) {
            setStats(res);
        }
      } catch (error) {
        console.error("Lỗi lấy thống kê", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // Update lại name state nếu user context thay đổi (trường hợp F5)
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  if (!user) return <div className="p-20 text-center">Vui lòng đăng nhập để xem hồ sơ.</div>;

  // 2. Xử lý cập nhật tên
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Tên không được để trống' });
      return;
    }

    try {
      await updateUserProfile(name); // Gọi hàm từ Context
      setMessage({ type: 'success', text: 'Cập nhật tên thành công!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Cập nhật thất bại. Vui lòng thử lại.' });
    }
  };

  // 3. Xử lý đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự' });
      return;
    }

    try {
      // Gọi API đổi pass
      // Lưu ý key: oldPassWord (chữ W hoa theo API bạn gửi)
      await updatePasswordAPI({
        oldPassWord: currentPassword,
        newPassWord: newPassword
      });

      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
        // Backend có thể trả về lỗi 400 nếu sai pass cũ
        // Check log để biết chính xác cấu trúc lỗi trả về từ axios-customize
        console.log(error);
        setMessage({ type: 'error', text: 'Đổi mật khẩu thất bại (Sai mật khẩu cũ?)' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Thông báo lỗi/thành công */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Avatar & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="relative inline-block mb-4">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                alt={user.name} 
                className="w-32 h-32 rounded-full border-4 border-indigo-50 mx-auto shadow-sm" 
              />
              <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{user.email}</p>
            <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold mb-6">
              <i className="fa-solid fa-star"></i>
              <span>{user.rating ? user.rating.toFixed(1) : '0.0'}</span>
              <span className="text-gray-400 font-normal text-xs ml-1">(Đánh giá)</span>
            </div>
            
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              {user.roles && user.roles.length > 0 ? user.roles[0] : 'MEMBER'}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-simple text-indigo-600"></i>
              Hoạt động giao dịch
            </h3>
            {loadingStats ? (
                <div className="text-center text-gray-400 text-sm py-4">Đang tải thống kê...</div>
            ) : (
                <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Tổng sản phẩm đã đăng</span>
                    <span className="font-bold text-gray-900">{stats.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Đã giao dịch thành công</span>
                    <span className="font-bold text-green-600">{stats.soldProducts}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Đang rao bán</span>
                    <span className="font-bold text-indigo-600">{stats.activeProducts}</span>
                </div>
                </div>
            )}
          </div>
        </div>

        {/* Right Side: Information & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Thông tin cơ bản</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center gap-1"
                >
                  <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                </button>
              )}
            </div>
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input 
                      type="text" 
                      aria-label="Họ và tên"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button"
                      onClick={() => { setIsEditing(false); setName(user.name); }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tên hiển thị</p>
                      <p className="text-gray-900 font-medium">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trạng thái tài khoản</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <p className="text-gray-900 font-medium">{user.status}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ngày tham gia</p>
                      <p className="text-gray-900 font-medium">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ID Sinh viên</p>
                      <p className="text-gray-900 font-medium text-xs font-mono bg-gray-100 p-1 rounded inline-block">#{user.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="font-bold text-gray-900">Bảo mật & Mật khẩu</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="px-6 py-2 text-sm font-bold text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;