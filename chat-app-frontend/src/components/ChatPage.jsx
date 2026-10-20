import {
  MdAttachFile,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdSend,
} from "react-icons/md";
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
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatBoxRef = useRef(null);
  const previousScrollTopRef = useRef(0);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    if (!connected || !roomId || !currentUser) {
      navigate("/", { replace: true });
    }
  }, [connected, roomId, currentUser, navigate]);

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
  }, [connected, roomId]);

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

  const handleChatScroll = () => {
    if (chatBoxRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
      const previousScrollTop = previousScrollTopRef.current;
      const isScrollingUp = scrollTop < previousScrollTop - 4;
      const isScrollingDown = scrollTop > previousScrollTop + 4;

      if (scrollTop <= 24 || isScrollingDown) {
        setShowScrollTop(false);
      } else if (isScrollingUp) {
        setShowScrollTop(true);
      }

      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 24);
      previousScrollTopRef.current = scrollTop;
    }
  };

  const scrollToTop = () => {
    chatBoxRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-[#08111f] text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#08111f]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
              <p className="truncate text-sm font-semibold text-white">{roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-200">{currentUser}</p>
              <p className="text-xs text-slate-500">You</p>
            </div>
            <img
              src={`https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(currentUser)}`}
              alt=""
              className="h-9 w-9 rounded-full border border-white/10 bg-slate-800"
            />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-300/30"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      <main
        ref={chatBoxRef}
        onScroll={handleChatScroll}
        className="hide-scrollbar mx-auto h-[calc(100vh-73px)] max-w-4xl overflow-y-auto px-4 pb-20 pt-8 sm:px-6"
      >
        <div className="mb-8 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          <span>{messages.length ? `${messages.length} messages` : "Start the conversation"}</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div>
          {messages.map((message, index) => {
            const isCurrentUser = message.sender === currentUser;
            const previousMessage = messages[index - 1];
            const sameSender =
              previousMessage && previousMessage.sender === message.sender;

            return (
              <div
                key={index}
                className={`flex items-end gap-3 ${
                  index === 0 ? "" : sameSender ? "mt-1" : "mt-3"
                } ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <img
                  src={`https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(message.sender)}`}
                  alt=""
                  className={`h-8 w-8 shrink-0 rounded-full border border-white/10 bg-slate-800 ${isCurrentUser ? "order-2" : ""}`}
                />
                <div
                  className={`max-w-[min(80%,32rem)] rounded-2xl px-4 py-3 ${
                    isCurrentUser
                      ? "rounded-br-md bg-cyan-400 text-slate-950"
                      : "rounded-bl-md border border-white/10 bg-white/[0.07] text-slate-100"
                  }`}
                >
                  <div className="mb-1 flex items-baseline justify-between gap-5">
                    <p className={`text-xs font-semibold ${isCurrentUser ? "text-slate-800" : "text-cyan-300"}`}>
                      {isCurrentUser ? "You" : message.sender}
                    </p>
                    <p className={`text-[11px] ${isCurrentUser ? "text-slate-700" : "text-slate-500"}`}>
                      {timeAgo(message.timeStamp)}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="animate-scroll-control fixed left-1/2 top-[4.75rem] z-20 flex h-7 w-7 -translate-x-1/2 items-center justify-center text-cyan-300 transition duration-200 hover:scale-125 hover:text-cyan-200 focus:scale-125 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 active:scale-90"
        >
          <MdKeyboardArrowUp size={22} />
        </button>
      )}

      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className="animate-scroll-control fixed bottom-24 left-1/2 z-20 flex h-7 w-7 -translate-x-1/2 items-center justify-center text-cyan-300 transition duration-200 hover:scale-125 hover:text-cyan-200 focus:scale-125 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 active:scale-90"
        >
          <MdKeyboardArrowDown size={22} />
        </button>
      )}

      <div className="fixed bottom-0 left-0 z-10 w-full border-t border-white/10 bg-[#08111f]/90 px-3 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex h-12 max-w-4xl items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-2 shadow-xl shadow-black/20 transition focus-within:border-cyan-300/30 focus-within:ring-2 focus-within:ring-cyan-300/10">
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
            placeholder="Write a message..."
            aria-label="Message"
            className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white outline-none placeholder:text-slate-500"
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Attach a file"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <MdAttachFile size={18} />
            </button>
            <button
              type="button"
              onClick={sendMessage}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200/50"
            >
              <MdSend size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatPage;
