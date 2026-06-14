import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");
        setProjects(res.data.projects);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await api.post("/projects", { name: projectName });
      setProjects((prev) => [res.data.project, ...prev]);
      setNewKey(res.data.apiKey);
      setProjectName("");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (projectId) => {
    setDeletingId(projectId);
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewKey(null);
    setError("");
    setProjectName("");
  };

  // Get initials from project name for the card icon
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Random but consistent color per project
  const getColor = (id) => {
    const colors = [
      "bg-indigo-500",
      "bg-purple-500",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-orange-500",
      "bg-pink-500",
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 animate-pulse"
            >
              <div className="w-10 h-10 bg-[#1f1f1f] rounded-xl mb-4" />
              <div className="h-3 bg-[#1f1f1f] rounded w-2/3 mb-2" />
              <div className="h-2 bg-[#1f1f1f] rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-semibold">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projects.length > 0
              ? `${projects.length} project${projects.length > 1 ? "s" : ""}`
              : "No projects yet"}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="border border-dashed border-[#2a2a2a] rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4B5563"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <h3 className="text-white text-base font-medium mb-2">
            No projects yet
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Create your first project to get an API key and start monitoring
            errors
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Create your first project
          </button>
        </div>
      )}

      {/* Grid layout */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#2a2a2a] transition-all group"
            >
              {/* Card top — icon + menu */}
              <div className="flex items-start justify-between">
                <div
                  className={`w-10 h-10 ${getColor(project.id)} rounded-xl flex items-center justify-center`}
                >
                  <span className="text-white text-xs font-bold">
                    {getInitials(project.name)}
                  </span>
                </div>

                {/* Delete */}
                {confirmDeleteId === project.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-60"
                    >
                      {deletingId === project.id ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(project.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Project name + date */}
              <div>
                <h3 className="text-white text-sm font-medium mb-1 truncate">
                  {project.name}
                </h3>
                <p className="text-gray-600 text-xs">
                  Created{" "}
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-[#1f1f1f]" />

              {/* Footer — view errors button */}
              <button
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex items-center justify-between text-gray-500 hover:text-white text-xs transition-colors group/btn"
              >
                <span>View errors</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="group-hover/btn:translate-x-0.5 transition-transform"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add new project card */}
          <button
            onClick={() => setModalOpen(true)}
            className="border border-dashed border-[#2a2a2a] hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-colors group"
          >
            <div className="w-10 h-10 bg-[#1a1a1a] group-hover:bg-indigo-500/10 rounded-xl flex items-center justify-center transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B7280"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-gray-600 group-hover:text-gray-400 text-xs transition-colors">
              New project
            </span>
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md">
            {newKey ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="text-white text-base font-medium">
                    Project created
                  </h3>
                </div>
                <p className="text-gray-500 text-sm mb-6 ml-7">
                  Copy your API key now — it won't be shown again.
                </p>

                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                    API Key
                  </p>
                  <p className="text-green-400 text-sm font-mono break-all">
                    {newKey}
                  </p>
                </div>

                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
                    Install snippet
                  </p>
                  <p className="text-gray-300 text-xs font-mono break-all leading-relaxed">
                    {`<script src="http://localhost:5020/sdk/bugradar.js"\n  data-key="${newKey}"\n  data-endpoint="http://localhost:5020/api/ingest">\n</script>`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopy(newKey)}
                    className="flex-1 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
                  >
                    {copied ? "Copied!" : "Copy API key"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 h-10 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-white text-base font-medium mb-1">
                  New project
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Give your project a name to get started
                </p>

                {error && (
                  <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-2 block">
                      Project name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. My Portfolio Site"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl h-11 px-4 text-gray-200 placeholder-gray-600 outline-none text-sm focus:border-indigo-500/50 transition-colors"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 h-10 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !projectName.trim()}
                      className="flex-1 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-60"
                    >
                      {creating ? "Creating..." : "Create project"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
