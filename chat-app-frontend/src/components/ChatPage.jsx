import { MdAttachFile, MdSend } from "react-icons/md";
import { useState, useRef, useEffect } from "react";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL } from "../config/AxiosHelper";
import { getMessagesApi } from "../services/RoomService";
import { timeAgo } from "../config/helper";

const ChatPage = () => {
  const {
    connected,
    roomId,
    currentUser,
    setConnected,
    setRoomId,
    setCurrentUser,
  } = useChatContext();
  // console.log("connected", connected);
  // console.log("roomId", roomId);
  // console.log("currentUser", currentUser);

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await getMessagesApi(roomId);
        setMessages(data);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    }
    if (connected) {
      loadMessages();
    }
  });

  // Scroll to the bottom of the chat box when messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scroll({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  //WebSocket connection and subscription
  useEffect(() => {
    if (!connected || !roomId || !currentUser) return;

    const socket = new SockJS(`${baseURL}/chat`);
    const client = Stomp.over(socket);

    client.connect(
      {},
      () => {
        setStompClient(client);
        toast.success("Connected to chat!");

        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMessage]);
        });
      },
      (error) => {
        console.error("WebSocket connection error:", error);
        toast.error("Unable to connect to chat.");
      },
    );

    return () => {
      if (client.connected) {
        client.disconnect(() => {
          console.log("WebSocket disconnected");
        });
      } else {
        client.disconnect();
      }
    };
  }, [connected, roomId, currentUser]);

  //send message handle
  const sendMessage = () => {
    if (stompClient && connected && input.trim()) {
      console.log("Sending message:", input);
      const message = {
        sender: currentUser,
        content: input,
        roomId: roomId,
      };
      stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify(message),
      );
      setInput("");
    }
  };

  // handle logout
  const handleLogout = () => {
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    setStompClient(null);

    toast.success("You have left the room.");
    navigate("/");
  };

  return (
    <div className="">
      {/* Header */}
      <header className="fixed w-full dark:border-gray-700 dark:bg-gray-900 shadow flex justify-around items-center py-5 ">
        {/* Room name */}
        <div>
          <h1 className="text-xl font-semibold">
            Room: <span>{roomId}</span>
          </h1>
        </div>

        {/* user name   */}
        <div>
          <h1 className="text-xl font-semibold">
            User: <span>{currentUser}</span>
          </h1>
        </div>

        {/* leave room: button */}
        <div>
          <button
            onClick={handleLogout}
            className="dark:bg-red-500 dark:hover:bg-red-700 py-1 px-3 rounded transition-colors"
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main
        ref={chatBoxRef}
        className="py-20 px-10 dark:bg-slate-600 w-2/3 mx-auto h-screen overflow-auto"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === currentUser ? "justify-end" : "justify-start"} `}
          >
            <div
              className={` ${message.sender === currentUser ? "bg-blue-500" : "bg-gray-800"} my-1 p-1 rounded-lg text-white w-fit`}
            >
              <div className="flex flex-row gap-1">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(message.sender)}`}
                  alt={`${message.sender}'s avatar`}
                  className="w-9 h-9 rounded-full shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold">{message.sender}</p>
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-400">
                    {timeAgo(message.timeStamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Messages will be displayed here */}
      </main>

      {/* Input Message Section */}
      <div className="fixed bottom-0 left-0 w-full h-20 px-4 ">
        <div className="h-full w-full md:w-2/3 px-4 md:px-6 gap-4 flex items-center justify-between mx-auto rounded-full dark:bg-gray-800">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            type="text"
            placeholder="Type your message..."
            className="dark:border-gray-600 dark:bg-gray-900 dark:text-white px-5 py-2 flex-1 min-w-0 border rounded-full outline-none focus:ring-1 focus:outline-none"
          />

          <div className="flex gap-2">
            <button className="dark:bg-purple-600 hover:bg-puple-700 text-white h-10 w-10 shrink-0 flex rounded-full items-center justify-center transition-colors">
              <MdAttachFile size={20} />
            </button>
            <button
              onClick={sendMessage}
              className="dark:bg-green-600 hover:bg-green-700 text-white h-10 w-10 shrink-0 flex rounded-full items-center justify-center transition-colors"
            >
              <MdSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatPage;
