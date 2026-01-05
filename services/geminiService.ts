
import { FlowerInfo } from "../types";

const ZHIPU_API_KEY = import.meta.env.VITE_ZHIPU_API_KEY;
const ZHIPU_API_BASE = "https://open.bigmodel.cn/api/paas/v4";

// 识别花卉 - 使用 GLM-4V 视觉 API
async function identifyFlowerByVision(base64Image: string): Promise<string> {
  const response = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4v",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请识别图片中的花卉名称。只返回花卉的中文名称，不要有任何额外的说明或标点符号。"
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision API failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// 获取花卉详细信息 - 使用 GLM-4 文本 API
async function getFlowerInfo(flowerName: string): Promise<Omit<FlowerInfo, "name" | "confidence" | "description">> {
  const prompt = `请为花卉"${flowerName}"生成以下信息，严格按照JSON格式返回：
{
  "poetry": "一句与此花相关的诗词，两行，用逗号分隔（如：采菊东篱下，悠然见南山）",
  "botany": "植物学特征，80字以内，优雅简洁",
  "culture": "文化内涵，80字以内，富有诗意",
  "care": {
    "water": "浇水要点，15字以内",
    "sunlight": "光照要求，15字以内",
    "soil": "土壤要求，15字以内",
    "temperature": "温度要求，15字以内"
  }
}
只返回JSON，不要其他内容。`;

  const response = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: "glm-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Info API failed: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // 解析 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse flower info");
  }

  return JSON.parse(jsonMatch[0]);
}

export const identifyFlower = async (base64Image: string): Promise<FlowerInfo> => {
  try {
    // 步骤 1: 识别花名
    const flowerName = await identifyFlowerByVision(base64Image);

    // 步骤 2: 获取详细信息
    const info = await getFlowerInfo(flowerName);

    // 步骤 3: 生成简短描述
    const description = `由智谱 AI 识别为${flowerName}`;

    return {
      name: flowerName,
      confidence: 95, // 云端 API 高置信度
      description,
      ...info
    };
  } catch (error) {
    console.error("Identify Error:", error);
    throw new Error("识别失败，请稍后再试");
  }
};

