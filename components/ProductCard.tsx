import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  
  // 1. Hàm lấy label trạng thái
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Đang bán';
      case 'SOLD': return 'Đã bán';
      case 'PENDING': return 'Chờ duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  };

  // 2. Hàm lấy màu trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'SOLD': return 'bg-gray-200 text-gray-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 3. Xử lý đường dẫn ảnh (QUAN TRỌNG)
  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/400x400?text=No+Image';
    
    // Nếu là ảnh online (bắt đầu bằng http) -> Giữ nguyên
    if (url.startsWith('http')) return url;
    
    // Nếu là ảnh từ server (bắt đầu bằng /uploads) -> Ghép host backend vào
    // Backend đang chạy ở port 8089
    return `http://localhost:8089${url}`; 
  };

  // Lấy ảnh đầu tiên trong mảng
  const displayImage = product.imageUrls && product.imageUrls.length > 0 
    ? getImageUrl(product.imageUrls[0]) 
    : 'https://via.placeholder.com/400x400?text=No+Image';

  // Avatar người bán (Dùng DiceBear nếu chưa có ảnh thật)
  const sellerAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.sellerName}`;

  return (
    <Link to={`/products/${product.id}`} className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group h-full flex flex-col">
      
      {/* --- PHẦN ẢNH SẢN PHẨM --- */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={displayImage} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Xử lý khi ảnh bị lỗi (404)
            // (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Error';
          }}
        />
        
        {/* Badge Trạng thái */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider z-10 ${getStatusColor(product.status)}`}>
          {getStatusLabel(product.status)}
        </div>

        {/* Lớp phủ khi đã bán */}
        {product.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <span className="text-white font-bold text-xl uppercase tracking-widest border-2 border-white px-4 py-1">Đã bán</span>
          </div>
        )}
      </div>
      
      {/* --- PHẦN THÔNG TIN --- */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="font-semibold text-gray-900 truncate flex-1 group-hover:text-indigo-600 transition-colors" title={product.title}>
            {product.title}
          </h3>
          <span className="text-indigo-600 font-bold whitespace-nowrap">
            {product.price.toLocaleString('vi-VN')}đ
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <i className="fa-solid fa-layer-group text-[10px]"></i> {product.categoryName}
        </p>
        
        {/* --- PHẦN NGƯỜI BÁN & RATING --- */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <img src={sellerAvatarUrl} className="w-6 h-6 rounded-full border border-gray-200 object-cover" alt="avatar" />
            <span className="text-xs text-gray-600 font-medium truncate max-w-[100px]" title={product.sellerName}>
              {product.sellerName}
            </span>
          </div>
          
          {/* Hiển thị Rating thật từ API */}
          <div className="flex items-center text-yellow-500 text-[10px] sm:text-xs gap-1 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">
            <span className="font-bold">{product.sellerRating ? product.sellerRating.toFixed(1) : '0.0'}</span>
            <i className="fa-solid fa-star text-[10px]"></i>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;