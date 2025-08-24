# Iconic - AI Image Generation Platform

## 🚀 새로운 아키텍처 개요

Iconic은 프롬프트 기반 AI 이미지 생성을 위한 현대적인 웹 플랫폼입니다. 이제 Firestore와 Firebase Storage를 활용한 실시간 상태 관리와 안정적인 이미지 저장 시스템을 제공합니다.

## ✨ 주요 기능

### 🔄 실시간 생성 상태 관리
- **즉시 저장**: 프롬프트 전송과 동시에 Firestore에 생성 이력 저장
- **상태 추적**: `generating` → `completed`/`failed` 상태 실시간 업데이트
- **사이드바 연동**: 생성 진행 상황이 사이드바에 즉시 반영

### 🖼️ 안정적인 이미지 저장
- **Firebase Storage**: 생성된 이미지를 안전하게 저장
- **프록시 시스템**: 외부 이미지 URL의 CORS 문제 해결
- **자동 재시도**: 업로드 실패 시 최대 3회 자동 재시도

### 💬 실시간 채팅 시스템
- **Firestore 기반**: 채팅 히스토리를 Firestore에 저장
- **상태 동기화**: 생성 상태와 채팅 내용이 실시간으로 동기화
- **사이드바 연동**: 생성 이력 클릭 시 해당 채팅 내용 로드

## 🏗️ 시스템 아키텍처

### 프론트엔드 (React)
```
src/
├── components/
│   ├── CreationPage.jsx      # 메인 생성 페이지
│   ├── CreationSidebar.jsx   # 생성 이력 사이드바
│   └── ...
├── utils/
│   ├── firestore.js          # Firestore 데이터베이스 연동
│   ├── storage.js            # Firebase Storage 연동
│   └── api.ts               # 백엔드 API 연동
└── contexts/
    └── AuthContext.jsx       # 사용자 인증 관리
```

### 백엔드 (Node.js + Express)
```
server/
├── routes/
│   ├── generate.ts           # AI 이미지 생성 API
│   └── proxy.ts             # 이미지 프록시 서비스
├── utils/
│   ├── svgUtils.ts          # SVG 처리 유틸리티
│   └── templateLocking.ts   # 템플릿 잠금 시스템
└── index.ts                 # 메인 서버 파일
```

## 🔄 생성 플로우

### 1. 프롬프트 전송
```
사용자 입력 → CreationPage → Firestore 저장 (status: 'generating')
```

### 2. AI 생성
```
백엔드 API 호출 → GPT-Image-1 처리 → 이미지 생성
```

### 3. Storage 업로드
```
생성된 이미지 → Firebase Storage 업로드 → URL 생성
```

### 4. 상태 완료
```
Firestore 업데이트 (status: 'completed') → 사이드바 실시간 반영
```

## 🛠️ 기술 스택

### 프론트엔드
- **React 18**: 최신 React 기능 활용
- **Tailwind CSS**: 모던한 UI 디자인
- **Firebase SDK**: 실시간 데이터베이스 및 스토리지

### 백엔드
- **Node.js**: 서버 사이드 JavaScript
- **Express**: 웹 프레임워크
- **OpenAI API**: GPT-Image-1 이미지 생성

### 데이터베이스 & 스토리지
- **Firestore**: 실시간 NoSQL 데이터베이스
- **Firebase Storage**: 클라우드 파일 스토리지
- **Firebase Auth**: 사용자 인증 시스템

## 🚀 시작하기

### 1. 환경 설정
```bash
# 프로젝트 클론
git clone <repository-url>
cd iconic

# 의존성 설치
npm install
cd server && npm install
```

### 2. Firebase 설정
```bash
# Firebase 프로젝트 생성 후 설정 파일 추가
# src/firebase.js 파일에 Firebase 설정 입력

# Firebase Storage CORS 설정 (중요!)
# Firebase CLI 설치 후 다음 명령어 실행:
gsutil cors set firebase-storage-cors.json gs://your-bucket-name.appspot.com

# 또는 Firebase Console에서 Storage > Rules에서 CORS 설정 추가
```

### 3. 환경 변수 설정
```bash
# .env 파일 생성
OPENAI_API_KEY=your_openai_api_key
FIREBASE_CONFIG=your_firebase_config
```

### 4. 개발 서버 실행
```bash
# 프론트엔드 (포트 3000)
npm run dev

# 백엔드 (포트 3001)
cd server && npm run dev
```

## 📊 Firestore 데이터 구조

### Generations 컬렉션
```javascript
{
  userId: "user123",
  projectName: "iconic",
  prompt: "Create a modern logo",
  status: "completed", // generating, completed, failed
  options: {
    type: "Logo",
    style: "Flat",
    size: "1024",
    extras: ["Transparent Background"]
  },
  result: {
    asset: {
      storageImageUrl: "https://storage.googleapis.com/...",
      dalleImage: "https://oaidalleapiprodscus.blob.core.windows.net/..."
    },
    code: { /* SVG, React, HTML 코드 */ }
  },
  chatHistory: [/* 채팅 메시지 배열 */],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔧 주요 API 엔드포인트

### 이미지 생성
```
POST /api/generate
Content-Type: application/json

{
  "type": "Icon",
  "style": "Flat",
  "size": "1024",
  "description": "Create a modern logo",
  "referenceImages": []
}
```

### 이미지 프록시
```
GET /api/proxy-image?url=<image_url>
```

## 🎯 성능 최적화

### 실시간 업데이트
- **Firestore onSnapshot**: 폴링 대신 실시간 리스너 사용
- **상태 기반 렌더링**: 필요한 부분만 업데이트

### 이미지 처리
- **자동 재시도**: 네트워크 오류 시 자동 복구
- **타임아웃 관리**: 30초 타임아웃으로 무한 대기 방지
- **프록시 시스템**: CORS 문제 해결로 안정적인 이미지 로딩

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 이미지 업로드 실패
```bash
# Firebase Storage 규칙 확인
# 네트워크 연결 상태 확인
# 프록시 서버 상태 확인
```

#### 2. 실시간 업데이트 안됨
```bash
# Firestore 보안 규칙 확인
# 사용자 인증 상태 확인
# 네트워크 연결 상태 확인
```

#### 3. CORS 오류
```bash
# 프록시 서버 상태 확인
# 이미지 URL 유효성 확인

# Firebase Storage CORS 설정 확인
gsutil cors get gs://your-bucket-name.appspot.com

# CORS 설정 적용
gsutil cors set firebase-storage-cors.json gs://your-bucket-name.appspot.com
```

#### 4. Firebase Storage ERR_HTTP2_COMPRESSION_ERROR
```bash
# Firebase Storage CORS 설정 확인
# 프록시 서버를 통한 이미지 로딩 확인
# 브라우저 캐시 클리어
# Firebase Storage 규칙 확인
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해 주세요.

---

**Iconic** - AI로 창의성을 현실로 만들어보세요! 🎨✨
