// App.tsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import MyShopPage from './pages/MyShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AllProductsPage from './pages/AllProductsPage';
import PostProductPage from './pages/PostProductPage';
import ConversationPage from './pages/ConversationPage';
import ConversationListPage from './pages/ConversationListPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/products" element={<AllProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />

              {/* Private Routes (Phải đăng nhập mới vào được) */}
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/user/:userId" element={
                <ProtectedRoute><UserProfilePage /></ProtectedRoute> 
              } />
              <Route path="/my-shop" element={
                <ProtectedRoute><MyShopPage /></ProtectedRoute>
              } /> 

              <Route path="/chat/:conversationId" element={
                <ProtectedRoute><ConversationPage /></ProtectedRoute>
              } />

              <Route path="/conversations" element={
                <ProtectedRoute><ConversationListPage /></ProtectedRoute>
              } />

              <Route path="/post" element={
                <ProtectedRoute><PostProductPage /></ProtectedRoute>
              } />
            
              <Route path="/admin-dashboard" element={
  <ProtectedRoute>
    <RoleRoute allowed={['ADMIN']}>
      <AdminDashboardPage />
    </RoleRoute>
  </ProtectedRoute>
} />

            </Routes>
          </main>
          
          <footer className="bg-white border-t border-gray-200 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-4">UniTrade</div>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                Nền tảng trao đổi đồ cũ dành riêng cho sinh viên Việt Nam. An toàn, minh bạch và thân thiện với môi trường.
              </p>
              <div className="flex justify-center space-x-6 text-gray-400 text-lg mb-8">
                <i className="fa-brands fa-facebook hover:text-indigo-600 cursor-pointer"></i>
                <i className="fa-brands fa-instagram hover:text-indigo-600 cursor-pointer"></i>
                <i className="fa-brands fa-twitter hover:text-indigo-600 cursor-pointer"></i>
                <i className="fa-brands fa-discord hover:text-indigo-600 cursor-pointer"></i>
              </div>
              <div className="text-xs text-gray-400 border-t border-gray-100 pt-8">
                &copy; 2024 UniTrade. Bản quyền thuộc về đội ngũ phát triển sinh viên.
              </div>
            </div>
          </footer>

          <AIAssistant />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
