import "./App.css";
//import JoinCreateChat from "./components/JoinCreateChat";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./config/routes.jsx";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* <JoinCreateChat /> */}
      <AppRoutes />
    </>
  );
}

export default App;
