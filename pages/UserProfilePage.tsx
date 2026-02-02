import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ReportReason, Review } from '../types';
import ProductCard from '../components/ProductCard'; 
import { 
  getUserByIdAPI, 
  getProductsByUserIdAPI, 
  createReportAPI, 
  getReviewsByUserIdAPI 
} from '../config/api';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SOLD' | 'REVIEWS'>('ACTIVE');
  const [activeProducts, setActiveProducts] = useState<any[]>([]);
  const [soldProducts, setSoldProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // State Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>(ReportReason.OTHER);
  const [reportNote, setReportNote] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Helper: Xử lý màu sắc và nhãn theo Status từ Backend
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Hoạt động', color: 'text-green-600', dot: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-100' };
      case 'BLOCKED':
        return { label: 'Đã bị khóa', color: 'text-red-600', dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-100' };
      case 'WARNING':
        return { label: 'Cảnh báo', color: 'text-yellow-600', dot: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100' };
      case 'RESTRICTED':
        return { label: 'Hạn chế', color: 'text-orange-600', dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
      default:
        return { label: status || 'Không rõ', color: 'text-gray-400', dot: 'bg-gray-300', bg: 'bg-gray-50', border: 'border-gray-100' };
    }
  };

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res: any = await getUserByIdAPI(userId);
        if (res) {
          setProfile({ ...res, avatar: res.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.name}` });
        }
      } catch (error) { console.error(error); } finally { setLoadingProfile(false); }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const fetchContent = async () => {
      setLoadingContent(true);
      try {
        if (activeTab === 'REVIEWS') {
          const res: any = await getReviewsByUserIdAPI(userId, 1, 10);
          setReviews(res?.result || []);
        } else {
          const statusParam = activeTab === 'ACTIVE' ? 'APPROVED' : 'SOLD';
          const res: any = await getProductsByUserIdAPI(userId, statusParam);
          const data = res?.result || res || [];
          if (activeTab === 'ACTIVE') setActiveProducts(data);
          else setSoldProducts(data);
        }
      } catch (error) { console.error(error); } finally { setLoadingContent(false); }
    };
    fetchContent();
  }, [userId, activeTab]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingReport(true);
      await createReportAPI({ targetUserId: userId, reason: reportReason, note: reportNote });
      setReportSuccess(true);
      setTimeout(() => { setIsReportModalOpen(false); setReportSuccess(false); setReportNote(''); }, 2000);
    } catch (error) { alert("Lỗi gửi báo cáo"); } finally { setIsSubmittingReport(false); }
  };

  if (loadingProfile) return <div className="py-32 text-center"><i className="fa-solid fa-circle-notch animate-spin text-4xl text-indigo-600"></i></div>;
  if (!profile) return <div className="py-32 text-center">User not found</div>;

  const statusConfig = getStatusConfig(profile.status);
  const isSelf = currentUser?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-24">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors group">
        <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE: Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-50 to-transparent"></div>
            <div className="relative inline-block mb-4 mt-4">
              <img src={profile.avatar} className="w-32 h-32 rounded-full border-4 border-white mx-auto shadow-xl object-cover relative z-10" alt="avatar" />
              <div className={`absolute bottom-1 right-1 ${statusConfig.dot} w-6 h-6 rounded-full border-4 border-white z-20 shadow-lg ${profile.status === 'ACTIVE' ? 'animate-pulse' : ''}`}></div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile.name}</h2>
            <p className="text-[10px] text-gray-400 font-bold mb-6 truncate uppercase tracking-widest">{profile.email}</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center text-yellow-500 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                <i className="fa-solid fa-star text-xs mr-1"></i>
                <span className="font-black text-sm">{profile.rating.toFixed(1)}</span>
              </div>
            </div>
            {!isSelf && (
              <button onClick={() => setIsReportModalOpen(true)} className="w-full py-3 border-2 border-red-50 text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i> Báo cáo người dùng
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-widest mb-2"><i className="fa-solid fa-chart-line text-indigo-600 mr-2"></i>Hoạt động</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Đã đăng</span><span className="font-black text-gray-900">{profile.totalProducts}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Đã bán</span><span className="font-black text-green-600">{profile.soldProducts}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Đang rao</span><span className="font-black text-indigo-600">{profile.activeProducts}</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 overflow-hidden">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Chi tiết tài khoản</h3>
              <div className={`flex items-center gap-2 ${statusConfig.bg} px-3 py-1 rounded-full border ${statusConfig.border}`}>
                <span className={`w-1.5 h-1.5 ${statusConfig.dot} rounded-full`}></span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mã định danh</p>
                    <p className="text-gray-900 font-bold text-lg">#{profile.id?.substring(0,8).toUpperCase()}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngày gia nhập</p>
                    <p className="text-gray-900 font-bold text-lg">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trạng thái xác minh</p>
                    <span className={`px-3 py-1 rounded-lg ${statusConfig.bg} ${statusConfig.color} text-[10px] font-black uppercase border ${statusConfig.border}`}>{profile.status}</span>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đánh giá uy tín</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star text-[10px] ${s <= Math.round(profile.rating) ? 'text-yellow-400' : 'text-gray-100'}`}></i>)}
                      <span className="ml-2 text-xs font-bold text-gray-500">({profile.countByReview || 0})</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-graduation-cap text-[10rem] -rotate-12"></i></div>
            <h4 className="text-xl font-black mb-4 flex items-center gap-3"><i className="fa-solid fa-circle-info"></i>Hồ sơ UniTrade</h4>
            <p className="text-indigo-100 text-sm leading-relaxed font-medium mb-8">Thành viên này đã thực hiện {profile.soldProducts} giao dịch trực tiếp. Luôn được cộng đồng đánh giá cao về sự tin cậy.</p>
            {!isSelf && <button onClick={() => navigate(`/conversations`)} className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 shadow-lg active:scale-95 transition-all">Nhắn tin ngay</button>}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-16 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <i className={`fa-solid ${activeTab === 'REVIEWS' ? 'fa-star text-yellow-400' : 'fa-shop text-indigo-600'}`}></i>
            {activeTab === 'REVIEWS' ? 'Phản hồi cộng đồng' : 'Danh mục sản phẩm'}
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            {['ACTIVE', 'SOLD', 'REVIEWS'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
                {tab === 'ACTIVE' ? 'Đang bán' : tab === 'SOLD' ? 'Đã bán' : 'Đánh giá'}
              </button>
            ))}
          </div>
        </div>

        {loadingContent ? (
          <div className="py-20 text-center"><i className="fa-solid fa-circle-notch animate-spin text-3xl text-gray-200"></i></div>
        ) : activeTab === 'REVIEWS' ? (
          <div className="space-y-6">
            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.reviewId} className="bg-white rounded-[35px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all relative group">
                <div className="flex flex-col sm:flex-row justify-between gap-6">
                  <div className="flex gap-5">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerName}`} className="w-16 h-16 rounded-[20px] bg-indigo-50 border shadow-md p-1" alt="reviewer" />
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className="font-black text-gray-900 text-sm tracking-tight">{review.reviewerName}</h4>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star text-[9px] ${s <= review.rating ? 'text-yellow-400' : 'text-gray-100'}`}></i>)}
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><i className="fa-solid fa-calendar"></i> {new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <Link to={`/products/${review.productId}`} className="flex items-center gap-3 bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-2xl border border-gray-100 transition-colors">
                    <div className="min-w-0"><p className="text-[9px] font-black text-gray-400 uppercase">Sản phẩm</p><p className="text-[11px] font-bold text-gray-700 truncate">Xem chi tiết</p></div>
                  </Link>
                </div>
                <div className="mt-6 relative">
                  <i className="fa-solid fa-quote-left absolute -top-4 -left-2 text-indigo-100 text-4xl -z-0"></i>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium italic relative z-10 pl-8">"{review.comment}"</p>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Chưa có đánh giá nào</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {(activeTab === 'ACTIVE' ? activeProducts : soldProducts).length > 0 ? (
              (activeTab === 'ACTIVE' ? activeProducts : soldProducts).map(p => <ProductCard key={p.id} product={p} />)
            ) : (
              <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Danh mục này hiện đang trống</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL REPORT USER (FULL OPTIONS) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmittingReport && setIsReportModalOpen(false)}></div>
          
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            {reportSuccess ? (
              <div className="p-16 text-center space-y-6">
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce"><i className="fa-solid fa-check"></i></div>
                <h3 className="text-2xl font-black text-gray-900 uppercase">Đã gửi báo cáo</h3>
                <p className="text-gray-500 font-medium">Cảm ơn bạn đã phản hồi. Chúng tôi sẽ xử lý trong vòng 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleReport}>
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-red-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl shadow-sm"><i className="fa-solid fa-triangle-exclamation"></i></div>
                    <div>
                      <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Báo cáo vi phạm</h3>
                      <p className="text-[10px] text-red-500 font-bold uppercase">Đối tượng: {profile.name}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsReportModalOpen(false)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <div className="p-10 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Chọn lý do vi phạm</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(ReportReason).map((reason) => (
                        <button
                          key={reason} type="button"
                          onClick={() => setReportReason(reason)}
                          className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                            reportReason === reason ? 'bg-red-50 border-red-500 text-red-600 shadow-md shadow-red-100' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {reason.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ghi chú chi tiết</label>
                    <textarea
                      required value={reportNote} onChange={(e) => setReportNote(e.target.value)}
                      placeholder="Mô tả cụ thể hành vi hoặc bằng chứng vi phạm..."
                      className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-red-500 transition-all outline-none text-sm min-h-[140px] font-medium"
                    ></textarea>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 flex gap-4">
                  <button type="button" onClick={() => setIsReportModalOpen(false)} className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Hủy bỏ</button>
                  <button type="submit" disabled={isSubmittingReport || !reportNote.trim()} className="flex-[2] bg-red-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 shadow-xl shadow-red-100 active:scale-95 transition-all">
                    {isSubmittingReport ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Gửi khiếu nại'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;