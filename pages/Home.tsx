import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import RecommendedProductsSection from "../components/RecommendedProductsSection";
import { Product, ProductParams, Category } from "../types/index";
import { getProductsAPI, getCategoriesAPI } from "../config/api";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80",
    eyebrow: "Chợ sinh viên thông minh",
    title: "Mua đồ học tập, bán đồ cũ chỉ trong vài phút.",
    description: "UniTrade giúp sinh viên trao đổi giáo trình, laptop, đồ ký túc xá và vật dụng học đường an toàn hơn.",
    accent: "from-teal-400 to-emerald-300",
  },
  {
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
    eyebrow: "Kết nối quanh campus",
    title: "Tìm món cần dùng ngay gần trường của bạn.",
    description: "Ưu tiên những tin đăng gần bạn để hẹn nhận nhanh, tiết kiệm phí ship và dễ kiểm tra sản phẩm.",
    accent: "from-amber-300 to-orange-400",
  },
  {
    image: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80",
    eyebrow: "Tiết kiệm ngân sách",
    title: "Giữ ví sinh viên nhẹ áp lực hơn mỗi học kỳ.",
    description: "Săn giáo trình, máy tính, tai nghe, bàn học với mức giá dễ chịu từ cộng đồng sinh viên.",
    accent: "from-cyan-300 to-blue-400",
  },
  {
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80",
    eyebrow: "An toàn hơn với AI",
    title: "Tin đăng được hỗ trợ kiểm duyệt để giảm rủi ro.",
    description: "Hệ thống hỗ trợ phát hiện nội dung bất thường, hàng cấm và dấu hiệu lừa đảo trước khi giao dịch.",
    accent: "from-lime-300 to-teal-300",
  },
];

