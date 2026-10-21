import axios from "axios";

export const baseURL = "https://chatapp-backend-jk31.onrender.com";
export const httpCLient = axios.create({
  baseURL,
});

httpCLient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});
