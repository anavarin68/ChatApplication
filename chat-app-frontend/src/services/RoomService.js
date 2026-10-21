import { httpCLient } from "../config/AxiosHelper";

export const createRoomApi = async (roomDetail) => {
  const response = await httpCLient.post(`api/v1/rooms`, roomDetail, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
  return response.data;
};

export const joinRoomApi = async (roomId) => {
  const response = await httpCLient.get(`api/v1/rooms/${roomId}`);
  return response.data;
};

export const getRoomsApi = async () => {
  try {
    const savedRooms = JSON.parse(localStorage.getItem("chatRooms") || "[]");
    return Array.isArray(savedRooms) ? savedRooms : [];
  } catch (error) {
    console.error("Unable to restore saved rooms:", error);
    return [];
  }
};

export const getMessagesApi = async (roomId, cursor, size = 20) => {
  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
  const response = await httpCLient.get(
    `api/v1/rooms/${roomId}/messages?size=${size}${cursorParam}`,
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