const studentPerks = [
  { icon: "fa-wallet", title: "Tiết kiệm", text: "Tìm đồ học tập đúng nhu cầu với giá thân thiện." },
  { icon: "fa-location-dot", title: "Gần trường", text: "Ưu tiên giao dịch trong khu vực quen thuộc." },
  { icon: "fa-recycle", title: "Sống xanh", text: "Cho đồ cũ thêm vòng đời mới trong cộng đồng." },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const [activeCategoryId, setActiveCategoryId] = useState<number | "ALL">("ALL");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const currentSlide = heroSlides[activeSlide];

  const goToSlide = (index: number) => {
    setActiveSlide((index + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await getCategoriesAPI();
        if (res && Array.isArray(res)) setCategories(res);
      } catch (error) {
        console.error("Lỗi lấy danh mục", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: ProductParams = {
        page: 0,
        size: 8,
        sortDir,
        sortBy: "createdAt",
      };

      if (activeCategoryId !== "ALL") params.categoryId = activeCategoryId;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res: any = await getProductsAPI(params);
      if (res && res.result) setProducts(res.result);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeCategoryId, minPrice, maxPrice, sortDir]);

  const resetFilters = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMinPrice("");
    setMaxPrice("");
    setActiveCategoryId("ALL");
    setSortDir("desc");
    fetchProducts();
  };

  return (
    <div className="relative -mx-4 -mt-8 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(153,246,228,0.35),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_34%,#f8fafc_100%)] px-4 pb-20 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -left-24 top-[520px] h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl space-y-12 pt-8">
        <section className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.28)] sm:rounded-[2.5rem]">
            {heroSlides.map((slide, index) => (
              <img
                key={slide.image}
                src={slide.image}
                alt={slide.title}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${activeSlide === index ? "scale-100 opacity-70" : "scale-105 opacity-0"}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/70 to-teal-950/20"></div>
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950 to-transparent"></div>

            <div className="relative z-10 flex min-h-[520px] flex-col justify-between p-6 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full bg-gradient-to-r ${currentSlide.accent} px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-950 shadow-lg`}>
                  {currentSlide.eyebrow}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur-md">
                  Dành riêng cho sinh viên
                </span>
              </div>

              <div className="max-w-3xl">
                <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  {currentSlide.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-200 sm:text-lg">
                  {currentSlide.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/products")}
                    className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-xl transition-all hover:-translate-y-1 hover:bg-teal-50"
                  >
                    Bắt đầu mua sắm
                  </button>
                  <button
                    onClick={() => navigate("/nearby-products")}
                    className="rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/20"
                  >
                    Xem đồ gần bạn
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Chuyển tới banner ${index + 1}`}
                      onClick={() => goToSlide(index)}
                      className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-10 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => goToSlide(activeSlide - 1)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20">
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <button onClick={() => goToSlide(activeSlide + 1)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20">
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:col-span-3 lg:col-span-1">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">UniTrade vibe</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Đồ cũ nhưng cơ hội mới.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Một không gian mua bán nhẹ nhàng, minh bạch và gần gũi với nhịp sống sinh viên.
              </p>
            </div>
            {studentPerks.map((perk) => (
              <div key={perk.title} className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition-transform group-hover:rotate-6 group-hover:bg-teal-600">
                  <i className={`fa-solid ${perk.icon}`}></i>
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">{perk.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{perk.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Khám phá nhanh</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Danh mục đang được sinh viên quan tâm</h2>
            </div>
            <button onClick={() => navigate("/products")} className="inline-flex items-center gap-2 self-start rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700">
              Xem tất cả <i className="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            <button onClick={() => setActiveCategoryId("ALL")} className={`whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${activeCategoryId === "ALL" ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}>
              Tất cả
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${activeCategoryId === cat.id ? "border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}>
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-teal-900 to-emerald-700 p-6 text-white shadow-[0_24px_60px_rgba(15,118,110,0.22)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <i className="fa-solid fa-shield-halved text-2xl"></i>
            </div>
            <h3 className="mt-6 text-2xl font-black">An toàn hơn với kiểm duyệt AI</h3>
            <p className="mt-3 text-sm leading-7 text-teal-50">
              Mỗi bài đăng được hỗ trợ phân tích để hạn chế hàng cấm, nội dung bất thường và các dấu hiệu thiếu tin cậy.
            </p>
            <button className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-teal-50">
              Tìm hiểu quy trình
            </button>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Giá tối thiểu</label>
                <input type="number" placeholder="VD: 50000" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Giá tối đa</label>
                <input type="number" placeholder="VD: 500000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Sắp xếp</label>
                <select value={sortDir} onChange={(e) => setSortDir(e.target.value as "desc" | "asc")} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100">
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>
              </div>
              <button onClick={resetFilters} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-black text-slate-500 transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700">
                <i className="fa-solid fa-rotate-right"></i> Đặt lại
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Tin mới lên kệ</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Sản phẩm mới nhất</h2>
            </div>
            <span className="text-sm font-bold text-slate-400">
              {loading ? "Đang tải..." : `Tìm thấy ${products.length} sản phẩm`}
            </span>
          </div>

          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white py-20 text-center shadow-sm">
              <i className="fa-solid fa-circle-notch animate-spin text-4xl text-teal-500"></i>
              <p className="mt-4 font-semibold text-slate-500">Đang tìm kiếm sản phẩm...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
              <i className="fa-solid fa-filter-circle-xmark mb-4 text-4xl text-slate-200"></i>
              <h3 className="font-black text-slate-950">Không có kết quả</h3>
              <p className="mt-2 text-sm text-slate-500">Vui lòng điều chỉnh lại bộ lọc giá hoặc danh mục.</p>
            </div>
          )}

          <div className="mt-12 flex justify-center">
            <button onClick={() => navigate("/products")} className="rounded-2xl border-2 border-slate-950 px-10 py-3 font-black text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white hover:shadow-xl">
              Xem thêm sản phẩm
            </button>
          </div>
        </section>

        <RecommendedProductsSection />
      </div>
    </div>
  );
};

export default Home;
