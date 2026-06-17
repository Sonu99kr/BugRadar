import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: `${config.apiBase}/api`,
  withCredentials: true,
});

export default api;
