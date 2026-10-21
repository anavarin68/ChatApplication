
import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { httpCLient } from "../config/AxiosHelper";
import { getApiErrorMessage } from "../services/AuthService";
import chatIcon from "../assets/bubble-chat.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const hasVerificationParams = Boolean(email && token);
  const [message, setMessage] = useState(
    hasVerificationParams ? "Verifying your email..." : "Invalid verification link.",
  );
  const [loading, setLoading] = useState(hasVerificationParams);
  const verificationStarted = useRef(false);

  useEffect(() => {
    document.title = "Verify email - Chatify";
  }, []);

  useEffect(() => {

    if (verificationStarted.current) return;
    verificationStarted.current = true;

    if (!hasVerificationParams) return;

    httpCLient
      .get("/api/v1/auth/verify-email", {
        params: { email, token },
      })
      .then((response) => {
        setMessage(
          typeof response.data === "string"
            ? response.data
            : "Email verified successfully."
        );
      })
      .catch((error) => {
        setMessage(
          getApiErrorMessage(error, "Email verification failed. Please try again."),
        );
      })
      .finally(() => setLoading(false));
  }, [email, hasVerificationParams, searchParams, token]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08111f] px-6 py-10 text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">
        <div className="mb-8 flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
            <img src={chatIcon} alt="" className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">Chatify</span>
        </div>

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl ring-1 ring-cyan-300/20">
          {loading ? "✉" : message.toLowerCase().includes("success") ? "✓" : "!"}
        </div>

        <p className="text-sm font-medium text-cyan-300">Account verification</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {loading ? "Verifying your email" : "Email verification"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">{message}</p>

        {loading && (
          <div className="mx-auto mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-400" />
          </div>
        )}

        {!loading && (
          <Link
            to="/login"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200/50"
          >
            Continue to login
          </Link>
        )}
        <p className="mt-6 text-xs text-slate-500">
          Secure your account before joining a conversation.
        </p>
      </section>
    </main>
  );
};

export default VerifyEmail;
