
import { FlowerInfo } from "../types";

const ZHIPU_API_KEY = import.meta.env.VITE_ZHIPU_API_KEY;
const ZHIPU_API_BASE = "https://open.bigmodel.cn/api/paas/v4";

// 识别花卉 - 使用 GLM-4V 视觉 API
// 识别花卉 - 使用 GLM-4V 视觉 API
interface IdentificationResult {
  name: string;
  confidence: number;
}

async function identifyFlowerByVision(base64Image: string): Promise<IdentificationResult> {
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
              text: "请作为植物学家，根据图像清晰度、特征可见性、光照条件进行严格打分。返回JSON：{name: string, confidence: number}。\n评分标准：\n- 极度清晰且特征完整：0.9800-0.9999\n- 略有模糊或部分遮挡：0.9000-0.9500\n- 较模糊或特征不明显：0.8000-0.8900\n**请务必精确到小数点后4位，例如 0.9254, 0.9731, 0.8812。拒绝整数！**"
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
      temperature: 0.5, // 提高温度以增加多样性
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision API failed: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // console.log("🌸 Vision API Raw Response:", content);

  // 尝试解析 JSON
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      // console.log("✅ Parsed JSON:", result);

      let conf = 0.95;
      if (typeof result.confidence === 'number') {
        conf = result.confidence;
      } else if (typeof result.confidence === 'string') {
        conf = parseFloat(result.confidence);
      }

      // 确保置信度在合理范围内 (0-1)
      if (conf > 1) conf = conf / 100;

      return {
        name: result.name || "未知花卉",
        confidence: conf
      };
    }
  } catch (e) {
    console.warn("Parsing failed", e);
  }

  // 降级处理：如果不是 JSON，尝试直接清理文本作为名字
  let name = content;
  name = name.replace(/^中文名称[：:]\s*/, '')
    .replace(/^花名[：:]\s*/, '')
    .replace(/^识别结果[：:]\s*/, '')
    .replace(/["{}\n]/g, '')
    .replace(/[。，！.!,]/g, '');

  // 提取 AI 返回的置信度
  let confidence = 0.90; // 默认值
  const percentMatch = content.match(/(\d{1,3})(\.\d+)?%/);
  const decimalMatch = content.match(/\b0\.\d+\b/);

  if (percentMatch) {
    confidence = parseFloat(percentMatch[1]) / 100;
  } else if (decimalMatch) {
    confidence = parseFloat(decimalMatch[0]);
  }

  confidence = Math.min(Math.max(confidence, 0.1), 0.99);

  return { name: name.trim(), confidence };
}

// 获取花卉详细信息 - 使用 GLM-4 文本 API
async function getFlowerInfo(flowerName: string): Promise<Omit<FlowerInfo, "name" | "confidence">> {
  const prompt = `请为花卉"${flowerName}"生成以下信息，严格按照JSON格式返回。**所有内容必须使用简体中文**：
{
  "scientificName": "花卉的英文名称（如：Rose, Sunflower等）",
  "description": "优美详细的花卉介绍，包括形态特征和观赏价值，50-80字，必须使用中文",
  "poetry": "一句与此花相关的诗词，两行，用逗号分隔（如：采菊东篱下，悠然见南山）",
  "botany": "植物学特征，80字以内，优雅简洁，必须使用中文",
  "culture": "文化内涵，80字以内，富有诗意，必须使用中文",
  "care": {
    "water": "浇水要点，15字以内，使用中文",
    "sunlight": "光照要求，15字以内，使用中文",
    "soil": "土壤要求，15字以内，使用中文",
    "temperature": "温度要求，15字以内，使用中文"
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
    // 步骤 1: 识别花名和置信度
    const { name: flowerName, confidence } = await identifyFlowerByVision(base64Image);

    // 步骤 2: 获取详细信息
    const info = await getFlowerInfo(flowerName);

    // 步骤 3: 生成简短描述
    // const description = `由智谱 AI 识别为${flowerName}`;

    return {
      name: flowerName,
      confidence: confidence, // 使用 AI 返回的动态置信度
      description: info.description || `${flowerName}，优雅的花卉植物。`,
      ...info
    };
  } catch (error) {
    console.error("Identify Error:", error);
    throw new Error("识别失败，请稍后再试");
  }
};

