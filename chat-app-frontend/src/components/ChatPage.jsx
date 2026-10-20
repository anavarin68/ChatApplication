import {
  MdAttachFile,
  MdEmojiEmotions,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdNotificationsNone,
  MdSend,
} from "react-icons/md";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL } from "../config/AxiosHelper";
import { getMessagesApi } from "../services/RoomService";
import {
  formatMessageDateLabel,
  getMessageDateKey,
  formatMessageTime,
} from "../config/helper";

function playMessageSound() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.error("Unable to play message notification sound:", error);
  }
}

function getMessageKey(message) {
  return (
    message.id ||
    JSON.stringify([message.timeStamp, message.sender, message.content])
  );
}

const ChatPage = () => {
  const {
    connected,
    roomId,
    currentUser,
    setConnected,
    clearSession,
  } = useChatContext();
  const navigate = useNavigate();

  //Pagination of messages
  const PAGE_SIZE = 20;
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const cursorRef = useRef(null);
  const activeRoomRef = useRef(roomId);
  const paginationGenerationRef = useRef(0);

  const isPrependingRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const previousScrollTopRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const initialLoadRef = useRef(true);
  const initialLoadCompletedRef = useRef(false);


  const [input, setInput] = useState(() => {
    return localStorage.getItem(`chatDraft-${roomId}`) || "";
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hour12] = useState(() => {
    return localStorage.getItem("chatHour12") === "true";
  });
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      const savedRecentEmojis = window.localStorage.getItem("recentEmojis");
      const parsedRecentEmojis = savedRecentEmojis
        ? JSON.parse(savedRecentEmojis)
        : [];
      return Array.isArray(parsedRecentEmojis) ? parsedRecentEmojis : [];
    } catch (error) {
      console.error("Unable to load recent emojis:", error);
      return [];
    }
  });
  const chatBoxRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const [stompClient, setStompClient] = useState(null);

  const messageDraftKey = `chatDraft-${roomId}`;

  useEffect(() => {
    if (input) {
      localStorage.setItem(messageDraftKey, input);
    } else {
      localStorage.removeItem(messageDraftKey);
    }
  }, [input, messageDraftKey]);

  useEffect(() => {
    const handleWindowFocus = () => {
      setUnreadCount(0);
      document.title = "Chatify";
    };
    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, []);

  useEffect(() => {
    if (!connected || !roomId || !currentUser) {
      navigate("/", { replace: true });
    }
  }, [connected, roomId, currentUser, navigate]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!showEmojiPicker) {
        return;
      }

      if (
        emojiPickerRef.current?.contains(event.target) ||
        emojiButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setShowEmojiPicker(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!showEmojiPicker) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showEmojiPicker]);

  //Pagination
  useEffect(() => {
  if (!connected || !roomId) return;

  let cancelled = false;
  const generation = ++paginationGenerationRef.current;

  activeRoomRef.current = roomId;
  loadingRef.current = true;
  hasMoreRef.current = true;
  cursorRef.current = null;

  initialLoadRef.current = true;
  initialLoadCompletedRef.current = false;
  isPrependingRef.current = false;

  const loadInitialMessages = async () => {
    setMessages([]);
    setLoadingMessages(true);

    try {
      const response = await getMessagesApi(roomId, null, PAGE_SIZE);

      if (
        cancelled ||
        generation !== paginationGenerationRef.current ||
        activeRoomRef.current !== roomId
      ) {
        return;
      }

      if (!response || !Array.isArray(response.messages)) {
        throw new Error("Invalid message page response");
      }

      const initialMessages = response.messages;

      setMessages((currentMessages) => {
        // Keep any live messages received while the REST request
        // was in progress, while avoiding duplicate entries.
        const combined = [...initialMessages, ...currentMessages];
        const uniqueMessages = [];
        const seen = new Set();

        for (const message of combined) {
          const key = getMessageKey(message);

          if (!seen.has(key)) {
            seen.add(key);
            uniqueMessages.push(message);
          }
        }

        return uniqueMessages;
      });

      cursorRef.current = response?.nextCursor || null;
      hasMoreRef.current = Boolean(response?.hasMore);

      initialLoadCompletedRef.current = true;
    } catch (error) {
      if (!cancelled && generation === paginationGenerationRef.current) {
        console.error("Error loading messages:", error);
        toast.error("Unable to load messages.");
      }
    } finally {
      if (!cancelled && generation === paginationGenerationRef.current) {
        loadingRef.current = false;
        setLoadingMessages(false);
      }
    }
  };

  loadInitialMessages();

  return () => {
    cancelled = true;
    loadingRef.current = false;
    hasMoreRef.current = false;
    cursorRef.current = null;
    activeRoomRef.current = null;
    paginationGenerationRef.current += 1;
  };
}, [connected, roomId]);

  // Scroll to the bottom of the chat box when messages change
  useLayoutEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    // Preserve the visible position when older messages are prepended.
    if (isPrependingRef.current) {
      const heightDifference =
        chatBox.scrollHeight - previousScrollHeightRef.current;

      chatBox.scrollTop =
        previousScrollTopRef.current + heightDifference;

      isPrependingRef.current = false;
      shouldAutoScrollRef.current = false;
      return;
    }

    // Scroll to the bottom after the initial messages load.
    if (initialLoadRef.current && initialLoadCompletedRef.current) {
      chatBox.scrollTop = chatBox.scrollHeight;
      initialLoadRef.current = false;
      shouldAutoScrollRef.current = false;
      return;
    }

    // For live messages, scroll only if the user was near the bottom.
    if (shouldAutoScrollRef.current) {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: "smooth",
      });
    }

    shouldAutoScrollRef.current = false;
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
          // Remember whether the user was near the bottom BEFORE
          // adding the new message.
          const chatBox = chatBoxRef.current;

          shouldAutoScrollRef.current = chatBox
            ? chatBox.scrollHeight -
                chatBox.scrollTop -
                chatBox.clientHeight <
              150
            : true;

          setMessages((prev) => [...prev, newMessage]);
          playMessageSound();
          if (document.hidden) {
            setUnreadCount((count) => {
              const nextCount = count + 1;
              document.title = `(${nextCount}) New messages — Chatify`;
              return nextCount;
            });
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`New message from ${newMessage.sender}`, {
                body: newMessage.content,
              });
            }
          }
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
      setShowEmojiPicker(false);
      localStorage.removeItem(messageDraftKey);
    }
  };

  // handle logout
  const handleLogout = () => {
    setConnected(false);
    clearSession();
    setStompClient(null);

    toast.success("You have left the room.");
    navigate("/");
  };


