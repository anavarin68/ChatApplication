import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

function getSavedSession() {
  try {
    const savedSession = localStorage.getItem("chatSession");
    const parsedSession = savedSession ? JSON.parse(savedSession) : {};
    return {
      roomId: typeof parsedSession.roomId === "string" ? parsedSession.roomId : "",
      roomName: typeof parsedSession.roomName === "string" ? parsedSession.roomName : "",
      currentUser:
        typeof parsedSession.currentUser === "string"
          ? parsedSession.currentUser
          : localStorage.getItem("authName") || "",
    };
  } catch (error) {
    console.error("Unable to restore chat session:", error);
    return { roomId: "", roomName: "", currentUser: "" };
  }
}

export const ChatProvider = ({ children }) => {
  const [savedSession] = useState(getSavedSession);
  const [roomId, setRoomIdState] = useState(savedSession.roomId);
  const [roomName, setRoomNameState] = useState(savedSession.roomName);
  const [currentUser, setCurrentUserState] = useState(savedSession.currentUser);
  const [connected, setConnected] = useState(
    Boolean(savedSession.roomId && savedSession.currentUser),
  );

  const setRoomId = (value) => {
    setRoomIdState(value);
    const session = JSON.parse(localStorage.getItem("chatSession") || "{}");
    localStorage.setItem(
      "chatSession",
      JSON.stringify({ ...session, roomId: value }),
    );
  };

  const setCurrentUser = (value) => {
    setCurrentUserState(value);
    const session = JSON.parse(localStorage.getItem("chatSession") || "{}");
    localStorage.setItem(
      "chatSession",
      JSON.stringify({ ...session, currentUser: value }),
    );
  };

  const setRoomName = (value) => {
    setRoomNameState(value);
    const session = JSON.parse(localStorage.getItem("chatSession") || "{}");
    localStorage.setItem(
      "chatSession",
      JSON.stringify({ ...session, roomName: value }),
    );
  };

  const clearSession = () => {
    localStorage.removeItem("chatSession");
    setRoomIdState("");
    setRoomNameState("");
    setCurrentUserState("");
    setConnected(false);
  };

  return (
    <ChatContext.Provider
      value={{
        roomId,
        roomName,
        currentUser,
        setRoomId,
        setRoomName,
        setCurrentUser,
        setConnected,
        clearSession,
        connected,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

const useChatContext = () => useContext(ChatContext);
export default  useChatContext;