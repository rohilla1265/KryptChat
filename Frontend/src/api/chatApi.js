import axiosClient from '../utils/axiosClient.js'; 

export const fetchChatHistory = async (user1, user2) => {
  try {
    // Ab baseURL aur withCredentials automatically apply honge
    const res = await axiosClient.get(`/messages/history/${user1}/${user2}`);
    return res.data.success ? res.data.messages : [];
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};