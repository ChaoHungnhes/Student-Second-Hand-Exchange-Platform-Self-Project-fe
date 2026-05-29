export enum ProductStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  IN_NEGOTIATION = "IN_NEGOTIATION",
  SOLD = "SOLD",
  ARCHIVED = "ARCHIVED",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  WARNING = "WARNING",
  RESTRICTED = "RESTRICTED",
  BLOCKED = "BLOCKED",
  INACTIVE = "INACTIVE",
}

export enum UserRole {
  USER = "USER",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

export enum AIStatus {
  OK = "OK",
  WARNING = "WARNING",
  SCAM = "SCAM",
  SPAM = "SPAM",
  PENDING = "PENDING",
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  rating: number;
  createdAt: string;
  totalProducts: number;
  soldProducts: number;
  activeProducts: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  aiStatus: AIStatus;
  aiNote?: string;
  sellerName: string;
  sellerId: string;
  categoryName: string;
  imageUrls: string[];
  createdAt: string;
  // Location
  city: string;
  ward: string;
  addressDetail: string;
  // Admin feedback
  adminNote?: string;
  // Sold metadata
  soldAt?: string;
  buyerName?: string;
}

export interface Conversation {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  lastMessage?: string;
  status: ConversationStatus;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export enum ReportReason {
  SPAM = "SPAM",
  FRAUD = "FRAUD",
  ABUSIVE_LANGUAGE = "ABUSIVE_LANGUAGE",
  FAKE_PRODUCT = "FAKE_PRODUCT",
  OTHER = "OTHER",
  SCAM = "SCAM",
}

export interface Review {
  reviewId: string;
  targetId: string;
  targetName: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  transactionId: string;
  productId: string;
  reviewerAvatar?: string; // Có thể dùng dicebear nếu BE không trả về
}

//------------------------------------------------------------------------------------------------

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ConversationStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export enum AuditAction {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  DELETE = "DELETE",
  BLOCK = "BLOCK",
  UNBLOCK = "UNBLOCK",
  UPDATE_ROLE = "UPDATE_ROLE",
  STATUS_CHANGE = "STATUS_CHANGE",
  LOGIN = "LOGIN",
}

export enum AuditTargetType {
  PRODUCT = "PRODUCT",
  USER = "USER",
  TRANSACTION = "TRANSACTION",
  CONVERSATION = "CONVERSATION",
  SYSTEM = "SYSTEM",
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  rating: number;
  countByReview: number;
  totalProducts: number;
  soldProducts: number;
  activeProducts: number;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  aiStatus: AIStatus;
  aiNote?: string;
  sellerName: string;
  sellerId: string;
  categoryName: string;
  categoryId?: number;
  imageUrls: string[];
  createdAt: string;
  city: string;
  ward: string;
  addressDetail: string | null;
  adminNote?: string | null;
  sellerRating?: number;
  soldAt?: string;
  buyerName?: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  productId: string;
  productTitle: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId: string;
  targetUserName: string;
  reason: ReportReason;
  note: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: ConversationStatus;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  actorId: string;
  actorRole: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}
