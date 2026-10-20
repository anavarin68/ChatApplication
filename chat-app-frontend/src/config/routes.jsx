import { Routes, Route } from "react-router-dom";
import ChatPage from "../components/ChatPage.jsx";
import JoinCreateChat from "../components/JoinCreateChat.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<JoinCreateChat />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;