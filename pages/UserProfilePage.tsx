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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>(ReportReason.OTHER);
  const [reportNote, setReportNote] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Hoạt động', color: 'text-emerald-700', dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'BLOCKED':
        return { label: 'Đã bị khóa', color: 'text-rose-700', dot: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' };
      case 'WARNING':
        return { label: 'Cảnh báo', color: 'text-amber-700', dot: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'RESTRICTED':
        return { label: 'Hạn chế', color: 'text-orange-700', dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
      default:
        return { label: status || 'Không rõ', color: 'text-slate-500', dot: 'bg-slate-300', bg: 'bg-slate-50', border: 'border-slate-100' };
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
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfile(false);
      }
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
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingContent(false);
      }
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
    } catch (error) {
      alert('Lỗi gửi báo cáo');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (loadingProfile) {
    return <div className="py-32 text-center"><i className="fa-solid fa-circle-notch animate-spin text-4xl text-teal-600"></i></div>;
  }
  if (!profile) return <div className="py-32 text-center font-bold text-slate-400">Không tìm thấy người dùng</div>;

  const statusConfig = getStatusConfig(profile.status);
  const isSelf = currentUser?.id === profile.id;
  const productCount = activeTab === 'ACTIVE' ? activeProducts.length : soldProducts.length;

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 pb-24">
      <div className="absolute -top-16 right-8 -z-10 h-80 w-80 rounded-full bg-teal-200/35 blur-3xl"></div>
      <div className="absolute top-80 left-0 -z-10 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl"></div>

      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-black text-slate-500 shadow-sm backdrop-blur transition hover:border-teal-200 hover:text-teal-700">
        <i className="fa-solid fa-arrow-left"></i> Quay lại
      </button>

      <section className="overflow-hidden rounded-[44px] border border-white bg-white shadow-2xl shadow-slate-100">
        <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
          <div className="relative bg-[radial-gradient(circle_at_25%_20%,rgba(45,212,191,0.35),transparent_32%),linear-gradient(135deg,#0f172a,#134e4a)] p-8 text-white md:p-10">
            <div className="absolute right-8 top-8 h-28 w-28 rounded-full border-[18px] border-white/10"></div>
            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-5">
                <img src={profile.avatar} className="h-36 w-36 rounded-[42px] border-4 border-white/80 bg-white object-cover shadow-2xl" alt="avatar" />
                <div className={`absolute -bottom-2 -right-2 h-7 w-7 rounded-full border-4 border-white ${statusConfig.dot} ${profile.status === 'ACTIVE' ? 'animate-pulse' : ''}`}></div>
              </div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-100">
                <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`}></span>{statusConfig.label}
              </p>
              <h1 className="text-4xl font-black tracking-tight">{profile.name}</h1>
              <p className="mt-2 max-w-xs truncate text-xs font-bold uppercase tracking-widest text-teal-100/80">{profile.email}</p>
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-slate-950 shadow-xl">
                <i className="fa-solid fa-star text-amber-400"></i>
                <span className="font-black">{profile.rating.toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-400">({profile.countByReview || 0} đánh giá)</span>
              </div>
              {!isSelf && (
                <div className="mt-7 flex w-full max-w-sm gap-3">
                  <button onClick={() => navigate('/conversations')} className="flex-1 rounded-2xl bg-white px-5 py-4 text-[10px] font-black uppercase tracking-widest text-teal-700 transition hover:bg-teal-50">
                    <i className="fa-solid fa-message mr-2"></i>Nhắn tin
                  </button>
                  <button onClick={() => setIsReportModalOpen(true)} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white/20">
                    <i className="fa-solid fa-flag"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">UniTrade profile</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Hồ sơ người dùng</h2>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}>
                <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`}></span>{profile.status || 'UNKNOWN'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Đã đăng', value: profile.totalProducts, tone: 'bg-slate-950 text-white', icon: 'fa-box-open' },
                { label: 'Đã bán', value: profile.soldProducts, tone: 'bg-emerald-100 text-emerald-700', icon: 'fa-handshake' },
                { label: 'Đang rao', value: profile.activeProducts, tone: 'bg-teal-100 text-teal-700', icon: 'fa-store' },
              ].map(item => (
                <div key={item.label} className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}><i className={`fa-solid ${item.icon}`}></i></div>
                  <p className="text-2xl font-black text-slate-950">{item.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Mã định danh</p>
                <p className="break-all text-lg font-black text-slate-950">#{profile.id?.substring(0, 8).toUpperCase()}</p>
              </div>
              <div className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày gia nhập</p>
                <p className="text-lg font-black text-slate-950">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
              </div>
              <div className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm md:col-span-2">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Đánh giá uy tín</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => <i key={s} className={`fa-solid fa-star ${s <= Math.round(profile.rating) ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                  <span className="ml-3 text-sm font-bold text-slate-500">{profile.rating.toFixed(1)} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-[40px] bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white shadow-2xl shadow-orange-100 md:p-10">
        <div className="relative z-10 max-w-3xl">
          <h3 className="flex items-center gap-3 text-2xl font-black"><i className="fa-solid fa-shield-heart"></i>Hồ sơ UniTrade</h3>
          <p className="mt-3 text-sm font-medium leading-7 text-amber-50">Thành viên này đã thực hiện {profile.soldProducts} giao dịch trực tiếp. Hãy ưu tiên trao đổi rõ ràng, kiểm tra sản phẩm và giữ lịch sử trò chuyện để giao dịch an toàn hơn.</p>
        </div>
      </section>

      <section className="mt-14 space-y-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">Marketplace activity</p>
            <h2 className="mt-2 flex items-center gap-3 text-3xl font-black text-slate-950">
              <i className={`fa-solid ${activeTab === 'REVIEWS' ? 'fa-star text-amber-400' : 'fa-shop text-teal-600'}`}></i>
              {activeTab === 'REVIEWS' ? 'Phản hồi cộng đồng' : 'Danh mục sản phẩm'}
            </h2>
          </div>
          <div className="flex rounded-3xl border border-slate-200 bg-white p-1 shadow-sm">
            {['ACTIVE', 'SOLD', 'REVIEWS'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition ${activeTab === tab ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-500 hover:text-teal-700'}`}>
                {tab === 'ACTIVE' ? 'Đang bán' : tab === 'SOLD' ? 'Đã bán' : 'Đánh giá'}
              </button>
            ))}
          </div>
        </div>

        {loadingContent ? (
          <div className="py-20 text-center"><i className="fa-solid fa-circle-notch animate-spin text-3xl text-slate-200"></i></div>
        ) : activeTab === 'REVIEWS' ? (
          <div className="space-y-5">
            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.reviewId} className="group relative overflow-hidden rounded-[34px] border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-100">
                <div className="flex flex-col justify-between gap-5 sm:flex-row">
                  <div className="flex gap-5">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerName}`} className="h-16 w-16 rounded-3xl border bg-teal-50 p-1 shadow-md" alt="reviewer" />
                    <div>
                      <div className="mb-1.5 flex flex-wrap items-center gap-3"><h4 className="text-sm font-black text-slate-950">{review.reviewerName}</h4><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <i key={s} className={`fa-solid fa-star text-[9px] ${s <= review.rating ? 'text-amber-400' : 'text-slate-100'}`}></i>)}</div></div>
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"><i className="fa-solid fa-calendar"></i>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <Link to={`/products/${review.productId}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 transition hover:bg-teal-50">
                    <div><p className="text-[9px] font-black uppercase text-slate-400">Sản phẩm</p><p className="text-[11px] font-bold text-slate-700">Xem chi tiết</p></div>
                  </Link>
                </div>
                <p className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm italic leading-7 text-slate-600">"{review.comment}"</p>
              </div>
            )) : (
              <div className="rounded-[40px] border border-dashed border-slate-200 bg-white py-24 text-center"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chưa có đánh giá nào</p></div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productCount > 0 ? (
              (activeTab === 'ACTIVE' ? activeProducts : soldProducts).map(p => <ProductCard key={p.id} product={p} />)
            ) : (
              <div className="col-span-full rounded-[40px] border border-dashed border-slate-200 bg-white py-24 text-center"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Danh mục này hiện đang trống</p></div>
            )}
          </div>
        )}
      </section>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmittingReport && setIsReportModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[40px] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            {reportSuccess ? (
              <div className="space-y-6 p-16 text-center">
                <div className="mx-auto flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-500 shadow-inner"><i className="fa-solid fa-check"></i></div>
                <h3 className="text-2xl font-black uppercase text-slate-950">Đã gửi báo cáo</h3>
                <p className="font-medium text-slate-500">Cảm ơn bạn đã phản hồi. Chúng tôi sẽ xử lý trong vòng 24h.</p>
              </div>
            ) : (
              <form onSubmit={handleReport}>
                <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 p-8">
                  <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-xl text-rose-600"><i className="fa-solid fa-triangle-exclamation"></i></div><div><h3 className="text-sm font-black uppercase tracking-widest text-slate-950">Báo cáo vi phạm</h3><p className="text-[10px] font-bold uppercase text-rose-500">Đối tượng: {profile.name}</p></div></div>
                  <button type="button" onClick={() => setIsReportModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="space-y-8 p-8">
                  <div className="space-y-4"><label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn lý do vi phạm</label><div className="grid grid-cols-2 gap-3">{Object.values(ReportReason).map((reason) => (<button key={reason} type="button" onClick={() => setReportReason(reason)} className={`rounded-2xl border-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition ${reportReason === reason ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-md shadow-rose-100' : 'border-transparent bg-slate-50 text-slate-400 hover:border-slate-200'}`}>{reason.replace(/_/g, ' ')}</button>))}</div></div>
                  <div className="space-y-3"><label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú chi tiết</label><textarea required value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="Mô tả cụ thể hành vi hoặc bằng chứng vi phạm..." className="min-h-[140px] w-full rounded-[24px] border-2 border-transparent bg-slate-50 px-6 py-5 text-sm font-medium outline-none transition focus:border-rose-500 focus:bg-white"></textarea></div>
                </div>
                <div className="flex gap-4 bg-slate-50 p-8"><button type="button" onClick={() => setIsReportModalOpen(false)} className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:text-slate-600">Hủy bỏ</button><button type="submit" disabled={isSubmittingReport || !reportNote.trim()} className="flex-[2] rounded-2xl bg-rose-600 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-rose-100 transition hover:bg-rose-700 disabled:opacity-50">{isSubmittingReport ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Gửi khiếu nại'}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
