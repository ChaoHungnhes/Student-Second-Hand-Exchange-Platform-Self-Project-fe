// src/utils/imageHelper.ts

export const getImageUrl = (url?: string | null) => {
  if (!url) return 'https://via.placeholder.com/150?text=No+Image';
  
  // Nếu là ảnh online (bắt đầu bằng http) -> Giữ nguyên
  if (url.startsWith('http')) return url;
  
  // Nếu là ảnh từ server (bắt đầu bằng /uploads) -> Ghép host backend vào
  // Lưu ý: Đảm bảo http://localhost:8089 là chính xác port backend của bạn
  return `http://localhost:8089${url}`; 
};