import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage'

// 이미지를 Firebase Storage에 업로드 (개선된 버전)
export const uploadImageToStorage = async (imageUrl, userId, generationId, projectName = 'default', retryCount = 0) => {
  const maxRetries = 3
  
  try {
    console.log('Starting image upload to Firebase Storage...')
    console.log('Project:', projectName)
    console.log('User ID:', userId)
    console.log('Generation ID:', generationId)
    console.log('Retry attempt:', retryCount + 1)
    
    // CORS 문제 해결을 위한 프록시 사용
    let fetchUrl = imageUrl
    if (imageUrl.includes('google.com') || 
        imageUrl.includes('freepik.com') || 
        imageUrl.includes('external') ||
        imageUrl.includes('blob.core.windows.net') ||  // Azure Blob Storage
        imageUrl.includes('oaidalleapiprodscus') ||    // DALL-E Azure Storage
        imageUrl.includes('private/')) {               // Private URLs
      console.log('Using proxy for external/private image URL')
      fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
    }
    
    console.log('Fetching from:', fetchUrl)
    
    // 이미지 URL에서 blob 데이터 가져오기
    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    console.log('Image blob size:', blob.size, 'bytes')
    
    // 빈 blob 체크
    if (blob.size === 0) {
      throw new Error('Image blob is empty')
    }
    
    // Storage 경로 설정 (프로젝트별 구조)
    const storagePath = `projects/${projectName}/users/${userId}/generations/${generationId}/image.jpg`
    const storageRef = ref(storage, storagePath)
    
    // 이미지 업로드
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId: userId,
        generationId: generationId,
        projectName: projectName,
        uploadedAt: new Date().toISOString(),
        originalUrl: imageUrl,
        retryCount: retryCount.toString()
      }
    })
    
    console.log('Image uploaded successfully to:', storagePath)
    
    // 다운로드 URL 반환
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log('Download URL generated:', downloadURL)
    
    return {
      downloadURL,
      storagePath,
      metadata: snapshot.metadata
    }
  } catch (error) {
    console.error(`Failed to upload image to storage (attempt ${retryCount + 1}):`, error)
    
    // 재시도 로직
    if (retryCount < maxRetries) {
      console.log(`Retrying upload in 2 seconds... (${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return uploadImageToStorage(imageUrl, userId, generationId, projectName, retryCount + 1)
    }
    
    // 최대 재시도 횟수 초과
    throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`)
  }
}

// Firebase Storage에서 이미지 다운로드 URL 가져오기
export const getImageFromStorage = async (imagePath) => {
  try {
    const storageRef = ref(storage, imagePath)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Failed to get image from storage:', error)
    return null
  }
}

// 사용자의 모든 이미지 가져오기
export const getUserImages = async (userId, projectName = 'default') => {
  try {
    const userImagesRef = ref(storage, `projects/${projectName}/users/${userId}`)
    const result = await listAll(userImagesRef)
    
    const images = []
    for (const itemRef of result.items) {
      try {
        const downloadURL = await getDownloadURL(itemRef)
        images.push({
          path: itemRef.fullPath,
          url: downloadURL,
          name: itemRef.name
        })
      } catch (error) {
        console.error('Failed to get download URL for:', itemRef.fullPath, error)
      }
    }
    
    return images
  } catch (error) {
    console.error('Failed to list user images:', error)
    return []
  }
}

// 프로젝트별 이미지 가져오기
export const getProjectImages = async (projectName, userId = null) => {
  try {
    const projectRef = ref(storage, `projects/${projectName}`)
    const result = await listAll(projectRef)
    
    const images = []
    for (const itemRef of result.items) {
      try {
        const downloadURL = await getDownloadURL(itemRef)
        images.push({
          path: itemRef.fullPath,
          url: downloadURL,
          name: itemRef.name
        })
      } catch (error) {
        console.error('Failed to get download URL for:', itemRef.fullPath, error)
      }
    }
    
    // 특정 사용자 필터링
    if (userId) {
      return images.filter(img => img.path.includes(`/users/${userId}/`))
    }
    
    return images
  } catch (error) {
    console.error('Failed to list project images:', error)
    return []
  }
}

// Storage에서 이미지 삭제
export const deleteImageFromStorage = async (imagePath) => {
  try {
    const storageRef = ref(storage, imagePath)
    await deleteObject(storageRef)
    console.log('Image deleted from storage:', imagePath)
  } catch (error) {
    console.error('Failed to delete image from storage:', error)
    throw error
  }
}

// 사용자의 모든 이미지 삭제
export const deleteUserImages = async (userId, projectName = 'default') => {
  try {
    const userImages = await getUserImages(userId, projectName)
    
    for (const image of userImages) {
      await deleteImageFromStorage(image.path)
    }
    
    console.log(`Deleted ${userImages.length} images for user ${userId}`)
  } catch (error) {
    console.error('Failed to delete user images:', error)
    throw error
  }
}

// 이미지 URL이 유효한지 확인
export const validateImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

// 이미지 메타데이터 가져오기
export const getImageMetadata = async (imagePath) => {
  try {
    const storageRef = ref(storage, imagePath)
    // Firebase Storage에서 메타데이터를 직접 가져올 수는 없지만,
    // 경로에서 정보 추출
    const pathParts = imagePath.split('/')
    return {
      projectName: pathParts[1] || 'default',
      userId: pathParts[3] || 'unknown',
      generationId: pathParts[5] || 'unknown',
      fileName: pathParts[6] || 'image.jpg',
      fullPath: imagePath
    }
  } catch (error) {
    console.error('Failed to get image metadata:', error)
    return null
  }
}

// 이미지 업로드 상태 확인
export const checkUploadStatus = async (imagePath) => {
  try {
    const storageRef = ref(storage, imagePath)
    const downloadURL = await getDownloadURL(storageRef)
    return {
      exists: true,
      url: downloadURL,
      status: 'uploaded'
    }
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return {
        exists: false,
        status: 'not_found'
      }
    }
    return {
      exists: false,
      status: 'error',
      error: error.message
    }
  }
} 