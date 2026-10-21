import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import chatIcon from "../assets/bubble-chat.png";
import {
  getApiErrorMessage,
  getAuthToken,
  loginApi,
  registerApi,
} from "../services/AuthService";
import useChatContext from "../context/ChatContext";

const AuthPage = () => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser } = useChatContext();
  const isSignup = mode === "signup";

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setForm({ name: "", email: "", password: "" });
  }

  async function submit(event) {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();

    if ((isSignup && !name) || !email || !form.password) {
      toast.error(isSignup ? "Enter your name, email, and password." : "Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await registerApi({ name, email, password: form.password });
        toast.success("Verification link sent. Check your email.");
        switchMode("login");
      } else {
        const response = await loginApi({ email, password: form.password });
        const token = getAuthToken(response);
        if (token) {
          localStorage.setItem("authToken", token);
        }
        localStorage.setItem("authEmail", email);
        const username = response.name || response.username || email.split("@")[0];
        localStorage.setItem("authName", username);
        setCurrentUser(username);
        toast.success("Logged in successfully.");
        navigate("/rooms");
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isSignup
            ? "Unable to create your account. Please try again."
            : "Unable to log in. Verify your email and credentials.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08111f] px-6 py-10 text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
            <img src={chatIcon} alt="" className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">Chatify</span>
        </div>

        <div className="mb-7">
          <p className="text-sm font-medium text-cyan-300">Welcome to Chatify</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignup
              ? "Sign up and verify your email before logging in."
              : "Log in with your verified email to continue."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-black/20 p-1">
          {["login", "signup"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchMode(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === tab ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form className="space-y-5" onSubmit={submit}>
          {isSignup && (
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={updateForm}
                placeholder="e.g. Nitish"
                className="w-full rounded-xl border border-white/10 bg-[#101d30] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={updateForm}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-[#101d30] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={6}
              value={form.password}
              onChange={updateForm}
              placeholder="Your password"
              className="w-full rounded-xl border border-white/10 bg-[#101d30] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default AuthPage;
