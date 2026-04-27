import React from "react";

interface PostProductImagesStepProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imagesCount: number;
  previews: string[];
  onBack: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onSubmitFinal: () => void;
}

const PostProductImagesStep: React.FC<PostProductImagesStepProps> = ({
  fileInputRef,
  imagesCount,
  previews,
  onBack,
  onImageChange,
  onRemoveImage,
  onSubmitFinal,
}) => (
  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900">Hình ảnh sản phẩm</h2>
      <p className="text-gray-500 mt-1">
        Nên đăng từ 2-4 ảnh thật của sản phẩm để tăng tỉ lệ bán hàng.
      </p>
    </div>

    <div
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
    >
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={onImageChange}
      />
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
        <i className="fa-solid fa-cloud-arrow-up text-indigo-600 text-2xl"></i>
      </div>
      <p className="font-bold text-gray-700">Nhấn để tải lên hoặc kéo thả</p>
      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-black">
        PNG, JPG tối đa 10MB
      </p>
    </div>

    {previews.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {previews.map((url, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group"
          >
            <img src={url} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveImage(idx)}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        ))}
      </div>
    )}

    <div className="flex gap-4 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 border-2 border-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
      >
        Quay lại
      </button>
      <button
        type="button"
        onClick={onSubmitFinal}
        disabled={imagesCount === 0}
        className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        Hoàn tất & Gửi duyệt <i className="fa-solid fa-paper-plane"></i>
      </button>
    </div>
  </div>
);

export default PostProductImagesStep;
