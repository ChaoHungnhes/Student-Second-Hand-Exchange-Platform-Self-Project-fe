import React, { useState } from "react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  partnerName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  partnerName,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold text-center mb-2">
          Đánh giá giao dịch
        </h3>
        <p className="text-gray-500 text-center text-sm mb-6">
          Bạn cảm thấy thế nào về{" "}
          <span className="font-bold text-indigo-600">{partnerName}</span>?
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            >
              <i
                className={`fa-solid fa-star ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
              ></i>
            </button>
          ))}
        </div>

        <textarea
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
          placeholder="Nhập nhận xét của bạn (tùy chọn)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm"
          >
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

export default ReviewModal;
