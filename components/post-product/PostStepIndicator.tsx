import React from "react";

export type PostStep = "INFO" | "IMAGES" | "SUBMITTING" | "SUCCESS";

interface PostStepIndicatorProps {
  step: PostStep;
}

const steps = [
  { id: "INFO", icon: "fa-pen-to-square", label: "Thông tin" },
  { id: "IMAGES", icon: "fa-images", label: "Hình ảnh" },
  { id: "SUCCESS", icon: "fa-paper-plane", label: "Gửi duyệt" },
] as const;

const PostStepIndicator: React.FC<PostStepIndicatorProps> = ({ step }) => (
  <div className="mb-10">
    <div className="flex items-center justify-between relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
        style={{
          width: step === "INFO" ? "0%" : step === "IMAGES" ? "50%" : "100%",
        }}
      ></div>

      {steps.map((s, idx) => (
        <div key={s.id} className="relative z-10 flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              step === s.id ||
              (step === "SUBMITTING" && s.id === "SUCCESS") ||
              (step === "SUCCESS" && idx <= 2) ||
              (step === "IMAGES" && idx === 0)
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-white border-gray-300 text-gray-400"
            }`}
          >
            <i className={`fa-solid ${s.icon} text-sm`}></i>
          </div>
          <span
            className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${
              step === s.id || (step === "SUBMITTING" && s.id === "SUCCESS")
                ? "text-indigo-600"
                : "text-gray-400"
            }`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default PostStepIndicator;
