
import os
import io
import json
import base64

# Optional ML imports - only needed for local model inference
try:
    import torch
    import torch.nn.functional as F
    from torchvision import transforms
    from model import get_model
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

# AI utils are always needed (for cloud API)
from utils_ai import get_flower_info, identify_flower_by_vision

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Resources ---
device = None
model = None
idx_to_class = {}
flower_names = {}
ML_AVAILABLE = False
ML_ERROR = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_resources():
    global device, model, idx_to_class, flower_names, ML_AVAILABLE, ML_ERROR
    
    # If torch is not available, skip ML loading entirely
    if not TORCH_AVAILABLE:
        print("⚠️ PyTorch not available - running in API-only mode")
        ML_AVAILABLE = False
        ML_ERROR = "PyTorch not installed (cloud deployment mode)"
        return
    
    print("Loading resources from:", BASE_DIR)
    
    # 1. Load JSONs
    try:
        with open(os.path.join(BASE_DIR, 'flower_names.json'), 'r', encoding='utf-8') as f:
            flower_names = json.load(f)
            
        classes_path = os.path.join(BASE_DIR, 'classes.json')
        if os.path.exists(classes_path):
            with open(classes_path, 'r', encoding='utf-8') as f:
                classes_list = json.load(f)
                # idx_to_class: 0 -> "164" (strID)
                idx_to_class = {i: str(val) for i, val in enumerate(classes_list)}
        else:
             print("Warning: classes.json not found, using sorted keys fallback.")
             keys = sorted(list(flower_names.keys()))
             idx_to_class = {i: k for i, k in enumerate(keys)}
             
    except Exception as e:
        print(f"❌ Error loading jsons: {e}")
        return

    # 2. Load Model
    try:
        if torch.cuda.is_available():
            device = torch.device('cuda')
            print("Using CUDA")
        else:
            device = torch.device('cpu')
            print("Using CPU")

        # Model is in ./model/best_model.pth
        model_path = os.path.join(BASE_DIR, 'model', 'best_model.pth')
        
        if os.path.exists(model_path):
            print(f"Loading model from: {model_path}")
            # Fix: Use idx_to_class length (100) if available, as that matches the training classes.
            num_classes = len(idx_to_class) if idx_to_class else (len(flower_names) if flower_names else 102)
            print(f"Initializing model with num_classes={num_classes}")
            # Assuming ConvNeXt Large as per previous context
            model = get_model(num_classes, 'convnext_large') 
            checkpoint = torch.load(model_path, map_location=device)
            state_dict = checkpoint['model_state_dict'] if 'model_state_dict' in checkpoint else checkpoint
            
            # Handle potential DataParallel wrapper keys
            new_state_dict = {}
            for k, v in state_dict.items():
                name = k[7:] if k.startswith('module.') else k
                new_state_dict[name] = v
                
            model.load_state_dict(new_state_dict)
            model.to(device)
            if device.type == 'cuda':
                model.half()
            model.eval()
            ML_AVAILABLE = True
            print("✅ Model Loaded Successfully")
        else:
            print(f"❌ Model file not found at {model_path}")
            ML_AVAILABLE = False
            ML_ERROR = f"File Not Found: {model_path}"
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Model Load Failed: {e}")
        ML_AVAILABLE = False
        ML_ERROR = str(e)

load_resources()

# --- Preprocessing (only if torch is available) ---
if TORCH_AVAILABLE:
    data_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    def process_image(img_obj):
        image = img_obj.convert('RGB')
        return data_transform(image)
else:
    data_transform = None
    def process_image(img_obj):
        # This function won't be called in cloud mode, but define it anyway
        raise RuntimeError("Image processing requires PyTorch (local model mode)")


class ImageRequest(BaseModel):
    image: str


@app.get("/health")
def health():
    return {
        "status": "ok", 
        "ml_available": ML_AVAILABLE, 
        "ml_error": ML_ERROR,
        "device": str(device),
        "flower_count": len(flower_names)
    }

@app.post("/identify")
async def identify(req: ImageRequest):
    global ML_AVAILABLE
    
    # 1. Decode Image
    base64_str = req.image
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    
    try:
        image_data = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Image")

    # 2. Logic: Local Priority -> Cloud Fallback
    flower_id = None
    confidence = 0.0
    chinese_name = "未知"
    english_name = "Unknown"
    description = ""
    
    local_success = False
    
    # --- Step A: Local Model Inference ---
    if ML_AVAILABLE:
        try:
            input_tensor = process_image(image).unsqueeze(0).to(device)
            if device.type == 'cuda':
                input_tensor = input_tensor.half()
            
            with torch.no_grad():
                output = model(input_tensor)
                probs = F.softmax(output, dim=1)
                conf, pred_idx = torch.max(probs, dim=1)
            
            raw_conf = conf.item() * 100
            print(f"Local Inference: Index={pred_idx.item()}, Conf={raw_conf:.2f}%")
            
            if raw_conf >= 70: # Threshold
                flower_id = idx_to_class.get(pred_idx.item())
                if flower_id and flower_id in flower_names:
                    local_success = True
                    confidence = raw_conf
                    result_data = flower_names[flower_id]
                    chinese_name = result_data.get('chinese_name', '未知')
                    english_name = result_data.get('english_name', '')
                    english_name = result_data.get('english_name', '')
                    # description will be filled by LLM search later
                    print(f"✅ Local Match: {chinese_name}")
        except Exception as e:
            print(f"Local Inference Error: {e}")
            local_success = False

    # --- Step B: Cloud Fallback ---
    if not local_success:
        print("⚠️ Local failed/low conf. Switching to Zhipu GLM-4V...")
        vision_result = identify_flower_by_vision(base64_str)
        if vision_result and "name" in vision_result:
             chinese_name = vision_result['name']
             english_name = "Identified by Cloud API"
             description = vision_result.get('description', '')
             confidence = 99.9
             print(f"✅ Cloud Match: {chinese_name}")
        else:
             print("❌ Cloud also failed.")
             raise HTTPException(status_code=500, detail="Identification failed.")

    # --- Step C: Search Info (Text Generation) ---
    # User Requirement: "Text output is based on model recognition result search"
    # We use the 'chinese_name' (from either local or cloud) to query the LLM.
    print(f"🔍 Generating info for: {chinese_name}")
    info_json = get_flower_info(chinese_name)
    
    # Parse Result
    info = {
        "poem": "", "botany": "", "care": "", "culture": "", "description": ""
    }
    try:
        if info_json:
             parsed = json.loads(info_json)
             info.update(parsed)
    except:
        pass
    
    # If description was generated by LLM, use it. Otherwise keep existing (e.g. from Cloud Vision)
    if info.get("description"):
        description = info.get("description")
    elif not description:
        description = f"{chinese_name}，一种美丽的植物。"

    return {
        "name": chinese_name,
        "scientificName": english_name,
        "confidence": confidence / 100.0, # 0.0-1.0
        "description": description,
        "poetry": info.get("poem"),
        "botany": info.get("botany"),
        "care": info.get("care"),
        "culture": info.get("culture")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
