import axios from "axios";

const baseURL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api" // Aapka local backend port
  : "https://kryptchatbackend.onrender.com/api"; // Aapka live backend URL

const axiosClient = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers:{
        'Content-Type':'application/json'
    }
});

export default axiosClient;