import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  getUnreadCountAPI,
  getUnreadNotificationsCountAPI,
} from "../config/api";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  highlight?: boolean;
  admin?: boolean;
};

const Navbar: React.FC = () => {
  const {
    user,
    isAuthenticated: isLoggedIn,
    logout,
    hasAnyPermission,
    isAdmin,
    isManager,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chatUnreadClientRef = useRef<Client | null>(null);
  const lastUnreadMessageRef = useRef<string | null>(null);

  const canOpenCms = isAdmin || isManager;

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      setNotificationUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const res: any = await getUnreadCountAPI();
        let count = 0;

        if (typeof res === "number") count = res;
        else if (res?.result !== undefined) count = res.result;
        else if (res?.unreadCount !== undefined) count = res.unreadCount;
        else if (res?.count !== undefined) count = res.count;
        else if (res?.data?.result !== undefined) count = res.data.result;
        else if (res?.data?.data?.unreadCount !== undefined)
          count = res.data.data.unreadCount;
        else if (res?.data?.data?.result !== undefined)
          count = res.data.data.result;
        else if (res?.data?.unreadCount !== undefined)
          count = res.data.unreadCount;
        else if (res?.data?.count !== undefined) count = res.data.count;

        setUnreadCount(Number(count) || 0);
      } catch (error) {
        console.error("Lỗi lấy unread count:", error);
      }
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") fetchUnread();
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    window.addEventListener("REFRESH_UNREAD_COUNT", fetchUnread);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("REFRESH_UNREAD_COUNT", fetchUnread);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotificationUnreadCount(0);
      return;
    }

    const fetchNotificationUnread = async () => {
      try {
        const res: any = await getUnreadNotificationsCountAPI();
        let count = 0;

        if (typeof res === "number") count = res;
        else if (res?.count !== undefined) count = res.count;
        else if (res?.unreadCount !== undefined) count = res.unreadCount;
        else if (res?.data?.count !== undefined) count = res.data.count;
        else if (res?.data?.unreadCount !== undefined)
          count = res.data.unreadCount;

        setNotificationUnreadCount(Number(count) || 0);
      } catch (error) {
        console.error("Lỗi lấy notification unread count:", error);
      }
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") fetchNotificationUnread();
    };

    fetchNotificationUnread();
    const interval = setInterval(fetchNotificationUnread, 10000);
    window.addEventListener(
      "REFRESH_NOTIFICATION_UNREAD_COUNT",
      fetchNotificationUnread,
    );
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "REFRESH_NOTIFICATION_UNREAD_COUNT",
        fetchNotificationUnread,
      );
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      chatUnreadClientRef.current?.deactivate();
      chatUnreadClientRef.current = null;
      return;
    }

    const refreshUnread = () =>
      window.dispatchEvent(new Event("REFRESH_UNREAD_COUNT"));
    const handleRealtimeUnread = (message: any) => {
      refreshUnread();

      try {
        const payload = JSON.parse(message.body || "{}");
        const senderId = payload.senderId ?? payload.sender?.id;
        const messageId =
          payload.id ?? payload.messageId ?? payload.createdAt ?? message.body;

        if (
          String(senderId) !== String(user.id) &&
          lastUnreadMessageRef.current !== String(messageId)
        ) {
          lastUnreadMessageRef.current = String(messageId);
          setUnreadCount((count) => count + 1);
        }
      } catch {
        // If the backend sends a non-message event, the API refresh above is enough.
      }
    };
    const socket = new SockJS("http://localhost:8089/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        refreshUnread();
        [
          "/user/queue/messages",
          "/user/queue/conversations",
          `/topic/users/${user.id}/messages`,
          `/topic/users/${user.id}/conversations`,
        ].forEach((destination) => {
          client.subscribe(destination, handleRealtimeUnread);
        });
      },
    });

    client.activate();
    chatUnreadClientRef.current = client;

    return () => {
      client.deactivate();
      if (chatUnreadClientRef.current === client)
        chatUnreadClientRef.current = null;
    };
  }, [isLoggedIn, user?.id]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navItems: NavItem[] = [
    { to: "/", label: "Trang chủ", icon: "fa-house" },
    { to: "/products", label: "Khám phá", icon: "fa-compass" },
    {
      to: "/nearby-products",
      label: "Gần bạn",
      icon: "fa-location-crosshairs",
      highlight: true,
    },
    ...(isLoggedIn
      ? [{ to: "/my-shop", label: "Tin của tôi", icon: "fa-store" }]
      : []),
    ...(canOpenCms
      ? [
          {
            to: "/admin-dashboard",
            label: "CMS",
            icon: "fa-gauge-high",
            admin: true,
          },
        ]
      : []),
  ];

  const isExactOrChild = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const navLinkClassName = (
    { isActive }: { isActive: boolean },
    item: NavItem,
  ) => {
    const active = isActive || isExactOrChild(item.to);
    const base =
      "group relative inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-400/40";

    if (item.highlight) {
      return `${base} ${active ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_16px_38px_rgba(20,184,166,0.30)]" : "bg-emerald-50 text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-cyan-500 hover:text-white hover:shadow-[0_14px_34px_rgba(20,184,166,0.24)]"}`;
    }

    if (item.admin) {
      return `${base} ${active ? "bg-red-600 text-white shadow-[0_14px_30px_rgba(220,38,38,0.24)]" : "text-red-600 hover:bg-red-50 hover:shadow-sm"}`;
    }

    return `${base} ${active ? "bg-slate-950 text-white shadow-[0_16px_35px_rgba(15,23,42,0.22)]" : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)]"}`;
  };

  const navLinks = (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={closeMobileMenu}
          className={(state) => navLinkClassName(state, item)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-current/10 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            <i className={`fa-solid ${item.icon} text-xs`}></i>
          </span>
          <span>{item.label}</span>
          <span className="absolute inset-x-4 -bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-current transition-transform duration-300 group-hover:scale-x-100"></span>
        </NavLink>
      ))}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/85 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-24 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl"></div>
        <div className="absolute right-12 top-0 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8">
        <div className="flex min-h-20 items-center gap-3">
          <button
            type="button"
            aria-label="Mở menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-600 hover:shadow-md xl:hidden"
          >
            <i
              className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars"} text-lg`}
            ></i>
          </button>

          <Link
            to="/"
            onClick={closeMobileMenu}
            className="group flex flex-shrink-0 items-center gap-3 rounded-3xl pr-2 transition-transform hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-teal-700 to-emerald-500 text-white shadow-[0_14px_30px_rgba(15,118,110,0.28)] transition-transform group-hover:rotate-6">
              <i className="fa-solid fa-graduation-cap text-xl"></i>
            </span>
            <span className="leading-none">
              <span className="block text-2xl font-black tracking-tight text-slate-950">
                UniTrade
              </span>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.24em] text-teal-600 sm:block">
                Student market
              </span>
            </span>
          </Link>

          <div className="ml-2 hidden items-center gap-1 rounded-[1.35rem] bg-slate-100/80 p-1.5 xl:flex">
            {navLinks}
          </div>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <div className="relative hidden min-w-[220px] max-w-[340px] flex-shrink overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-amber-50 px-4 py-2.5 shadow-sm lg:flex lg:items-center lg:gap-3 xl:w-[23vw]">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-[0_10px_24px_rgba(13,148,136,0.22)]">
                <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-black text-slate-800">
                  Trao đổi nhanh trong trường
                </span>
                <span className="block truncate text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600">
                  An toàn - tiện lợi
                </span>
              </span>
              <span className="pointer-events-none absolute -right-5 -top-8 h-20 w-20 rounded-full bg-amber-300/30 blur-2xl"></span>
            </div>
            {isLoggedIn && user ? (
              <>
                <Link
                  to="/post"
                  onClick={closeMobileMenu}
                  className={`hidden h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(245,158,11,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(245,158,11,0.34)] sm:inline-flex ${isExactOrChild("/post") ? "bg-slate-950" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span className="hidden lg:inline">Đăng tin</span>
                </Link>

                <div className="flex flex-shrink-0 items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm sm:gap-2">
                  <Link
                    to="/conversations"
                    className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5 ${isExactOrChild("/conversations") || isExactOrChild("/chat") ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-teal-50 hover:text-teal-600"}`}
                  >
                    <i className="fa-solid fa-comment-dots text-lg"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-teal-500 px-1 text-[10px] font-black text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/notifications"
                    aria-label="Thông báo"
                    className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5 ${isExactOrChild("/notifications") ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"}`}
                  >
                    <i className="fa-solid fa-bell text-lg"></i>
                    {notificationUnreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black text-white">
                        {notificationUnreadCount > 99
                          ? "99+"
                          : notificationUnreadCount}
                      </span>
                    )}
                  </Link>

                  <div className="group relative">
                    <button className="flex max-w-[160px] items-center gap-2 rounded-xl p-1 transition-all hover:bg-slate-100 sm:pr-3">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                        }
                        alt="avatar"
                        className="h-8 w-8 flex-shrink-0 rounded-xl bg-slate-100 object-cover ring-2 ring-white"
                      />
                      <span className="hidden min-w-0 truncate text-sm font-bold text-slate-700 md:inline">
                        {user.name}
                      </span>
                      <i className="fa-solid fa-chevron-down hidden text-xs text-slate-400 transition-transform group-hover:rotate-180 sm:inline"></i>
                    </button>

                    <div className="invisible absolute right-0 mt-3 w-56 translate-y-2 rounded-3xl border border-slate-100 bg-white p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                      >
                        <i className="fa-solid fa-user-gear w-5"></i>
                        <span>Hồ sơ cá nhân</span>
                      </Link>
                      {canOpenCms && (
                        <Link
                          to="/admin-dashboard"
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                        >
                          <i className="fa-solid fa-gauge-high w-5"></i>
                          <span>CMS</span>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
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
                className={`flex-shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition-all hover:-translate-y-0.5 sm:px-6 ${isExactOrChild("/login") ? "bg-slate-950 text-white" : "bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white hover:shadow-[0_14px_30px_rgba(13,148,136,0.22)]"}`}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>

        <div
          className={`grid transition-all duration-300 xl:hidden ${isMobileMenuOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="mt-1 rounded-[1.75rem] border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-900/5">
              <div className="grid gap-2 sm:grid-cols-2">{navLinks}</div>
              <div className="relative mt-3 lg:hidden">
                <input
                  type="text"
                  placeholder="Tìm giáo trình, discussion..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              </div>
              {isLoggedIn && (
                <Link
                  to="/post"
                  onClick={closeMobileMenu}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 sm:hidden"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Đăng tin</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
