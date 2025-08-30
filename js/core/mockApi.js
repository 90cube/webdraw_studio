// Mock API: 백엔드가 있다고 가정하고 가상 데이터를 제공합니다.

const mockFileDatabase = [
    // Checkpoints
    'models/checkpoints/sd15/realistic/real_model_1.safetensors',
    'models/checkpoints/sd15/anime/anime_model_1.safetensors',
    'models/checkpoints/sdxl/pdxl/pdxl_model_1.safetensors',
    'models/checkpoints/sdxl/pdxl/pdxl_model_2.safetensors',
    'models/checkpoints/sdxl/ilxl/ilxl_model_1.safetensors',
    // LORAs
    'models/loras/sd15/character/sd15_char_lora.safetensors',
    'models/loras/sdxl/character/sdxl_char_lora_1.safetensors',
    'models/loras/sdxl/character/sdxl_char_lora_2.safetensors',
    'models/loras/sdxl/style/sdxl_style_lora.safetensors',
    // VAEs
    'models/vae/sd15/sd15_vae.safetensors',
    'models/vae/sdxl/sdxl_vae.safetensors',
];

function parsePath(path) {
    const parts = path.split('/');
    if (parts.length < 3) return null;
    return {
        path: path,
        name: parts[parts.length - 1],
        type: parts[1],
        baseModel: parts[2],
        subType: parts.slice(3, -1).join('/')
    };
}

const api = {
    // 백엔드에서 모든 파일 목록을 가져오는 것을 시뮬레이션합니다.
    async fetchFileList() {
        console.log("Mock API: Fetching all files...");
        return new Promise(resolve => {
            setTimeout(() => {
                const parsedFiles = mockFileDatabase.map(parsePath).filter(Boolean);
                resolve({ files: parsedFiles });
            }, 500); // 네트워크 딜레이 시뮬레이션
        });
    },

    // 긍정 프롬프트 프리셋 목록을 가져오는 것을 시뮬레이션합니다.
    async fetchPositivePresets() {
        console.log("Mock API: Fetching positive presets...");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { name: 'Epic Style', prompt: ', epic, cinematic, dramatic lighting, high detail' },
                    { name: 'Anime Style', prompt: ', anime style, key visual, vibrant, studio trigger' }
                ]);
            }, 300);
        });
    },

    // 부정 프롬프트 프리셋 목록을 가져오는 것을 시뮬레이션합니다.
    async fetchNegativePresets() {
        console.log("Mock API: Fetching negative presets...");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { name: 'Basic', prompt: ', ugly, tiling, poorly drawn hands, poorly drawn feet, out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, watermark, signature, cut off, low contrast, underexposed, overexposed, bad art, beginner, amateur, distorted face' },
                    { name: 'Painting', prompt: ', photo, photorealistic, realism, 3d render' }
                ]);
            }, 300);
        });
    }
};

export default api;
