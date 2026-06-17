const config = {
  apiBase: import.meta.env.VITE_API_URL || "http://localhost:5020",
  wsBase: import.meta.env.VITE_WS_URL || "ws://localhost:5020",
};

export default config;
