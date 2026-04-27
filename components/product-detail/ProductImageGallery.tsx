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
    <div className="lg:col-span-7 space-y-4">
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm group">
        <img
          src={
            product.imageUrls.length > 0
              ? getImageUrl(product.imageUrls[activeImage])
              : getImageUrl()
          }
          alt={product.title}
          className={`w-full h-full object-cover transition-all duration-500 ${isSold ? "grayscale blur-[1px]" : ""}`}
        />
        {isSold && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="text-white font-black text-6xl border-8 border-white px-10 py-4 transform -rotate-12 inline-block uppercase tracking-tighter shadow-2xl">
              ĐÃ BÁN
            </span>
          </div>
        )}
        {product.status === "REJECTED" && (
          <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center z-10">
            <span className="text-white font-black text-4xl border-4 border-white px-8 py-3 transform -rotate-12 uppercase">
              BỊ TỪ CHỐI
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {product.imageUrls.map((url, idx) => (
          <button
            key={idx}
            onClick={() => onSelectImage(idx)}
            className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? "border-indigo-600 scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <img
              src={getImageUrl(url)}
              className="w-full h-full object-cover"
              alt="thumb"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;
