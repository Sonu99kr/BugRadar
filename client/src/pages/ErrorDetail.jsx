import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api/axios";

// ─── Helpers ───────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getSeverity(count) {
  if (count > 100)
    return {
      label: "Critical",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    };
  if (count > 20)
    return {
      label: "High",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    };
  if (count > 5)
    return {
      label: "Medium",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    };
  return {
    label: "Low",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  };
}

function extractType(message) {
  if (!message) return "Error";
  const match = message.match(/^(\w+Error|\w+Exception)/);
  return match ? match[1] : "Error";
}

// ─── Custom tooltip ────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white text-sm font-medium">
          {payload[0].value} hits
        </p>
      </div>
    );
  }
  return null;
}

// ─── Stack trace renderer ───────────────────────────────────────

function StackTrace({ stack }) {
  const [expanded, setExpanded] = useState(false);

  if (!stack) return null;

  const lines = stack.split("\n");
  const visibleLines = expanded ? lines : lines.slice(0, 6);

  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
          Stack trace
        </span>
        {lines.length > 6 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors"
          >
            {expanded ? "Show less" : `Show all ${lines.length} lines`}
          </button>
        )}
      </div>
      <div className="p-4 overflow-x-auto">
        {visibleLines.map((line, i) => (
          <div key={i} className="flex gap-4 mb-1">
            <span className="text-gray-700 text-xs font-mono w-6 shrink-0 text-right">
              {i + 1}
            </span>
            <span
              className={`text-xs font-mono ${
                i === 0
                  ? "text-red-400"
                  : line.includes("node_modules")
                    ? "text-gray-700"
                    : "text-gray-400"
              }`}
            >
              {line}
            </span>
          </div>
        ))}
        {!expanded && lines.length > 6 && (
          <p className="text-gray-700 text-xs font-mono mt-2 ml-10">
            ... {lines.length - 6} more lines
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────

export default function ErrorDetail() {
  const { id, errorId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/projects/${id}/errors/${errorId}`);
        setData(res.data);
      } catch (err) {
        setError("Failed to load error details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, errorId]);

  const handleCopyStack = () => {
    if (data?.error?.stack) {
      navigator.clipboard.writeText(data.error.stack);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-4 bg-[#1f1f1f] rounded w-24 mb-8" />
        <div className="h-8 bg-[#1f1f1f] rounded w-2/3 mb-4" />
        <div className="h-4 bg-[#1f1f1f] rounded w-1/3 mb-10" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-20"
            />
          ))}
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-48 mb-4" />
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const { project, error: err, occurrences, timeline } = data;
  const severity = getSeverity(err.count);
  const errorType = extractType(err.message);
  const errorMessage = err.message.includes(":")
    ? err.message.split(":").slice(1).join(":").trim()
    : err.message;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-white transition-colors"
        >
          Projects
        </button>
        <span className="text-gray-700">/</span>
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="text-gray-600 hover:text-white transition-colors"
        >
          {project.name}
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400 font-mono">{errorType}</span>
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-red-400 text-sm font-mono font-medium bg-red-500/10 px-2 py-1 rounded-md">
            {errorType}
          </span>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-md border ${severity.bg} ${severity.border} ${severity.color}`}
          >
            {severity.label}
          </span>
        </div>
        <h1 className="text-white text-xl font-semibold leading-snug mb-2">
          {errorMessage}
        </h1>
        <div className="flex items-center gap-4 text-gray-500 text-xs">
          <span>First seen {timeAgo(err.first_seen)}</span>
          <span className="text-gray-700">·</span>
          <span>Last seen {timeAgo(err.last_seen)}</span>
          <span className="text-gray-700">·</span>
          <span>{err.count.toLocaleString()} total hits</span>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">
            Total hits
          </p>
          <p className="text-white text-2xl font-semibold">
            {err.count.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">
            First seen
          </p>
          <p className="text-white text-2xl font-semibold">
            {timeAgo(err.first_seen)}
          </p>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">
            Last seen
          </p>
          <p className="text-white text-2xl font-semibold">
            {timeAgo(err.last_seen)}
          </p>
        </div>
      </div>

      {/* ── Occurrence timeline ───────────────────────────────── */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 mb-6">
        <h2 className="text-white text-sm font-medium mb-1">
          Occurrence timeline
        </h2>
        <p className="text-gray-600 text-xs mb-6">Last 24 hours</p>

        {timeline.length === 0 ? (
          <div className="h-36 flex items-center justify-center">
            <p className="text-gray-600 text-sm">
              No occurrences in the last 24 hours
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={timeline}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1f1f1f"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#4B5563", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#4B5563", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Stack trace ───────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-sm font-medium">Stack trace</h2>
          <button
            onClick={handleCopyStack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-[#2a2a2a] px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <StackTrace stack={err.stack} />
      </div>

      {/* ── Recent occurrences ────────────────────────────────── */}
      <div>
        <h2 className="text-white text-sm font-medium mb-3">
          Recent occurrences
          <span className="text-gray-600 ml-2 font-normal">
            last {occurrences.length}
          </span>
        </h2>

        {occurrences.length === 0 ? (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8 text-center">
            <p className="text-gray-500 text-sm">No occurrences recorded</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {occurrences.map((occ, i) => (
              <div
                key={occ.id}
                className="bg-[#111] border border-[#1f1f1f] rounded-2xl px-5 py-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  {/* URL */}
                  {occ.url && (
                    <p className="text-indigo-400 text-xs font-mono truncate mb-2">
                      {occ.url}
                    </p>
                  )}

                  {/* Browser + OS */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4B5563"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <span className="text-gray-500 text-xs">
                        {occ.browser}
                      </span>
                    </div>
                    <span className="text-gray-700">·</span>
                    <span className="text-gray-500 text-xs">{occ.os}</span>
                    {occ.metadata?.viewport && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-gray-600 text-xs">
                          {occ.metadata.viewport.width}×
                          {occ.metadata.viewport.height}
                        </span>
                      </>
                    )}
                    {occ.metadata?.language && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-gray-600 text-xs">
                          {occ.metadata.language}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Time */}
                <span className="text-gray-600 text-xs shrink-0">
                  {timeAgo(occ.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
