import axios from "axios";

import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "../utils/tokenUtils";

const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";
const AUTH_TOKENS_REFRESHED_EVENT = "auth:tokens-refreshed";
const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue = [];

const dispatchSessionExpired = () => {
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
};

const dispatchTokensRefreshed = (accessToken) => {
  window.dispatchEvent(
    new CustomEvent(AUTH_TOKENS_REFRESHED_EVENT, {
      detail: { accessToken },
    }),
  );
};

const isRefreshSkippedEndpoint = (url = "") =>
  AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => url.includes(endpoint));

const resolveRefreshQueue = (error, accessToken) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(accessToken);
  });

  refreshQueue = [];
};

const attachAuthorizationHeader = (config, accessToken) => {
  config.headers = config.headers ?? {};

  if (typeof config.headers.set === "function") {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
    return;
  }

  config.headers.Authorization = `Bearer ${accessToken}`;
};

const removeAuthorizationHeader = (config) => {
  if (!config.headers) {
    return;
  }

  if (typeof config.headers.delete === "function") {
    config.headers.delete("Authorization");
    return;
  }

  delete config.headers.Authorization;
};

axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      attachAuthorizationHeader(config, accessToken);
    } else {
      removeAuthorizationHeader(config);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshSkippedEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearTokens();
      dispatchSessionExpired();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((accessToken) => {
        attachAuthorizationHeader(originalRequest, accessToken);
        return axiosClient(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const response = await refreshClient.post("/auth/refresh", { refreshToken });
      const payload = response.data?.data ?? response.data;
      const newAccessToken = payload?.accessToken ?? payload?.access_token ?? payload?.token;
      const newRefreshToken = payload?.refreshToken ?? payload?.refresh_token;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error("Refresh response did not include new tokens.");
      }

      saveTokens(newAccessToken, newRefreshToken);
      attachAuthorizationHeader(originalRequest, newAccessToken);
      dispatchTokensRefreshed(newAccessToken);
      resolveRefreshQueue(null, newAccessToken);

      return axiosClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      resolveRefreshQueue(refreshError, null);
      dispatchSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
export { AUTH_SESSION_EXPIRED_EVENT, AUTH_TOKENS_REFRESHED_EVENT };
