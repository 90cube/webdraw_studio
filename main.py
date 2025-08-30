from fastapi import FastAPI
from pathlib import Path
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware

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
                "path": str(p).replace('\\', '/'),
                "subfolder": str(p.parent.relative_to(vaes_dir)).replace('\\', '/') if p.parent != vaes_dir else "",
                "preview_image": str(image_path).replace('\\', '/') if image_path else None
            })
            
    return vaes

@app.get("/api/models/loras")
def get_loras() -> List[Dict[str, Any]]:
    loras_dir = Path("models/lora")
    allowed_extensions = [".safetensors", ".ckpt", ".pth"]
    loras = []

    for p in loras_dir.rglob("*"):
        if p.is_file() and p.suffix.lower() in allowed_extensions:
            image_path = next(p.parent.glob(f"{p.stem}.*['.png', '.jpg', '.jpeg', '.webp']"), None)
            
            loras.append({
                "name": p.name,
                "path": str(p).replace('\\', '/'),
                "subfolder": str(p.parent.relative_to(loras_dir)).replace('\\', '/') if p.parent != loras_dir else "",
                "preview_image": str(image_path).replace('\\', '/') if image_path else None
            })
            
    return loras
