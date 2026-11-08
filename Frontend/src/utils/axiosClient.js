import axios from "axios";
const axiosClient = axios.create({
    baseURL:'https://kryptchatbackend.onrender.com/api',
    withCredentials: true,
    headers:{
        'Content-Type':'application/json'
    }
});
export default axiosClient;