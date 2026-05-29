import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  registerAPI,
  verifyEmailAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
} from "../config/api";
import { getApiErrorMessage, showApiErrorAlert } from "../utils/apiError";

type AuthMode = "login" | "register" | "verify" | "forgot" | "reset";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8089";

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  useEffect(() => {
    let interval: any;
    if ((mode === "verify" || mode === "reset") && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "login") {
      if (!validateEmail(email)) return setError("Email không hợp lệ");
      if (password.length < 6) return setError("Mật khẩu phải từ 6 ký tự");

      setLoading(true);
      try {
        await login({ email, password });
        navigate("/");
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Email hoặc mật khẩu không chính xác",
        );
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    } else if (mode === "register") {
      if (!name) return setError("Vui lòng nhập tên");
      if (!validateEmail(email)) return setError("Email không hợp lệ");
      if (password.length < 6) return setError("Mật khẩu quá ngắn");

      setLoading(true);
      try {
        await registerAPI({ name, email, password });
        setSuccess("Đăng ký thành công! Vui lòng kiểm tra email để lấy OTP.");
        setMode("verify");
        setTimer(300);
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Đăng ký thất bại. Email có thể đã tồn tại.",
        );
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    } else if (mode === "forgot") {
      if (!validateEmail(email)) return setError("Vui lòng nhập email hợp lệ");

      setLoading(true);
      try {
        await forgotPasswordAPI(email);
        setSuccess("Mã OTP đã được gửi về email của bạn.");
        setMode("reset");
        setTimer(300);
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Không tìm thấy email này trong hệ thống.",
        );
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    } else if (mode === "reset") {
      if (otp.length !== 6) return setError("Mã xác nhận gồm 6 chữ số");
      if (newPassword.length < 6)
        return setError("Mật khẩu mới phải từ 6 ký tự");
      if (newPassword !== confirmPassword)
        return setError("Mật khẩu xác nhận không khớp");

      setLoading(true);
      try {
        await resetPasswordAPI({ email, otp, newPassword });
        setSuccess("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
        setTimeout(() => {
          setMode("login");
          setPassword("");
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Mã OTP không đúng hoặc đã hết hạn.",
        );
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    } else if (mode === "verify") {
      if (otp.length !== 6) return setError("Mã xác nhận gồm 6 chữ số");

      setLoading(true);
      try {
        await verifyEmailAPI(email, otp);
        setSuccess("Xác thực thành công! Bạn có thể đăng nhập ngay.");
        setMode("login");
        setPassword("");
        setOtp("");
      } catch (err) {
        const message = getApiErrorMessage(err, "Mã xác nhận không chính xác.");
        setError(message);
        showApiErrorAlert(err, message);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case "login":
        return "Chào mừng trở lại";
      case "register":
        return "Tạo tài khoản UniTrade";
      case "forgot":
        return "Khôi phục mật khẩu";
      case "reset":
        return "Đặt lại mật khẩu";
      case "verify":
        return "Xác thực email";
    }
  };

  const submitLabel = loading
    ? null
    : mode === "login"
      ? "Đăng nhập"
      : mode === "register"
        ? "Gửi mã xác nhận"
        : mode === "forgot"
          ? "Gửi mã khôi phục"
          : mode === "reset"
            ? "Đổi mật khẩu"
            : "Xác nhận";

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-amber-200/50 blur-3xl animate-pulse"></div>
      <div className="absolute -right-20 bottom-8 h-96 w-96 rounded-full bg-teal-200/45 blur-3xl animate-pulse"></div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,#fff7ed,#f8fafc_48%,#ecfeff)]"></div>

      <div className="mx-auto grid min-h-[calc(100vh-160px)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden rounded-[44px] bg-slate-950 p-9 text-white shadow-2xl shadow-slate-200 lg:block">
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full border-[20px] border-white/10"></div>
          <div className="absolute -bottom-14 -left-14 h-56 w-56 rounded-full bg-orange-400/25 blur-2xl"></div>
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-orange-100">
              <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(253,186,116,0.9)]"></span>
              Student marketplace
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight">
              Mua bán đồ sinh viên an toàn, nhanh và gần bạn hơn.
            </h1>
            <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-slate-300">
              UniTrade giúp sinh viên trao đổi sách, đồ học tập, thiết bị và vật
              dụng ký túc xá với cộng đồng đáng tin cậy.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { icon: "fa-shield-heart", label: "An toàn" },
                { icon: "fa-comments", label: "Nhắn tin nhanh" },
                { icon: "fa-location-dot", label: "Gần trường" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.1]"
                >
                  <i
                    className={`fa-solid ${item.icon} mb-4 text-xl text-orange-200`}
                  ></i>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-300 text-slate-950">
                  <i className="fa-solid fa-graduation-cap"></i>
                </div>
                <div>
                  <p className="text-sm font-black">
                    Dành riêng cho cộng đồng sinh viên
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Đăng nhập để lưu tin, trò chuyện và quản lý gian hàng cá
                    nhân.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-4 -z-10 rounded-[48px] bg-white/45 blur-xl"></div>
          <div className="overflow-hidden rounded-[40px] border border-white bg-white/90 shadow-2xl shadow-slate-200/80 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-orange-500 to-teal-600 p-7 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-50">
                    UniTrade
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">
                    {renderTitle()}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-white/85">
                    {mode === "login"
                      ? "Đăng nhập để tiếp tục phiên chợ sinh viên."
                      : mode === "register"
                        ? "Tạo hồ sơ để bắt đầu mua bán trong cộng đồng."
                        : mode === "forgot"
                          ? "Nhập email để nhận mã khôi phục bảo mật."
                          : `Kiểm tra hộp thư ${email || "của bạn"}.`}
                  </p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-2xl shadow-lg">
                  <i
                    className={`fa-solid ${mode === "forgot" || mode === "reset" ? "fa-key" : mode === "verify" ? "fa-envelope-circle-check" : "fa-graduation-cap"}`}
                  ></i>
                </div>
              </div>
            </div>

            <form className="space-y-6 p-7" onSubmit={handleSubmit}>
              <div className="rounded-3xl bg-slate-100 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={`rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition ${mode === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                  >
                    Đăng ký
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700 animate-in fade-in zoom-in-95">
                  <i className="fa-solid fa-circle-exclamation text-lg"></i>
                  <span className="font-bold">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 animate-in fade-in zoom-in-95">
                  <i className="fa-solid fa-circle-check text-lg"></i>
                  <span className="font-bold">{success}</span>
                </div>
              )}

              <div className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-2">
                    <label
                      htmlFor="name-input"
                      className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Họ và tên
                    </label>
                    <div className="relative">
                      <input
                        id="name-input"
                        type="text"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    </div>
                  </div>
                )}

                {(mode === "login" ||
                  mode === "register" ||
                  mode === "forgot") && (
                  <div className="space-y-2">
                    <label
                      htmlFor="email-input"
                      className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <input
                        id="email-input"
                        type="email"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="sv123@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    </div>
                  </div>
                )}

                {(mode === "login" || mode === "register") && (
                  <div className="space-y-2">
                    <div className="ml-1 flex items-center justify-between">
                      <label
                        htmlFor="password-input"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Mật khẩu
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:underline"
                        >
                          Quên mật khẩu?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="password-input"
                        type="password"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    </div>
                  </div>
                )}

                {(mode === "verify" || mode === "reset") && (
                  <div className="space-y-4">
                    <div className="space-y-3 text-center">
                      <label
                        htmlFor="otp-input"
                        className="block text-xs font-black uppercase tracking-widest text-slate-400"
                      >
                        Mã xác nhận OTP
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        maxLength={6}
                        required
                        className="w-full rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-5 text-center text-3xl font-black tracking-[0.75em] text-orange-600 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                      />
                      <div className="flex items-center justify-center gap-2">
                        <i
                          className={`fa-solid fa-clock-rotate-left text-xs ${timer < 60 ? "text-rose-500 animate-pulse" : "text-slate-400"}`}
                        ></i>
                        <span
                          className={`text-xs font-bold ${timer < 60 ? "text-rose-500" : "text-slate-500"}`}
                        >
                          Mã hết hạn trong: {formatTime(timer)}
                        </span>
                      </div>
                    </div>
                    {mode === "reset" && (
                      <>
                        <div className="space-y-2">
                          <label
                            htmlFor="new-password"
                            className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
                          >
                            Mật khẩu mới
                          </label>
                          <input
                            id="new-password"
                            type="password"
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            placeholder="Tối thiểu 6 ký tự"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="confirm-password"
                            className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
                          >
                            Xác nhận mật khẩu
                          </label>
                          <input
                            id="confirm-password"
                            type="password"
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
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

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-3xl bg-slate-950 px-4 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-black disabled:opacity-50 active:scale-95"
              >
                {loading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                ) : (
                  <>
                    <span>{submitLabel}</span>
                    <i className="fa-solid fa-arrow-right transition group-hover:translate-x-1"></i>
                  </>
                )}
              </button>

              {mode === "login" && (
                <>
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="mx-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      hoặc
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 active:scale-95"
                  >
                    <i className="fa-brands fa-google text-lg text-red-500"></i>
                    <span>Đăng nhập bằng Google</span>
                  </button>
                </>
              )}

              {(mode === "forgot" || mode === "reset" || mode === "verify") && (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="flex w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:text-orange-600"
                >
                  <i className="fa-solid fa-arrow-left-long"></i> Quay lại đăng
                  nhập
                </button>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
