import { useAuthStore } from "@/store/auth-store";
import axios, { type AxiosRequestConfig } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export const BASE_URL = "https://eve-ai.api.openhvn.dev/api/mobile";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  console.log("token", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest.url ?? "";
    const isAuthRequest = url.includes("/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (!refreshToken) {
        await forceLogout();
        return Promise.reject(buildApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${token}`,
              };
              resolve(api(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken: string = data.data.accessToken;
        const newRefreshToken: string | undefined = data.data.refreshToken;

        await SecureStore.setItemAsync("accessToken", newAccessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync("refreshToken", newRefreshToken);
        }

        processQueue(null, newAccessToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await forceLogout();
        return Promise.reject(buildApiError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(buildApiError(error));
  },
);

async function forceLogout() {
  await useAuthStore.getState().logout();
  if (router.canDismiss()) router.dismissAll();
  router.replace("/");
}

function buildApiError(error: any): ApiError {
  const message =
    error.response?.data?.error?.message ||
    error.message ||
    "Something went wrong";
  const status = error.response?.status || 500;
  return new ApiError(message, status);
}

export default api;
