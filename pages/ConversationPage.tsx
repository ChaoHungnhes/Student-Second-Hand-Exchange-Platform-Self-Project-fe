import React, { useEffect, useRef, useState } from 'react';

import { useNavigate, useParams, useLocation } from 'react-router-dom';

import SockJS from 'sockjs-client';

import { Client } from '@stomp/stompjs';

import { useAuth } from '../context/AuthContext';

import {

  getMessagesAPI,

  markAsReadAPI,

  checkUserOnlineAPI,

  getConversationsAPI,

  getProductDetailAPI,

  confirmTransactionAPI,
  createReviewAPI,
  getTransactionByProductAPI

} from '../config/api';

import { getImageUrl } from '../utils/imageHelper';



// --- INTERFACES ---

interface Message {

  id: string;

  senderId: string;

  content: string;

  createdAt: string;

}



interface ConversationDetails {

  id: string;

  partnerId: string;

  partnerName: string;

  partnerAvatar: string | null;

  productId: string;

  productTitle: string;

  productImage: string | null;

  productPrice: number;

}

// ✨ [NEW] Interface cho Review Modal
interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    partnerName: string;
}

// ✨ [NEW] Component Modal Đánh giá (Viết trực tiếp hoặc tách file)
const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, partnerName }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <h3 className="text-xl font-bold text-center mb-2">Đánh giá giao dịch</h3>
                <p className="text-gray-500 text-center text-sm mb-6">
                    Bạn cảm thấy thế nào về <span className="font-bold text-indigo-600">{partnerName}</span>?
                </p>

                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                        >
                            <i className={`fa-solid fa-star ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                        </button>
                    ))}
                </div>

                <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                    placeholder="Nhập nhận xét của bạn (Tùy chọn)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm">
                        Để sau
                    </button>
                    <button 
                        onClick={() => onSubmit(rating, comment)}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    >
                        Gửi đánh giá
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- HELPER FORMAT THỜI GIAN ---

const formatTimeDisplay = (dateString: string) => {

  if (!dateString) return '';

  const date = new Date(dateString);

  const now = new Date();

 

  const isToday = date.getDate() === now.getDate() &&

                  date.getMonth() === now.getMonth() &&

                  date.getFullYear() === now.getFullYear();



  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });



  if (isToday) {

    return time;

  } else {

    const day = date.getDate().toString().padStart(2, '0');

    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    return `${time} ${day}/${month}`;

  }

};



const ConversationPage: React.FC = () => {

  const { conversationId } = useParams<{ conversationId: string }>();

  const navigate = useNavigate();

  const location = useLocation();

  const { user } = useAuth();

 

  // --- STATE DỮ LIỆU ---

  const [messages, setMessages] = useState<Message[]>([]);

  const [details, setDetails] = useState<ConversationDetails | null>(location.state?.conversationDetails || null);

  const [partnerOnline, setPartnerOnline] = useState(false);

 

  // --- STATE LOGIC ---

  const [input, setInput] = useState('');

  const [connected, setConnected] = useState(false);

  const [chatClosed, setChatClosed] = useState(false);

 

  // State xác nhận giao dịch

  const [isOwner, setIsOwner] = useState(false);

  const [confirming, setConfirming] = useState(false);

// ✨ [NEW] State cho Transaction và Review
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false); // Check nếu đã đánh giá rồi (logic UI tạm thời)

  const clientRef = useRef<Client | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);



  // 1. KHỞI TẠO: Load Details & Check Owner

  useEffect(() => {

    const initData = async () => {

        // [LOG DEBUG 1] Kiểm tra User hiện tại

        console.log("🔍 [DEBUG] Current User:", user);



        // A. Load Details nếu bị mất state (do F5)

        let currentDetails = details;

        if (!currentDetails && conversationId) {

            try {

                const res: any = await getConversationsAPI();

                const dataList = Array.isArray(res) ? res : (res?.data || []);

                currentDetails = dataList.find((c: any) => c.id === conversationId);

                if (currentDetails) setDetails(currentDetails);

            } catch (e) {

                console.error("Lỗi load conversation:", e);

            }

        }



        // [LOG DEBUG 2] Kiểm tra thông tin cuộc hội thoại

        console.log("🔍 [DEBUG] Conversation Details:", currentDetails);



        // B. Check xem mình có phải là người bán (Owner) không để hiện nút Chốt đơn

        if (currentDetails && user) {

            try {

                console.log("🔍 [DEBUG] Fetching Product ID:", currentDetails.productId);

                const productRes: any = await getProductDetailAPI(currentDetails.productId);

               

                // [LOG DEBUG 3] Kiểm tra response API Product

                console.log("🔍 [DEBUG] Product API RAW Res:", productRes);



                // Xử lý response data lồng nhau nếu có

                // Ưu tiên res.data.data (nếu axios raw), sau đó res.data (nếu interceptor), cuối cùng là res

                const productData = productRes?.data?.data || productRes?.data || productRes;

               

                console.log("🔍 [DEBUG] Parsed Product Data:", productData);



                if (productData) {

                    const sellerId = productData.sellerId || productData.userId; // Check cả 2 trường hợp tên field

                   

                    console.log(`🔍 [DEBUG] So sánh ID: Seller(${sellerId}) vs User(${user.id})`);



                    // Nếu mình là người bán

                    // Ép kiểu về string để so sánh an toàn

                    if (String(sellerId) === String(user.id)) {

                        console.log("✅ [DEBUG] MATCH! User là người bán -> setIsOwner(true)");

                        setIsOwner(true);

                    } else {

                        console.log("❌ [DEBUG] NOT MATCH! User không phải người bán.");

                        setIsOwner(false);

                    }



                    // Nếu sản phẩm đã bán -> Khóa chat

                    if (productData.status === 'SOLD' || productData.status === 'COMPLETED') {

                        console.log("🔒 [DEBUG] Sản phẩm đã bán -> Khóa chat.");

                        setChatClosed(true);
                        try {
                            console.log("🔍 Đang tìm Transaction ID cho sản phẩm:", currentDetails.productId);
                            const txRes: any = await getTransactionByProductAPI(currentDetails.productId);
                            
                            // [PHÂN TÍCH RESPONSE CỦA BẠN]
                            // txRes.data = { resultCode: 200, data: { id: "...", ... } }
                            // Nên transaction data nằm ở txRes.data.data
                            const txData = txRes?.data?.data || txRes?.data || txRes;

                            if (txData && txData.id) {
                                console.log("✅ Đã lấy được TransactionID:", txData.id);
                                setTransactionId(txData.id); // Lưu vào state để hiện nút Đánh giá
                            } else {
                                console.warn("⚠️ Không tìm thấy ID trong response transaction");
                            }
                        } catch (txError) {
                            console.error("❌ Lỗi khi lấy Transaction ID:", txError);
                        }

                    }

                }

            } catch (err) {

                console.error("Lỗi check owner:", err);

            }

        }

    };



    initData();

  }, [conversationId, user]); // Bỏ details khỏi dependency để tránh loop



  // 2. LOGIC CHÍNH: Load tin nhắn, WebSocket, Check Online

  useEffect(() => {

    if (!conversationId) return;



    fetchMessages();

    markAsReadAPI(conversationId);

    connectWS();



    if (details?.partnerId) {

        checkUserOnline(details.partnerId);

    }



    return () => {

      clientRef.current?.deactivate();

    };

  }, [conversationId]);



  useEffect(() => {

      if (details?.partnerId) {

          checkUserOnline(details.partnerId);

      }

  }, [details]);



  const checkUserOnline = async (partnerId: string) => {

      try {

          const res: any = await checkUserOnlineAPI(partnerId);

          let isOnline = false;



          if (typeof res === 'boolean') {

              isOnline = res;

          }

          else if (res?.data === true || res?.data === false) {

              isOnline = res.data;

          }

          else if (res?.data?.data === true || res?.data?.data === false) {

              isOnline = res.data.data;

          }



          setPartnerOnline(isOnline);

      } catch (e) {

          // console.error("Check online err", e); // Tạm tắt log rác

          setPartnerOnline(false);

      }

  };



  const fetchMessages = async () => {

    try {

        const res: any = await getMessagesAPI(conversationId!);

        const msgs = res?.result || res?.data?.result || [];

        setMessages(msgs);

    } catch (e) {

        console.error("Lỗi load tin nhắn:", e);

    }

  };



  const connectWS = () => {

    const socket = new SockJS('http://localhost:8089/ws', null, { withCredentials: true });

    const client = new Client({

      webSocketFactory: () => socket,

      reconnectDelay: 5000,

      onConnect: () => {

        setConnected(true);

        client.subscribe(`/topic/conversations/${conversationId}`, (msg) => {

          const message: Message = JSON.parse(msg.body);

          setMessages((prev) => [...prev, message]);

        });

       

        client.subscribe('/user/queue/errors', (msg) => {

            const err = JSON.parse(msg.body);

            if (err.resultDesc === 'TRANSACTION_COMPLETED') {

                setChatClosed(true);

                alert("Giao dịch đã hoàn tất!");

            }

        });

      },

      onDisconnect: () => setConnected(false)

    });

    client.activate();

    clientRef.current = client;

  };



  const sendMessage = () => {

    if (chatClosed || !input.trim() || !connected) return;

    clientRef.current?.publish({

      destination: '/app/chat.send',

      body: JSON.stringify({ conversationId, content: input })

    });

    setInput('');

  };



  // --- HÀM CHỐT ĐƠN ---

  const handleConfirmTransaction = async () => {

    if (!window.confirm(`Bạn có chắc chắn muốn xác nhận bán sản phẩm này cho ${details?.partnerName}?`)) {

        return;

    }



    try {

        setConfirming(true);

        const res: any = await confirmTransactionAPI(conversationId!);

        console.log("🔍 [DEBUG] Confirm Transaction Res:", res);

        // API trả về trực tiếp transaction object với id

        const isSuccess = res?.id ? true : false;

        console.log("🔍 [DEBUG] isSuccess:", isSuccess, "| id:", res?.id);

       

        if (isSuccess) {

          setChatClosed(true);
          setTransactionId(res.id);

          alert("🎉 Giao dịch thành công! Đơn hàng đã được tạo.");

        } else {

          alert("❌ Xác nhận giao dịch thất bại.");

        }

    } catch (error) {

        console.error("Lỗi chốt đơn:", error);

        alert("Có lỗi xảy ra khi xác nhận giao dịch.");

    } finally {

        setConfirming(false);

    }

  };

  const handleSubmitReview = async (rating: number, comment: string) => {
      if (!transactionId) {
          alert("Không tìm thấy mã giao dịch!");
          return;
      }

      try {
          const payload = {
              transactionId: transactionId,
              rating: rating,
              comment: comment
          };
          console.log("📤 Sending review:", payload);
          
          const res: any = await createReviewAPI(payload);
          
          // Check response backend trả về "Đánh giá thành công" hoặc object
          alert("✅ Đánh giá thành công! Cảm ơn bạn.");
          setHasReviewed(true);
          setShowReviewModal(false);

      } catch (error: any) {
          console.error("Lỗi review:", error);
          const errorRes = error.response?.data;
          
          if (errorRes?.resultDesc === 'REVIEW_ALREADY_EXISTS') {
              alert("⚠️ Bạn đã đánh giá giao dịch này rồi.");
              setHasReviewed(true); // Disable nút luôn
              setShowReviewModal(false);
          } else {
              alert("❌ Có lỗi xảy ra: " + (errorRes?.message || "Vui lòng thử lại"));
          }
      }
  };



  useEffect(() => {

    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages]);



  // --- RENDER ---

  if (!user) return <div className="p-20 text-center">Vui lòng đăng nhập</div>;

  if (!details && !messages.length) return <div className="p-20 text-center">Đang tải...</div>;



  return (

    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 my-4">

     

      {/* HEADER */}

      <div className="bg-indigo-600 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md z-10">

        <div className="flex items-center gap-4 w-full md:w-auto">

          <button onClick={() => navigate(-1)} className="hover:bg-white/20 p-2 rounded-full transition-colors">

            <i className="fa-solid fa-arrow-left"></i>

          </button>

         

          {/* Partner Info */}

          <div className="flex items-center gap-3">

             <div className="relative">

                <img

                    src={details?.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${details?.partnerName}`}

                    className="w-10 h-10 rounded-full bg-white/20 p-1 object-cover"

                    alt="partner"

                />

                {partnerOnline && (

                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full"></span>

                )}

            </div>

            <div>

              <h3 className="font-bold text-sm flex items-center gap-2">

                  {details?.partnerName}

                  {partnerOnline ? (

                      <span className="text-[9px] bg-green-500/20 text-green-100 px-1.5 rounded border border-green-400/30">Online</span>

                  ) : (

                      <span className="text-[9px] bg-gray-500/40 text-gray-200 px-1.5 rounded">Offline</span>

                  )}

              </h3>

              <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">

                  {isOwner ? 'Người mua' : 'Người bán'}

              </p>

            </div>

          </div>

        </div>



        {/* RIGHT SIDE: Product Card & Action Button */}

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">

           {chatClosed && transactionId && !hasReviewed && (
                <button 
                    onClick={() => setShowReviewModal(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 text-xs font-bold py-2 px-4 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 animate-pulse"
                >
                    <i className="fa-solid fa-star"></i>
                    ĐÁNH GIÁ
                </button>
            )}

            {/* ✨ [NEW] Nếu đã đánh giá */}
            {hasReviewed && (
                <span className="bg-gray-400/50 text-white/80 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 cursor-default">
                    <i className="fa-solid fa-check"></i>
                    ĐÃ ĐÁNH GIÁ
                </span>
            )}

            {/* 🔥 NÚT CHỐT ĐƠN */}

            {/* [DEBUG UI] Hiển thị lý do nếu nút bị ẩn */}

            {!isOwner && <span className="hidden">Không phải chủ</span>}

            {chatClosed && <span className="hidden">Đã đóng chat</span>}



            {isOwner && !chatClosed && (

                <button

                    onClick={handleConfirmTransaction}

                    disabled={confirming}

                    className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"

                >

                    {confirming ? (

                        <i className="fa-solid fa-circle-notch animate-spin"></i>

                    ) : (

                        <i className="fa-solid fa-handshake-simple"></i>

                    )}

                    CHỐT ĐƠN

                </button>

            )}



            {/* Product Mini Card */}

            {details && (

                <div

                    onClick={() => navigate(`/product/${details.productId}`)}

                    className="bg-white/10 hover:bg-white/20 transition-all rounded-2xl p-2 pr-4 flex items-center gap-3 cursor-pointer border border-white/10"

                >

                    <img

                        src={getImageUrl(details.productImage)}

                        className="w-10 h-10 rounded-lg object-cover bg-white"

                        alt="product"

                    />

                    <div className="flex-1 min-w-0 hidden sm:block">

                        <p className="text-xs font-bold truncate max-w-[100px]">{details.productTitle}</p>

                        <p className="text-xs font-black text-indigo-200">{details.productPrice?.toLocaleString('vi-VN')}đ</p>

                    </div>

                    <i className="fa-solid fa-chevron-right text-[10px] opacity-50"></i>

                </div>

            )}

        </div>

      </div>



      {/* STATUS ALERT */}

      {chatClosed && (

        <div className="bg-green-50 text-green-800 text-sm font-bold text-center py-3 border-b border-green-100 flex items-center justify-center gap-2">

          <i className="fa-solid fa-circle-check text-green-600 text-lg"></i>

          Giao dịch đã hoàn thành thành công!

        </div>

      )}



      {/* MESSAGES AREA */}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">

        <div className="text-center py-4">

          <span className="bg-gray-200/50 text-gray-500 text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest">

            {connected ? 'Đã kết nối' : 'Đang kết nối...'}

          </span>

        </div>



        {messages.map((m) => {

          const isMe = m.senderId === user.id;

          return (

            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>

                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm break-words ${

                  isMe

                  ? 'bg-indigo-600 text-white rounded-tr-none'

                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'

                }`}>

                  {m.content}

                </div>

                <span className="text-[9px] text-gray-400 font-medium px-2">

                    {formatTimeDisplay(m.createdAt)}

                </span>

              </div>

            </div>

          );

        })}

        <div ref={bottomRef} />

      </div>



      {/* INPUT AREA */}

      <div className="p-4 bg-white flex items-center gap-3 border-t border-gray-100">

        <button className="text-gray-400 hover:text-indigo-600 p-2 transition-colors">

          <i className="fa-solid fa-circle-plus text-xl"></i>

        </button>

        <div className="flex-1 relative">

          <input

            value={input}

            onChange={(e) => setInput(e.target.value)}

            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}

            disabled={chatClosed}

            placeholder={chatClosed ? "Giao dịch đã đóng" : "Nhập tin nhắn..."}

            className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"

          />

        </div>

        <button

          onClick={sendMessage}

          disabled={!input.trim() || !connected || chatClosed}

          className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 transition-all active:scale-95"

        >

          <i className="fa-solid fa-paper-plane"></i>

        </button>

      </div>

      {/* ✨ [NEW] Render Modal */}
      <ReviewModal 
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          partnerName={details?.partnerName || 'Đối tác'}
      />

    </div>

  );

};



export default ConversationPage;