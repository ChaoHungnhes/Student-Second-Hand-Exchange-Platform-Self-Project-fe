// src/types/index.ts
// Định nghĩa User khớp với dữ liệu đã xử lý trong AuthContext
export interface User {
  id?: string;
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
  status?: string;
  rating?: number;
  createdAt?: string;
  totalProducts?: number;
  soldProducts?: number;
  activeProducts?: number;
}

// Định nghĩa UserStats (Thống kê)
export interface UserStats {
  totalProducts: number;
  soldProducts: number;
  activeProducts: number;
}

export interface LoginResponse {
  token: string;
  name: string;
  // Backend có thể trả về "role" (string) hoặc "roles" (array), khai báo cả 2 cho chắc
  role?: string | string[]; 
  roles?: string | string[];
  authenticated: boolean;
  avatar?: string;
  status?: string;
}

export interface IntrospectResponse {
  valid: boolean;
}

// Định nghĩa response chung từ API
export interface ApiResponse<T> {
  resultCode: number;
  resultDesc: string;
  responseTime: string;
  data: T;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrls: string[];
  categoryName: string;
  
  // Thông tin người bán
  sellerName: string;
  sellerId: string;      // Mới thêm
  sellerRating: number;  // Mới thêm
  sellerAvatar?: string; // (Dự phòng nếu sau này có)

  status: string;       // APPROVED, SOLD...
  aiStatus?: string;    // OK, WARNING, SCAM, SPAM, PENDING
  aiNote?: string;      // AI moderation note
  adminNote?: string;   // Admin note
  createdAt: string;
  city?: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  owner: boolean;       // true nếu người xem là chủ bài đăng
  buyerInfo?: BuyerInfo | null; // Thông tin người mua (nếu đã bán)
}

export interface BuyerInfo {
  name: string;
  buyTime: string;
  avatar?: string;
}

export interface MetaData {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface ProductResponse {
  meta: MetaData;
  result: Product[];
}

export interface ProductParams {
  page?: number;
  size?: number;
  keyword?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  category?: string; 
  categoryId?: number;
  status?: string;   
  sortDir?: 'asc' | 'desc';
  sortBy?: string;
} 

export interface Category {
  id: number;
  name: string;
}

export interface Transaction {
  transactionId: string;
  transactionStatus: string;
  purchaseDate: string;
  
  productId: string;
  productTitle: string;
  productPrice: number;
  productThumbnail: string;
  productStatus: string;
  
  sellerName: string;
  sellerId: string;
}

export interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  productId: string;
  productTitle: string;
  productImage: string | null;
  productPrice: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

