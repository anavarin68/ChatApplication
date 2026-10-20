import React from "react";
import chatIcon from "../assets/bubble-chat.png";
import toast from "react-hot-toast";
import { createRoomApi, joinRoomApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router-dom";

const JoinCreateChat = () => {
  const [detail, setDetail] = React.useState({
    roomId: new URLSearchParams(window.location.search).get("room") || "",
    userName: "",
  });

  const {
    setRoomId,
    setCurrentUser,
    setConnected,
  } = useChatContext();
  const navigate = useNavigate();

  function handleFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (!detail.userName || !detail.roomId) {
      toast.error("Invalid input. ");
      return false;
    }
    return true;
  }

  //join chat room
  async function joinChat() {
    if (validateForm()) {

      try {
        await joinRoomApi(detail.roomId);
        toast.success("Joining the room...", { duration: 1500 });
        setRoomId(detail.roomId);
        setCurrentUser(detail.userName);
        setConnected(true);
        // Give the notification time to be read before changing screens.
        setTimeout(() => {
          navigate("/chat");
        }, 1600);
      } catch (error) {
        if(error.status == 400){
          toast.error("Room does not exist.");
        } else{
          toast.error("Error joining room. Please try again.");
        }
      }
    }
  }

  async function createRoom() {
    if (validateForm()) {
      //create chat room
      console.log(detail);
      //   call api to create room and then join the room
      try {
        const response = await createRoomApi(detail.roomId);
        console.log("Room created successfully:", response);
        toast.success("Room created successfully.", { duration: 1500 });

        // Show the next notification after the creation message has finished.
        setTimeout(() => {
          toast.success("Joining the room...", { duration: 1500 });
          setRoomId(response.roomId);
          setCurrentUser(detail.userName);
          setConnected(true);
          setTimeout(() => navigate("/chat"), 1600);
        }, 1600);
      } catch (error) {
        console.log(error);
        if (error.status == 400) {
          toast.error("Room already exists.");
        } else {
          toast.error("Error creating room. Please try again.");
        }
      }
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08111f] px-6 py-6 text-slate-100 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
            <img src={chatIcon} alt="" className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">Chatify</span>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
          Real-time chat
        </span>
      </header>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 py-20 lg:grid-cols-[1fr_420px] lg:py-28">
        <section className="max-w-xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            Conversations, made simple
          </p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Make space for a good conversation.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
            Create a private room or join your team in seconds. No clutter,
            no distractions, just chat.
          </p>
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Instant rooms
            </span>
            <span>•</span>
            <span>Simple by design</span>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">
          <div className="mb-8">
            <p className="text-sm font-medium text-cyan-300">Get started</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Enter a room</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use an existing room or create a new one.
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              joinChat();
            }}
          >
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
                Your name
              </label>
              <input
                onChange={handleFormInputChange}
                type="text"
                id="name"
                name="userName"
                value={detail.userName}
                placeholder="e.g. Alex"
                className="w-full rounded-xl border border-white/10 bg-[#101d30] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
              />
            </div>

            <div>
              <label htmlFor="roomId" className="mb-2 block text-sm font-medium text-slate-300">
                Room ID
              </label>
              <input
                onChange={handleFormInputChange}
                type="text"
                id="roomId"
                name="roomId"
                value={detail.roomId}
                placeholder="e.g. design-team"
                className="w-full rounded-xl border border-white/10 bg-[#101d30] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200/50"
              >
                Join room
              </button>
              <button
                type="button"
                onClick={createRoom}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Create room
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default JoinCreateChat;
