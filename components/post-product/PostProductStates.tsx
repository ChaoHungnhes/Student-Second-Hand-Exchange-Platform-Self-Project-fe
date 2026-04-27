import React from "react";

interface LoginRequiredProps {
  onLogin: () => void;
}

export const LoginRequired: React.FC<LoginRequiredProps> = ({ onLogin }) => (
  <div className="py-20 text-center">
    <i className="fa-solid fa-lock text-4xl text-gray-200 mb-4"></i>
    <h2 className="text-xl font-bold text-gray-900">Vui lòng đăng nhập</h2>
    <p className="text-gray-500 mt-2">Bạn cần đăng nhập để đăng tin bán đồ.</p>
    <button
      onClick={onLogin}
      className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
    >
      Đăng nhập ngay
    </button>
  </div>
);

export const SubmittingState: React.FC = () => (
  <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-indigo-100 space-y-8 animate-in zoom-in-95 duration-500">
    <div className="relative w-32 h-32 mx-auto">
      <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <i className="fa-solid fa-robot text-4xl text-indigo-600"></i>
      </div>
    </div>
    <div>
      <h2 className="text-2xl font-bold text-gray-900">
        Đang tải ảnh & Gửi duyệt...
      </h2>
      <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
        Hệ thống đang tải hình ảnh lên và gửi bài đăng của bạn tới Admin kiểm
        duyệt.
      </p>
    </div>
  </div>
);

interface SuccessStateProps {
  onGoHome: () => void;
  onGoToShop: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  onGoHome,
  onGoToShop,
}) => (
  <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-green-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-4xl shadow-lg shadow-green-100">
      <i className="fa-solid fa-check"></i>
    </div>
    <h2 className="text-3xl font-black text-gray-900">
      Đăng tin thành công!
    </h2>

    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left space-y-2 text-center">
      <p className="text-gray-700 font-medium">
        Tin của bạn đang ở trạng thái{" "}
        <span className="text-yellow-600 font-bold uppercase">CHỜ DUYỆT</span>.
      </p>
      <p className="text-sm text-gray-500">
        Vui lòng đợi Admin kiểm duyệt nội dung trước khi được hiển thị công
        khai.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 pt-4">
      <button
        onClick={onGoToShop}
        className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
      >
        Quản lý tin đăng
      </button>
      <button
        onClick={onGoHome}
        className="flex-1 bg-white text-indigo-600 border-2 border-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all"
      >
        Về trang chủ
      </button>
    </div>
  </div>
);
