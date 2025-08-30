# WebDraw Studio

AI 이미지 생성을 위한 웹 기반 스튜디오 애플리케이션입니다.

## 🚀 초기 설정 (Initial Setup)

프로젝트를 처음 설정할 때, 다음 명령어를 실행하여 가상환경 및 필요한 폴더 구조를 생성하세요.

```batch
.\setup.bat
```

이 스크립트는 다음 작업을 수행합니다:
1.  `.venv` 라는 이름의 Python 가상환경을 생성합니다.
2.  모델 파일들을 저장할 기본 폴더 구조를 생성합니다.

## ▶️ 실행 (Running the Application)

프로젝트 설정이 완료된 후, 다음 명령어를 사용하여 프론트엔드와 백엔드 서버를 한 번에 시작할 수 있습니다.

```batch
.\all_start.bat
```

- **프론트엔드:** `http://localhost:8000`
- **백엔드:** `http://localhost:8001`

## 📂 모델 폴더 구조 (Model Folder Structure)

**매우 중요:** 이 애플리케이션이 정상적으로 동작하려면, 모든 모델 파일들은 반드시 아래의 폴더 구조에 맞게 위치해야 합니다. 특히 `sd15`와 `sdxl` 하위 폴더 분류는 VAE 필터링 등 핵심 기능에 직접적인 영향을 미칩니다.

```
models
├── checkpoints
│   ├── sd15
│   └── sdxl
├── lora
│   ├── sd15
│   └── sdxl
├── vae
│   ├── sd15
│   └── sdxl
└── controlnet
    ├── sd15
    └── sdxl
```
