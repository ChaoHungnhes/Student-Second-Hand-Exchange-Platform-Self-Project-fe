import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import thêm searchConversationsAPI
import { getConversationsAPI, checkUserOnlineAPI, searchConversationsAPI } from '../config/api';
import { getImageUrl } from '../utils/imageHelper'; 

// Interface khớp với API response
interface ConversationItem {
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

// Hàm format thời gian thông minh
const formatTimeDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return time;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${time} ${day}/${month}`;
};

const ConversationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State tìm kiếm
  const [keyword, setKeyword] = useState('');
  
  // Map lưu trạng thái online
  const [onlineStatusMap, setOnlineStatusMap] = useState<Record<string, boolean>>({});

  // Effect xử lý tìm kiếm (Debounce 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations(keyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]); // Chạy lại khi keyword thay đổi

  const fetchConversations = async (searchKey: string = '') => {
    try {
      setLoading(true);
      let res: any;

      // 🔍 LOGIC CHỌN API
      if (searchKey.trim()) {
        console.log("Đang tìm kiếm với từ khóa:", searchKey);
        res = await searchConversationsAPI(searchKey);
      } else {
        console.log("Lấy danh sách mặc định");
        res = await getConversationsAPI();
      }

      // Xử lý dữ liệu trả về (support cả 2 cấu trúc response nếu có)
      const list: ConversationItem[] = res?.data || res || [];
      setConversations(list);

      // Check online cho danh sách vừa tải được
      if (list.length > 0) {
        checkPartnersOnline(list);
      }
    } catch (e) {
      console.error("Lỗi tải hội thoại:", e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPartnersOnline = async (list: ConversationItem[]) => {
    const statusMap: Record<string, boolean> = {};
    const uniquePartnerIds = [...new Set(list.map(item => item.partnerId))];

    await Promise.all(
      uniquePartnerIds.map(async (partnerId) => {
        try {
          const res: any = await checkUserOnlineAPI(partnerId);
          let isOnline = false;
          // Logic check response an toàn
          if (typeof res === 'boolean') isOnline = res;
          else if (res?.data === true) isOnline = true;
          else if (res?.data?.data === true) isOnline = true;
          
          statusMap[partnerId] = isOnline;
        } catch (err) {
          statusMap[partnerId] = false;
        }
      })
    );
    // Merge với state cũ để không bị mất status của các user cũ khi search
    setOnlineStatusMap(prev => ({ ...prev, ...statusMap }));
  };

  const handleNavigate = (chat: ConversationItem) => {
    navigate(`/chat/${chat.id}`, { state: { conversationDetails: chat } });
  };

  if (!user) return <div className="p-20 text-center">Vui lòng đăng nhập để xem tin nhắn.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <i className="fa-solid fa-comments text-indigo-600"></i>
            Messenger
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Bạn có {conversations.filter(c => c.unreadCount > 0).length} tin nhắn chưa đọc
          </p>
        </div>

        {/* 🔍 SEARCH BAR */}
        <div className="relative w-full md:w-72">
          <input 
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên bạn bè, tên sp..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          
          {/* Nút xóa text search */}
          {keyword && (
            <button 
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* LIST CONTAINER */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mock Tabs */}
        <div className="flex border-b border-gray-50">
          <button className="flex-1 py-4 text-sm font-black text-indigo-600 border-b-2 border-indigo-600 uppercase tracking-widest">Tất cả</button>
          <button className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Mua đồ</button>
          <button className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Bán đồ</button>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <i className="fa-solid fa-circle-notch animate-spin text-3xl text-indigo-600"></i>
            <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">Đang tải...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.length > 0 ? (
              conversations.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => handleNavigate(chat)}
                  className={`p-4 sm:p-6 flex items-center gap-4 hover:bg-indigo-50/30 cursor-pointer transition-all relative ${chat.unreadCount > 0 ? 'bg-indigo-50/10' : ''}`}
                >
                  {/* Product Image */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img 
                        src={getImageUrl(chat.productImage)} 
                        alt="product" 
                        className="w-full h-full object-cover" 
                        // onError={(e) => {
                        //   (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Img';
                        // }}
                      />
                    </div>
                    {/* Partner Avatar */}
                    <div className="absolute -bottom-1 -right-1 relative">
                        <img 
                            src={chat.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.partnerName}`} 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-white" 
                            alt="avatar"
                        />
                        {/* 🟢 ONLINE INDICATOR */}
                        {onlineStatusMap[chat.partnerId] && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                        )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm font-black truncate max-w-[150px] sm:max-w-none ${chat.unreadCount > 0 ? 'text-gray-900' : 'text-gray-600'}`}>
                        {/* Highlight từ khóa tìm kiếm nếu có thể (Optional) */}
                        {chat.partnerName}
                      </h3>
                      <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                        {formatTimeDisplay(chat.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-tighter mb-1 truncate">
                      Sản phẩm: {chat.productTitle}
                    </p>
                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium'}`}>
                      {chat.lastMessage}
                    </p>
                  </div>

                  {/* Unread Dot */}
                  {chat.unreadCount > 0 && (
                    <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 flex-shrink-0"></div>
                  )}
                  
                  <div className="ml-2">
                    <i className="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                {keyword ? (
                  <>
                    <i className="fa-solid fa-magnifying-glass text-5xl text-gray-100"></i>
                    <p className="text-gray-400 font-medium">Không tìm thấy kết quả cho "{keyword}"</p>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-message-slash text-5xl text-gray-100"></i>
                    <p className="text-gray-400 font-medium">Chưa có cuộc hội thoại nào.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Tip */}
      <div className="mt-8 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-100">
          <i className="fa-solid fa-shield-heart"></i>
        </div>
        <div>
          <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wide mb-1">Giao dịch an toàn</h4>
          <p className="text-xs text-indigo-700 leading-relaxed font-medium">
            Hãy nhắn tin hẹn gặp tại các khu vực đông người trong khuôn viên trường. Không chuyển khoản trước khi kiểm tra trực tiếp sản phẩm.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationListPage;