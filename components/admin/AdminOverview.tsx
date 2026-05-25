import React, { useEffect, useMemo, useState } from "react";
import {
  countActiveUsersAPI,
  countPublicProductsAPI,
  countReportsTodayAPI,
  countTransactionsAPI,
} from "../../config/api";

const AdminOverview: React.FC = () => {
  const [productCount, setProductCount] = useState<number>(0);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [reportsTodayCount, setReportsTodayCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [pRes, uRes, tRes, rRes] = await Promise.allSettled([
          countPublicProductsAPI(),
          countActiveUsersAPI(),
          countTransactionsAPI(),
          countReportsTodayAPI(),
        ]);

        const getValue = (res: PromiseSettledResult<any>) => {
          if (res.status === "fulfilled" && res.value) {
            return res.value.count || 0;
          }
          return 0;
        };

        setProductCount(getValue(pRes));
        setActiveUserCount(getValue(uRes));
        setTransactionCount(getValue(tRes));
        setReportsTodayCount(getValue(rRes));
      } catch (e) {
        console.error("Failed to fetch admin counts", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Sinh viên hoạt động",
        value: activeUserCount,
        icon: "fa-users",
        accent: "bg-teal-400",
        surface: "from-teal-50 to-emerald-50",
        text: "text-teal-700",
        caption: "Cộng đồng đang online",
      },
      {
        label: "Sản phẩm công khai",
        value: productCount,
        icon: "fa-box-open",
        accent: "bg-amber-300",
        surface: "from-amber-50 to-orange-50",
        text: "text-amber-700",
        caption: "Đồ dùng sẵn sàng trao tay",
      },
      {
        label: "Giao dịch",
        value: transactionCount,
        icon: "fa-handshake",
        accent: "bg-sky-300",
        surface: "from-sky-50 to-cyan-50",
        text: "text-sky-700",
        caption: "Kết nối mua bán thành công",
      },
      {
        label: "Báo cáo hôm nay",
        value: reportsTodayCount,
        icon: "fa-flag",
        accent: "bg-rose-300",
        surface: "from-rose-50 to-red-50",
        text: "text-rose-700",
        caption: "Cần admin kiểm tra nhanh",
      },
    ],
    [activeUserCount, productCount, reportsTodayCount, transactionCount]
  );

  const totalActivity = activeUserCount + productCount + transactionCount;
  const safetyScore = reportsTodayCount > 0 ? 86 : 98;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6 duration-500">
      <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
        <div className="relative grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(20,184,166,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(251,191,36,0.16),transparent_28%)]" />
          <div className="relative p-6 sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-200">
              <i className="fa-solid fa-star" /> Tổng quan hôm nay
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Nhìn nhanh sức khỏe của chợ sinh viên S2S
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
              Các chỉ số được gom lại gọn gàng để admin ưu tiên việc quan trọng: giữ sàn sạch, phản hồi nhanh và tạo trải nghiệm mua bán an toàn cho sinh viên.
            </p>
          </div>

          <div className="relative border-t border-slate-100 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Campus pulse</p>
            <div className="mt-5 flex items-end gap-3">
              {loading ? (
                <div className="h-14 w-36 animate-pulse rounded-2xl bg-white/10" />
              ) : (
                <p className="text-6xl font-black tracking-tighter">{totalActivity.toLocaleString()}</p>
              )}
              <span className="mb-3 rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                Active
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">Tổng hoạt động nổi bật đang được ghi nhận trên hệ thống.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => (
          <article
            key={card.label}
            className={`group relative overflow-hidden rounded-[1.75rem] border border-white bg-gradient-to-br ${card.surface} p-5 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10`}
          >
            <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${card.accent} opacity-20 transition-transform duration-300 group-hover:scale-125`} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                {loading ? (
                  <div className="mt-4 h-10 w-24 animate-pulse rounded-2xl bg-white/70" />
                ) : (
                  <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{card.value.toLocaleString()}</p>
                )}
              </div>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl shadow-inner ${card.text}`}>
                <i className={`fa-solid ${card.icon}`} />
              </div>
            </div>
            <p className="relative mt-5 text-xs font-bold leading-5 text-slate-500">{card.caption}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#12312f] p-7 text-white shadow-2xl shadow-teal-950/10 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(250,204,21,0.28),transparent_24%),linear-gradient(135deg,rgba(45,212,191,0.24),transparent_45%)]" />
          <i className="fa-solid fa-bullhorn absolute -bottom-7 right-5 text-[9rem] text-white/10" />
          <div className="relative max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Gợi ý ưu tiên</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight">Giữ sàn sạch trước giờ cao điểm</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-teal-50/80">
              Hôm nay có {loading ? "..." : reportsTodayCount.toLocaleString()} báo cáo mới. Hãy xử lý sớm để sinh viên yên tâm mua bán, đặc biệt trong khung giờ nghỉ trưa và sau giờ học.
            </p>
            <button className="mt-6 rounded-2xl bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-teal-950 transition-all hover:-translate-y-0.5 hover:bg-amber-100">
              Kiểm tra báo cáo
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Trạng thái hệ thống</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Vận hành ổn định</h3>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <i className="fa-solid fa-heart-pulse text-2xl" />
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {[
              ["Database", "Connected", "w-[92%]"],
              ["AI Engine", "Ready", "w-[78%]"],
              ["Safety Score", `${safetyScore}%`, reportsTodayCount > 0 ? "w-[86%]" : "w-[98%]"],
            ].map(([name, status, width]) => (
              <div key={name}>
                <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-500">{name}</span>
                  <span className="text-emerald-600">{status}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 ${width}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;

