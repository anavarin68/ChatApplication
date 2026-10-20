import React from "react";
import chatIcon from "../assets/bubble-chat.png";
import toast from "react-hot-toast";
import { createRoomApi, joinRoomApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router-dom";

const JoinCreateChat = () => {
  const [detail, setDetail] = React.useState({
    roomId: "",
    userName: "",
  });

  const {
    roomId,
    currentUser,
    setRoomId,
    setCurrentUser,
    connected,
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
        const room = await joinRoomApi(detail.roomId);
        toast.success("Joining the room...");
        setRoomId(detail.roomId);
        setCurrentUser(detail.userName);
        setConnected(true);
        //forward to chat page after 2 seconds
        setTimeout(() => {
          navigate("/chat");
        }, 1000);
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
        toast.success("Room created successfully.");
        toast.success("Joining the room...");

        //join the room after successful creation
        setRoomId(response.roomId);
        setCurrentUser(detail.userName);
        setConnected(true);
        //forward to chat page after 2 seconds
        setTimeout(() => {
          navigate("/chat");
        }, 1000);
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="dark:border-gray-700 border p-10 w-full flex flex-col gap-4 max-w-md rounded dark:bg-gray-900 shadow">
        <div>
          <img src={chatIcon} alt="Chat Icon" className="mx-auto h-24 w-24" />
        </div>
        <h1 className="text-2xl font-semibold text-center">
          Join or Create a Room
        </h1>

        {/* Input Fields */}
        {/* Name */}
        <div className="">
          <label htmlFor="name" className="block font-medium mb-2">
            Your Name
          </label>
          <input
            onChange={handleFormInputChange}
            type="text"
            id="name"
            name="userName"
            value={detail.userName}
            placeholder="Enter your name"
            className="w-full dark:bg-gray-600 px-4 py-2 border dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Room Id */}
        <div className="">
          <label htmlFor="roomId" className="block font-medium mb-2">
            Room ID / New Room ID
          </label>
          <input
            onChange={handleFormInputChange}
            type="text"
            id="roomId"
            name="roomId"
            value={detail.roomId}
            placeholder="Enter your Room ID"
            className="w-full dark:bg-gray-600 px-4 py-2 border dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Button */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={joinChat}
              className="bg-blue-500 py-2 px-3 rounded-full hover:bg-blue-800 transition-colors mt-4"
            >
              Join Room
            </button>
            <button
              onClick={createRoom}
              className="bg-orange-500 py-2 px-3 rounded-full hover:bg-orange-800 transition-colors mt-4"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCreateChat;