const loadOlderMessages = async () => {
    if (
      loadingRef.current ||
      !hasMoreRef.current ||
      !connected ||
      !roomId ||
      !chatBoxRef.current
    ) {
      return;
    }

    const requestedRoomId = roomId;
    const requestedCursor = cursorRef.current;
    const generation = paginationGenerationRef.current;

    loadingRef.current = true;
    setLoadingMessages(true);

    // Capture the current scroll position before loading older messages.
    previousScrollHeightRef.current =
      chatBoxRef.current.scrollHeight;

    previousScrollTopRef.current =
      chatBoxRef.current.scrollTop;

    try {
      const response = await getMessagesApi(
        requestedRoomId,
        requestedCursor,
        PAGE_SIZE,
      );

      // Ignore responses belonging to a room that is no longer active.
      if (
        activeRoomRef.current !== requestedRoomId ||
        generation !== paginationGenerationRef.current ||
        !response ||
        !Array.isArray(response.messages)
      ) {
        return;
      }

      if (response.messages.length > 0) {
        // Deduplicate inside the functional update so the response cannot
        // be compared against a stale render while live messages arrive.
        setMessages((currentMessages) => {
          const existingKeys = new Set(
            currentMessages.map((message) =>
              getMessageKey(message),
            ),
          );
          const olderMessages = response.messages.filter((message) => {
            const key = getMessageKey(message);
            return !existingKeys.has(key);
          });

          if (olderMessages.length === 0) {
            return currentMessages;
          }

          isPrependingRef.current = true;
          return [...olderMessages, ...currentMessages];
        });
      }

      cursorRef.current = response.nextCursor || null;
      hasMoreRef.current = Boolean(response.hasMore);
    } catch (error) {
      if (error.response?.status === 400) {
        hasMoreRef.current = false;
      }
      isPrependingRef.current = false;

      console.error("Error loading older messages:", error);
      toast.error("Unable to load older messages.");
    } finally {
      if (generation === paginationGenerationRef.current) {
        loadingRef.current = false;
        setLoadingMessages(false);
      }
    }
  };








  const handleChatScroll = () => {
  if (chatBoxRef.current) {
    const { scrollTop, scrollHeight, clientHeight } =
      chatBoxRef.current;

    const previousScrollTop = previousScrollTopRef.current;
    const isScrollingUp = scrollTop < previousScrollTop - 4;
    const isScrollingDown = scrollTop > previousScrollTop + 4;

    // Load older messages when reaching the top
    if (
      scrollTop <= 24 &&
      hasMoreRef.current &&
      !loadingRef.current
    ) {
      loadOlderMessages();
    }

    // Existing scroll-to-top button behavior
    if (scrollTop <= 24 || isScrollingDown) {
      setShowScrollTop(false);
    } else if (isScrollingUp) {
      setShowScrollTop(true);
    }

    // Existing scroll-to-bottom button behavior
    setShowScrollBottom(
      scrollTop + clientHeight < scrollHeight - 24
    );

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

  const handleEmojiSelect = (emojiData) => {
    setInput((previousInput) => `${previousInput}${emojiData.emoji}`);
    setRecentEmojis((previousEmojis) => {
      const updatedEmojis = [
        emojiData.emoji,
        ...previousEmojis.filter((emoji) => emoji !== emojiData.emoji),
      ].slice(0, 8);
      window.localStorage.setItem("recentEmojis", JSON.stringify(updatedEmojis));
      return updatedEmojis;
    });
  };

  const enableNotifications = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const shareRoom = async () => {
    const shareUrl = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Room link copied.");
    } catch (error) {
      console.error("Unable to copy room link:", error);
      toast.error("Unable to copy room link.");
    }
  };

  const renderMessageContent = (content) =>
    content.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
      /^https?:\/\//.test(part) ? (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all underline decoration-current/40 underline-offset-2 hover:decoration-current"
        >
          {part}
        </a>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      ),
    );

  return (
    <div className="min-h-screen bg-[#08111f] text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#08111f]/90 px-4 py-2.5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{roomId}</p>
                <p className="truncate text-xs text-slate-500">{currentUser}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={enableNotifications}
              aria-label="Enable browser notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <MdNotificationsNone size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={shareRoom}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Share Room
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-950/20 transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-300/50"
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

        {loadingMessages && (
            <p
              className="py-3 text-center text-xs text-slate-500"
              role="status"
            >
              Loading messages...
            </p>
          )}

        <div>
          {messages.map((message, index) => {
            const isCurrentUser = message.sender === currentUser;
            const previousMessage = messages[index - 1];
            const sameSender =
              previousMessage && previousMessage.sender === message.sender;
            const showDateSeparator =
              !previousMessage ||
              getMessageDateKey(previousMessage.timeStamp) !==
                getMessageDateKey(message.timeStamp);

            return (
              <div key={`${message.timeStamp}-${index}`}>
                {showDateSeparator && (
                  <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
                    <span className="h-px flex-1 bg-white/10" />
                    <span>{formatMessageDateLabel(message.timeStamp)}</span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                )}
                <div
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
                      {formatMessageTime(message.timeStamp, hour12)}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {renderMessageContent(message.content)}
                  </p>
                </div>
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
        <div className="relative mx-auto max-w-4xl">
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-14 left-1/2 z-30 w-[min(300px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/40 sm:left-auto sm:right-0 sm:translate-x-0"
            >
              {recentEmojis.length > 0 && (
                <div className="flex items-center gap-1 border-b border-white/10 bg-[#202124] px-3 py-2">
                  <span className="mr-1 text-xs text-slate-400">Recent</span>
                  {recentEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`Use recent emoji ${emoji}`}
                      onClick={() => handleEmojiSelect({ emoji })}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-lg transition hover:bg-white/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                lazyLoadEmojis
                searchDisabled
                skinTonesDisabled
                theme="dark"
                width="100%"
                height={360}
              />
            </div>
          )}

          <div className="flex h-12 items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-2 shadow-xl shadow-black/20 transition focus-within:border-cyan-300/30 focus-within:ring-2 focus-within:ring-cyan-300/10">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            placeholder="Write a message..."
            aria-label="Message"
            className="max-h-20 min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-5 text-white outline-none placeholder:text-slate-500"
          />

          <div className="flex items-center gap-1">
            <button
              ref={emojiButtonRef}
              type="button"
              aria-label="Open emoji picker"
              onClick={() => setShowEmojiPicker((previous) => !previous)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <MdEmojiEmotions size={18} />
            </button>
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
    </div>
  );
};
export default ChatPage;
