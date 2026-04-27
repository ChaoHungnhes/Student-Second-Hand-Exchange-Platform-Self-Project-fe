import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUnreadCountAPI } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { user, isAuthenticated: isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.roles?.[0] === UserRole.ADMIN;

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const res: any = await getUnreadCountAPI();
        let count = 0;

        if (res?.unreadCount !== undefined) {
          count = res.unreadCount;
        } else if (res?.data?.data?.unreadCount !== undefined) {
          count = res.data.data.unreadCount;
        } else if (res?.data?.unreadCount !== undefined) {
          count = res.data.unreadCount;
        }

        setUnreadCount(count);
      } catch (error) {
        console.error('Lỗi lấy unread count:', error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const nearbyLinkClassName =
    'group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(6,182,212,0.24)]';

  const navLinks = (
    <>
      <Link
        to="/"
        onClick={closeMobileMenu}
        className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap"
      >
        Trang chủ
      </Link>

      <Link
        to="/products"
        onClick={closeMobileMenu}
        className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap"
      >
        Khám phá
      </Link>

      <Link to="/nearby-products" onClick={closeMobileMenu} className={nearbyLinkClassName}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <i className="fa-solid fa-location-crosshairs text-xs"></i>
        </span>
        <span>Sản phẩm ở gần bạn</span>
        <span className="hidden 2xl:inline-flex h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse"></span>
      </Link>

      {isLoggedIn && (
        <Link
          to="/my-shop"
          onClick={closeMobileMenu}
          className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap"
        >
          Tin của tôi
        </Link>
      )}

      {isAdmin && (
        <Link
          to="/admin-dashboard"
          onClick={closeMobileMenu}
          className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md font-bold text-sm whitespace-nowrap flex items-center gap-2"
        >
          <i className="fa-solid fa-gauge-high"></i>
          <span>Admin Dashboard</span>
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <button
              type="button"
              aria-label="Mở menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors flex-shrink-0"
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
            </button>

            <Link
              to="/"
              onClick={closeMobileMenu}
              className="text-2xl font-bold text-indigo-600 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span>UniTrade</span>
            </Link>

            <div className="hidden xl:flex items-center gap-2">{navLinks}</div>
          </div>

          <div className="ml-auto flex items-center justify-end gap-2 sm:gap-3 min-w-0">
            <div className="relative hidden lg:block flex-shrink min-w-[220px] max-w-[320px] w-[24vw]">
              <input
                type="text"
                placeholder="Tìm giáo trình, đồ điện tử..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>

            {isLoggedIn && user ? (
              <>
                <Link
                  to="/post"
                  className="bg-indigo-600 text-white h-11 px-4 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors hidden sm:inline-flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span className="hidden lg:inline">Đăng tin</span>
                </Link>

                <div className="flex items-center gap-1 sm:gap-2 lg:border-l lg:pl-3 border-gray-200 flex-shrink-0">
                  <Link
                    to="/conversations"
                    className="relative h-10 w-10 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                  >
                    <i className="fa-solid fa-comment-dots text-xl"></i>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-indigo-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  <button
                    type="button"
                    aria-label="Thông báo"
                    className="relative h-10 w-10 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                  >
                    <i className="fa-solid fa-bell text-xl"></i>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </button>

                  <div className="group relative">
                    <button className="flex items-center gap-2 border border-gray-200 p-1 sm:pr-3 rounded-full hover:shadow-sm transition-shadow max-w-[152px]">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                      />
                      <span className="text-sm font-semibold text-gray-700 hidden md:inline min-w-0 truncate">
                        {user.name}
                      </span>
                      <i className="fa-solid fa-chevron-down text-xs text-gray-400 hidden sm:inline"></i>
                    </button>

                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
                      <Link
                        to="/profile"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-user-gear text-indigo-600 w-5"></i>
                          <span>Hồ sơ cá nhân</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin-dashboard"
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                        >
                          <i className="fa-solid fa-gauge-high w-5"></i>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-right-from-bracket w-5"></i>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="bg-indigo-50 text-indigo-600 px-4 sm:px-6 py-2 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors border border-indigo-100 whitespace-nowrap flex-shrink-0"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-100 py-3">
            <div className="flex flex-col gap-2">
              {navLinks}
              <div className="relative mt-2 lg:hidden">
                <input
                  type="text"
                  placeholder="Tìm giáo trình, đồ điện tử..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
              {isLoggedIn && (
                <Link
                  to="/post"
                  onClick={closeMobileMenu}
                  className="sm:hidden mt-2 bg-indigo-600 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Đăng tin</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
