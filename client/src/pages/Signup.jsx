import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const errors = [
  {
    type: "TypeError",
    message: "Cannot read properties of null (reading 'price')",
    file: "checkout.js:42",
    time: "2s ago",
  },
  {
    type: "ReferenceError",
    message: "user is not defined",
    file: "auth.js:18",
    time: "1m ago",
  },
  {
    type: "TypeError",
    message: "Cannot read properties of undefined (reading 'map')",
    file: "dashboard.js:91",
    time: "3m ago",
  },
  {
    type: "NetworkError",
    message: "Failed to fetch /api/orders",
    file: "api/orders.js:7",
    time: "5m ago",
  },
];

function LivePanel() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((v) => (v < errors.length ? v + 1 : v));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0a0a] rounded-r-[36px] flex flex-col justify-between p-10 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-16">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                strokeDasharray="3 3"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            BugRadar
          </span>
        </div>

        <h2 className="text-white text-3xl font-semibold leading-snug mb-3">
          Know when your
          <br />
          app breaks.
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
          Real-time error monitoring for your web apps. Drop in one script tag
          and never miss a bug again.
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-gray-500 text-xs font-medium tracking-widest uppercase">
            Live errors
          </span>
        </div>

        {errors.slice(0, visible).map((err, i) => (
          <div
            key={i}
            className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4"
            style={{ animation: "fadeSlideIn 0.4s ease forwards" }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-red-400 text-xs font-medium font-mono">
                {err.type}
              </span>
              <span className="text-gray-600 text-xs shrink-0">{err.time}</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed mb-2 font-mono">
              {err.message}
            </p>
            <span className="text-gray-600 text-xs font-mono">{err.file}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 border-t border-[#1a1a1a] pt-6">
        <p className="text-gray-600 text-xs">
          <span className="text-white font-medium">2,847 errors</span> caught
          this week across{" "}
          <span className="text-white font-medium">12 projects</span>
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    // LAYOUT CHANGE: same as Login — light gray page, centered card
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-6">
      {/* LAYOUT CHANGE: floating card wrapper */}
      <div
        className="w-full max-w-5xl flex rounded-[36px] overflow-hidden shadow-2xl border border-gray-200"
        style={{ minHeight: "600px" }}
      >
        {/* Left — form, white background, 42% width */}
        <div className="w-full lg:w-[42%] flex flex-col justify-center px-10 py-12 bg-white">
          <div className="w-full max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-10">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                    strokeDasharray="3 3"
                  />
                </svg>
              </div>
              <span className="text-gray-900 font-semibold text-lg tracking-tight">
                BugRadar
              </span>
            </div>

            <h2 className="text-gray-900 text-3xl font-semibold mb-1">
              Create account
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Start monitoring your apps in minutes.
            </p>

            {error && (
              <div className="mb-6 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-600 text-xs font-medium mb-2 block">
                  Email address
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl h-11 px-4 gap-3 focus-within:border-indigo-400 transition-colors">
                  <svg width="15" height="11" viewBox="0 0 16 11" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z"
                      fill="#9CA3AF"
                    />
                  </svg>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-xs font-medium mb-2 block">
                  Password
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl h-11 px-4 gap-3 focus-within:border-indigo-400 transition-colors">
                  <svg width="12" height="15" viewBox="0 0 13 17" fill="none">
                    <path
                      d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                      fill="#9CA3AF"
                    />
                  </svg>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm w-full"
                    required
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-11 rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-60 mt-2"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>

            <p className="text-gray-500 text-sm mt-6 text-center">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-500 hover:text-indigo-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right — LivePanel, 58% width, hidden on mobile */}
        <div className="hidden lg:block lg:w-[58%]">
          <LivePanel />
        </div>
      </div>
    </div>
  );
}
