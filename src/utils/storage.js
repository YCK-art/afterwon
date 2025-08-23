import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// 이미지를 Firebase Storage에 업로드
export const uploadImageToStorage = async (imageUrl, userId, generationId) => {
  try {
    // 이미지 URL에서 blob 데이터 가져오기
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    
    // Storage 경로 설정
    const storageRef = ref(storage, `generations/${userId}/${generationId}/image.jpg`)
    
    // 이미지 업로드
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg'
    })
    
    // 다운로드 URL 반환
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Failed to upload image to storage:', error)
    throw error
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

// Storage에서 이미지 삭제
export const deleteImageFromStorage = async (imagePath) => {
  try {
    const storageRef = ref(storage, imagePath)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Failed to delete image from storage:', error)
  }
} 