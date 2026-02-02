import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Đang tải…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
//giới hạn theo vai trò
// export function RoleRoute({ roles = [], children }) {
//   const { user } = useAuth();         // user.roles = ["ADMIN", ...]
//   if (!user) return <Navigate to="/login" replace />;
//   const ok = roles.length === 0 || roles.some(r => user.roles.includes(r));
//   return ok ? children : <Navigate to="/403" replace />;
// } 
