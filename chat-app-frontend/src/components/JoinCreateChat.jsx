import React from "react";
import chatIcon from "../assets/bubble-chat.png";
import toast from "react-hot-toast";
import { createRoomApi, getRoomsApi, joinRoomApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import ChatPage from "./ChatPage";

const JoinCreateChat = () => {
  const [rooms, setRooms] = React.useState([]);
  const [roomId, setRoomId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const {
    roomId: activeRoomId,
    setRoomId: saveRoomId,
    setCurrentUser,
    setConnected,
    currentUser,
  } =
    useChatContext();

  React.useEffect(() => {
    let active = true;
    getRoomsApi()
      .then((data) => {
        if (active) {
          setRooms(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => toast.error("Unable to load chat rooms."))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function openRoom(room) {
    const selectedRoomId = room.roomId || room;
    try {
      await joinRoomApi(selectedRoomId);
      saveRoomId(selectedRoomId);
      setCurrentUser(currentUser || localStorage.getItem("authName") || "User");
      setConnected(true);
    } catch (error) {
      toast.error(error.response?.data || "Unable to open this room.");
    }
  }

  async function createRoom(event) {
    event.preventDefault();
    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) {
      toast.error("Enter a room name.");
      return;
    }

    setCreating(true);
    try {
      const createdRoom = await createRoomApi(trimmedRoomId);
      const nextRooms = [...rooms, createdRoom];
      setRooms(nextRooms);
      localStorage.setItem("chatRooms", JSON.stringify(nextRooms));
      setRoomId("");
      toast.success("Room created.");
      await openRoom(createdRoom);
    } catch (error) {
      toast.error(
        error.response?.status === 400
          ? "Room already exists."
          : "Unable to create the room.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08111f] text-slate-100">
      <header className="flex h-20 items-center justify-between border-b border-white/10 px-6 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
            <img src={chatIcon} alt="" className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Chatify</p>
            <p className="text-xs text-slate-500">Chat dashboard</p>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Signed in as <span className="font-medium text-cyan-300">{currentUser}</span>
        </p>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Your rooms
            </p>
            <h1 className="mt-2 text-xl font-semibold text-white">Choose a conversation</h1>
          </div>

          <form onSubmit={createRoom} className="mb-6 flex gap-2">
            <input
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder="New room name"
              aria-label="New room name"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101d30] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {creating ? "..." : "+"}
            </button>
          </form>

          <div className="space-y-2">
            {loading && <p className="text-sm text-slate-500">Loading rooms...</p>}
            {!loading && rooms.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                No rooms yet. Create the first one above.
              </p>
            )}
            {rooms.map((room) => {
              const name = room.roomId || room;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => openRoom(room)}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/[0.04] p-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/15 text-sm font-semibold text-indigo-200">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-200">{name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="h-[calc(100vh-5rem)] min-h-[calc(100vh-5rem)] overflow-hidden">
          {activeRoomId ? (
            <ChatPage embedded />
          ) : (
            <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-10">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl">
                  💬
                </div>
                <h2 className="text-2xl font-semibold text-white">Select a room to start chatting</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Your conversations will open here. Create a room or choose one from the sidebar.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default JoinCreateChat;
