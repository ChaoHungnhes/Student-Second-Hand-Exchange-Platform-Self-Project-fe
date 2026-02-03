import React, { useEffect, useState } from 'react';
import { countPublicProductsAPI, countActiveUsersAPI, countTransactionsAPI, countReportsTodayAPI } from '../../config/api';

// Không cần Props nữa vì component tự fetch data
const AdminOverview: React.FC = () => {
  const [productCount, setProductCount] = useState<number>(0);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [reportsTodayCount, setReportsTodayCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Gọi song song 4 API
        const [pRes, uRes, tRes, rRes] = await Promise.allSettled([
          countPublicProductsAPI(),
          countActiveUsersAPI(),
          countTransactionsAPI(),
          countReportsTodayAPI()
        ]);

        // Helper function để lấy data an toàn
        const getValue = (res: PromiseSettledResult<any>) => {
          if (res.status === 'fulfilled' && res.value) {
            // Nếu axios trả về data trực tiếp là object {count: 10}
            return res.value.count || 0;
          }
          return 0;
        };

        setProductCount(getValue(pRes));
        setActiveUserCount(getValue(uRes));
        setTransactionCount(getValue(tRes));
        setReportsTodayCount(getValue(rRes));

      } catch (e) {
        console.error('Failed to fetch admin counts', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  // ✅ FIX LỖI TAILWIND: Định nghĩa class tĩnh cụ thể
  const stats = [
    { 
      label: 'Người dùng', 
      value: activeUserCount, 
      icon: 'fa-users', 
      bgClass: 'bg-indigo-50', 
      textClass: 'text-indigo-600' 
    },
    { 
      label: 'Sản phẩm', 
      value: productCount, 
      icon: 'fa-box-open', 
      bgClass: 'bg-blue-50', 
      textClass: 'text-blue-600' 
    },
    { 
      label: 'Giao dịch', 
      value: transactionCount, 
      icon: 'fa-handshake', 
      bgClass: 'bg-green-50', 
      textClass: 'text-green-600' 
    },
    { 
      label: 'Báo cáo hôm nay', 
      value: reportsTodayCount, 
      icon: 'fa-flag', 
      bgClass: 'bg-red-50', 
      textClass: 'text-red-600' 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Thống kê hệ thống</h1>
      
      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all hover:-translate-y-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${card.bgClass} ${card.textClass}`}>
              <i className={`fa-solid ${card.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.label}</p>
              {loading ? (
                 <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                 <p className="text-3xl font-black text-gray-900">{card.value.toLocaleString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Banner & Server Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-indigo-600 rounded-[40px] p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2">Thông báo hệ thống</h3>
            <p className="text-indigo-100 text-sm font-medium opacity-80 mb-6">
                Hệ thống đang hoạt động ổn định. Có {reportsTodayCount} báo cáo mới cần xử lý trong ngày hôm nay.
            </p>
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">Kiểm tra ngay</button>
          </div>
          <i className="fa-solid fa-bell absolute top-1/2 right-[-20px] text-[120px] text-white/10 -translate-y-1/2 rotate-12"></i>
        </div>

        <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-4">Trạng thái Server</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Database (MySQL)</span>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">AI Engine</span>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Ready</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Storage</span>
              <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[45%]"></div>
                  </div>
                  <span className="text-[10px] font-black text-gray-400">...%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;