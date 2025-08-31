# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebDraw Studio is an AI image generation web application with a Python FastAPI backend and a vanilla JavaScript frontend using Fabric.js for canvas manipulation. The app provides a professional interface for AI image generation with floating UI panels, dual canvas system, and ComfyUI-compatible model management.

## Development Commands

### Initial Setup
```bash
# Create virtual environment and directory structure
.\setup.bat

# Install Python dependencies
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Development Server
```bash
# Start both frontend and backend servers
.\all_start.bat
# Frontend: http://localhost:8000
# Backend: http://localhost:8001

# Stop all servers
.\stop_servers.bat
```

### Manual Server Management
```bash
# Frontend only (Python HTTP server)
python -m http.server 8000

# Backend only (FastAPI with uvicorn)
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

## Architecture Overview

### Backend (Python FastAPI)
- **main.py**: Single FastAPI application file
- **API Endpoints**:
  - `/api/models/checkpoints` - List AI model checkpoints
  - `/api/models/vaes` - List VAE models  
  - `/api/models/loras` - List LoRA models
  - `/api/presets/positive` - Positive prompt presets
  - `/api/presets/negative` - Negative prompt presets
  - `/api/models/detection` - Detection models (external path)
- **Model Organization**: ComfyUI-compatible structure with sd15/sdxl subdirectories
- **CORS**: Configured for localhost:8000 frontend

### Frontend (Vanilla JavaScript + Fabric.js)
Modular ES6 architecture with component-based organization:

#### Core Modules (`js/core/`)
- **app.js**: Main application entry point and module initialization
- **canvas.js**: Fabric.js canvas initialization and image mode management
- **ui.js**: Draggable panels and collapsible UI functionality  
- **stateManager.js**: Centralized state management with event-driven updates

#### UI Components (`js/components/`)
- **modelExplorer.js**: Model selection with hierarchical tree structure
- **parameters.js**: Generation parameters (steps, CFG, denoise, seed)
- **areaCapture.js**: Canvas area selection for image generation
- **multiDetailer.js**: Multi-step image processing workflow
- **prompt.js**: Prompt input with positive/negative presets
- **loraSelector.js**: LoRA model selection and management

#### Key Architectural Patterns
- **State Management**: Custom event-driven system (`stateManager.js`)
- **Component Structure**: Each component has `init()` function and manages own DOM
- **Canvas System**: Fabric.js with custom image modes (image/mask/preprocessor/controlnet/reference)
- **Panel System**: Floating draggable panels with collapse/expand functionality

## Model Directory Structure

**Critical**: All models must follow this exact structure for proper functioning:

```
models/
├── checkpoints/
│   ├── sd15/
│   └── sdxl/
├── lora/
│   ├── sd15/
│   └── sdxl/
├── vae/
│   ├── sd15/
│   └── sdxl/
└── controlnet/
    ├── sd15/
    └── sdxl/
```

The `models` directory is a symbolic link pointing to ComfyUI's model directory:
```
models -> /d/Comfyui/Original_comfyui/ComfyUI_windows_portable/ComfyUI/models
```

## Key Development Patterns

### Adding New Components
1. Create new file in `js/components/` 
2. Export `init()` function that:
   - Creates HTML content for assigned panel
   - Sets up event listeners
   - Integrates with `stateManager` for state updates
3. Import and call `init()` in `app.js`

### State Management Usage
```javascript
import state from '../core/stateManager.js';

// Get state
const currentModel = state.getState('currentBaseModel');

// Set state (triggers event)
state.setState('currentBaseModel', 'sdxl');

// Listen to state changes
state.listen('currentBaseModel', (newValue) => {
    // Handle state change
});
```

### Canvas Integration
Canvas modes determine object behavior:
- `image`: Standard I2I processing
- `mask`: Mask generation
- `preprocessor`: Preprocessing input
- `controlnet`: ControlNet source
- `reference`: Locked reference (non-editable)

### API Integration Pattern
```javascript
// Standard pattern for model fetching
const response = await fetch('http://localhost:8001/api/models/checkpoints');
const models = await response.json();
// Process hierarchical model structure with buildTree() function
```

## File Structure Notes

- **Static Assets**: CSS in `css/`, favicon and HTML in root
- **Documentation**: Korean planning documents and FabricJS guides in root
- **Examples**: `Ex/` directory contains experimental code
- **Batch Scripts**: Windows batch files for development workflow
- **Python Cache**: `__pycache__/` and `.venv/` for Python environment

## Important Implementation Details

- Frontend uses ES6 modules with native browser support
- No build system - direct file serving via Python HTTP server
- Model hierarchy automatically built from filesystem structure
- All UI text in Korean (target user interface language)
- Canvas container adapts to window resize
- External detection models path: `D:/Cube_Project/webtoonmakers/models/ultralytics`