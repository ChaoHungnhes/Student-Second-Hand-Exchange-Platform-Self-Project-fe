import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategoriesAPI, createDraftProductAPI, uploadProductImagesAPI, submitProductAPI } from '../config/api';
import { Category } from '../types/index';

type PostStep = 'INFO' | 'IMAGES' | 'SUBMITTING' | 'SUCCESS';

const PostProductPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [step, setStep] = useState<PostStep>('INFO');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    city: 'Hà Nội', // Giá trị mặc định
    district: '',
    ward: '',
    addressDetail: ''
  });
  
  // Image States
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res: any = await getCategoriesAPI();
        if (Array.isArray(res)) setCategories(res);
      } catch (e) { console.error(e); }
    };
    fetchCats();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LOGIC XỬ LÝ ẢNH ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- BƯỚC 1: TẠO BẢN NHÁP ---
  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res: any = await createDraftProductAPI({
        ...formData,
        categoryId: Number(formData.categoryId)
      });

      if (res && res.id) {
        setDraftId(res.id);
        setStep('IMAGES');
      }
    } catch (error) {
      console.error("Lỗi tạo bản nháp:", error);
      alert("Có lỗi xảy ra khi tạo tin đăng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- BƯỚC 2: UPLOAD ẢNH VÀ GỬI DUYỆT ---
  const handleSubmitFinal = async () => {
    if (!draftId) return;
    setStep('SUBMITTING');

    try {
      if (images.length > 0) {
        const formDataUpload = new FormData();
        images.forEach(file => {
          formDataUpload.append("files", file);
        });
        await uploadProductImagesAPI(draftId, formDataUpload);
      }

      await submitProductAPI(draftId);
      setStep('SUCCESS');
    } catch (error) {
      console.error("Lỗi upload/submit:", error);
      alert("Đăng tin thất bại ở bước cuối. Vui lòng thử lại.");
      setStep('IMAGES');
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center">
        <i className="fa-solid fa-lock text-4xl text-gray-200 mb-4"></i>
        <h2 className="text-xl font-bold text-gray-900">Vui lòng đăng nhập</h2>
        <p className="text-gray-500 mt-2">Bạn cần đăng nhập để đăng tin bán đồ.</p>
        <button onClick={() => navigate('/login')} className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Đăng nhập ngay</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
      {/* Progress Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
          <div className={`absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500`} style={{ 
            width: step === 'INFO' ? '0%' : step === 'IMAGES' ? '50%' : '100%' 
          }}></div>
          
          {[
            { id: 'INFO', icon: 'fa-pen-to-square', label: 'Thông tin' },
            { id: 'IMAGES', icon: 'fa-images', label: 'Hình ảnh' },
            { id: 'SUCCESS', icon: 'fa-paper-plane', label: 'Gửi duyệt' }
          ].map((s, idx) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                (step === s.id || (step === 'SUBMITTING' && s.id === 'SUCCESS') || (step === 'SUCCESS' && idx <= 2) || (step === 'IMAGES' && idx === 0))
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'bg-white border-gray-300 text-gray-400'
              }`}>
                <i className={`fa-solid ${s.icon} text-sm`}></i>
              </div>
              <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${
                (step === s.id || (step === 'SUBMITTING' && s.id === 'SUCCESS')) ? 'text-indigo-600' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Info Form */}
      {step === 'INFO' && (
        <form onSubmit={handleCreateDraft} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border-b border-gray-50 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Mô tả sản phẩm</h2>
            <p className="text-sm text-gray-500">Cung cấp thông tin chi tiết để người mua dễ tìm thấy bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tiêu đề tin đăng *</label>
              <input 
                required
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ví dụ: Giáo trình Giải tích 1 còn mới"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Danh mục *</label>
              <select 
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium appearance-none"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Giá bán (VNĐ) *</label>
              <input 
                required
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Ví dụ: 50000"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Mô tả chi tiết *</label>
              <textarea 
                required
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Mô tả tình trạng sản phẩm, thời gian đã sử dụng..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              ></textarea>
            </div>
          </div>

          <div className="border-b border-gray-50 pb-4 pt-4">
            <h2 className="text-xl font-bold text-gray-900">Địa điểm giao dịch</h2>
            <p className="text-sm text-gray-500">Ưu tiên các khu vực trong hoặc gần trường học.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* === SỬA ĐỔI TẠI ĐÂY: DÙNG SELECT THAY VÌ INPUT === */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tỉnh/Thành phố *</label>
              <select 
                required
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium appearance-none"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
              </select>
            </div>
            {/* ================================================ */}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quận/Huyện *</label>
              <input required name="district" value={formData.district} onChange={handleInputChange} placeholder="Hai Bà Trưng" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phường/Xã *</label>
              <input required name="ward" value={formData.ward} onChange={handleInputChange} placeholder="Bách Khoa" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Địa chỉ cụ thể</label>
              <input name="addressDetail" value={formData.addressDetail} onChange={handleInputChange} placeholder="Ký túc xá B1, Phòng 102..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <>Tiếp tục tải ảnh <i className="fa-solid fa-arrow-right"></i></>}
          </button>
        </form>
      )}

      {/* Step 2: Image Upload */}
      {step === 'IMAGES' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Hình ảnh sản phẩm</h2>
            <p className="text-gray-500 mt-1">Nên đăng từ 2-4 ảnh thật của sản phẩm để tăng tỉ lệ bán hàng.</p>
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
              onChange={handleImageChange}
            />
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-cloud-arrow-up text-indigo-600 text-2xl"></i>
            </div>
            <p className="font-bold text-gray-700">Nhấn để tải lên hoặc kéo thả</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-black">PNG, JPG tối đa 10MB</p>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {previews.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                  <img src={url} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(idx)}
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
              onClick={() => setStep('INFO')} 
              className="flex-1 border-2 border-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
            >
              Quay lại
            </button>
            <button 
              onClick={handleSubmitFinal}
              disabled={images.length === 0}
              className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              Hoàn tất & Gửi duyệt <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Submitting */}
      {step === 'SUBMITTING' && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-indigo-100 space-y-8 animate-in zoom-in-95 duration-500">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-robot text-4xl text-indigo-600"></i>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đang tải ảnh & Gửi duyệt...</h2>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Hệ thống đang tải hình ảnh lên và gửi bài đăng của bạn tới Admin kiểm duyệt.
            </p>
          </div>
        </div>
      )}

      {/* Final Step: Success */}
      {step === 'SUCCESS' && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-green-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-4xl shadow-lg shadow-green-100">
            <i className="fa-solid fa-check"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900">Đăng tin thành công!</h2>
          
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left space-y-2 text-center">
             <p className="text-gray-700 font-medium">
               Tin của bạn đang ở trạng thái <span className="text-yellow-600 font-bold uppercase">CHỜ DUYỆT</span>.
             </p>
             <p className="text-sm text-gray-500">
               Vui lòng đợi Admin kiểm duyệt nội dung trước khi được hiển thị công khai.
             </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => navigate('/my-shop')}
              className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
            >
              Quản lý tin đăng
            </button>
            <button 
              onClick={() => navigate('/')}
              className="flex-1 bg-white text-indigo-600 border-2 border-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostProductPage;