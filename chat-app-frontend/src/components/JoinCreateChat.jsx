import React from "react";
import chatIcon from "../assets/bubble-chat.png";
import toast from "react-hot-toast";
import { MdClose, MdContentCopy, MdLogout, MdMenu } from "react-icons/md";
import {
  createRoomApi,
  getRoomApi,
  getRoomsApi,
  joinRoomApi,
} from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import ChatPage from "./ChatPage";
import { useNavigate } from "react-router-dom";

const JoinCreateChat = () => {
  const [rooms, setRooms] = React.useState([]);
  const [newRoomName, setNewRoomName] = React.useState("");
  const [joinRoomId, setJoinRoomId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const {
    roomId: activeRoomId,
    setRoomName: saveRoomName,
    setRoomId: saveRoomId,
    setCurrentUser,
    setConnected,
    clearSession,
    currentUser,
  } =
    useChatContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "Chat dashboard - Chatify";
  }, []);

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
      const roomDetails = await getRoomApi(selectedRoomId);
      const selectedRoomName =
        roomDetails?.name ||
        (typeof room === "object" ? room.name : "") ||
        "Chat room";
      saveRoomId(selectedRoomId);
      saveRoomName(selectedRoomName);
      setCurrentUser(currentUser || localStorage.getItem("authName") || "User");
      setConnected(true);
      setSidebarOpen(false);
    } catch (error) {
      toast.error(error.response?.data || "Unable to open this room.");
    }
  }

  async function createRoom(event) {
    event.preventDefault();
    const trimmedRoomName = newRoomName.trim();
    if (!trimmedRoomName) {
      toast.error("Enter a room name.");
      return;
    }

    setCreating(true);
    try {
      const createdRoom = await createRoomApi(trimmedRoomName);
      setRooms((current) => [
        createdRoom,
        ...current.filter((room) => room.roomId !== createdRoom.roomId),
      ]);
      setNewRoomName("");
      setActiveAction(null);
      toast.success("Room created.");
      saveRoomId(createdRoom.roomId);
      saveRoomName(createdRoom.name || trimmedRoomName);
      setConnected(true);
      setSidebarOpen(false);
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

  async function joinRoom(event) {
    event.preventDefault();
    const trimmedRoomId = joinRoomId.trim();
    if (!trimmedRoomId) {
      toast.error("Enter a room ID.");
      return;
    }

    if (rooms.some((room) => (room.roomId || room) === trimmedRoomId)) {
      toast.error("You are already a member of this room.");
      return;
    }

    try {
      const joinedRoom = await joinRoomApi(trimmedRoomId);
      setRooms((current) => [
        joinedRoom,
        ...current.filter((room) => room.roomId !== joinedRoom.roomId),
      ]);
      setJoinRoomId("");
      setActiveAction(null);
      saveRoomId(joinedRoom.roomId);
      saveRoomName(joinedRoom.name || trimmedRoomId);
      setConnected(true);
      setSidebarOpen(false);
      toast.success("Room joined.");
    } catch (error) {
      toast.error(
        error.response?.status === 404
          ? "Room not found."
          : error.response?.data?.message || "Unable to join the room.",
      );
    }

  }

  async function copyRoomId(event, roomId) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied.");
    } catch (error) {
      console.error("Unable to copy room ID:", error);
      toast.error("Unable to copy room ID.");
    }

  }

  function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authEmail");
    localStorage.removeItem("authName");
    clearSession();
    toast.success("Logged out successfully.");
    navigate("/login");
  }

  return (
    <main className="h-screen overflow-hidden bg-[#08111f] text-slate-100">
      <div className="relative h-full w-full lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          />
        )}
        <aside className={`fixed inset-y-0 left-0 z-40 flex h-full w-[min(86vw,280px)] flex-col border-r border-white/10 bg-[#08111f] px-3 py-4 shadow-2xl transition-transform duration-300 sm:px-4 lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
            <img src={chatIcon} alt="" className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Chatify</p>
            <p className="text-xs text-slate-500">Chat dashboard</p>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <MdClose size={20} />
          </button>
          </div>
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Your rooms
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveAction(activeAction === "create" ? null : "create")}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              + Create room
            </button>
            <button
              type="button"
              onClick={() => setActiveAction(activeAction === "join" ? null : "join")}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              Join room
            </button>
          </div>
          {activeAction === "create" && (
            <form onSubmit={createRoom} className="mb-4 flex gap-2">
              <input
                autoFocus
                value={newRoomName}
                onChange={(event) => setNewRoomName(event.target.value)}
                placeholder="New room name"
                aria-label="New room name"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#101d30] px-2.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
              />
              <button type="submit" disabled={creating} className="rounded-lg bg-cyan-400 px-2.5 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">
                {creating ? "..." : "Create"}
              </button>
            </form>
          )}
          {activeAction === "join" && (
            <form onSubmit={joinRoom} className="mb-4 flex gap-2">
              <input
                autoFocus
                value={joinRoomId}
                onChange={(event) => setJoinRoomId(event.target.value)}
                placeholder="Room ID to join"
                aria-label="Room ID to join"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#101d30] px-2.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
              />
              <button type="submit" className="rounded-lg bg-cyan-400 px-2.5 py-2 text-xs font-semibold text-slate-950">
                Join
              </button>
            </form>
          )}

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {loading && <p className="text-sm text-slate-500">Loading rooms...</p>}
            {!loading && rooms.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                No rooms yet. Create the first one above.
              </p>
            )}
            {rooms.map((room) => {
              const name = room.name || room.roomId || room;
              const id = room.roomId || room;
              return (
                <div
                  key={id}
                  className="flex w-full items-center gap-2 rounded-xl border border-transparent bg-white/[0.04] p-2.5 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <button
                    type="button"
                    onClick={() => openRoom(room)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-400/15 text-sm font-semibold text-indigo-200">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-200">{name}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => copyRoomId(event, id)}
                    aria-label={`Copy ${name} room ID`}
                    title="Copy room ID"
                    className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <MdContentCopy size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-white/10 pt-4">
            <p className="min-w-0 truncate text-xs text-slate-400">
              Signed in as <span className="font-medium text-cyan-300">{currentUser}</span>
            </p>
            <button
              type="button"
              onClick={logout}
              className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-400"
            >
              <MdLogout size={15} />
              Logout
            </button>
          </div>
        </aside>

        <section className="relative h-full min-h-0 overflow-hidden">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#101d30]/90 text-slate-300 shadow-lg backdrop-blur transition hover:bg-white/10 lg:hidden"
          >
            <MdMenu size={20} />
          </button>
          {activeRoomId ? (
            <ChatPage embedded />
          ) : (
            <div className="flex h-full items-center justify-center p-10">
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
