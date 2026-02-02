import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCountAPI } from '../config/api'; // Nhớ import API
import { 
UserRole 
} from '../types';

const Navbar: React.FC = () => {
  const { user, isAuthenticated: isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  
  // State lưu số tin nhắn chưa đọc
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch số tin nhắn chưa đọc khi login thành công
  // Fetch số tin nhắn chưa đọc khi login thành công
  useEffect(() => {
    if (isLoggedIn) {
      const fetchUnread = async () => {
        try {
          const res: any = await getUnreadCountAPI();
          
          console.log("Unread API Response:", res);

          let count = 0;

          // --- SỬA ĐOẠN NÀY ---
          
          // TRƯỜNG HỢP 0: res chính là object { unreadCount: 1 } (Dựa theo log mới nhất của bạn)
          if (res?.unreadCount !== undefined) {
             count = res.unreadCount;
          }
          // TRƯỜNG HỢP 1: Axios mặc định (res.data.data.unreadCount)
          else if (res?.data?.data?.unreadCount !== undefined) {
            count = res.data.data.unreadCount;
          } 
          // TRƯỜNG HỢP 2: Interceptor trả về res.data (res.data.unreadCount)
          else if (res?.data?.unreadCount !== undefined) {
            count = res.data.unreadCount;
          }
          
          // --------------------

          console.log("Parsed Unread Count:", count);
          setUnreadCount(count);
        } catch (error) {
          console.error("Lỗi lấy unread count:", error);
        }
      };

      fetchUnread();
      
      // Auto refresh mỗi 30s
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Menu trái giữ nguyên */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <i className="fa-solid fa-graduation-cap"></i>
              <span>UniTrade</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium text-sm">Trang chủ</Link>
              <Link to="/products" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium text-sm">Khám phá</Link>
              {isLoggedIn && (
                <Link to="/my-shop" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium text-sm">Tin của tôi</Link>
              )}
              {user?.roles[0] === UserRole.ADMIN && (
                        <Link to="/admin-dashboard" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold">
                          <i className="fa-solid fa-gauge-high"></i> Admin Dashboard
                        </Link>
                      )}
            </div>
          </div>
          
          {/* Menu phải */}
          <div className="flex items-center gap-4">
            {/* Search bar giữ nguyên */}
            <div className="relative hidden lg:block">
              <input 
                type="text" 
                placeholder="Tìm giáo trình, đồ điện tử..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            
            {isLoggedIn && user ? (
              <>
                <Link to="/post" className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors hidden sm:block">
                  <i className="fa-solid fa-plus mr-2"></i> Đăng tin
                </Link>
                
                <div className="flex items-center gap-1 sm:gap-3 border-l pl-4 border-gray-200">
                  
                  {/* --- ICON TIN NHẮN (Đã cập nhật logic API) --- */}
                  <Link to="/conversations" className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
                    <i className="fa-solid fa-comment-dots text-xl"></i>
                    
                    {/* Chỉ hiện badge khi số lượng > 0 */}
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* --- ICON THÔNG BÁO --- */}
                  <button 
                    aria-label="Thông báo"
                    className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
                    <i className="fa-solid fa-bell text-xl"></i>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>

                  {/* User Dropdown giữ nguyên */}
                  <div className="group relative">
                    <button className="flex items-center gap-2 border border-gray-200 p-1 pr-3 rounded-full hover:shadow-sm transition-shadow">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                        alt="avatar" 
                        className="w-8 h-8 rounded-full object-cover bg-gray-100" 
                      />
                      <span className="text-sm font-semibold text-gray-700 hidden sm:inline max-w-[100px] truncate">
                        {user.name}
                      </span>
                      <i className="fa-solid fa-chevron-down text-xs text-gray-400"></i>
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
                      <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <i className="fa-solid fa-user-gear text-indigo-600 w-5"></i> Hồ sơ cá nhân
                      </Link>
                      {user?.roles[0] === UserRole.ADMIN && (
                        <Link to="/admin-dashboard" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold">
                          <i className="fa-solid fa-gauge-high"></i> Admin Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <i className="fa-solid fa-right-from-bracket w-5"></i> Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors border border-indigo-100">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;