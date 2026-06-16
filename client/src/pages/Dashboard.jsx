import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  LineChart,
  Line,
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

function extractFile(stack) {
  if (!stack) return "unknown";
  const lines = stack.split("\n");
  for (const line of lines) {
    const match =
      line.match(/at .+\((.+):(\d+):\d+\)/) || line.match(/at (.+):(\d+):\d+/);
    if (match) {
      return (
        match[1]
          .replace(/^https?:\/\/[^/]+/, "")
          .replace(/\?.*$/, "")
          .split("/")
          .pop() +
        ":" +
        match[2]
      );
    }
  }
  return "unknown";
}

function extractType(message) {
  if (!message) return "Error";
  const match = message.match(/^(\w+Error|\w+Exception)/);
  return match ? match[1] : "Error";
}

// ─── Severity ──────────────────────────────────────────────────

function getSeverity(count) {
  if (count > 100) return "critical";
  if (count > 20) return "high";
  if (count > 5) return "medium";
  return "low";
}

const severityConfig = {
  critical: {
    label: "Critical",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Low",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    dot: "bg-blue-500",
  },
};

function SeverityBadge({ count }) {
  const severity = getSeverity(count);
  const config = severityConfig[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border ${config.bg} ${config.border} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ─── Custom tooltip ────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white text-sm font-medium">
          {payload[0].value} errors
        </p>
      </div>
    );
  }
  return null;
}

// ─── Browser distribution widget ───────────────────────────────

