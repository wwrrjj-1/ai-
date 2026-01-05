
import os
import sys
import torch
import json
from model import get_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print(f"Base Dir: {BASE_DIR}")

def test_load():
    print("--- Testing JSON Load ---")
    try:
        with open(os.path.join(BASE_DIR, 'flower_names.json'), 'r', encoding='utf-8') as f:
            names = json.load(f)
            print(f"Loaded {len(names)} names.")
    except Exception as e:
        print(f"JSON Load Failed: {e}")

    print("--- Testing Model Load ---")
    model_path = os.path.join(BASE_DIR, 'model', 'best_model.pth')
    if os.path.exists(model_path):
        print(f"Model file found at {model_path}")
        try:
            device = torch.device('cpu')
            num_classes = 102
            print("Creating model object (convnext_large)...")
            model = get_model(num_classes, 'convnext_large')
            print("Loading state dict...")
            checkpoint = torch.load(model_path, map_location=device)
            print("State dict loaded. Keys:", len(checkpoint.keys()) if isinstance(checkpoint, dict) else "Not dict")
            
            # fast check
            if 'model_state_dict' in checkpoint:
                 print("Found 'model_state_dict' key.")
            
            print("Model load complete.")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Model Init Failed: {e}")
    else:
        print(f"Model file NOT found at {model_path}")

if __name__ == "__main__":
    test_load()
