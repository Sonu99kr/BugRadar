import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setTimeout(() => navigate("/"), 50);
  };

  return (
    <nav className="h-14 border-b border-[#1f1f1f] bg-[#0a0a0a] flex items-center px-6 justify-between">
      <Link to="/" className="flex items-center gap-2 no-underline">
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
      </Link>

      <div className="flex items-center gap-6">
        {/* Docs link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          Docs
        </a>
        <span className="text-gray-500 text-sm hidden sm:block">
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white border border-[#2a2a2a] hover:border-[#3a3a3a] px-3 py-1.5 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
