import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import ChatHeader from "../components/conversation/ChatHeader";
import ChatInput from "../components/conversation/ChatInput";
import ChatMessages from "../components/conversation/ChatMessages";
import ReviewModal from "../components/conversation/ReviewModal";
import {
  ConversationDetails,
  Message,
} from "../components/conversation/types";
import { useAuth } from "../context/AuthContext";
import {
  checkUserOnlineAPI,
  confirmTransactionAPI,
  createReviewAPI,
  getConversationsAPI,
  getMessagesAPI,
  getProductDetailAPI,
  getTransactionByProductAPI,
  markAsReadAPI,
} from "../config/api";
import { getImageUrl } from "../utils/imageHelper";

const formatTimeDisplay = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return time;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${time} ${day}/${month}`;
};

const ConversationPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [details, setDetails] = useState<ConversationDetails | null>(
    location.state?.conversationDetails || null,
  );
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [chatClosed, setChatClosed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const initData = async () => {
      console.log("[DEBUG] Current User:", user);

      let currentDetails = details;

      if (!currentDetails && conversationId) {
        try {
          const res: any = await getConversationsAPI();
          const dataList = Array.isArray(res) ? res : res?.data || [];
          currentDetails = dataList.find((c: any) => c.id === conversationId);
          if (currentDetails) setDetails(currentDetails);
        } catch (e) {
          console.error("Lỗi load conversation:", e);
        }
      }

      console.log("[DEBUG] Conversation Details:", currentDetails);

      if (currentDetails && user) {
        try {
          console.log("[DEBUG] Fetching Product ID:", currentDetails.productId);

          const productRes: any = await getProductDetailAPI(
            currentDetails.productId,
          );
          console.log("[DEBUG] Product API RAW Res:", productRes);

          const productData =
            productRes?.data?.data || productRes?.data || productRes;

          console.log("[DEBUG] Parsed Product Data:", productData);

          if (productData) {
            const sellerId = productData.sellerId || productData.userId;
            console.log(
              `[DEBUG] So sánh ID: Seller(${sellerId}) vs User(${user.id})`,
            );

            setIsOwner(String(sellerId) === String(user.id));

            if (
              productData.status === "SOLD" ||
              productData.status === "COMPLETED"
            ) {
              console.log("[DEBUG] Sản phẩm đã bán -> Khóa chat.");
              setChatClosed(true);

              try {
                console.log(
                  "[DEBUG] Đang tìm Transaction ID cho sản phẩm:",
                  currentDetails.productId,
                );
                const txRes: any = await getTransactionByProductAPI(
                  currentDetails.productId,
                );
                const txData = txRes?.data?.data || txRes?.data || txRes;

                if (txData?.id) {
                  console.log("[DEBUG] Đã lấy được TransactionID:", txData.id);
                  setTransactionId(txData.id);
                } else {
                  console.warn(
                    "[DEBUG] Không tìm thấy ID trong response transaction",
                  );
                }
              } catch (txError) {
                console.error("[DEBUG] Lỗi khi lấy Transaction ID:", txError);
              }
            }
          }
        } catch (err) {
          console.error("Lỗi check owner:", err);
        }
      }
    };

    initData();
  }, [conversationId, user]);

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

      if (typeof res === "boolean") {
        isOnline = res;
      } else if (res?.data === true || res?.data === false) {
        isOnline = res.data;
      } else if (res?.data?.data === true || res?.data?.data === false) {
        isOnline = res.data.data;
      }

      setPartnerOnline(isOnline);
    } catch (e) {
      setPartnerOnline(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res: any = await getMessagesAPI(conversationId!);
      setMessages(res?.result || res?.data?.result || []);
    } catch (e) {
      console.error("Lỗi load tin nhắn:", e);
    }
  };

  const connectWS = () => {
    const socket = new SockJS("http://localhost:8089/ws");

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);

        client.subscribe(`/topic/conversations/${conversationId}`, (msg) => {
          const message: Message = JSON.parse(msg.body);
          setMessages((prev) => [...prev, message]);
        });

        client.subscribe("/user/queue/errors", (msg) => {
          const err = JSON.parse(msg.body);

          if (err.resultDesc === "TRANSACTION_COMPLETED") {
            setChatClosed(true);
            alert("Giao dịch đã hoàn tất!");
          }
        });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;
  };

  const sendMessage = () => {
    if (chatClosed || !input.trim() || !connected) return;

    shouldAutoScrollRef.current = true;

    clientRef.current?.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ conversationId, content: input }),
    });

    setInput("");
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  const handleConfirmTransaction = async () => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xác nhận bán sản phẩm này cho ${details?.partnerName}?`,
      )
    ) {
      return;
    }

    try {
      setConfirming(true);
      const res: any = await confirmTransactionAPI(conversationId!);
      console.log("[DEBUG] Confirm Transaction Res:", res);

      if (res?.id) {
        setChatClosed(true);
        setTransactionId(res.id);
        alert("Giao dịch thành công! Đơn hàng đã được tạo.");
      } else {
        alert("Xác nhận giao dịch thất bại.");
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
      const payload = { transactionId, rating, comment };
      console.log("[DEBUG] Sending review:", payload);

      await createReviewAPI(payload);
      alert("Đánh giá thành công! Cảm ơn bạn.");
      setHasReviewed(true);
      setShowReviewModal(false);
    } catch (error: any) {
      console.error("Lỗi review:", error);
      const errorRes = error.response?.data;

      if (errorRes?.resultDesc === "REVIEW_ALREADY_EXISTS") {
        alert("Bạn đã đánh giá giao dịch này rồi.");
        setHasReviewed(true);
        setShowReviewModal(false);
      } else {
        alert(
          "Có lỗi xảy ra: " + (errorRes?.message || "Vui lòng thử lại"),
        );
      }
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const previousLength = prevMessagesLengthRef.current;
    const hasNewMessage = messages.length > previousLength;

    if (
      previousLength === 0 ||
      (hasNewMessage && shouldAutoScrollRef.current)
    ) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: previousLength === 0 ? "auto" : "smooth",
      });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  if (!user?.id) {
    return <div className="p-20 text-center">Vui lòng đăng nhập</div>;
  }

  if (!details && !messages.length) {
    return <div className="p-20 text-center">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 my-4">
      <ChatHeader
        chatClosed={chatClosed}
        confirming={confirming}
        details={details}
        hasReviewed={hasReviewed}
        isOwner={isOwner}
        partnerOnline={partnerOnline}
        transactionId={transactionId}
        getImageUrl={getImageUrl}
        onBack={() => navigate(-1)}
        onConfirmTransaction={handleConfirmTransaction}
        onOpenProduct={(productId) => navigate(`/products/${productId}`)}
        onOpenReview={() => setShowReviewModal(true)}
      />

      {chatClosed && (
        <div className="bg-green-50 text-green-800 text-sm font-bold text-center py-3 border-b border-green-100 flex items-center justify-center gap-2">
          <i className="fa-solid fa-circle-check text-green-600 text-lg"></i>
          Giao dịch đã hoàn thành thành công!
        </div>
      )}

      <ChatMessages
        connected={connected}
        currentUserId={user.id}
        messages={messages}
        messagesContainerRef={messagesContainerRef}
        onScroll={handleMessagesScroll}
        formatTimeDisplay={formatTimeDisplay}
      />

      <ChatInput
        chatClosed={chatClosed}
        connected={connected}
        input={input}
        onInputChange={setInput}
        onSend={sendMessage}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        partnerName={details?.partnerName || "Đối tác"}
      />
    </div>
  );
};

export default ConversationPage;
