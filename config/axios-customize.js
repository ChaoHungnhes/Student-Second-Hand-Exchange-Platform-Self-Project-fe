import axios from "axios";

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
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) return pushQueue(original);

      isRefreshing = true;
      if (!refreshPromise) {
        refreshPromise = instance.post("/s2s/authentication/refresh");
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
    return Promise.reject(error);
  }
);

export default instance;
