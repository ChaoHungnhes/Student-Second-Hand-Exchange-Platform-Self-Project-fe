// src/config/api.js
import axios from "./axios-customize";

// API Auth
export const loginAPI = (data) => axios.post("/s2s/authentication/login", data);
export const logoutAPI = () => axios.post("/s2s/authentication/logout");
export const introspectAPI = () => axios.post("/s2s/authentication/introspect");
export const refreshAPI = () => axios.post("/s2s/authentication/refresh");
export const getMyInfoAPI = () => axios.get("/s2s/user/getMyInfo");
export const registerAPI = (data) => 
  axios.post("/s2s/user/register", data);
export const verifyEmailAPI = (email, otp) => 
  axios.post("/s2s/user/verify-email", null, {
    params: { email, otp }
  });
export const forgotPasswordAPI = (email) => 
  axios.post("/s2s/user/forgot-password", null, {
    params: { email } 
  });
export const resetPasswordAPI = (data) => 
  axios.post("/s2s/user/reset-password", data);
// ====== API USER & PROFILE ======
export const updateProfileAPI = (data) => axios.patch("/s2s/user/me", data);
export const updatePasswordAPI = (data) => axios.patch("/s2s/user/update-password", data);
export const getMyStatsAPI = () => axios.get("/s2s/products/me/stats");
export const getUserByIdAPI = (userId) => 
  axios.get(`/s2s/user/${userId}`);
export const createUserAPI = (data) => 
  axios.post("/s2s/user/create", data);
// ====== API PRODUCTS ======
export const getProductsAPI = (params) => {
  return axios.get("/s2s/products", {
    params: params 
  });
};
export const getProductDetailAPI = (id) => axios.get(`/s2s/products/${id}`);

export const createDraftProductAPI = (data) => 
  axios.post("/s2s/products/createDraft", data);

export const uploadProductImagesAPI = (productId, formData) => 
  axios.post(`/s2s/productImages/${productId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const submitProductAPI = (productId) => 
  axios.post(`/s2s/products/${productId}/submit`);

export const getMyProductsAPI = (status) => {
  const params = {};
  if (status && status !== 'ALL') {
    params.status = status;
  }
  return axios.get("/s2s/products/my-products", { params });
};

export const getProductsByUserIdAPI = (userId, status, page = 1, size = 10) =>
  axios.get(`/s2s/products/product-ByUserId`, { 
    params: { id: userId, status, page, size } 
  });

export const updateProductAPI = (id, data) => {
  return axios.put(`/s2s/products/${id}`, data); 
};

export const deleteProductAPI = (id) => {
  return axios.delete(`/s2s/products/${id}`); 
};
// ====== API CATEGORIES ======
export const getCategoriesAPI = () => axios.get("/s2s/categories");

// ====== API TRANSACTIONS ======
export const getMyPurchasesAPI = () => axios.get("/s2s/transactions/my-purchases");

export const confirmTransactionAPI = (conversationId) => 
  axios.post('/s2s/transactions/confirm', { conversationId });

export const getTransactionByProductAPI = (productId) => 
  axios.get(`/s2s/transactions/product/${productId}`);
;

// ====== API CHAT (CONVERSATION) ======

export const createConversationAPI = (productId) => 
  axios.post(`/s2s/conversations/products/${productId}`);

export const getMessagesAPI = (conversationId, page = 0, size = 20) => 
  axios.get(`/s2s/conversations/${conversationId}/messages`, {
    params: { page, size }
  });

export const markAsReadAPI = (conversationId) => 
  axios.put(`/s2s/conversations/${conversationId}/seen`);

export const getConversationsAPI = () => axios.get("/s2s/conversations");

export const getUnreadCountAPI = () => axios.get("/s2s/conversations/unread-count");

export const searchConversationsAPI = (keyword) => 
  axios.get("/s2s/conversations/search", { params: { keyword } });

export const checkUserOnlineAPI = (userId) =>
  axios.get(`/s2s/conversations/users/${userId}/online`);

export const createReportAPI = (payload) =>
  axios.post(`/s2s/reports`, payload);

export const createReviewAPI = (data) => axios.post('/s2s/reviews', data);

export const getReviewsByUserIdAPI = (userId, page = 1, size = 10) =>
  axios.get(`/s2s/reviews/user`, { 
    params: { userId, page, size } 
  });

// ====== ADMIN / COUNT HELPERS ======
export const countPublicProductsAPI = () => axios.get('/s2s/products/count-public');
export const countActiveUsersAPI = () => axios.get('/s2s/user/count-active');
export const countTransactionsAPI = () => axios.get('/s2s/transactions/admin/count');
export const countReportsTodayAPI = () => axios.get('/s2s/reports/count-today');
// ====== API REPORTS & REVIEWS ======
export const getReportsAPI = (page = 1, pageSize = 10) =>
  axios.get('/s2s/reports', { params: { page, pageSize } });

export const getReportByIdAPI = (id) =>
  axios.get(`/s2s/reports/${id}`);

export const deleteReportAPI = (id) =>
  axios.delete(`/s2s/reports/${id}`);

// ====== ADMIN / AUDIT LOGS ======
export const getAuditLogsAPI = (params) =>
  axios.get('/s2s/log', { params });

// ====== ADMIN / CONVERSATIONS ======
export const getAdminConversationsAPI = (params) =>
  axios.get('/s2s/admin/conversations', { params });

// ====== API TRANSACTIONS (ADMIN) ======
export const getAdminTransactionsAPI = ({ page = 1, size = 10, keyword, status, sortBy, sortDir } = {}) =>
  axios.get('/s2s/transactions/admin', { params: { page, size, keyword, status, sortBy, sortDir } });

export const updateAdminTransactionStatusAPI = (id, status) =>
  axios.put(`/s2s/transactions/admin/${id}/status`, null, { params: { status } });

export const deleteAdminTransactionAPI = (id) =>
  axios.delete(`/s2s/transactions/admin/${id}`);

// ====== API USERS ======
export const getUsersAPI = ({ page = 1, size = 10, keyword, status, sortBy, sortDir } = {}) =>
  axios.get('/s2s/user', { params: { page, size, keyword, status, sortBy, sortDir } });

export const deleteUserAPI = (id) =>
  axios.delete(`/s2s/user/delete/${id}`);

export const updateUserAPI = (id, data) =>
  axios.put(`/s2s/user/update/${id}`, data);

export const patchUserStatusAPI = (id, status) =>
  axios.patch(`/s2s/user/${id}/status`, { status });

export const updateConversationStatusAPI = (id, status) =>
  axios.put(`/s2s/admin/conversations/${id}/status`, null, { params: { status } });

export const deleteConversationAPI = (id) =>
  axios.delete(`/s2s/admin/conversations/${id}`);