import axios from "axios";

const API_URL = "http://192.168.137.1:5000/"; 

export const sendDetection = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/sync`, {
      ...data,
      device_id: "device_001", // replace with real device id later
      image_url: data.image_url  
    });
    console.log("Sent:", res.data);
  } catch (err) {
    console.log("Error:", err.message);
  }
};