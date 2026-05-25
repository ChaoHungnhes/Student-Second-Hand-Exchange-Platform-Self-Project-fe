import React from "react";
import { Product } from "../../types/index";

interface ProductImageGalleryProps {
  activeImage: number;
  product: Product;
  getImageUrl: (url?: string) => string;
  onSelectImage: (index: number) => void;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  activeImage,
  product,
  getImageUrl,
  onSelectImage,
}) => {
  const isSold = product.status === "SOLD";

  return (
    <div className="space-y-5 lg:col-span-7">
      <div className="group relative aspect-square overflow-hidden rounded-[40px] border border-white bg-white shadow-2xl shadow-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 via-transparent to-cyan-100/30"></div>
        <img
          src={product.imageUrls.length > 0 ? getImageUrl(product.imageUrls[activeImage]) : getImageUrl()}
          alt={product.title}
          className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${isSold ? "grayscale blur-[1px]" : ""}`}
        />
        {isSold && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/55">
            <span className="inline-block -rotate-12 border-8 border-white px-10 py-4 text-6xl font-black uppercase tracking-tighter text-white shadow-2xl">ĐÃ BÁN</span>
          </div>
        )}
        {product.status === "REJECTED" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-rose-950/50">
            <span className="-rotate-12 border-4 border-white px-8 py-3 text-4xl font-black uppercase text-white">BỊ TỪ CHỐI</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto rounded-[28px] border border-white bg-white/80 p-3 shadow-lg shadow-slate-100 backdrop-blur no-scrollbar">
        {product.imageUrls.map((url, idx) => (
          <button
            key={idx}
            onClick={() => onSelectImage(idx)}
            className={`h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl border-2 transition-all ${activeImage === idx ? "scale-105 border-orange-500 shadow-lg shadow-orange-100" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <img src={getImageUrl(url)} className="h-full w-full object-cover" alt="thumb" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;
