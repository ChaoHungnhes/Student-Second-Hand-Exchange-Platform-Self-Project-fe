import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import thêm API mới
import { registerAPI, verifyEmailAPI, forgotPasswordAPI, resetPasswordAPI } from '../config/api';
import { getApiErrorMessage, showApiErrorAlert } from '../utils/apiError';

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  
  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 phút

  const { login } = useAuth();
  const navigate = useNavigate();

  // Đếm ngược thời gian OTP
  useEffect(() => {
    let interval: any;
    if ((mode === 'verify' || mode === 'reset') && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  // --- XỬ LÝ SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. ĐĂNG NHẬP
    if (mode === 'login') {
      if (!validateEmail(email)) return setError('Email không hợp lệ');
      if (password.length < 6) return setError('Mật khẩu phải từ 6 ký tự');
      
      setLoading(true);
      try {
        await login({ email, password });
        navigate('/');
      } catch (err) {
        const message = getApiErrorMessage(err, 'Email hoặc mật khẩu không chính xác');
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    } 
    
    // 2. ĐĂNG KÝ
    else if (mode === 'register') {
      if (!name) return setError('Vui lòng nhập tên');
      if (!validateEmail(email)) return setError('Email không hợp lệ');
      if (password.length < 6) return setError('Mật khẩu quá ngắn');
      
      setLoading(true);
      try {
        await registerAPI({ name, email, password });
        setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để lấy OTP.');
        setMode('verify');
        setTimer(300);
      } catch (err) {
        const message = getApiErrorMessage(err, 'Đăng ký thất bại. Email có thể đã tồn tại.');
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    } 
    
    // 3. QUÊN MẬT KHẨU (Gửi OTP)
    else if (mode === 'forgot') {
      if (!validateEmail(email)) return setError('Vui lòng nhập email hợp lệ');
      
      setLoading(true);
      try {
        // Gọi API forgot-password
        await forgotPasswordAPI(email);
        
        setSuccess('Mã OTP đã được gửi về email của bạn.');
        setMode('reset');
        setTimer(300);
      } catch (err) {
        const message = getApiErrorMessage(err, 'Không tìm thấy email này trong hệ thống.');
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    }

    // 4. ĐẶT LẠI MẬT KHẨU (Reset Password)
    else if (mode === 'reset') {
      if (otp.length !== 6) return setError('Mã xác nhận gồm 6 chữ số');
      if (newPassword.length < 6) return setError('Mật khẩu mới phải từ 6 ký tự');
      if (newPassword !== confirmPassword) return setError('Mật khẩu xác nhận không khớp');
      
      setLoading(true);
      try {
        // Gọi API Reset
        await resetPasswordAPI({
            email,
            otp,
            newPassword
        });

        setSuccess('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
        
        // Chờ 1.5s để người dùng đọc thông báo rồi chuyển trang
        setTimeout(() => {
            setMode('login');
            // Reset form
            setPassword(''); 
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        }, 1500);

      } catch (err) {
        const message = getApiErrorMessage(err, 'Mã OTP không đúng hoặc đã hết hạn.');
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    }

    // 5. XÁC THỰC EMAIL (Sau khi đăng ký)
    else if (mode === 'verify') {
      if (otp.length !== 6) return setError('Mã xác nhận gồm 6 chữ số');
      
      setLoading(true);
      try {
        await verifyEmailAPI(email, otp);
        setSuccess('Xác thực thành công! Đang đăng nhập...');
        
        // Tự động login luôn sau khi verify (nếu muốn)
        // Hoặc chuyển về trang login bắt nhập lại pass
        setMode('login'); 
        setPassword('');
        setOtp('');
      } catch (err) {
        const message = getApiErrorMessage(err, 'Mã xác nhận không chính xác.');
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case 'login': return 'Đăng nhập UniTrade';
      case 'register': return 'Tạo tài khoản mới';
      case 'forgot': return 'Quên mật khẩu?';
      case 'reset': return 'Đặt lại mật khẩu';
      case 'verify': return 'Xác thực Email';
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
            <i className={`fa-solid ${mode === 'forgot' || mode === 'reset' ? 'fa-key' : 'fa-graduation-cap'}`}></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {renderTitle()}
          </h2>
          <p className="mt-3 text-sm text-gray-500 font-medium px-4">
            {mode === 'login' ? (
              <>Chưa có tài khoản? <button onClick={() => setMode('register')} className="text-indigo-600 font-bold hover:underline">Đăng ký ngay</button></>
            ) : mode === 'register' ? (
              <>Đã có tài khoản? <button onClick={() => setMode('login')} className="text-indigo-600 font-bold hover:underline">Đăng nhập</button></>
            ) : mode === 'forgot' ? (
              "Nhập email sinh viên để nhận mã khôi phục."
            ) : (
              `Vui lòng kiểm tra email ${email}`
            )}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3 border border-red-100 animate-in fade-in zoom-in-95">
              <i className="fa-solid fa-circle-exclamation text-lg"></i> 
              <span className="font-bold">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm flex items-center gap-3 border border-green-100 animate-in fade-in zoom-in-95">
              <i className="fa-solid fa-circle-check text-lg"></i> 
              <span className="font-bold">{success}</span>
            </div>
          )}
          
          <div className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1">
                <label htmlFor="name-input" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <div className="relative">
                  <input
                    id="name-input"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all pl-11"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                </div>
              </div>
            )}
            
            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div className="space-y-1">
                <label htmlFor="email-input" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email sinh viên</label>
                <div className="relative">
                  <input
                    id="email-input"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all pl-11"
                    placeholder="sv@university.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label htmlFor="password-input" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mật khẩu</label>
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password-input"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all pl-11"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
                </div>
              </div>
            )}

            {(mode === 'verify' || mode === 'reset') && (
              <div className="space-y-3">
                <div className="text-center space-y-2 mb-4">
                  <label htmlFor="otp-input" className="text-xs font-black text-gray-400 uppercase tracking-widest block">Mã xác nhận (OTP)</label>
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    required
                    className="w-full text-center tracking-[0.8em] font-black text-3xl py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-600"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <i className={`fa-solid fa-clock-rotate-left text-xs ${timer < 60 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}></i>
                    <span className={`text-xs font-bold ${timer < 60 ? 'text-red-500' : 'text-gray-500'}`}>
                      Mã hết hạn trong: {formatTime(timer)}
                    </span>
                  </div>
                </div>

                {mode === 'reset' && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="new-password" classNa="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                      <input
                        id="new-password"
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        placeholder="Tối thiểu 6 ký tự"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="confirm-password" classNa="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                      <input
                        id="confirm-password"
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest active:scale-95"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
              ) : (
                mode === 'login' ? 'Đăng nhập' : 
                mode === 'register' ? 'Gửi mã xác nhận' : 
                mode === 'forgot' ? 'Gửi mã khôi phục' : 
                mode === 'reset' ? 'Đổi mật khẩu' : 'Xác nhận'
              )}
            </button>
          </div>
          
          {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
            <button 
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full text-xs font-bold text-gray-400 hover:text-indigo-600 flex items-center justify-center gap-2 uppercase tracking-widest transition-colors"
            >
              <i className="fa-solid fa-arrow-left-long"></i> Quay lại đăng nhập
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
