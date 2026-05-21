import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuth2RedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCurrentUser } = useAuth();
  const [message, setMessage] = useState('Đang hoàn tất đăng nhập Google...');

  useEffect(() => {
    const completeOAuthLogin = async () => {
      const authenticated = searchParams.get('authenticated');
      const error = searchParams.get('error') || searchParams.get('message');

      if (error || authenticated === 'false') {
        setMessage('Đăng nhập Google thất bại. Đang chuyển về trang đăng nhập...');
        setTimeout(() => navigate('/login', { replace: true }), 1200);
        return;
      }

      try {
        await refreshCurrentUser();
        navigate('/', { replace: true });
      } catch (err) {
        console.error('OAuth2 callback error', err);
        setMessage('Không thể lấy thông tin tài khoản. Vui lòng thử lại.');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    };

    completeOAuthLogin();
  }, [navigate, refreshCurrentUser, searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500 shadow-sm">
          <i className="fa-brands fa-google"></i>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Google OAuth</h1>
        <p className="mt-3 text-sm font-semibold text-gray-500">{message}</p>
        <div className="mt-6 flex justify-center">
          <i className="fa-solid fa-circle-notch animate-spin text-2xl text-indigo-600"></i>
        </div>
      </div>
    </div>
  );
};

export default OAuth2RedirectPage;
