export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface ConversationDetails {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  productId: string;
  productTitle: string;
  productImage: string | null;
  productPrice: number;
  buyerId?: string;
  buyerName?: string;
  sellerId?: string;
  sellerName?: string;
}



