import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { chatBotAPI, getProductsAPI } from "../config/api";
import { getImageUrl } from "../utils/imageHelper";

type ProductSuggestion = {
  id: string;
  title: string;
  price: number;
  categoryName: string;
  image: string;
  city: string;
  ward: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  products?: ProductSuggestion[];
  createdAt: Date;
};

const suggestedQuestions = [
  "Tôi muốn tìm laptop cũ",
  "Có hỗ trợ giao hàng không?",
  "Tôi muốn tìm sách cũ",
  "Hotline hỗ trợ là gì?",
];

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const CHATBOT_SESSION_STORAGE_KEY = "s2sChatBotSessionId";
const MAX_MESSAGE_LENGTH = 1000;

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createSessionId = () =>
  `s2s-chat-session-${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`.slice(
    0,
    80,
  );

const getChatSessionId = () => {
  const storedSessionId = localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
  if (storedSessionId && storedSessionId.length <= 80) return storedSessionId;

  const newSessionId = createSessionId();
  localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, newSessionId);
  return newSessionId;
};

const buildSearchKeywords = (message: string) => {
  const normalized = message
    .toLowerCase()
    .replace(/\b(tôi|minh|mình|muốn|cần|tìm|kiếm|mua|cũ|sản phẩm|đồ)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return Array.from(new Set([message.trim(), normalized].filter(Boolean)));
};

const findFallbackProducts = async (
  message: string,
): Promise<ProductSuggestion[]> => {
  for (const keyword of buildSearchKeywords(message)) {
    try {
      const response: any = await getProductsAPI({
        page: 0,
        size: 4,
        keyword,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      const products = Array.isArray(response?.result) ? response.result : [];
      if (products.length > 0) {
        return products.map((product: any) => ({
          id: String(product.id),
          title: product.title,
          price: Number(product.price) || 0,
          categoryName: product.categoryName,
          image:
            product.image || product.imageUrl || product.imageUrls?.[0] || "",
          city: product.city,
          ward: product.ward,
        }));
      }
    } catch (error) {
      console.error("Fallback chatbot product search failed:", error);
    }
  }

  return [];
};

const ProductSuggestionCard: React.FC<{ product: ProductSuggestion }> = ({
  product,
}) => (
  <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm">
    <img
      src={getImageUrl(product.image)}
      alt={product.title}
      className="h-20 w-20 flex-shrink-0 rounded-xl object-cover bg-slate-100"
      onError={(event) => {
        event.currentTarget.src = "https://via.placeholder.com/160?text=S2S";
      }}
    />
    <div className="min-w-0 flex-1">
      <h4
        className="line-clamp-2 text-sm font-bold text-slate-900"
        title={product.title}
      >
        {product.title}
      </h4>
      <p className="mt-1 text-sm font-extrabold text-emerald-600">
        {currencyFormatter.format(product.price || 0)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        <i className="fa-solid fa-layer-group mr-1"></i>
        {product.categoryName || "Khác"}
      </p>
      <p className="text-xs text-slate-500 truncate">
        <i className="fa-solid fa-location-dot mr-1 text-emerald-500"></i>
        {[product.ward, product.city].filter(Boolean).join(", ")}
      </p>
      <Link
        to={`/products/${product.id}`}
        className="mt-2 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
      >
        Xem chi tiết
      </Link>
    </div>
  </div>
);

const ChatBotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState("");
  const sessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sessionIdRef.current = getChatSessionId();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isOpen]);

  const sendMessage = async (rawMessage?: string) => {
    const text = (rawMessage ?? input).trim();
    if (!text || isSending) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setValidationError("Tin nhắn không được vượt quá 1000 kí tự.");
      return;
    }

    const sessionId = sessionIdRef.current || getChatSessionId();
    if (sessionId.length > 80) {
      setValidationError(
        "Phiên chat không hợp lệ, vui lòng tải lại trang và thử lại.",
      );
      return;
    }
    setValidationError("");

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      text,
      createdAt: new Date(),
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response: any = await chatBotAPI({ message: text, sessionId });
      const responseProducts = Array.isArray(response?.products)
        ? response.products
        : [];
      const fallbackProducts =
        responseProducts.length > 0 ? [] : await findFallbackProducts(text);
      const products =
        responseProducts.length > 0 ? responseProducts : fallbackProducts;
      const botMessage: ChatMessage = {
        id: createMessageId(),
        role: "bot",
        text:
          products.length > 0
            ? response?.answer ||
              "Mình tìm thấy một số sản phẩm phù hợp trên S2S:"
            : response?.answer ||
              "Mình chưa tìm thấy câu trả lời phù hợp. Bạn thử hỏi cách khác nhé.",
        products,
        createdAt: new Date(),
      };
      setMessages((current) => [...current, botMessage]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "bot",
          text: "Xin lỗi, hệ thống chatbot đang bận. Bạn vui lòng thử lại sau.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl shadow-emerald-500/30 transition hover:-translate-y-1 hover:scale-105"
          aria-label="Mở chatbot S2S"
        >
          <i className="fa-solid fa-comments text-2xl"></i>
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-amber-400"></span>
        </button>
      )}

      {isOpen && (
        <section className="flex h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-900/20 animate-[s2s-pop_.18s_ease-out] sm:h-[600px]">
          <style>{`@keyframes s2s-pop{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          <header className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Trợ lý S2S</h3>
                  <p className="text-xs text-emerald-50">
                    Gợi ý đồ cũ sinh viên trong vài giây
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-white/90 transition hover:bg-white/15"
                aria-label="Thu nhỏ chatbot"
              >
                <i className="fa-solid fa-minus"></i>
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#ecfeff,transparent_35%),linear-gradient(180deg,#f8fafc,#eefdf7)] p-4">
            {messages.length === 0 && (
              <div className="rounded-3xl border border-emerald-100 bg-white/85 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">
                  Bạn cần tìm gì trên S2S hôm nay?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendMessage(question)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm shadow-sm ${message.role === "user" ? "rounded-br-md bg-slate-900 text-white" : "rounded-bl-md border border-emerald-100 bg-white text-slate-700"}`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <ProductSuggestionCard
                          key={product.id}
                          product={product}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-md border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-sm">
                  <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                  S2S đang trả lời...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="border-t border-slate-100 bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-emerald-400 focus-within:bg-white">
              <input
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (validationError) setValidationError("");
                }}
                disabled={isSending}
                placeholder="Nhập câu hỏi về sản phẩm..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={
                  isSending ||
                  !input.trim() ||
                  input.trim().length > MAX_MESSAGE_LENGTH
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Gửi tin nhắn"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
            {validationError && (
              <p className="mt-2 px-2 text-xs font-medium text-red-500">
                {validationError}
              </p>
            )}
            <div className="mt-1 px-2 text-right text-[11px] text-slate-400">
              {input.length}/{MAX_MESSAGE_LENGTH}
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default ChatBotWidget;
