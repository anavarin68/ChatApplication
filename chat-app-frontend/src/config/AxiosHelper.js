import axios from "axios";
export const baseURL = "https://chatapp-backend-jk31.onrender.com";
export const httpCLient = axios.create({
    baseURL: baseURL,
});