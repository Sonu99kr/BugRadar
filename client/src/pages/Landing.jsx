import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [errorCount, setErrorCount] = useState(2847);

  // Simulate live error counter ticking up
  useEffect(() => {
    const interval = setInterval(() => {
      setErrorCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
            <svg
              width="12"
              height="12"
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
          <span className="text-white font-semibold text-sm tracking-tight">
            BugRadar
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            Docs
          </a>
          <button
            onClick={() => navigate("/login")}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="bg-white hover:bg-gray-100 text-black text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="px-8 pt-20 pb-16 max-w-6xl mx-auto">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 border border-[#1f1f1f] rounded-full px-4 py-1.5 mb-10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
          <span className="text-gray-400 text-xs font-mono">
            {errorCount.toLocaleString()} errors caught today
          </span>
        </div>

        {/* Asymmetric grid — big headline left, meta right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 items-end mb-14">
          <div>
            <h1
              className="text-white font-semibold leading-none tracking-tight"
              style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
            >
              Know when
              <br />
              your app
              <br />
              <span className="text-indigo-400">breaks.</span>
            </h1>
          </div>

          {/* Right meta column — editorial style */}
          <div className="lg:pb-3">
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Drop one script tag into any website. Every unhandled error gets
              captured, grouped, and surfaced in real time — before your users
              notice.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/signup")}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-5 py-3 rounded-xl transition-colors"
              >
                Start monitoring free →
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-white text-sm px-5 py-3 rounded-xl transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>

        {/* Divider with label */}
        <div className="flex items-center gap-4 mb-14">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="text-gray-700 text-xs font-mono tracking-widest uppercase">
            how it works
          </span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>

        {/* ── Features — asymmetric grid ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4 mb-20">
          {/* Feature 1 — large card */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="text-white text-base font-medium mb-2">
              One script tag
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              No SDK configuration, no build step, no npm install. Paste one
              line and every error in your app is instantly monitored.
            </p>
            {/* Mini code snippet */}
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-gray-600 text-xs font-mono mb-1">
                {"<!-- paste before </body> -->"}
              </p>
              <p className="text-indigo-300 text-xs font-mono leading-relaxed">
                {'<script src="bugradar.js"'}
                <br />
                {'  data-key="br_live_••••">'}
                <br />
                {"</script>"}
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#34d399"
                strokeWidth="1.5"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="text-white text-base font-medium mb-2">
              Real-time dashboard
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Errors appear on your dashboard the moment they happen. Live
              updates via WebSocket — no refreshing needed.
            </p>

            {/* Mini live indicator */}
            <div className="mt-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-xs font-mono">live</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mb-6">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fb923c"
                strokeWidth="1.5"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <h3 className="text-white text-base font-medium mb-2">
              Smart grouping
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Same error from 500 users shows as one group, not 500 rows.
              Fingerprinting by message, file, and line number.
            </p>

            {/* Mini stat */}
            <div className="mt-6 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600 text-xs">500 hits</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4B5563"
                strokeWidth="1.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="text-white text-xs font-medium">1 group</span>
            </div>
          </div>
        </div>

        {/* ── CTA banner ─────────────────────────────────── */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-2xl font-semibold mb-2">
              Start monitoring in 30 seconds.
            </h2>
            <p className="text-gray-500 text-sm">
              Free to use. No credit card. One script tag.
            </p>
          </div>
          <button
            onClick={() => navigate("/signup")}
            className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Create free account →
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
