
import { FlowerInfo } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/identify";

export const identifyFlower = async (base64Image: string): Promise<FlowerInfo> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Backend Error:", errText);
      throw new Error("识别服务请求失败");
    }

    const data = await response.json();
    return data as FlowerInfo;
  } catch (error) {
    console.error("Identify Error:", error);
    throw error;
  }
};
