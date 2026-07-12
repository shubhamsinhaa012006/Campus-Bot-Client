import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export async function sendMessage(message, history) {
  const response = await axios.post(`${API_BASE_URL}/chat`, {
    message,
    history,
  });

  return response.data.reply;
}