import axios from "axios";
import { useAuth } from "@clerk/clerk-expo";
import { useMemo } from "react";

// For local testing on emulator, you might need your machine's local IP address instead of localhost.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const useApi = () => {
  const { getToken } = useAuth();

  const authApi = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Error fetching Clerk token:", error);
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    return instance;
  }, [getToken]);

  return authApi; 
};

export default api;
