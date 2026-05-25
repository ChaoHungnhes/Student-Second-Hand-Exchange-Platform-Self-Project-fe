import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import { Product, ProductStatus } from "../types";
import { getMyProductsAPI, getMyPurchasesAPI } from "../config/api";

const statusTabs: { id: "ALL" | ProductStatus; label: string; icon: string }[] = [
  { id: "ALL", label: "Tất cả", icon: "fa-layer-group" },
  { id: "APPROVED", label: "Đang bán", icon: "fa-bolt" },
  { id: "PENDING", label: "Chờ duyệt", icon: "fa-clock" },
  { id: "REJECTED", label: "Bị từ chối", icon: "fa-circle-xmark" },
  { id: "SOLD", label: "Đã bán", icon: "fa-circle-check" },
  { id: "DRAFT", label: "Bản nháp", icon: "fa-pen-ruler" },
];

const MyShopPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"LISTINGS" | "PURCHASED">("LISTINGS");
  const [filterStatus, setFilterStatus] = useState<"ALL" | ProductStatus>("ALL");
  const [displayList, setDisplayList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setDisplayList([]);

      try {
        if (activeTab === "LISTINGS") {
          const res: any = await getMyProductsAPI(filterStatus);
          if (res && res.result) setDisplayList(res.result);
        } else {
          const res: any = await getMyPurchasesAPI();
          if (res && res.result) {
            const mappedProducts: Product[] = res.result.map((t: any) => ({
              id: t.productId,
              title: t.productTitle,
              price: t.productPrice,
              imageUrls: [t.productThumbnail],
              categoryName: "Đã mua",
              sellerName: t.sellerName,
              sellerId: t.sellerId,
              sellerRating: 0,
              status: "SOLD",
              createdAt: t.purchaseDate,
              owner: false,
              city: "",
              ward: "",
              addressDetail: "",
            }));

            setDisplayList(mappedProducts);
          }
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, filterStatus, user]);

  const filteredList = displayList.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const listingCount = activeTab === "LISTINGS" ? displayList.length : 0;
  const purchasedCount = activeTab === "PURCHASED" ? displayList.length : 0;

  if (!user) {
    return (
      <div className="relative -mx-4 -mt-8 flex min-h-[520px] items-center justify-center bg-slate-50 px-4 sm:-mx-6 lg:-mx-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white">
            <i className="fa-solid fa-lock text-2xl"></i>
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-950">Bạn cần đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-500">Vui lòng đăng nhập để xem tin của bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative -mx-4 -mt-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.34),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_38%,#f8fafc_100%)] px-4 pb-24 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute right-0 top-16 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-24 top-[430px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl space-y-8 pt-8">
        <section className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(45,212,191,0.28),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(251,191,36,0.16),transparent_24%)]"></div>

            <div className="relative z-10">
              <span className="inline-flex rounded-full bg-gradient-to-r from-teal-300 to-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-950">
                Góc cá nhân
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Quản lý gian hàng sinh viên của bạn.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Theo dõi tin đăng, trạng thái kiểm duyệt và lịch sử mua sắm trong một không gian gọn gàng hơn.
              </p>
            </div>

            <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt="avatar"
                    className="h-14 w-14 rounded-2xl bg-white object-cover ring-2 ring-white/30"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">{user.name}</p>
                    <p className="truncate text-sm font-semibold text-slate-300">Chủ gian hàng UniTrade</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Đang xem</p>
                  <p className="mt-2 text-2xl font-black">{filteredList.length}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Chế độ</p>
                  <p className="mt-2 text-lg font-black">{activeTab === "LISTINGS" ? "Tin bán" : "Đã mua"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-2 rounded-3xl bg-slate-100 p-1.5 sm:grid-cols-2">
              <button
                onClick={() => {
                  setActiveTab("LISTINGS");
                  setFilterStatus("ALL");
                  setSearchTerm("");
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all ${activeTab === "LISTINGS" ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-white hover:text-slate-950"}`}
              >
                <i className="fa-solid fa-store"></i>
                Tin đăng bán
                {listingCount > 0 && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{listingCount}</span>}
              </button>
              <button
                onClick={() => {
                  setActiveTab("PURCHASED");
                  setSearchTerm("");
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all ${activeTab === "PURCHASED" ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-white hover:text-slate-950"}`}
              >
                <i className="fa-solid fa-bag-shopping"></i>
                Đồ đã mua
                {purchasedCount > 0 && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{purchasedCount}</span>}
              </button>
            </div>

            <div className="relative w-full lg:w-[420px]">
              <input
                type="text"
                placeholder={activeTab === "LISTINGS" ? "Tìm trong tin đăng..." : "Tìm trong lịch sử mua..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 shadow-inner transition-all placeholder:text-slate-400 focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>
          </div>
        </section>

        {activeTab === "LISTINGS" && (
          <section className="flex gap-2 overflow-x-auto rounded-[2rem] border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur-md">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition-all hover:-translate-y-0.5 ${filterStatus === tab.id ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "bg-white text-slate-500 hover:text-teal-700 hover:shadow-md"}`}
              >
                <i className={`fa-solid ${tab.icon} text-xs`}></i>
                {tab.label}
              </button>
            ))}
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">
                {activeTab === "LISTINGS" ? "Tin của tôi" : "Lịch sử mua"}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {activeTab === "LISTINGS" ? "Danh sách tin đăng" : "Những món đã mua"}
              </h2>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
              {loading ? "Đang tải..." : `${filteredList.length} mục`}
            </span>
          </div>

          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white py-24 text-center shadow-sm">
              <i className="fa-solid fa-circle-notch animate-spin text-4xl text-teal-500"></i>
              <p className="mt-4 font-semibold text-slate-500">Đang tải dữ liệu...</p>
            </div>
          ) : filteredList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredList.map((p, index) => (
                <div key={`${p.id}-${index}`} className="group relative">
                  <ProductCard product={p} />

                  {activeTab === "LISTINGS" &&
                    (p.status === "PENDING" || p.status === "REJECTED" || p.aiStatus === "SCAM" || p.aiStatus === "WARNING") && (
                      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
                        {(p.aiStatus === "WARNING" || p.aiStatus === "SCAM") && (
                          <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase text-white shadow-md ${p.aiStatus === "SCAM" ? "bg-red-600" : "bg-amber-500"}`}>
                            <i className="fa-solid fa-triangle-exclamation"></i> AI: {p.aiStatus}
                          </span>
                        )}
                        {(p.status === "PENDING" || p.status === "REJECTED") && (
                          <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase text-white shadow-md ${p.status === "REJECTED" ? "bg-slate-800" : "bg-blue-500"}`}>
                            {p.status === "PENDING" ? "Đang duyệt" : "Bị từ chối"}
                          </span>
                        )}
                      </div>
                    )}

                  {activeTab === "PURCHASED" && (
                    <div className="absolute left-3 top-3 z-10">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-teal-500 px-2.5 py-1.5 text-[10px] font-black uppercase text-white shadow-md">
                        <i className="fa-solid fa-bag-shopping"></i> Đã mua
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
                <i className="fa-solid fa-box-open text-4xl"></i>
              </div>
              <h3 className="text-xl font-black text-slate-950">
                {activeTab === "LISTINGS" ? "Chưa có tin đăng nào" : "Chưa mua món nào"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Danh sách đang trống. Hãy thử đăng bán một món đồ hoặc khám phá marketplace nhé!
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MyShopPage;
