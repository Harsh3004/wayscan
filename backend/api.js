import axios from "axios";

const API_URL = "http://192.168.137.1:5000/"; 

export const sendDetection = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/report`, data);
    console.log("Sent:", res.data);
  } catch (err) {
    console.log("Error:", err.message);
  }
};