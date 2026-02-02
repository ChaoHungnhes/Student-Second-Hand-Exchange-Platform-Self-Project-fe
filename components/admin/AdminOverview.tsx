
import React, { useEffect, useState } from 'react';
import { User, Product } from '../../types';
import { countPublicProductsAPI, countActiveUsersAPI, countTransactionsAPI, countReportsTodayAPI } from '../../config/api';

interface Props {
  users: User[];
  products: Product[];
}

const AdminOverview: React.FC<Props> = ({ users, products }) => {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [activeUserCount, setActiveUserCount] = useState<number | null>(null);
  const [transactionCount, setTransactionCount] = useState<number | null>(null);
  const [reportsTodayCount, setReportsTodayCount] = useState<number | null>(null);

  useEffect(() => {
    // fetch all counts in parallel
    const fetchCounts = async () => {
      try {
        const [pRes, uRes, tRes, rRes] = await Promise.allSettled([
          countPublicProductsAPI(),
          countActiveUsersAPI(),
          countTransactionsAPI(),
          countReportsTodayAPI()
        ]);

        if (pRes.status === 'fulfilled' && pRes.value && typeof (pRes.value as any).count === 'number') {
          setProductCount((pRes.value as any).count);
        }
        if (uRes.status === 'fulfilled' && uRes.value && typeof (uRes.value as any).count === 'number') {
          setActiveUserCount((uRes.value as any).count);
        }
        if (tRes.status === 'fulfilled' && tRes.value && typeof (tRes.value as any).count === 'number') {
          setTransactionCount((tRes.value as any).count);
        }
        if (rRes.status === 'fulfilled' && rRes.value && typeof (rRes.value as any).count === 'number') {
          setReportsTodayCount((rRes.value as any).count);
        }
      } catch (e) {
        // silent fail - keep fallback values
        console.error('Failed to fetch admin counts', e);
      }
    };
    fetchCounts();
  }, []);

  const stats = [
    { label: 'Người dùng', value: activeUserCount ?? users.length, icon: 'fa-users', color: 'indigo' },
    { label: 'Sản phẩm', value: productCount ?? products.length, icon: 'fa-box-open', color: 'blue' },
    { label: 'Giao dịch', value: transactionCount ?? 0, icon: 'fa-handshake', color: 'green' },
    { label: 'Báo cáo mới trong ngày', value: reportsTodayCount ?? 0, icon: 'fa-flag', color: 'red' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Thống kê hệ thống</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center text-2xl shadow-inner`}>
              <i className={`fa-solid ${card.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.label}</p>
              <p className="text-3xl font-black text-gray-900">{(card.value ?? 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-indigo-600 rounded-[40px] p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2">Thông báo hệ thống</h3>
            <p className="text-indigo-100 text-sm font-medium opacity-80 mb-6">Bạn có ... yêu cầu nâng cấp tài khoản chưa xử lý và ... báo cáo vi phạm mới.</p>
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">Kiểm tra ngay</button>
          </div>
          <i className="fa-solid fa- bell absolute top-1/2 right-[-20px] text-[120px] text-white/10 -translate-y-1/2 rotate-12"></i>
        </div>
        <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-4">Trạng thái Server</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Database (MySQL)</span>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Ổn định</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gemini AI Engine</span>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Storage (sever)</span>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">82% Capacity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
