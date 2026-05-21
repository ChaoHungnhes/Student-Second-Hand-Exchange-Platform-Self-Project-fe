import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly as required by guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIAssistantResponse = async (userPrompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction:
          "Bạn là 'UniTrade Bot', trợ lý AI thân thiện dành cho nền tảng trao đổi đồ cũ sinh viên UniTrade. Hãy giúp người dùng về các quy định nền tảng, cách đăng bài, mẹo giao dịch an toàn và giải đáp các câu hỏi thường gặp (FAQ). Luôn trả lời bằng tiếng Việt, ngắn gọn, súc tích và phù hợp với sinh viên.",
        temperature: 0.7,
      },
    });
    // response.text is a getter property, not a method
    return (
      response.text ||
      "Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại sau."
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Dịch vụ AI hiện đang bận. Vui lòng thử lại sau một chút.";
  }
};

export const moderateContent = async (title: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Phân tích bài đăng sản phẩm sau cho chợ sinh viên. Tiêu đề: "${title}". Mô tả: "${description}". Kiểm tra thư rác (spam), hàng cấm (chất kích thích, vũ khí, rượu bia), hoặc lừa đảo. Trả về định dạng JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ai_status: { type: Type.STRING },
            ai_note: { type: Type.STRING },
          },
          required: ["ai_status", "ai_note"],
        },
      },
    });
    // response.text is a getter property
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Moderation Error:", error);
    return {
      ai_status: "OK",
      ai_note: "Không thể phân tích nội dung tự động lúc này.",
    };
  }
};
