# Firebase Storage CORS 설정 가이드

## 🚨 ERR_HTTP2_COMPRESSION_ERROR 해결 방법

Firebase Storage에서 이미지를 직접 로드할 때 발생하는 `ERR_HTTP2_COMPRESSION_ERROR` 문제를 해결하는 방법입니다.

## 🔥 Base64 이미지 업로드 실패 해결 (400 Bad Request)

### 문제 원인
- **base64 데이터 처리**: GPT-Image-1의 base64 이미지 데이터가 너무 큼 (1.6MB+)
- **Firebase Storage 규칙**: 파일 크기 제한 (기본 10MB)
- **CORS 설정**: base64 업로드를 위한 적절한 헤더 부족

### 즉시 해결 방법

#### 1. Firebase Storage 규칙 업데이트
```bash
# Firebase Console에서 Storage > Rules 편집
# 또는 firebase-storage-rules.rules 파일 사용
```

#### 2. CORS 설정 적용 (중요!)
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인 및 프로젝트 선택
firebase login
firebase use your-project-id

# CORS 설정 적용
gsutil cors set firebase-storage-cors.json gs://your-bucket-name.appspot.com

# 설정 확인
gsutil cors get gs://your-bucket-name.appspot.com
```

#### 3. 파일 크기 제한 확인
- 현재 설정: 20MB
- base64 이미지: 일반적으로 1-3MB
- 충분한 여유 공간 확보

## 🔧 해결 방법 1: Firebase CLI를 통한 CORS 설정

### 1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 2. Firebase 프로젝트 로그인
```bash
firebase login
```

### 3. CORS 설정 적용
```bash
# 프로젝트 선택
firebase use your-project-id

# CORS 설정 적용
gsutil cors set firebase-storage-cors.json gs://your-bucket-name.appspot.com
```

### 4. CORS 설정 확인
```bash
gsutil cors get gs://your-bucket-name.appspot.com
```

## 🔧 해결 방법 2: Google Cloud Console을 통한 설정

### 1. Google Cloud Console 접속
- [Google Cloud Console](https://console.cloud.google.com/) 접속
- 프로젝트 선택

### 2. Cloud Storage > Browser로 이동
- 왼쪽 메뉴에서 "Cloud Storage" > "Browser" 선택

### 3. 버킷 선택
- 해당 Firebase Storage 버킷 클릭

### 4. CORS 설정
- "Permissions" 탭 클릭
- "CORS configuration" 섹션에서 편집
- 다음 설정 추가:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Cache-Control",
      "Authorization"
    ]
  }
]
```

## 🔧 해결 방법 3: 프록시 서버 사용 (권장)

현재 구현된 프록시 서버를 사용하면 CORS 문제를 완전히 우회할 수 있습니다.

### 프록시 엔드포인트
```
GET /api/proxy-storage?url=<firebase_storage_url>
```

### 자동 프록시 적용
- CreationSidebar와 ImageCardStack에서 Firebase Storage URL이 자동으로 프록시를 통해 로드됨
- 사용자가 별도 설정할 필요 없음

## 📋 Firebase Storage 규칙 확인

### 기본 규칙
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectName}/users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow write: if request.resource.size < 10 * 1024 * 1024;
      allow write: if request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 🧪 테스트 방법

### 1. CORS 설정 확인
```bash
# 브라우저 개발자 도구에서 Network 탭 확인
# Firebase Storage URL 직접 접근 시 CORS 오류 확인
```

### 2. 프록시 서버 테스트
```bash
# 프록시 엔드포인트 테스트
curl "http://localhost:3001/api/proxy-storage?url=<firebase_storage_url>"
```

### 3. 이미지 로딩 테스트
- 사이드바에서 생성된 이미지 썸네일 확인
- 이미지 카드에서 이미지 표시 확인
- 다운로드 기능 테스트

## 🚀 성능 최적화

### 1. 캐싱 설정
- 프록시 서버에서 1시간 캐시 설정
- 브라우저 캐시 활용

### 2. 이미지 압축
- Firebase Storage에서 이미지 자동 압축
- 적절한 이미지 크기 설정

### 3. CDN 활용
- Firebase Hosting과 연동하여 CDN 활용
- 전 세계 사용자를 위한 빠른 이미지 로딩

## 🔍 문제 해결 체크리스트

- [ ] Firebase CLI 설치 및 로그인
- [ ] CORS 설정 파일 생성 (`firebase-storage-cors.json`)
- [ ] CORS 설정 적용 (`gsutil cors set`)
- [ ] Firebase Storage 규칙 확인
- [ ] 프록시 서버 실행 확인
- [ ] 이미지 로딩 테스트
- [ ] 다운로드 기능 테스트

## 📞 추가 지원

문제가 지속되는 경우:
1. Firebase Console에서 Storage > Rules 확인
2. Google Cloud Console에서 CORS 설정 확인
3. 프록시 서버 로그 확인
4. 브라우저 개발자 도구에서 네트워크 오류 확인

---

**참고**: 프록시 서버를 사용하면 CORS 설정 없이도 이미지를 안전하게 로드할 수 있습니다. 