import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5020/api",
  withCredentials: true, // sends httpOnly cookie with every request
});

export default api;
