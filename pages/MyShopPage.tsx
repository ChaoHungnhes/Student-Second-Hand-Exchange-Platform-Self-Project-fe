import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import { Product, ProductStatus } from "../types";
import { getMyProductsAPI, getMyPurchasesAPI } from "../config/api"; // Import thêm getMyPurchasesAPI

const MyShopPage: React.FC = () => {
  const { user } = useAuth();

  // State quản lý Tab và Filter
  const [activeTab, setActiveTab] = useState<"LISTINGS" | "PURCHASED">(
    "LISTINGS",
  );
  const [filterStatus, setFilterStatus] = useState<"ALL" | ProductStatus>(
    "ALL",
  );

  // State dữ liệu
  const [displayList, setDisplayList] = useState<Product[]>([]); // Dùng chung 1 list hiển thị
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setDisplayList([]); // Clear cũ trước khi load mới

      try {
        // --- CASE 1: LẤY TIN ĐĂNG BÁN ---
        if (activeTab === "LISTINGS") {
          const res: any = await getMyProductsAPI(filterStatus);
          if (res && res.result) {
            setDisplayList(res.result);
          }
        }
        // --- CASE 2: LẤY LỊCH SỬ MUA HÀNG (MỚI) ---
        else {
          const res: any = await getMyPurchasesAPI();
          if (res && res.result) {
            // Mapping: Chuyển Transaction -> Product để dùng lại ProductCard
            const mappedProducts: Product[] = res.result.map((t: any) => ({
              id: t.productId,
              title: t.productTitle,
              price: t.productPrice,
              imageUrls: [t.productThumbnail], // Backend trả về 1 ảnh -> bỏ vào mảng
              categoryName: "Đã mua", // Hoặc để trống nếu API không trả về category

              sellerName: t.sellerName,
              sellerId: t.sellerId,
              sellerRating: 0, // Mặc định 0 hoặc ẩn đi vì API transaction chưa trả về rating

              status: "SOLD", // Mặc định là đã bán
              createdAt: t.purchaseDate, // Dùng ngày mua làm ngày hiển thị

              // Các trường bắt buộc khác của Product (fake tạm)
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

  // Lọc cục bộ theo từ khóa tìm kiếm
  const filteredList = displayList.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!user)
    return (
      <div className="py-32 text-center text-gray-500">
        <i className="fa-solid fa-lock text-4xl mb-4"></i>
        <p>Vui lòng đăng nhập để xem tin của bạn.</p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 px-4">
      {/* Header Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý cá nhân</h1>
          <p className="text-gray-500 text-sm">
            Quản lý tin đăng bán và lịch sử mua sắm của bạn.
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab("LISTINGS");
              setFilterStatus("ALL");
              setSearchTerm("");
            }}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "LISTINGS" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
          >
            Tin đăng bán
          </button>
          <button
            onClick={() => {
              setActiveTab("PURCHASED");
              setSearchTerm("");
            }}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "PURCHASED" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
          >
            Đồ đã mua
          </button>
        </div>
      </div>

      {/* Sub-filters (Chỉ hiện khi ở tab LISTINGS) */}
      {activeTab === "LISTINGS" && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-100">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "APPROVED", label: "Đang bán" },
            { id: "PENDING", label: "Chờ duyệt" },
            { id: "REJECTED", label: "Bị từ chối" },
            { id: "SOLD", label: "Đã bán" },
            { id: "DRAFT", label: "Bản nháp" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={
            activeTab === "LISTINGS"
              ? "Tìm trong tin đăng..."
              : "Tìm trong lịch sử mua..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <i className="fa-solid fa-circle-notch animate-spin text-4xl text-indigo-500"></i>
          <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : filteredList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredList.map((p, index) => (
            <div key={`${p.id}-${index}`} className="relative group">
              <ProductCard product={p} />

              {/* Badge Riêng cho Tab Tin đăng bán */}
              {activeTab === "LISTINGS" &&
                (p.status === "PENDING" ||
                  p.status === "REJECTED" ||
                  p.aiStatus === "SCAM") && (
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {(p.aiStatus === "WARNING" || p.aiStatus === "SCAM") && (
                      <span
                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase flex items-center gap-1 text-white ${
                          p.aiStatus === "SCAM" ? "bg-red-600" : "bg-yellow-500"
                        }`}
                      >
                        <i className="fa-solid fa-triangle-exclamation"></i> AI:{" "}
                        {p.aiStatus}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-md text-[9px] font-black uppercase flex items-center gap-1 text-white ${
                        p.status === "REJECTED" ? "bg-gray-800" : "bg-blue-500"
                      }`}
                    >
                      {p.status === "PENDING" ? "Đang duyệt" : "Bị từ chối"}
                    </span>
                  </div>
                )}

              {/* Badge Riêng cho Tab Đã mua */}
              {activeTab === "PURCHASED" && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase bg-green-500 text-white flex items-center gap-1 shadow-md">
                    <i className="fa-solid fa-bag-shopping"></i> Đã mua
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-gray-300">
          <i className="fa-solid fa-box-open text-4xl text-gray-200 mb-4"></i>
          <h3 className="font-bold text-gray-900 text-lg">
            {activeTab === "LISTINGS"
              ? "Chưa có tin đăng nào"
              : "Chưa mua món nào"}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Danh sách trống trơn. Hãy thử đăng bán hoặc mua sắm nhé!
          </p>
        </div>
      )}
    </div>
  );
};

export default MyShopPage;
