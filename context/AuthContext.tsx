import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
// Đảm bảo bạn đã update file types/index.ts như hướng dẫn trước
import { User, LoginResponse, IntrospectResponse } from "../types/index"; 
import { loginAPI, logoutAPI, introspectAPI, getMyInfoAPI, updateProfileAPI } from "../config/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUserProfile: (name: string) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isAdminOrManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeJwtAuthorities = (token?: string): string[] => {
  if (!token || token.split(".").length < 2) return [];
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const raw = payload.scope ?? payload.scopes ?? payload.authorities ?? payload.permissions ?? payload.authority;
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "string") return raw.split(/\s+/).filter(Boolean);
  } catch (error) {
    console.warn("Không decode được JWT permissions", error);
  }
  return [];
};

const normalizeAuthorities = (data: any): string[] => {
  const raw = data.authorities ?? data.permissions ?? data.scope ?? data.scopes ?? [];
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\s+/) : [];
  return Array.from(new Set(list.map(String).filter(Boolean)));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- HÀM CHUẨN HÓA DỮ LIỆU USER ---
  // Giúp convert dữ liệu từ API (UserDTO) sang định dạng chuẩn của Frontend (User Interface)
  const parseUser = (data: any, emailInput?: string, token?: string): User => {
    // 1. Xử lý Role: Backend có thể trả về "role": "ADMIN" (string) -> đổi thành ["ADMIN"] (array)
    const rawRole = data.role || data.roles;
    const tokenAuthorities = decodeJwtAuthorities(token || data.token || data.auth_token);
    const authorities = Array.from(new Set([...normalizeAuthorities(data), ...tokenAuthorities]));
    const roleAuthorities = authorities
      .filter((item) => item.startsWith("ROLE_"))
      .map((item) => item.replace(/^ROLE_/, ""));
    const rawRoles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];
    const rolesArray = Array.from(new Set([...rawRoles, ...roleAuthorities].map(String)));
    const permissions = authorities.filter((item) => item.includes(":")); 

    // 2. Trả về object User đầy đủ
    return {
      id: data.id,
      name: data.name,
      email: data.email || emailInput || "",
      role: rolesArray[0],
      roles: rolesArray, // Luôn là mảng string
      authorities,
      permissions,
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
      status: data.status,
      rating: data.rating,
      createdAt: data.createdAt,
      totalProducts: data.totalProducts,
      soldProducts: data.soldProducts,
      activeProducts: data.activeProducts
    };
  };

  // --- 1. KHỞI TẠO: CHECK LOGIN KHI F5 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("[AuthContext] Bắt đầu kiểm tra login...");
        
        // Tạo Promise timeout 3s để tránh treo mãi
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Introspect timeout")), 1000)
        );
        
        const introRes = await Promise.race([
          introspectAPI() as unknown as Promise<IntrospectResponse>,
          timeoutPromise
        ]) as unknown as IntrospectResponse;
        
        console.log("[AuthContext] introspectAPI result:", introRes);
        
        if (introRes?.valid) {
            // Token còn hạn -> Gọi API lấy thông tin chi tiết user
            try {
                const infoRes = await getMyInfoAPI();
                console.log("[AuthContext] getMyInfoAPI result:", infoRes);
                if(infoRes) {
                    const userData = parseUser(infoRes, undefined, localStorage.getItem("auth_token") || undefined);
                    setUser(userData);
                    // Cập nhật lại cache local để dự phòng
                    localStorage.setItem("auth_user", JSON.stringify(userData));
                    return; 
                }
            } catch (err) {
                console.warn("[AuthContext] Mạng chậm hoặc lỗi lấy info, dùng tạm cache cũ", err);
            }
            
            // Fallback: Nếu API getMyInfo lỗi, lấy tạm từ localStorage
            const cachedStr = localStorage.getItem("auth_user");
            if (cachedStr) setUser(JSON.parse(cachedStr));
        } else {
            // Token hết hạn
            console.log("[AuthContext] Token hết hạn hoặc không hợp lệ");
            handleCleanup();
        }
      } catch (error) {
        console.error("[AuthContext] Lỗi initAuth:", error);
        handleCleanup();
      } finally {
        console.log("[AuthContext] Hoàn thành kiểm tra, set loading=false");
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleCleanup = () => {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const refreshCurrentUser = async () => {
    const fullUserInfo = await getMyInfoAPI();
    const userData = parseUser(fullUserInfo, undefined, localStorage.getItem("auth_token") || undefined);
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  // --- 2. HÀM LOGIN ---
  const login = async ({ email, password }: any) => {
    const res = await loginAPI({ email, password }) as unknown as LoginResponse;
    const token = res?.token || (res as any)?.auth_token;
    if (res && res.authenticated) {
      try {
        if (token) localStorage.setItem("auth_token", token);
        await refreshCurrentUser();
        
      } catch (error) {
        console.warn("Không lấy được full info sau login, dùng tạm info cơ bản");
        const basicUser = parseUser(res, email, token);
        setUser(basicUser);
        localStorage.setItem("auth_user", JSON.stringify(basicUser));
      }
    } else {
      throw new Error("Đăng nhập thất bại");
    }
  };

  // --- 3. HÀM LOGOUT ---
  const logout = async () => {
    try { 
        await logoutAPI(); 
    } catch (e) {
        console.error("Logout error", e);
    } finally {
      handleCleanup();
    }
  };

  // --- 4. HÀM UPDATE PROFILE (Đổi tên hiển thị ngay lập tức) ---
  const updateUserProfile = async (newName: string) => {
    // Gọi API update
    const res: any = await updateProfileAPI({ name: newName });
    
    // Cập nhật State và LocalStorage để Navbar hiển thị tên mới ngay
    if (user) {
        // Backend trả về object user mới sau khi update, ta parse lại cho chuẩn
        const updatedUser = parseUser(res, user.email);
        // Giữ lại các trường cũ nếu API trả về thiếu, ghi đè trường mới
        const mergedUser = { ...user, ...updatedUser };
        
        setUser(mergedUser);
        localStorage.setItem("auth_user", JSON.stringify(mergedUser));
    }
  };
  const hasRole = (role: string) => user?.roles?.includes(role) ?? false;
  const hasAnyRole = (roles: string[]) => roles.some(hasRole);
  const hasPermission = (permission: string) => hasRole("ADMIN") || (user?.permissions?.includes(permission) ?? user?.authorities?.includes(permission) ?? false);
  const hasAnyPermission = (permissions: string[]) => permissions.some(hasPermission);
  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");
  const isUser = hasRole("USER");
  const isAdminOrManager = isAdmin || isManager;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, updateUserProfile, refreshCurrentUser, hasRole, hasAnyRole, hasPermission, hasAnyPermission, isAdmin, isManager, isUser, isAdminOrManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};




