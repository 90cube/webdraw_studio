/**
 * 백엔드 API 가이드
 * 
 * 프론트엔드 개발에 필요한 백엔드 API의 명세를 정의합니다.
 */

## 1. 파일 목록 조회 API

- **Endpoint:** `GET /api/files`
- **Description:** `models` 폴더 내의 모든 파일 목록을 재귀적으로 스캔하여 반환합니다. 프론트엔드는 이 전체 목록을 받아 필요한 필터링을 수행합니다.

- **Query Parameters:** 없음

- **Success Response (200 OK):**
  - **Content-Type:** `application/json`
  - **Body:**
    ```json
    {
      "files": [
        {
          "path": "models/checkpoints/sd15/realistic/real_model_1.safetensors",
          "name": "real_model_1.safetensors",
          "type": "checkpoints",
          "baseModel": "sd15",
          "subType": "realistic"
        },
        {
          "path": "models/checkpoints/sdxl/pdxl/pdxl_model_1.safetensors",
          "name": "pdxl_model_1.safetensors",
          "type": "checkpoints",
          "baseModel": "sdxl",
          "subType": "pdxl"
        },
        {
          "path": "models/loras/sdxl/character/char_lora_1.safetensors",
          "name": "char_lora_1.safetensors",
          "type": "loras",
          "baseModel": "sdxl",
          "subType": "character"
        }
      ]
    }
    ```
