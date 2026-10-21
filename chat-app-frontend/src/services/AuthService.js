import { httpCLient } from "../config/AxiosHelper";

export const registerApi = async ({ name, email, password }) => {
  const response = await httpCLient.post("/api/v1/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
};

export const loginApi = async ({ email, password }) => {
  const response = await httpCLient.post("/api/v1/auth/login", {
    email,
    password,
  });
  return response.data;
};

export function getAuthToken(data) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";

  return (
    data.token ||
    data.accessToken ||
    data.access_token ||
    data.jwt ||
    data.data?.token ||
    data.data?.accessToken ||
    ""
  );
}

export function getApiErrorMessage(error, fallback) {
  const responseData = error?.response?.data;
  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  return responseData?.message || responseData?.error || fallback;
}
