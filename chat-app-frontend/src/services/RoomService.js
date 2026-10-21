import { httpCLient } from "../config/AxiosHelper";

export const createRoomApi = async (name) => {
  const response = await httpCLient.post("/api/v1/rooms", { name });
  return response.data;
};

export const joinRoomApi = async (roomId) => {
  const response = await httpCLient.post("/api/v1/rooms/join", { roomId });
  return response.data;
};

export const getRoomApi = async (roomId) => {
  const response = await httpCLient.get(`/api/v1/rooms/${roomId}`);
  return response.data;
};

export const getRoomsApi = async () => {
  const response = await httpCLient.get("/api/v1/rooms/my-rooms");
  return response.data;
};

export const getMessagesApi = async (roomId, cursor, size = 20) => {
  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
  const response = await httpCLient.get(
    `/api/v1/rooms/${roomId}/messages?size=${size}${cursorParam}`,
  );
  if (Array.isArray(response.data)) {
    return {
      messages: response.data,
      hasMore: false,
      nextCursor: null,
    };
  }

  return response.data;
};
