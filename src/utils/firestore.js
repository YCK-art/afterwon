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

// 생성 이력 저장 (개선된 버전)
export const saveGenerationHistory = async (userId, generationData, projectName = 'iconic') => {
  try {
    console.log('💾 Saving generation history to Firestore...')
    console.log('👤 User ID:', userId)
    console.log('📁 Project:', projectName)
    
    const docRef = await addDoc(collection(db, 'generations'), {
      userId,
      projectName,
      ...generationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // 이미지 관련 메타데이터 추가
      imageMetadata: {
        storagePath: generationData.result?.asset?.storageImageUrl ? 
          `projects/${projectName}/users/${userId}/generations/${Date.now()}` : null,
        originalUrl: generationData.result?.asset?.dalleImage || null,
        storageUrl: generationData.result?.asset?.storageImageUrl || null,
        uploadedAt: new Date().toISOString()
      }
    })
    
    console.log('✅ Generation history saved with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Error saving generation history:', error)
    throw error
  }
}

// 사용자의 생성 이력 불러오기 (프로젝트별 필터링 지원)
export const getUserGenerations = async (userId, projectName = 'iconic') => {
  try {
    console.log('📥 Loading generations for user:', userId, 'project:', projectName)
    
    let q
    if (projectName) {
      q = query(
        collection(db, 'generations'),
        where('userId', '==', userId),
        where('projectName', '==', projectName)
      )
    } else {
      q = query(
        collection(db, 'generations'),
        where('userId', '==', userId)
      )
    }
    
    const querySnapshot = await getDocs(q)
    const generations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`📊 Found ${generations.length} generations`)
    
    // 클라이언트 사이드에서 정렬
    return generations.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return dateB - dateA
    })
  } catch (error) {
    console.error('❌ Error fetching user generations:', error)
    throw error
  }
}

// 프로젝트별 생성 이력 불러오기
export const getProjectGenerations = async (projectName, userId = null) => {
  try {
    console.log('📥 Loading generations for project:', projectName)
    
    let q
    if (userId) {
      q = query(
        collection(db, 'generations'),
        where('projectName', '==', projectName),
        where('userId', '==', userId)
      )
    } else {
      q = query(
        collection(db, 'generations'),
        where('projectName', '==', projectName)
      )
    }
    
    const querySnapshot = await getDocs(q)
    const generations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`📊 Found ${generations.length} generations for project ${projectName}`)
    
    return generations.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return dateB - dateA
    })
  } catch (error) {
    console.error('❌ Error fetching project generations:', error)
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
    console.error('❌ Error fetching generation:', error)
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
    console.log('✅ Generation updated successfully')
  } catch (error) {
    console.error('❌ Error updating generation:', error)
    throw error
  }
}

// 생성 이력 삭제
export const deleteGeneration = async (generationId) => {
  try {
    const docRef = doc(db, 'generations', generationId)
    await deleteDoc(docRef)
    console.log('🗑️ Generation deleted successfully')
  } catch (error) {
    console.error('❌ Error deleting generation:', error)
    throw error
  }
}

// 사용자 프로젝트 정보 저장
export const saveUserProject = async (userId, projectData) => {
  try {
    const docRef = await addDoc(collection(db, 'userProjects'), {
      userId,
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('❌ Error saving user project:', error)
    throw error
  }
}

// 사용자 프로젝트 목록 가져오기
export const getUserProjects = async (userId) => {
  try {
    const q = query(
      collection(db, 'userProjects'),
      where('userId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('❌ Error fetching user projects:', error)
    throw error
  }
}

// 이미지 메타데이터 업데이트
export const updateImageMetadata = async (generationId, imageMetadata) => {
  try {
    const docRef = doc(db, 'generations', generationId)
    await updateDoc(docRef, {
      'imageMetadata': imageMetadata,
      updatedAt: serverTimestamp()
    })
    console.log('✅ Image metadata updated successfully')
  } catch (error) {
    console.error('❌ Error updating image metadata:', error)
    throw error
  }
}

// 통계 정보 가져오기
export const getUserStats = async (userId, projectName = 'iconic') => {
  try {
    const generations = await getUserGenerations(userId, projectName)
    
    const stats = {
      totalGenerations: generations.length,
      totalImages: generations.filter(g => g.result?.asset?.storageImageUrl).length,
      recentGenerations: generations.slice(0, 5),
      favoriteStyles: {},
      favoriteTypes: {}
    }
    
    // 스타일별 통계
    generations.forEach(g => {
      if (g.options?.style) {
        stats.favoriteStyles[g.options.style] = (stats.favoriteStyles[g.options.style] || 0) + 1
      }
      if (g.options?.type) {
        stats.favoriteTypes[g.options.type] = (stats.favoriteTypes[g.options.type] || 0) + 1
      }
    })
    
    return stats
  } catch (error) {
    console.error('❌ Error fetching user stats:', error)
    throw error
  }
} 