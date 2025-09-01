from fastapi import FastAPI
from pathlib import Path
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import json # Added json import

app = FastAPI()

# CORS 미들웨어 설정
origins = [
    "http://localhost",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "WebDraw Studio Backend is running!"}

@app.get("/api/models/checkpoints")
def get_checkpoints() -> List[Dict[str, Any]]:
    checkpoints_dir = Path("models/checkpoints")
    allowed_extensions = [".safetensors", ".ckpt", ".pth"]
    checkpoints = []

    for p in checkpoints_dir.rglob("*"):
        if p.is_file() and p.suffix.lower() in allowed_extensions:
            # Find a corresponding image file (png, jpg, etc.)
            image_path = next(p.parent.glob(f"{p.stem}.*['.png', '.jpg', '.jpeg', '.webp']"), None)
            
            checkpoints.append({
                "name": p.name,
                "path": str(p).replace('\\', '/') if p else None,
                "subfolder": str(p.parent.relative_to(checkpoints_dir)).replace('\\', '/') if p.parent != checkpoints_dir else "",
                "preview_image": str(image_path).replace('\\', '/') if image_path else None
            })
            
    return checkpoints

@app.get("/api/models/vaes")
def get_vaes() -> List[Dict[str, Any]]:
    vaes_dir = Path("models/vae")
    allowed_extensions = [".safetensors", ".ckpt", ".pth"]
    vaes = []

    for p in vaes_dir.rglob("*"):
        if p.is_file() and p.suffix.lower() in allowed_extensions:
            image_path = next(p.parent.glob(f"{p.stem}.*['.png', '.jpg', '.jpeg', '.webp']"), None)
            
            vaes.append({
                "name": p.name,
                "path": str(p).replace('\\', '/') ,
                "subfolder": str(p.parent.relative_to(vaes_dir)).replace('\\', '/') if p.parent != vaes_dir else "",
                "preview_image": str(image_path).replace('\\', '/') if image_path else None
            })
            
    return vaes

@app.get("/api/models/loras")
def get_loras() -> List[Dict[str, Any]]:
    loras_dir = Path("models/loras")
    allowed_extensions = [".safetensors", ".ckpt", ".pth"]
    loras = []

    for p in loras_dir.rglob("*"):
        if p.is_file() and p.suffix.lower() in allowed_extensions:
            # Find a corresponding image file (png, jpg, etc.)
            image_path = next(p.parent.glob(f"{p.stem}.*['.png', '.jpg', '.jpeg', '.webp']"), None)
            
            loras.append({
                "name": p.name,
                "path": str(p).replace('\\', '/') ,
                "subfolder": str(p.parent.relative_to(loras_dir)).replace('\\', '/') if p.parent != loras_dir else "",
                "preview_image": str(image_path).replace('\\', '/') if image_path else None
            })
            
    return loras

@app.get("/api/presets/positive")
def get_positive_presets() -> List[Dict[str, str]]:
    presets_dir = Path("models/presets/posprpt")
    presets = []
    for p in presets_dir.glob("*.json"):
        try:
            content = p.read_text(encoding='utf-8')
            data = json.loads(content)
            if "prompt" in data:
                presets.append({"name": p.stem.replace('_', ' ').title(), "prompt": data["prompt"]})
        except Exception as e:
            print(f"Error reading preset file {p}: {e}")
    return presets

@app.get("/api/presets/negative")
def get_negative_presets() -> List[Dict[str, str]]:
    presets_dir = Path("models/presets/negprpt")
    presets = []
    for p in presets_dir.glob("*.json"):
        try:
            content = p.read_text(encoding='utf-8')
            data = json.loads(content)
            if "prompt" in data:
                presets.append({"name": p.stem.replace('_', ' ').title(), "prompt": data["prompt"]})
        except Exception as e:
            print(f"Error reading preset file {p}: {e}")
    return presets

@app.get("/api/models/detection")
def get_detection_models() -> List[str]:
    # IMPORTANT: This is an absolute path outside the project directory
    models_dir = Path("D:/Cube_Project/webtoonmakers/models/ultralytics")
    pt_files = []
    if models_dir.exists() and models_dir.is_dir():
        for p in models_dir.rglob("*.pt"):
            if p.is_file():
                pt_files.append(p.name)
    return pt_files

@app.get("/api/models/elements")
def get_elements() -> List[str]:
    elements_dir = Path("models/presets/elements")
    elements = []
    if elements_dir.exists() and elements_dir.is_dir():
        for p in elements_dir.glob("*.png"):
            if p.is_file():
                elements.append(p.name)
    return sorted(elements)
