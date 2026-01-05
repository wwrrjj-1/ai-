import os
import json

try:
    from zhipuai import ZhipuAI
except Exception:
    ZhipuAI = None

def _load_api_key():
    # Look for apikey.txt in the SAME directory as this file (server/)
    base = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base, 'apikey.txt')
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    if "智谱" in line or "zhipu" in line.lower():
                        parts = line.replace("：", ":").split(":")
                        if len(parts) > 1:
                            return parts[1].strip()
            return None
        except Exception:
            return None
    return None

API_KEY = _load_api_key()
client = ZhipuAI(api_key=API_KEY) if ZhipuAI and API_KEY else None

def get_flower_info(flower_name):
    """
    Search/Generate encyclopedia info based on the identified flower name.
    Strictly follows the 4-line 'Care' format.
    """
    prompt = f"""
请为"{flower_name}"生成花卉百科信息。

要求：
1. 必须返回纯 JSON 格式，不要包含任何其他文字或 markdown 标记
2. JSON 结构如下：
{{
  "poem": "与该花卉相关的著名诗词 (必须包含上下句，用逗号分隔，如：'采菊东篱下，悠然见南山')",
  "botany": "植物学特征简述 (科属、形态等，50字以内)",
  "description": "用优美的语言简短介绍这种花（30字以内）",
  "care": "养护核心要点。必须且仅包含四行，格式如下：\\n水分：[描述]\\n阳光：[描述]\\n土壤：[描述]\\n温度：[描述]\\n每行25字以内。",
  "culture": "花语或文化寓意 (30字以内)"
}}

请直接返回 JSON，不要添加任何前缀或后缀。
    """
    
    if not client:
        return json.dumps({
            "poem": "花开有时，静待花期",
            "botany": f"{flower_name}的详细信息暂时无法获取 (API Unavailable)",
            "care": "水分：适量\n阳光：充足\n土壤：疏松\n温度：适宜",
            "culture": "每朵花都有独特的美"
        }, ensure_ascii=False)
    try:
        response = client.chat.completions.create(
            model="glm-4",
            messages=[
                {"role": "system", "content": "你是一位植物学家,擅长用简洁优美的语言介绍花卉。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            top_p=0.9,
            max_tokens=512,
        )
        content = response.choices[0].message.content.strip()
        content = content.replace("```json", "").replace("```", "").strip()
        # Parse to ensure validity, but return string
        json.loads(content) 
        return content
    except Exception as e:
        print(f"Info Generation Failed: {e}")
        return json.dumps({
            "poem": "花开有时，静待花期",
            "botany": f"暂时无法获取{flower_name}的详细信息",
            "care": "水分：见干见湿\n阳光：保持明亮\n土壤：排水良好\n温度：温暖舒适",
            "culture": "生命力顽强"
        }, ensure_ascii=False)

def identify_flower_by_vision(base64_image):
    """
    Fallback: Use GLM-4V to identify the flower if local model fails.
    """
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model="glm-4v",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "请识别这张图片中的花卉。只返回花卉的标准中文名称，不要包含任何其他文字、标点或解释。"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": base64_image
                            }
                        }
                    ]
                }
            ]
        )
        
        flower_name = response.choices[0].message.content.strip()
        
        # Get brief desc
        desc_response = client.chat.completions.create(
            model="glm-4",
            messages=[
                {"role": "user", "content": f"请用一句话简短介绍一下{flower_name}这种花（30字以内）。"}
            ]
        )
        description = desc_response.choices[0].message.content.strip()

        return {
            "name": flower_name,
            "description": description
        }

    except Exception as e:
        print(f"Identify Flower Vision Failed: {e}")
        return None
