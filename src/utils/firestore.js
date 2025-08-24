import { db, storage } from '../firebase'
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
  serverTimestamp,
  onSnapshot,
  limit,
  startAfter
} from 'firebase/firestore'
import { ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage'

/** ─────────────────────────────────────────────────────────────
 *  공통 유틸
 *  ───────────────────────────────────────────────────────────── */
const MAX_INLINE_TEXT = 250_000; // Firestore 문서 안전치(지표 포함) 고려, 여유있게 제한
const isDataUrl = (s) => typeof s === 'string' && s.startsWith('data:')
const safeString = (v, fallback = '') => (v === undefined || v === null ? fallback : String(v))
const toNum = (v, d = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

/** 긴 본문은 Storage에 .txt로 오프로딩하고 URL만 Firestore에 저장 */
async function offloadLargeTextToStorage({
  userId,
  projectName,
  generationId,
  field,            // 'user'|'assistant' 등 + 용도
  content
}) {
  const path = `projects/${projectName}/users/${userId}/generations/${generationId}/messages/${Date.now()}-${field}.txt`
  const r = storageRef(storage, path)
  await uploadString(r, content, 'raw', {
    contentType: 'text/plain; charset=utf-8',
    cacheControl: 'public, max-age=31536000, immutable'
  })
  const url = await getDownloadURL(r)
  return { path, url }
}

/** ─────────────────────────────────────────────────────────────
 *  1) 생성 요약 저장 (문서 본문은 가볍게)
 *  - result.asset.* 에는 storagePath/downloadURL 같은 "참조"만 저장
 *  - 거대한 base64/dataUrl은 절대 저장하지 않음!
 *  ───────────────────────────────────────────────────────────── */
export const saveGenerationHistory = async (userId, generationData, projectName = 'iconic') => {
  try {
    const options = generationData.options || {}
    const meta = generationData.result?.meta || {}

    const docBody = {
      userId: safeString(userId),
      projectName: safeString(projectName),
      prompt: safeString(generationData.prompt),
      options: {
        type: safeString(options.type),
        style: safeString(options.style),
        size: toNum(options.size, 0),
        extras: Array.isArray(options.extras) ? options.extras.map(String) : []
      },
      status: safeString(generationData.status || generationData.result?.status || 'pending'),
      result: {
        status: safeString(generationData.result?.status || ''),
        asset: {
          // 여기에는 "참조"만 남김
          storageImageUrl: safeString(
            generationData.result?.asset?.storageImageUrl ||
              generationData.metadata?.storageInfo?.downloadURL ||
              ''
          ),
          storagePath: safeString(
            generationData.result?.asset?.storagePath ||
              generationData.metadata?.storageInfo?.storagePath ||
              ''
          ),
          // 시각 비교용 외부 원본 URL만(있다면). dataURL(거대)은 저장 금지
          sourceUrl: isDataUrl(generationData.result?.asset?.dalleImage)
            ? ''
            : safeString(generationData.result?.asset?.dalleImage || ''),
          // PNG/JPEG/SVG 본문은 문서에 저장하지 않음 (큰 필드)
        },
        code: {
          // 코드 스니펫도 길 수 있으므로 기본은 비워두고,
          // 필요시 별도 API에서 Storage에 저장 후 path/url만 넣는 흐름 권장
          svg: '',
          react: '',
          html: '',
          dataUrl: '' // 절대 넣지 마세요(거대)
        },
        meta: {
          type: safeString(meta.type || options.type),
          style: safeString(meta.style || options.style),
          size: toNum(meta.size || options.size, 0),
          extras: Array.isArray(meta.extras) ? meta.extras.map(String) : options.extras || [],
          checksum: safeString(meta.checksum),
          description: safeString(meta.description || generationData.description)
        },
        message: safeString(generationData.result?.message)
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      imageMetadata: {
        storagePath:
          safeString(
            generationData.metadata?.storageInfo?.storagePath ||
              generationData.result?.asset?.storagePath ||
              ''
          ) || null,
        originalUrl: isDataUrl(generationData.result?.asset?.dalleImage)
          ? ''
          : safeString(generationData.result?.asset?.dalleImage || ''),
        storageUrl:
          safeString(
            generationData.metadata?.storageInfo?.downloadURL ||
              generationData.result?.asset?.storageImageUrl ||
              ''
          ) || '',
        uploadedAt: new Date().toISOString()
      },
      metadata: {
        projectName: safeString(generationData.metadata?.projectName || projectName),
        generationId: safeString(generationData.metadata?.generationId || ''),
        storageInfo: {
          uploaded: Boolean(generationData.metadata?.storageInfo?.uploaded ?? true),
          storagePath: safeString(generationData.metadata?.storageInfo?.storagePath || ''),
          originalUrl: safeString(generationData.metadata?.storageInfo?.originalUrl || ''),
          downloadURL: safeString(generationData.metadata?.storageInfo?.downloadURL || ''),
          uploadStatus: safeString(generationData.metadata?.storageInfo?.uploadStatus || 'uploaded')
        }
      }
    }

    const docRef = await addDoc(collection(db, 'generations'), docBody)
    return docRef.id
  } catch (error) {
    console.error('❌ Error saving generation history:', error)
    throw error
  }
}

/** 생성 문서 업데이트(부분 패치). 큰 필드는 넣지 말 것 */
export const updateGeneration = async (generationId, updateData) => {
  try {
    const docRef = doc(db, 'generations', generationId)
    await updateDoc(docRef, { ...updateData, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('❌ Error updating generation:', error)
    throw error
  }
}

/** ─────────────────────────────────────────────────────────────
 *  2) 채팅 메시지: subcollection 로깅 (모두 저장)
 *  - 긴 본문은 Storage로 오프로딩 후 contentUrl 참조
 *  ───────────────────────────────────────────────────────────── */

/**
 * appendChatMessage
 * @param userId         메시지 주인의 uid (오프로딩 경로 계산)
 * @param projectName    프로젝트명
 * @param generationId   상위 generation doc id
 * @param msg            { role, type, content, attachments?, metadata? }
 *    - role: 'user'|'assistant'|'system'|'tool'
 *    - type: 'text'|'image'|'code'|'event'
 *    - content: string (길면 자동 오프로딩)
 *    - attachments: [{storagePath,url,mime,size}] (선택)
 *    - metadata: {model,tokens,latencyMs,error,...} (선택)
 */
export const appendChatMessage = async (
  userId,
  projectName,
  generationId,
  msg
) => {
  try {
    const content = safeString(msg.content)
    let contentToSave = content
    let contentUrl = ''

    if (content.length > MAX_INLINE_TEXT) {
      // 긴 본문은 Storage 오프로딩
      const off = await offloadLargeTextToStorage({
        userId,
        projectName,
        generationId,
        field: msg.role || 'message',
        content
      })
      contentToSave = `[oversize-content offloaded] ${off.path}`
      contentUrl = off.url
    }

    const messageDoc = {
      role: safeString(msg.role || 'user'),
      type: safeString(msg.type || 'text'),
      content: contentToSave,     // 인라인(짧은 경우) 또는 오프로딩 안내 텍스트
      contentUrl,                 // 길면 여기에 Storage URL
      attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
      metadata: msg.metadata || {},
      createdAt: serverTimestamp()
    }

    const col = collection(db, 'generations', generationId, 'messages')
    const added = await addDoc(col, messageDoc)
    return added.id
  } catch (error) {
    console.error('❌ appendChatMessage failed:', error)
    throw error
  }
}

/** messages 페이지네이션 조회 */
export const getMessages = async (generationId, { pageSize = 50, cursor = null } = {}) => {
  try {
    let qy = query(
      collection(db, 'generations', generationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(pageSize)
    )
    if (cursor) qy = query(qy, startAfter(cursor))

    const snap = await getDocs(qy)
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null
    return { items, nextCursor }
  } catch (err) {
    console.error('❌ getMessages error:', err)
    throw err
  }
}

/** 실시간 메시지 구독 */
export const subscribeToMessages = (generationId, callback) => {
  try {
    const qy = query(
      collection(db, 'generations', generationId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        callback(items)
      },
      (err) => console.error('❌ subscribeToMessages error:', err)
    )
    return unsub
  } catch (err) {
    console.error('❌ subscribeToMessages init error:', err)
    throw err
  }
}

/** ─────────────────────────────────────────────────────────────
 *  3) Generation 목록/단건
 *  - 서버 정렬(orderBy) 사용 → 일관성/성능↑
 *  ───────────────────────────────────────────────────────────── */
export const getUserGenerations = async (userId, projectName = 'iconic') => {
  try {
    const qy = projectName
      ? query(
          collection(db, 'generations'),
          where('userId', '==', String(userId)),
          where('projectName', '==', String(projectName)),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, 'generations'),
          where('userId', '==', String(userId)),
          orderBy('createdAt', 'desc')
        )

    const snapshot = await getDocs(qy)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('❌ Error fetching user generations:', error)
    throw error
  }
}

export const getProjectGenerations = async (projectName, userId = null) => {
  try {
    const qy = userId
      ? query(
          collection(db, 'generations'),
          where('projectName', '==', String(projectName)),
          where('userId', '==', String(userId)),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, 'generations'),
          where('projectName', '==', String(projectName)),
          orderBy('createdAt', 'desc')
        )

    const snapshot = await getDocs(qy)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('❌ Error fetching project generations:', error)
    throw error
  }
}

export const getGenerationById = async (generationId) => {
  try {
    const d = await getDoc(doc(db, 'generations', generationId))
    if (!d.exists()) throw new Error('Generation not found')
    return { id: d.id, ...d.data() }
  } catch (error) {
    console.error('❌ Error fetching generation:', error)
    throw error
  }
}

/** 실시간 생성 목록/단건 구독 */
export const subscribeToGenerationUpdates = (userId, projectName = 'iconic', callback) => {
  try {
    const qy = query(
      collection(db, 'generations'),
      where('userId', '==', String(userId)),
      where('projectName', '==', String(projectName)),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(
      qy,
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error('❌ Real-time listener error:', err)
    )
  } catch (error) {
    console.error('❌ Error setting up real-time listener:', error)
    throw error
  }
}

export const subscribeToSingleGeneration = (generationId, callback) => {
  try {
    return onSnapshot(
      doc(db, 'generations', generationId),
      (d) => callback(d.exists() ? ({ id: d.id, ...d.data() }) : null),
      (err) => console.error('❌ Single generation listener error:', err)
    )
  } catch (error) {
    console.error('❌ Error setting up single generation listener:', error)
    throw error
  }
}

/** ─────────────────────────────────────────────────────────────
 *  4) 삭제 계열 (메시지 서브컬렉션 포함 캐스케이드)
 *  ───────────────────────────────────────────────────────────── */
export const deleteGeneration = async (generationId) => {
  try {
    // 서브컬렉션 messages 모두 삭제
    const msgs = await getDocs(collection(db, 'generations', generationId, 'messages'))
    for (const d of msgs.docs) {
      await deleteDoc(d.ref)
    }
    // 본문 삭제
    await deleteDoc(doc(db, 'generations', generationId))
    console.log('🗑️ Generation deleted with messages:', generationId)
  } catch (error) {
    console.error('❌ Error deleting generation:', error)
    throw error
  }
}

/** 사용자의 전체 생성 문서 일괄 삭제(주의!) */
export const deleteUserGenerations = async (userId, projectName = 'iconic') => {
  const gens = await getUserGenerations(userId, projectName)
  for (const g of gens) await deleteGeneration(g.id)
  console.log(`Deleted ${gens.length} generations for user ${userId}`)
}

/** ─────────────────────────────────────────────────────────────
 *  5) 사용자 프로젝트 (기존 그대로)
 *  ───────────────────────────────────────────────────────────── */
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

export const getUserProjects = async (userId) => {
  try {
    const qy = query(collection(db, 'userProjects'), where('userId', '==', userId))
    const snap = await getDocs(qy)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('❌ Error fetching user projects:', error)
    throw error
  }
}

/** ─────────────────────────────────────────────────────────────
 *  6) 이미지 메타데이터 업데이트 (필요 시)
 *  ───────────────────────────────────────────────────────────── */
export const updateImageMetadata = async (generationId, imageMetadata) => {
  try {
    const docRef = doc(db, 'generations', generationId)
    await updateDoc(docRef, { imageMetadata, updatedAt: serverTimestamp() })
  } catch (error) {
    console.error('❌ Error updating image metadata:', error)
    throw error
  }
}

/** 상태 강제 수정 (디버깅용) */
export const forceFixGenerationStatus = async (generationId) => {
  try {
    const g = await getGenerationById(generationId)
    if (g.status === 'generating') {
      const hasImage =
        g.result?.asset?.storageImageUrl ||
        g.result?.asset?.sourceUrl
      await updateGeneration(
        generationId,
        hasImage
          ? { status: 'completed' }
          : { status: 'failed', error: 'No image found in result' }
      )
      return hasImage ? 'completed' : 'failed'
    }
    return g.status
  } catch (error) {
    console.error('❌ Failed to force fix generation status:', error)
    throw error
  }
} 