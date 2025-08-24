import { storage } from '../firebase'
import { ref, uploadString, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage'

// MIME → 확장자 매핑
const extFromMime = (mime) => {
  if (!mime) return 'png'
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('svg')) return 'svg'
  return 'png'
}

// 캐시 헤더(이미지 재사용을 원할 땐 immutable 권장)
const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

// base64 data URL 여부
const isDataUrl = (url) => typeof url === 'string' && url.startsWith('data:image/')

// 안전한 쿼리 파라미터 추가 (필요할 때만)
const addQueryParam = (url, key, val) => {
  try {
    const u = new URL(url)
    u.searchParams.set(key, String(val))
    return u.toString()
  } catch {
    // URL 파싱 실패 시 원본 반환
    return url
  }
}

// ──────────────────────────────────────────────────────────────
// 1) 업로드 (gpt-image-1 base64 우선 경로)
// ──────────────────────────────────────────────────────────────
export const uploadImageToStorage = async (
  imageUrl,
  userId,
  generationId,
  projectName = 'default',
  retryCount = 0
) => {
  const maxRetries = 3

  try {
    console.log('🚀 Upload start', { projectName, userId, generationId, retry: retryCount + 1 })

    let contentType = 'image/png'
    let fileExtension = 'png'
    let storageRef
    let metadata

    // 경로 확정 함수
    const buildPath = (ext) =>
      `projects/${projectName}/users/${userId}/generations/${generationId}/image.${ext}`

    // A) data URL (가장 안정적: gpt-image-1 응답)
    if (isDataUrl(imageUrl)) {
      // dataURL에서 MIME 추출
      const mimeMatch = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)
      contentType = mimeMatch ? mimeMatch[1] : 'image/png'
      fileExtension = extFromMime(contentType)

      const storagePath = buildPath(fileExtension)
      storageRef = ref(storage, storagePath)

      metadata = {
        contentType,
        cacheControl: DEFAULT_CACHE_CONTROL,
        customMetadata: {
          userId,
          generationId,
          projectName,
          uploadedAt: new Date().toISOString(),
          source: 'gpt-image-1-base64'
        }
      }

      // ✅ data_url 업로드 API 사용 (fetch/atob 필요 없음)
      const snapshot = await uploadString(storageRef, imageUrl, 'data_url', metadata)
      console.log('✅ Uploaded (data_url) →', storagePath)

      const downloadURL = await getDownloadURL(snapshot.ref)
      // 캐시 무효화가 필요하다면 아래 주석 해제
      // const finalURL = addQueryParam(downloadURL, 'v', Date.now())

      return {
        downloadURL, // finalURL,
        storagePath,
        metadata: snapshot.metadata
      }
    }

    // B) 일반 URL (드물게 필요: 외부 이미지를 저장해야 할 때)
    //  -> CORS 문제 회피용 프록시를 일관되게 사용 권장
    console.log('🌐 Fetching external image URL via proxy')
    const fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const resp = await fetch(fetchUrl, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`)

    const blob = await resp.blob()
    contentType = resp.headers.get('content-type') || blob.type || 'image/jpeg'
    fileExtension = extFromMime(contentType)

    if (!blob.size) throw new Error('Image blob is empty')
    if (blob.size > 20 * 1024 * 1024) throw new Error('Image file too large (max 20MB)')

    const storagePath = buildPath(fileExtension)
    storageRef = ref(storage, storagePath)

    metadata = {
      contentType,
      cacheControl: DEFAULT_CACHE_CONTROL,
      customMetadata: {
        userId,
        generationId,
        projectName,
        uploadedAt: new Date().toISOString(),
        source: 'external-url',
        originalUrl: imageUrl,
        blobSize: String(blob.size)
      }
    }

    const snapshot = await uploadBytes(storageRef, blob, metadata)
    console.log('✅ Uploaded (blob) →', storagePath)

    const downloadURL = await getDownloadURL(snapshot.ref)
    // const finalURL = addQueryParam(downloadURL, 'v', Date.now())

    return {
      downloadURL, // finalURL,
      storagePath,
      metadata: snapshot.metadata
    }
  } catch (error) {
    console.error(`❌ Upload failed (attempt ${retryCount + 1}):`, error)
    if (retryCount < maxRetries) {
      await new Promise((r) => setTimeout(r, 1500))
      return uploadImageToStorage(imageUrl, userId, generationId, projectName, retryCount + 1)
    }
    throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`)
  }
}

