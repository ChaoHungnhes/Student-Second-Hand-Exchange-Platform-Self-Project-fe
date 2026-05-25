// C:\Users\ADMIN\Desktop\S2SFE\components\RoleRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allowed = [], children }) {
  const { user, loading } = useAuth();

  // THÊM DÒNG NÀY: Đợi load xong thông tin User mới kiểm tra quyền
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch animate-spin text-3xl text-indigo-500"></i>
        <span className="ml-3 font-bold text-gray-500">Đang kiểm tra quyền quản trị...</span>
      </div>
    );
  }

  // Debug để xem tại sao sai
  console.log("Check RoleRoute:", { 
    currentUserRoles: user?.roles, 
    allowedRoles: allowed 
  });

  const ok = user?.roles?.some(r => allowed.includes(r)) ?? false;

  if (!ok) {
    console.warn("Truy cập bị từ chối: User không có quyền phù hợp");
    return <Navigate to="/" replace />; // Hoặc trang /403 nếu đã tạo
  }

  return children;
}