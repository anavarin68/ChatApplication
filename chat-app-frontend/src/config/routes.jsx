import { Navigate, Routes, Route } from "react-router-dom";
import ChatPage from "../components/ChatPage.jsx";
import JoinCreateChat from "../components/JoinCreateChat.jsx";
import VerifyEmail from "../components/VerifyEmail.jsx";
import AuthPage from "../components/AuthPage.jsx";

const ProtectedRoute = ({ children }) => {
  return localStorage.getItem("authToken") ? children : <Navigate to="/auth" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <JoinCreateChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;