// ──────────────────────────────────────────────────────────────
// 2) 단일 파일 URL 얻기
// ──────────────────────────────────────────────────────────────
export const getImageFromStorage = async (imagePath) => {
  try {
    const storageRef = ref(storage, imagePath)
    return await getDownloadURL(storageRef)
  } catch (error) {
    console.error('Failed to get image from storage:', error)
    return null
  }
}

// ──────────────────────────────────────────────────────────────
// 3) 재귀적으로 사용자 이미지 전부 가져오기
//    (하위 폴더(generations/…)까지 포함)
// ──────────────────────────────────────────────────────────────
const listAllRecursive = async (dirRef) => {
  const out = []
  const res = await listAll(dirRef)
  out.push(...res.items)
  for (const prefix of res.prefixes) {
    const nested = await listAllRecursive(prefix)
    out.push(...nested)
  }
  return out
}

export const getUserImages = async (userId, projectName = 'default') => {
  try {
    const rootRef = ref(storage, `projects/${projectName}/users/${userId}`)
    const items = await listAllRecursive(rootRef)
    const results = []
    for (const itemRef of items) {
      try {
        const url = await getDownloadURL(itemRef)
        results.push({ path: itemRef.fullPath, url, name: itemRef.name })
      } catch (e) {
        console.error('Get URL failed:', itemRef.fullPath, e)
      }
    }
    return results
  } catch (error) {
    console.error('Failed to list user images:', error)
    return []
  }
}

// 프로젝트 단위로 모으되 (옵션) 특정 유저만 필터
export const getProjectImages = async (projectName, userId = null) => {
  try {
    const rootRef = ref(storage, `projects/${projectName}`)
    const items = await listAllRecursive(rootRef)
    const results = []
    for (const itemRef of items) {
      try {
        const url = await getDownloadURL(itemRef)
        results.push({ path: itemRef.fullPath, url, name: itemRef.name })
      } catch (e) {
        console.error('Get URL failed:', itemRef.fullPath, e)
      }
    }
    return userId ? results.filter((x) => x.path.includes(`/users/${userId}/`)) : results
  } catch (error) {
    console.error('Failed to list project images:', error)
    return []
  }
}

// ──────────────────────────────────────────────────────────────
// 4) 삭제
// ──────────────────────────────────────────────────────────────
export const deleteImageFromStorage = async (imagePath) => {
  try {
    await deleteObject(ref(storage, imagePath))
    console.log('Deleted:', imagePath)
  } catch (error) {
    console.error('Failed to delete image:', error)
    throw error
  }
}

export const deleteUserImages = async (userId, projectName = 'default') => {
  const images = await getUserImages(userId, projectName)
  for (const img of images) await deleteImageFromStorage(img.path)
  console.log(`Deleted ${images.length} images for user ${userId}`)
}

// ──────────────────────────────────────────────────────────────
// 5) URL 유효성 검사 (HEAD 금지 → <img> 로드 방식)
// ──────────────────────────────────────────────────────────────
export const validateImageUrl = (url) =>
  new Promise((resolve) => {
    try {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = addQueryParam(url, 'ts', Date.now()) // 캐시 회피용
    } catch {
      resolve(false)
    }
  })

// ──────────────────────────────────────────────────────────────
// 6) 경로에서 메타 데이터 파싱
// ──────────────────────────────────────────────────────────────
export const getImageMetadata = async (imagePath) => {
  try {
    const parts = imagePath.split('/')
    return {
      projectName: parts[1] || 'default',
      userId: parts[3] || 'unknown',
      generationId: parts[5] || 'unknown',
      fileName: parts[6] || 'image.png',
      fullPath: imagePath
    }
  } catch (error) {
    console.error('Failed to parse image metadata:', error)
    return null
  }
}

// ──────────────────────────────────────────────────────────────
// 7) 업로드 상태 확인
// ──────────────────────────────────────────────────────────────
export const checkUploadStatus = async (imagePath) => {
  try {
    const url = await getDownloadURL(ref(storage, imagePath))
    return { exists: true, url, status: 'uploaded' }
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return { exists: false, status: 'not_found' }
    }
    return { exists: false, status: 'error', error: error.message }
  }
} 