function BrowserWidget({ projectId }) {
  const [browsers, setBrowsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/browsers`);
        setBrowsers(res.data.browsers);
      } catch (err) {
        console.error("Browser fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId]);

  const browserColors = {
    Chrome: "bg-blue-500",
    Safari: "bg-orange-500",
    Firefox: "bg-purple-500",
    Edge: "bg-teal-500",
    Opera: "bg-red-500",
    Unknown: "bg-gray-500",
  };

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
      <h2 className="text-white text-sm font-medium mb-4">
        Browser distribution
      </h2>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-[#1f1f1f] rounded" />
          ))}
        </div>
      ) : browsers.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-6">No data yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {browsers.map((b) => (
            <div key={b.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 text-xs">{b.name}</span>
                <span className="text-gray-500 text-xs font-mono">
                  {b.percentage}% · {b.count}
                </span>
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${browserColors[b.name] || "bg-gray-500"}`}
                  style={{ width: `${b.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [trendRange, setTrendRange] = useState("24h");
  const [trendLoading, setTrendLoading] = useState(false);
  const [sortBy, setSortBy] = useState("last_seen");
  const [severityFilter, setSeverityFilter] = useState("all");

  const handleLiveMessage = useCallback((message) => {
    const [flashNew, setFlashNew] = useState(false);
    if (message.type !== "new_error") return;

    // 1. Update stats — increment total occurrences
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalOccurrences: Number(prev.stats.totalOccurrences) + 1,
          lastSeen: message.timestamp,
        },
      };
    });

    // 2. Update error groups — update count or add new group
    setData((prev) => {
      if (!prev) return prev;

      const existingIndex = prev.errors.findIndex(
        (e) => e.id === message.groupId,
      );

      let updatedErrors;

      if (existingIndex !== -1) {
        // Existing error — increment count and move to top
        updatedErrors = [...prev.errors];
        updatedErrors[existingIndex] = {
          ...updatedErrors[existingIndex],
          count: message.count,
          last_seen: message.timestamp,
        };
      } else {
        // New error group — add to top of list
        updatedErrors = [
          {
            id: message.groupId,
            message: message.message,
            stack: "",
            count: message.count,
            first_seen: message.timestamp,
            last_seen: message.timestamp,
          },
          ...prev.errors,
        ];

        // Also increment unique error count
        return {
          ...prev,
          errors: updatedErrors,
          stats: {
            ...prev.stats,
            totalGroups: prev.stats.totalGroups + 1,
            totalOccurrences: Number(prev.stats.totalOccurrences) + 1,
            lastSeen: message.timestamp,
          },
        };
      }

      return { ...prev, errors: updatedErrors };
    });

    // 3. Update activity feed — add new occurrence to top
    setOccurrences((prev) => {
      const newOccurrence = {
        id: `live-${Date.now()}`,
        message: message.message,
        browser: "Unknown",
        os: "Unknown",
        url: message.url,
        created_at: message.timestamp,
      };
      // Keep max 10 items
      return [newOccurrence, ...prev].slice(0, 10);
    });
    setFlashNew(true);
    setTimeout(() => setFlashNew(false), 1000);
  }, []);

  useWebSocket(id, handleLiveMessage);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [errorsRes, occurrencesRes] = await Promise.all([
          api.get(`/projects/${id}/errors?page=${page}&limit=20`),
          api.get(`/projects/${id}/occurrences`),
        ]);
        setData(errorsRes.data);
        setOccurrences(occurrencesRes.data.occurrences);
      } catch (err) {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, page]);

  useEffect(() => {
    const fetchTrend = async () => {
      setTrendLoading(true);
      try {
        const res = await api.get(`/projects/${id}/trend?range=${trendRange}`);
        setTrend(res.data.trend);
      } catch (err) {
        console.error("Trend fetch failed:", err);
      } finally {
        setTrendLoading(false);
      }
    };
    fetchTrend();
  }, [id, trendRange]);

  // Sort + filter errors client side
  const processedErrors = data?.errors
    ? [...data.errors]
        .filter((err) => {
          if (severityFilter === "all") return true;
          return getSeverity(err.count) === severityFilter;
        })
        .sort((a, b) => {
          if (sortBy === "count") return b.count - a.count;
          if (sortBy === "first_seen")
            return new Date(a.first_seen) - new Date(b.first_seen);
          return new Date(b.last_seen) - new Date(a.last_seen);
        })
    : [];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-4 bg-[#1f1f1f] rounded w-24 mb-8" />
        <div className="h-8 bg-[#1f1f1f] rounded w-48 mb-10" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-24"
            />
          ))}
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-64 mb-4" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-20 mb-3"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const { project, errors, pagination, stats } = data;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* ── Back ─────────────────────────────────────────────── */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        All projects
      </button>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-semibold">{project.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Error monitoring dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 border border-[#1f1f1f] rounded-full px-3 py-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          <span className="text-gray-500 text-xs">Live</span>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6">
          <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
            Unique errors
          </p>
          <p className="text-white text-3xl font-semibold">
            {stats.totalGroups}
          </p>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6">
          <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
            Total occurrences
          </p>
          <p className="text-white text-3xl font-semibold">
            {Number(stats.totalOccurrences).toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6">
          <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
            Last error
          </p>
          <p className="text-white text-3xl font-semibold">
            {stats.lastSeen ? timeAgo(stats.lastSeen) : "—"}
          </p>
        </div>
      </div>

      {/* ── Trend chart ──────────────────────────────────────── */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-sm font-medium">Error trend</h2>
            <p className="text-gray-600 text-xs mt-0.5">
              Occurrences over time
            </p>
          </div>
          <div className="flex items-center bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-1 gap-1">
            {["24h", "7d", "30d"].map((range) => (
              <button
                key={range}
                onClick={() => setTrendRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  trendRange === range
                    ? "bg-indigo-500 text-white"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trend.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-gray-600 text-sm">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={trend}
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
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 3 }}
                activeDot={{ r: 5, fill: "#818cf8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* ── Error groups ───────────────────────────────────── */}
        <div>
          {errors.length === 0 ? (
            <div className="bg-[#111] border border-dashed border-[#2a2a2a] rounded-2xl p-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="text-white text-base font-medium mb-2">
                No errors captured yet
              </h3>
              <p className="text-gray-500 text-sm mb-8 max-w-sm">
                Install the BugRadar SDK on your website to start capturing
                errors
              </p>
              <div className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 text-left">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">
                  Install snippet
                </p>
                <pre className="text-indigo-300 text-xs font-mono leading-relaxed overflow-x-auto">
                  {`<script
  src="http://localhost:5020/sdk/bugradar.js"
  data-key="YOUR_PROJECT_API_KEY"
  data-endpoint="http://localhost:5020/api/ingest">
</script>`}
                </pre>
              </div>
            </div>
          ) : (
            <>
              {/* Controls row */}
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h2 className="text-white text-sm font-medium">
                  Error groups
                  <span className="text-gray-600 ml-2 font-normal">
                    {processedErrors.length} shown
                  </span>
                </h2>

                <div className="flex items-center gap-2">
                  {/* Severity filter */}
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#1f1f1f] text-gray-400 text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-[#2a2a2a] transition-colors"
                  >
                    <option value="all">All severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  {/* Sort toggle */}
                  <div className="flex items-center bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-1 gap-1">
                    {[
                      { key: "last_seen", label: "Recent" },
                      { key: "count", label: "Frequency" },
                      { key: "first_seen", label: "Oldest" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          sortBy === opt.key
                            ? "bg-indigo-500 text-white"
                            : "text-gray-500 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* No results after filter */}
              {processedErrors.length === 0 && (
                <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No {severityFilter} severity errors found
                  </p>
                  <button
                    onClick={() => setSeverityFilter("all")}
                    className="text-indigo-400 text-xs mt-2 hover:text-indigo-300"
                  >
                    Clear filter
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {processedErrors.map((err) => (
                  <div
                    key={err.id}
                    onClick={() => navigate(`/projects/${id}/errors/${err.id}`)}
                    className="bg-[#111] border border-[#1f1f1f] hover:border-[#2a2a2a] rounded-2xl px-5 py-4 flex items-start justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Type + file + severity */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-red-400 text-xs font-mono font-medium bg-red-500/10 px-2 py-0.5 rounded-md shrink-0">
                          {extractType(err.message)}
                        </span>
                        <span className="text-gray-600 text-xs font-mono truncate">
                          {extractFile(err.stack)}
                        </span>
                        <SeverityBadge count={err.count} />
                      </div>

                      <p className="text-gray-300 text-sm truncate mb-2">
                        {err.message.includes(":")
                          ? err.message.split(":").slice(1).join(":").trim()
                          : err.message}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 text-xs">
                          First {timeAgo(err.first_seen)}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-gray-600 text-xs">
                          Last {timeAgo(err.last_seen)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1 mb-1">
                        <span className="text-red-400 text-sm font-medium font-mono">
                          {err.count.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-gray-700 text-xs">hits</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-gray-600 text-xs">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="text-xs text-gray-400 hover:text-white border border-[#2a2a2a] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(pagination.pages, p + 1))
                      }
                      disabled={page === pagination.pages}
                      className="text-xs text-gray-400 hover:text-white border border-[#2a2a2a] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right sidebar ───────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Activity feed */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
            <h2 className="text-white text-sm font-medium mb-4">
              Recent activity
            </h2>
            {occurrences.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-6">
                No activity yet
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {occurrences.map((occ, i) => (
                  <div key={occ.id}>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#4B5563"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-xs truncate mb-0.5">
                          {occ.message.includes(":")
                            ? occ.message.split(":").slice(1).join(":").trim()
                            : occ.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs">
                            {occ.browser}
                          </span>
                          <span className="text-gray-700">·</span>
                          <span className="text-gray-600 text-xs">
                            {occ.os}
                          </span>
                          <span className="text-gray-700">·</span>
                          <span className="text-gray-600 text-xs">
                            {timeAgo(occ.created_at)}
                          </span>
                        </div>
                        {occ.url && (
                          <p className="text-gray-700 text-xs truncate mt-0.5">
                            {occ.url}
                          </p>
                        )}
                      </div>
                    </div>
                    {i < occurrences.length - 1 && (
                      <div className="border-t border-[#1a1a1a] mt-3" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browser distribution */}
          <BrowserWidget projectId={id} />
        </div>
      </div>
    </div>
  );
}
