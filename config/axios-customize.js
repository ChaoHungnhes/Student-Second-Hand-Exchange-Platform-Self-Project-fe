import axios from "axios";
import { getApiErrorMessage } from "../utils/apiError";

// Tạo instance axios 
const instance = axios.create({
  baseURL: "http://localhost:8089",
  withCredentials: true,
  timeout: 15000,
});

// -------------------- Auto refresh token (chống đua) --------------------
let isRefreshing = false;
let refreshPromise = null;
let queue = []; // { resolve, reject, config }

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  "/s2s/authentication/login",
  "/s2s/authentication/refresh",
  "/s2s/authentication/introspect",
  "/s2s/user/register",
  "/s2s/user/verify-email",
  "/s2s/user/forgot-password",
  "/s2s/user/reset-password",
];

function isAuthEndpointWithoutRefresh(url = "") {
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => url.includes(endpoint));
}

function pushQueue(config) {
  return new Promise((resolve, reject) => queue.push({ resolve, reject, config }));
}
function flushQueue(error) {
  queue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error);
    else resolve(instance(config));
  });
  queue = [];
}

// -------------------- Response interceptor --------------------
instance.interceptors.response.use(
  (res) => {
    if (typeof res.data === "string") return res.data;

    // Unwrap FormatResponse của BE: {resultCode, resultDesc, responseTime, data}
    const envelope = res.data;
    if (envelope && typeof envelope === "object" && "resultCode" in envelope) {
      return envelope.data;
    }
    return res.data;
  },
  async (error) => {
    const original = error.config || {};
    const shouldRefresh =
      error.response?.status === 401 &&
      !original._retry &&
      !original._skipAuthRefresh &&
      !isAuthEndpointWithoutRefresh(original.url);

    if (shouldRefresh) {
      original._retry = true;

      if (isRefreshing) return pushQueue(original);

      isRefreshing = true;
      if (!refreshPromise) {
        refreshPromise = instance.post("/s2s/authentication/refresh", null, {
          _skipAuthRefresh: true,
        });
      }

      try {
        await refreshPromise;
        const result = await instance(original);
        flushQueue();
        return result;
      } catch (e) {
        flushQueue(e);
        throw e;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }
    error.apiMessage = getApiErrorMessage(error);
    error.apiCode =
      error.response?.data?.resultCode ||
      error.response?.data?.code ||
      error.response?.data?.errorCode;

    return Promise.reject(error);
  }
);

export default instance;
