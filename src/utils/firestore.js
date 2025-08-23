import { db } from '../firebase'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'

// 생성 이력 저장
export const saveGenerationHistory = async (userId, generationData) => {
  try {
    const docRef = await addDoc(collection(db, 'generations'), {
      userId,
      ...generationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving generation history:', error)
    throw error
  }
}

// 사용자의 생성 이력 불러오기
export const getUserGenerations = async (userId) => {
  try {
    // 임시로 인덱스 없이 작동하도록 수정
    const q = query(
      collection(db, 'generations'),
      where('userId', '==', userId)
      // orderBy 제거하여 인덱스 문제 해결
    )
    const querySnapshot = await getDocs(q)
    const generations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // 클라이언트 사이드에서 정렬
    return generations.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return dateB - dateA
    })
  } catch (error) {
    console.error('Error fetching user generations:', error)
    throw error
  }
}

// 특정 생성 이력 불러오기
export const getGenerationById = async (generationId) => {
  try {
    const docRef = doc(db, 'generations', generationId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      throw new Error('Generation not found')
    }
  } catch (error) {
    console.error('Error fetching generation:', error)
    throw error
  }
}

// 생성 이력 업데이트
export const updateGeneration = async (generationId, updateData) => {
  try {
    const docRef = doc(db, 'generations', generationId)
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating generation:', error)
    throw error
  }
}

// 생성 이력 삭제
export const deleteGeneration = async (generationId) => {
  try {
    const docRef = doc(db, 'generations', generationId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting generation:', error)
    throw error
  }
} 