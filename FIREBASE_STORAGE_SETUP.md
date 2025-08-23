# Firebase Storage 연동 가이드

## 개요
이 프로젝트는 Firebase Storage를 사용하여 AI로 생성된 이미지들을 안전하게 저장하고 관리합니다.

## Firebase Storage 구조

### 폴더 경로
```
gs://afterwon-6d17f.firebasestorage.app/
├── projects/
│   └── iconic/
│       └── users/
│           └── {userId}/
│               └── generations/
│                   └── {generationId}/
│                       └── image.jpg
```

### 메타데이터
각 이미지 파일에는 다음 메타데이터가 포함됩니다:
- `userId`: 사용자 ID
- `generationId`: 생성 ID
- `projectName`: 프로젝트명 (iconic)
- `uploadedAt`: 업로드 시간
- `originalUrl`: 원본 DALL-E 이미지 URL
- `retryCount`: 재시도 횟수

## 주요 기능

### 1. 이미지 업로드
```javascript
import { uploadImageToStorage } from '../utils/storage'

const uploadResult = await uploadImageToStorage(
  imageUrl,        // DALL-E 이미지 URL
  userId,          // 사용자 ID
  generationId,    // 생성 ID
  'iconic'         // 프로젝트명
)

// 결과
{
  downloadURL: 'https://...',
  storagePath: 'projects/iconic/users/...',
  metadata: { ... }
}
```

### 2. 이미지 다운로드
```javascript
import { getImageFromStorage } from '../utils/storage'

const imageUrl = await getImageFromStorage(storagePath)
```

### 3. 사용자 이미지 목록
```javascript
import { getUserImages } from '../utils/storage'

const userImages = await getUserImages(userId, 'iconic')
```

### 4. 이미지 삭제
```javascript
import { deleteImageFromStorage } from '../utils/storage'

await deleteImageFromStorage(storagePath)
```

## 에러 처리 및 재시도

### 자동 재시도
- 최대 3회 재시도
- 2초 간격으로 재시도
- 네트워크 오류, 권한 오류 등에 대응

### Fallback 처리
- Firebase Storage 업로드 실패 시 DALL-E 원본 URL 사용
- 사용자에게 명확한 상태 알림

## 보안 규칙

Firebase Storage 보안 규칙을 다음과 같이 설정하세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로젝트별 사용자 폴더 접근 제어
    match /projects/{projectName}/users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 공개 읽기 전용 폴더 (필요시)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 사용법

### 1. 테스트 모드
CreationPage에서 "🧪 Test Mode" 버튼을 클릭하여 이미지 업로드를 테스트할 수 있습니다.

### 2. 이미지 생성
AI 이미지 생성 후 자동으로 Firebase Storage에 업로드됩니다.

### 3. 사이드바에서 확인
생성된 이미지들이 CreationSidebar에 썸네일로 표시됩니다.

## 문제 해결

### 일반적인 문제들

1. **권한 오류**
   - Firebase 프로젝트 설정 확인
   - Storage 보안 규칙 확인
   - 사용자 인증 상태 확인

2. **업로드 실패**
   - 네트워크 연결 확인
   - 이미지 URL 유효성 확인
   - Storage 용량 확인

3. **이미지 표시 안됨**
   - Storage URL 유효성 확인
   - CORS 설정 확인
   - 이미지 파일 존재 여부 확인

### 디버깅

브라우저 콘솔에서 다음 로그를 확인하세요:
- 🚀 업로드 시작
- 📦 이미지 blob 정보
- ✅ 업로드 성공
- ❌ 업로드 실패
- 🔄 재시도 정보

## 성능 최적화

### 이미지 압축
- JPEG 형식 사용
- 적절한 해상도 설정
- Progressive JPEG 고려

### 캐싱
- Firebase Storage URL 캐싱
- 브라우저 이미지 캐싱 활용

### 배치 처리
- 여러 이미지 동시 업로드
- 업로드 큐 관리

## 모니터링

### Firebase Console
- Storage 사용량 모니터링
- 업로드/다운로드 통계
- 에러 로그 확인

### 사용자 통계
- 프로젝트별 이미지 수
- 사용자별 저장 용량
- 인기 스타일/타입 분석

## 향후 개선사항

1. **이미지 최적화**
   - WebP 형식 지원
   - 자동 리사이징
   - 썸네일 생성

2. **고급 기능**
   - 이미지 태깅
   - 검색 기능
   - 공유 기능

3. **성능 개선**
   - CDN 연동
   - 지연 로딩
   - 가상 스크롤

## 지원

문제가 발생하면 다음을 확인하세요:
1. Firebase 프로젝트 설정
2. 네트워크 연결 상태
3. 브라우저 콘솔 에러
4. Firebase Console 로그 