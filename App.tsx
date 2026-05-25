// App.tsx
import React, { Suspense, lazy } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

const Home = lazy(() => import("./pages/Home"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MyShopPage = lazy(() => import("./pages/MyShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const AllProductsPage = lazy(() => import("./pages/AllProductsPage"));
const PostProductPage = lazy(() => import("./pages/PostProductPage"));
const ConversationPage = lazy(() => import("./pages/ConversationPage"));
const ConversationListPage = lazy(() => import("./pages/ConversationListPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotificationDetailPage = lazy(
  () => import("./pages/NotificationDetailPage"),
);
const NearbyProductsPage = lazy(() => import("./pages/NearbyProductsPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const OAuth2RedirectPage = lazy(() => import("./pages/OAuth2RedirectPage"));
const ChatBotWidget = lazy(() => import("./components/ChatBotWidget"));

const PageLoader: React.FC = () => (
  <div className="flex min-h-[360px] items-center justify-center">
    <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-6 text-center shadow-xl shadow-slate-900/5">
      <i className="fa-solid fa-circle-notch animate-spin text-3xl text-teal-500"></i>
      <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
        Ðang t?i
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<AuthPage />} />
                <Route
                  path="/oauth2/redirect"
                  element={<OAuth2RedirectPage />}
                />
                <Route path="/products" element={<AllProductsPage />} />
                <Route
                  path="/nearby-products"
                  element={<NearbyProductsPage />}
                />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                {/* Private Routes (Ph?i dang nh?p m?i vào du?c) */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/:userId"
                  element={
                    <ProtectedRoute>
                      <UserProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-shop"
                  element={
                    <ProtectedRoute>
                      <MyShopPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/chat/:conversationId"
                  element={
                    <ProtectedRoute>
                      <ConversationPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/conversations"
                  element={
                    <ProtectedRoute>
                      <ConversationListPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/notifications/:id"
                  element={
                    <ProtectedRoute>
                      <NotificationDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/post"
                  element={
                    <ProtectedRoute>
                      <PostProductPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleRoute allowed={["ADMIN", "MANAGER"]}>
                        <AdminDashboardPage />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <Suspense fallback={null}>
            <ChatBotWidget />
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

