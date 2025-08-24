import { useState, useEffect, useRef } from 'react'
import { Camera, Smile, Plus, ChevronDown, ArrowUp, X, Image as ImageIcon, Palette, Ruler, Settings, Sparkles, Download, Copy, Check } from 'lucide-react'
import { generateAsset } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { saveGenerationHistory } from '../utils/firestore'
import { uploadImageToStorage } from '../utils/storage'
import ImageUploadTest from './ImageUploadTest'
import ImageCardStack from './ImageCardStack'

// ✅ 안전 유틸: 너무 큰 문자열/데이터 URL은 Firestore에 저장하지 않도록
const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:')
const safeShort = (v, max = 120_000) => { // 필요시 길이 제한
  if (typeof v !== 'string') return ''
  return v.length > max ? v.slice(0, max) : v
}

// ✅ 공용 변환 유틸: 채팅 히스토리를 Firestore 형식으로 정규화
const normalizeChatForFirestore = (history) =>
  (history || []).map(m => ({
    id: String(m.id ?? Date.now()),
    type: String(m.type ?? 'assistant'),
    message: String(m.message ?? ''),
    timestamp: String(m.timestamp ?? new Date().toLocaleTimeString()),
    date: m.date instanceof Date ? m.date.toISOString()
         : (typeof m.date === 'string' ? m.date : new Date().toISOString()),
    isLoading: !!m.isLoading,
    subtype: m.subtype ? String(m.subtype) : ''   // ✅ 알림 종류 보존
  }))

const CreationPage = ({ startNewChat, onRefreshSidebar, onLoadChatHistory }) => {
  const { currentUser } = useAuth()
  const { isDark } = useTheme()
  const [prompt, setPrompt] = useState('')
  const [uploadedImages, setUploadedImages] = useState([])
  const [activeSegment, setActiveSegment] = useState('image') // 'image' 또는 'code'
  const [leftPanelWidth, setLeftPanelWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const chatHistoryRef = useRef([]) // ✅ 최신 chatHistory를 안전하게 읽기 위한 ref 추가
  

  
  // 채팅 히스토리 상태
  const [chatHistory, setChatHistory] = useState(() => {
    // localStorage에서 채팅 이력 복원
    try {
      const saved = localStorage.getItem('currentChatHistory')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Failed to load chat history:', error)
      return []
    }
  })
  
  // 드래그 앤 드롭 상태
  const [isDragOver, setIsDragOver] = useState(false)
  
  // 파일 입력 참조
  const fileInputRef = useRef(null)
  
  // 템플릿 선택 관련 상태
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState({
    type: '',
    style: '',
    size: '',
    extras: []
  })

  // AI 생성 관련 상태
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState(null)
  const [generatedImages, setGeneratedImages] = useState([]) // 현재 채팅방의 이미지만 저장
  const [currentChatId, setCurrentChatId] = useState(null) // 현재 채팅방 ID
  const [currentGenerationDocId, setCurrentGenerationDocId] = useState(null) // ✅ 현재 진행 중인 문서 ID
  const [activeCodeTab, setActiveCodeTab] = useState('svg')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false) // 다운로드 드롭다운 표시 상태
  
  // 테스트 모드 상태
  const [showTestMode, setShowTestMode] = useState(false)

  // 템플릿 옵션들
  const typeOptions = ['Icon', 'Emoji', 'Illustration', 'Logo', 'Character']
  const styleOptions = ['Liquid Glass', 'Neon Glow', 'Pixel Art', 'Skeuomorphism', '3D', 'Flat', 'Gradient', 'Minimalist']
  const sizeOptions = ['256px', '512px', '1024px'] // gpt-image-1 지원 크기
  const extraOptions = ['Transparent Background', 'High Resolution', 'Vector Format']

  // 옵션 선택 처리
  const handleOptionSelect = (key, value) => {
    if (key === 'extra') {
      setSelectedOptions(prev => ({
        ...prev,
        extras: (prev.extras || []).includes(value) 
          ? (prev.extras || []).filter(item => item !== value)
          : [...(prev.extras || []), value]
      }))
    } else {
      setSelectedOptions(prev => ({
        ...prev,
        [key]: prev[key] === value ? '' : value
      }))
    }
  }

  // 선택된 옵션 제거
  const removeOption = (key) => {
    if (key === 'extra') {
      setSelectedOptions(prev => ({ ...prev, extras: [] }))
    } else {
      setSelectedOptions(prev => ({ ...prev, [key]: '' }))
    }
  }

  // 선택된 옵션 개수
  const getSelectedOptionsCount = () => {
    return Object.values(selectedOptions).filter(v => 
      typeof v === 'string' ? v : (Array.isArray(v) ? v.length > 0 : false)
    ).length
  }

  // 페이지 로드 시 디폴트 상태 정리 및 새 채팅 시작
  useEffect(() => {
    const clearDefaultData = () => {
      try {
        // 디폴트 상태에서 불필요한 데이터 제거
        localStorage.removeItem('currentChatHistory')
        localStorage.removeItem('chatHistory')
        localStorage.removeItem('tempChatHistory')
        localStorage.removeItem('generatedImages')
        
        // 채팅별 이미지 데이터 정리
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('chatImages_')) {
            localStorage.removeItem(key)
          }
        })
        
        // 생성 관련 임시 데이터 정리
        localStorage.removeItem('creationPrompt')
        localStorage.removeItem('creationOptions')
        localStorage.removeItem('startGenerationImmediately')
        
        console.log('Default data cleared from localStorage')
      } catch (error) {
        console.error('Failed to clear default data:', error)
      }
    }
    
    // 페이지 로드 시 한 번만 실행
    clearDefaultData()
    
    // 기본 환영 메시지만 설정 (handleNewChat 호출하지 않음)
    const welcomeMessage = {
      id: Date.now(),
      type: 'assistant',
      message: "Hello! I'm Afterwon 1.0, your creative AI assistant specializing in visual content creation. I can help you create stunning images, videos, and bring your creative ideas to life. What would you like to create today? Feel free to describe your vision or ask for suggestions to get started.",
      timestamp: new Date().toLocaleTimeString(),
      date: new Date()
    }
    
    setChatHistory([welcomeMessage])
    setGeneratedImages([])
    setGenerationResult(null)
    setPrompt('')
    setUploadedImages([])
    setCurrentChatId(null)
    setCurrentGenerationDocId(null) // ✅ 진행 중인 문서 ID 초기화
    setSelectedOptions({
      type: '',
      style: '',
      size: '',
      extras: []
    })
    
    console.log('Default state initialized')
  }, [])

  // 채팅 내용을 localStorage에 저장하는 함수
  const saveChatToStorage = (newChatHistory) => {
    try {
      localStorage.setItem('currentChatHistory', JSON.stringify(newChatHistory))
      // 백업으로도 저장
      localStorage.setItem('chatHistoryBackup', JSON.stringify(newChatHistory))
    } catch (error) {
      console.error('Failed to save chat to storage:', error)
    }
  }

  // 생성된 이미지를 히스토리에 추가하는 함수 (localStorage 용량 제한)
  const addGeneratedImage = (imageData) => {
    const newImage = {
      id: imageData.id || Date.now(),
      imageUrl: imageData.imageUrl,
      prompt: imageData.prompt,
      options: imageData.options,
      timestamp: imageData.timestamp || new Date(),
      dalleImage: imageData.dalleImage,
      storageImageUrl: imageData.storageImageUrl,
      chatId: currentChatId || 'default' // 현재 채팅방 ID 추가
    }
    
    // 현재 채팅방의 이미지 목록에 추가
    setGeneratedImages(prev => [...prev, newImage])
    
    // localStorage에 채팅방별로 저장 (용량 제한 포함)
    try {
      const chatId = currentChatId || 'default'
      const chatImages = JSON.parse(localStorage.getItem(`chatImages_${chatId}`) || '[]')
      
      // 최대 10개 이미지만 유지 (용량 절약)
      if (chatImages.length >= 10) {
        chatImages.shift() // 가장 오래된 이미지 제거
      }
      
      chatImages.push(newImage)
      
      // 이미지 데이터를 간소화하여 저장 (용량 절약)
      const simplifiedImage = {
        id: newImage.id,
        prompt: newImage.prompt,
        timestamp: newImage.timestamp,
        chatId: newImage.chatId
        // imageUrl은 제거하여 용량 절약
      }
      
      localStorage.setItem(`chatImages_${chatId}`, JSON.stringify([...chatImages.slice(-10).map(img => simplifiedImage)]))
      console.log(`Saved new image to localStorage for chat: ${chatId}`)
    } catch (error) {
      console.error('Failed to save generated images:', error)
      // localStorage 용량 초과 시 기존 데이터 정리
      try {
        const chatId = currentChatId || 'default'
        localStorage.removeItem(`chatImages_${chatId}`)
        console.log('Cleared localStorage due to quota exceeded')
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError)
      }
    }
  }

  // 이미지 로드 함수는 제거 (디폴트 상태에서는 불필요)

  // 새 채팅 시작 함수
  const handleNewChat = () => {
    console.log('Starting new chat...')
    
    // 모든 상태 초기화
    setChatHistory([])
    setPrompt('')
    setUploadedImages([])
    setGenerationResult(null)
    setGeneratedImages([])
    setCurrentChatId(null)
    setCurrentGenerationDocId(null) // ✅ 진행 중인 문서 ID 초기화
    setSelectedOptions({
      type: '',
      style: '',
      size: '',
      extras: []
    })
    
    // localStorage 완전 정리
    const clearAllData = () => {
      try {
        localStorage.removeItem('currentChatHistory')
        localStorage.removeItem('chatHistory')
        localStorage.removeItem('tempChatHistory')
        localStorage.removeItem('generatedImages')
        
        // 채팅별 이미지 데이터 정리
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('chatImages_')) {
            localStorage.removeItem(key)
          }
        })
        
        // 생성 관련 임시 데이터 정리
        localStorage.removeItem('creationPrompt')
        localStorage.removeItem('creationOptions')
        localStorage.removeItem('startGenerationImmediately')
        
        console.log('All data cleared from localStorage')
      } catch (error) {
        console.error('Failed to clear data:', error)
      }
    }
    
    clearAllData()
    
    // 기본 환영 메시지 추가
    const welcomeMessage = {
      id: Date.now(),
      type: 'assistant',
      message: "Hello! I'm Afterwon 1.0, your creative AI assistant specializing in visual content creation. I can help you create stunning images, videos, and bring your creative ideas to life. What would you like to create today? Feel free to describe your vision or ask for suggestions to get started.",
      timestamp: new Date().toLocaleTimeString(),
      date: new Date()
    }
    
    setChatHistory([welcomeMessage])
    saveChatToStorage([welcomeMessage])
    
    // 사이드바의 선택된 생성 이력 초기화
    if (window.setSelectedGenerationId) {
      window.setSelectedGenerationId(null)
    }
    
    console.log('New chat started successfully')
  }



  // 채팅 이력 로드 함수 (사이드바에서 호출)
  const loadChatHistory = (history, promptText, result) => {
    console.log('Loading chat history:', { history, promptText, result })
    
    // 새로운 채팅방 시작 시 이미지 목록 초기화
    const chatId = promptText || 'default'
    setCurrentChatId(chatId)
    
            // history가 유효한지 확인하고 안전하게 설정
        let validHistory = []
        
        if (history && Array.isArray(history) && history.length > 0) {
          // Firestore에서 로드된 데이터가 유효한지 확인
          validHistory = history.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            type: msg.type || 'assistant',
            message: msg.message || '',
            timestamp: msg.timestamp || new Date().toLocaleTimeString(),
            date: msg.date ? (msg.date.toDate ? msg.date.toDate() : new Date(msg.date)) : new Date(),
            isLoading: !!msg.isLoading,  // ✅ 추가
            subtype: msg.subtype || ''                      // ✅ 알림 종류 복원
          }))
        } else {
      // history가 없거나 유효하지 않으면 기본 메시지 생성
      validHistory = [
        {
          id: Date.now(),
          type: 'assistant',
          message: '👋 Hello! I\'m ready to help you create amazing designs. What would you like to make today?',
          timestamp: new Date().toLocaleTimeString(),
          date: new Date()
        }
      ]
      
      // promptText가 있으면 사용자 메시지 추가
      if (promptText) {
        validHistory.push({
          id: Date.now() + 1,
          type: 'user',
          message: promptText,
          timestamp: new Date().toLocaleTimeString(),
          date: new Date()
        })
      }
    }
    
    // 채팅 히스토리 설정
    setChatHistory(validHistory)
    
    // 프롬프트는 입력창에 표시하지 않음 (이미 채팅 히스토리에 포함됨)
    // setPrompt(promptText)
    
    // 생성 결과도 복원
    if (result) {
      console.log('Setting generationResult:', result)
      setGenerationResult(result)
      
      // result에서 이미지 정보를 추출하여 generatedImages에 추가
      if (result.asset) {
        console.log('Extracting image data from result:', result.asset)
        
        const imageData = {
          // 항상 generationId(예: gen_...)를 우선 사용
          id: result?.generationId
              || result?.metadata?.generationId
              || currentGenerationDocId         // 그래도 없으면 같은 세션 문서 id
              || 'unknown_generation',
          imageUrl: result.asset.storageImageUrl || result.asset.dalleImage,
          prompt: promptText,
          options: result.options || {},
          timestamp: result.createdAt ? new Date(result.createdAt) : new Date(),
          dalleImage: result.asset.dalleImage,
          storageImageUrl: result.asset.storageImageUrl,
          chatId: chatId // 채팅방 ID 추가
        }
        
        console.log('Created imageData:', imageData)
        
        // 현재 채팅방의 이미지만 표시하도록 설정
        setGeneratedImages([imageData])
        
        // localStorage에 채팅방별로 저장
        try {
          const chatImages = JSON.parse(localStorage.getItem(`chatImages_${chatId}`) || '[]')
          const exists = chatImages.some(img => img.id === imageData.id)
          if (!exists) {
            chatImages.push(imageData)
            localStorage.setItem(`chatImages_${chatId}`, JSON.stringify(chatImages))
            console.log(`Saved image to localStorage for chat: ${chatId}`)
          }
        } catch (error) {
          console.error('Failed to save image to localStorage:', error)
        }
      } else {
        console.log('No asset found in result:', result)
        // 이미지가 없으면 빈 배열로 설정
        setGeneratedImages([])
      }
    } else {
      console.log('No result provided')
      // 결과가 없으면 빈 배열로 설정
      setGeneratedImages([])
    }
    
    // ✅ 백필: 결과가 있는데 알림 이벤트가 없으면 하나 넣어준다.
    const hasEvent = (validHistory || []).some(m => m.subtype === 'image_generated')
    const hasAsset = !!(result?.asset?.storageImageUrl || result?.asset?.dalleImage)
    if (!hasEvent && hasAsset) {
      validHistory = [
        ...validHistory,
        {
          id: `evt_${result?.generationId || result?.metadata?.generationId || 'unknown'}`,
          type: 'assistant',
          subtype: 'image_generated',
          message: '🖼️ Image generated',
          timestamp: new Date().toLocaleTimeString(),
          date: new Date(),
          isLoading: false
        }
      ]
    }
    
    // localStorage에도 저장
    saveChatToStorage(validHistory)
    
    console.log('Chat history loaded successfully:', validHistory)
  }

  // localStorage에서 채팅 이력 복원 (백업 포함)
  const restoreChatHistory = () => {
    try {
      // 먼저 현재 채팅 이력 시도
      const currentHistory = localStorage.getItem('currentChatHistory')
      if (currentHistory) {
        const history = JSON.parse(currentHistory)
        if (history && Array.isArray(history) && history.length > 0) {
          setChatHistory(history)
          return
        }
      }
      
      // 백업에서 복원 시도
      const backupHistory = localStorage.getItem('chatHistory')
      if (backupHistory) {
        const history = JSON.parse(backupHistory)
        if (history && Array.isArray(history) && history.length > 0) {
          setChatHistory(history)
          saveChatToStorage(history)
          return
        }
      }
      
      // 기본 채팅 시작
      const defaultChat = [
        {
          id: Date.now(),
          type: 'assistant',
          message: '👋 Hello! I\'m ready to help you create amazing designs. What would you like to make today?',
          timestamp: new Date().toLocaleTimeString(),
          date: new Date()
        }
      ]
      setChatHistory(defaultChat)
      saveChatToStorage(defaultChat)
    } catch (error) {
      console.error('Failed to restore chat history:', error)
      // 에러 발생 시 기본 채팅 시작
      const defaultChat = [
        {
          id: Date.now(),
          type: 'assistant',
          message: '👋 Hello! I\'m ready to help you create amazing designs. What would you like to make today?',
          timestamp: new Date().toLocaleTimeString(),
          date: new Date()
        }
      ]
      setChatHistory(defaultChat)
      saveChatToStorage(defaultChat)
    }
  }

  // App.jsx에서 전달받은 onLoadChatHistory 함수 사용
  useEffect(() => {
    if (onLoadChatHistory) {
      // onLoadChatHistory 함수를 CreationSidebar에서 사용할 수 있도록 설정
      window.loadChatHistoryFromSidebar = loadChatHistory
      console.log('loadChatHistoryFromSidebar function set on window object')
    }
  }, [onLoadChatHistory])

  // 다운로드 함수를 상단으로 이동 (GPT-Image-1 base64 데이터 지원)
  const downloadDalleImage = async (imageUrl, format = 'png') => {
    if (!imageUrl) {
      console.error('No image URL provided for download')
      return
    }

    try {
      // base64 데이터 URL인 경우 직접 다운로드 (GPT-Image-1 응답)
      if (imageUrl.startsWith('data:image/')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `ai-generated-image-${timestamp}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Base64 image downloaded successfully');
        return;
      }

      // 일반 URL인 경우 기존 방식 사용
      console.log('Attempting direct download...')
      
      // Canvas를 사용하여 이미지 변환
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      // CORS 설정
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // 배경을 흰색으로 설정 (PNG는 투명 배경 유지)
        if (format === 'jpg' || format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        
        ctx.drawImage(img, 0, 0)
        
        // 다운로드 링크 생성
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          a.download = `ai-generated-image-${timestamp}.${format}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          console.log('Image downloaded successfully')
        }, `image/${format}`, 0.9)
      }
      
      img.onerror = () => {
        console.error('Failed to load image for direct download')
        alert('다운로드에 실패했습니다. 이미지 URL에 직접 접근할 수 없습니다.')
      }
      
      img.src = imageUrl
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  // AI 생성 함수 (실제 API 호출) - 리팩토링된 버전
  const generateWithAI = async (prompt, addUserMessage = true) => {
    if (!prompt.trim() && uploadedImages.length === 0) return
    
    // ✅ 이중 실행 가드 + runId 통일
    if (isGenerating || window.__genInFlight) {
      console.warn('Generation already in progress')
      return
    }
    window.__genInFlight = true
    
    setIsGenerating(true)
    
    // Firebase Storage 업로드 변수들을 함수 시작 부분에서 선언
    let storageImageUrl = null;
    let storagePath = null;
    let imageMetadata = null;
    let uploadStatus = 'pending';
    
    // 사용자 메시지를 먼저 채팅 히스토리에 추가 (중복 방지)
    let userMessage = null;
    let loadingMessage = null;
    
    if (addUserMessage) {
      userMessage = {
        id: Date.now(),
        type: 'user',
        message: prompt,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date()
      }
      
      // 로딩 메시지 추가
      loadingMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: "Generating your components...",
        timestamp: new Date().toLocaleTimeString(),
        date: new Date(),
        isLoading: true
      }
      
      // 사용자 메시지와 로딩 메시지를 동시에 추가
      setChatHistory(prev => [...prev, userMessage, loadingMessage])
      
      // localStorage에 즉시 저장 (사용자 메시지 포함)
      saveChatToStorage([...chatHistory, userMessage, loadingMessage])
    } else {
      // 사용자 메시지가 이미 추가된 경우 로딩 메시지만 추가
      loadingMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: "Generating your components...",
        timestamp: new Date().toLocaleTimeString(),
        date: new Date(),
        isLoading: true
      }
      
      setChatHistory(prev => [...prev, loadingMessage])
      saveChatToStorage([...chatHistory, loadingMessage])
    }
    
    // ✅ 생성 ID를 한 번만 만들고 모든 곳에 재사용
    const runId = `gen_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
    const generationId = runId // storage 경로/Firestore meta/이미지 카드 id 모두 동일값으로
    
    // Firestore에 생성 시작 상태 저장 (즉시)
    let firestoreDocId = null
    if (currentUser) {
      try {
        const initialGenerationData = {
          prompt: prompt,
          options: {
            type: selectedOptions.type || 'Icon',
            style: selectedOptions.style || 'Flat',
            size: selectedOptions.size || '1024',
            extras: selectedOptions.extras || []
          },
          status: 'generating', // 상태를 generating으로 설정
          chatHistory: [
            ...chatHistory.filter(msg => !msg.isLoading),
            ...(userMessage ? [userMessage] : []),
            loadingMessage
          ],
          createdAt: new Date(),
          metadata: {
            projectName: 'iconic',
            generationId: generationId,
            storageInfo: {
              uploaded: false,
              storagePath: null,
              originalUrl: null,
              uploadStatus: 'pending'
            }
          }
        }
        
        firestoreDocId = await saveGenerationHistory(currentUser.uid, initialGenerationData, 'iconic')
        console.log('✅ Generation started and saved to Firestore with ID:', firestoreDocId)
        
        // ✅ 방금 만든 문서로 채팅 컨텍스트 전환
        setCurrentGenerationDocId(firestoreDocId)
        setCurrentChatId(firestoreDocId)                     // 채팅방 id를 문서 id로 통일
        setChatHistory(initialGenerationData.chatHistory)    // 로딩 말풍선 있는 히스토리로 교체
        localStorage.setItem('currentGenerationDocId', firestoreDocId)
        setTimeout(() => {                                   // 사이드바 선택 고정
          if (window.setSelectedGenerationId) window.setSelectedGenerationId(firestoreDocId)
        }, 0)
        
        // 사이드바 새로고침 (생성 시작 상태 반영)
        if (onRefreshSidebar) {
          onRefreshSidebar()
        }
      } catch (error) {
        console.error('Failed to save initial generation state:', error)
      }
    }
    
    try {
      // 첨부된 이미지가 있으면 먼저 업로드
      let referenceImageUrls = []
      if (uploadedImages.length > 0) {
        console.log('Processing uploaded images for AI generation...')
        try {
          // 이미지 파일들을 base64로 변환하여 전송
          for (const image of uploadedImages) {
            const base64 = await fileToBase64(image.file)
            referenceImageUrls.push({
              name: image.name,
              data: base64,
              type: image.file.type
            })
          }
          console.log('Converted images to base64:', referenceImageUrls.length)
        } catch (error) {
          console.error('Failed to process uploaded images:', error)
        }
      }
      
      // 후속질문인지 확인 (이미 생성된 이미지가 있는 경우)
      const isModification = generatedImages.length > 0 && currentChatId
      
      if (isModification) {
        console.log('Follow-up question detected - AI will iterate on existing image')
      }
      
      // isModification을 전역 변수로 설정하여 함수 내 다른 부분에서 접근 가능하도록 함
      window.currentIsModification = isModification
      
      // 백엔드 형식에 맞게 데이터 변환 (기존 API 형식 유지)
      const request = {
        type: selectedOptions.type || 'Icon', // 기본값: Icon
        style: selectedOptions.style ? selectedOptions.style.replace(/\s+/g, '') : 'Flat', // 공백 제거, 기본값: Flat
        size: selectedOptions.size ? selectedOptions.size.replace('px', '') : '1024', // px 제거, 기본값: 1024 (GPT-Image-1 최적)
        extras: selectedOptions.extras || [],
        description: prompt, // 원본 프롬프트 그대로 사용
        referenceImages: referenceImageUrls // 첨부된 이미지 추가
      }
      
      console.log('Sending request (compatible with existing API):', request) // 디버깅용
      console.log('isModification flag:', isModification) // 디버깅용
      
      const result = await generateAsset(request)
      console.log('Generation successful:', result)
      
      // 응답 구조 검증
      if (!result || !result.asset) {
        throw new Error('Invalid response structure from server')
      }
      
      setGenerationResult(result)
      
      // ✅ "이미지 먼저 보여주고" 저장은 뒤에서
      // ❶ 결과 획득
      if (!result || !result.asset) throw new Error('Invalid response')
      
      // ❷ 미리보기용 URL 결정(우선순위: base64 > storageUrl > 외부URL)
      const generatedUrl = result.asset.png || result.asset.storageImageUrl || result.asset.dalleImage
      
      if (generatedUrl) {
        console.log('Generated image found:', generatedUrl)
        
        // ✅ 완료 알림 메시지(이벤트) – 한 세션/한 이미지당 하나
        const completionMsg = {
          id: `evt_${generationId}`,               // 고정 ID로 중복 방지
          type: 'assistant',
          subtype: 'image_generated',              // ← 이게 로드/복원 키
          message: '🖼️ Image generated',
          timestamp: new Date().toLocaleTimeString(),
          date: new Date(),
          isLoading: false
        }
        // 채팅에 삽입(중복 제거)
        setChatHistory(prev => {
          const next = [
            ...prev.filter(m => m.id !== completionMsg.id), 
            completionMsg
          ]
          saveChatToStorage(next)
          return next
        })
        
        // ❸ UI 먼저 업데이트 (카드 1개만, id는 runId로 고정)
        setGeneratedImages(prev => {
          const next = prev.filter(i => i.id !== runId)
          return [...next, {
            id: runId,
            imageUrl: generatedUrl,
            prompt,
            options: selectedOptions,
            timestamp: new Date(),
            dalleImage: result.asset.dalleImage || '',
            storageImageUrl: result.asset.storageImageUrl || '' // 일단 빈 값일 수 있음
          }]
        })
        
        // ❹ 스피너는 여기서 끄기 → 사용자는 즉시 미리보기 확인
        setIsGenerating(false)
      } else {
        console.log('No generated image in response')
        setIsGenerating(false)
      }
      
      // ✅ Storage 업로드 후 같은 카드(runId) 를 업데이트
      if (currentUser && generatedUrl) {
        console.log('Current user:', currentUser.uid)
        console.log('Generated URL:', generatedUrl)
        
        try {
          console.log('Starting Firebase Storage upload process...')
          
          let storageImageUrl = ''
          let storagePath = null
          let uploadStatus = 'pending'
          
          // base64/URL 무엇이든 uploadImageToStorage가 처리
          try {
            console.log('Starting Firebase Storage upload for:', generatedUrl)
            
            const projectName = 'iconic'
            
            const uploadResult = await uploadImageToStorage(
              generatedUrl, 
              currentUser.uid, 
              generationId,
              projectName
            )
            
            storageImageUrl = uploadResult.downloadURL
            storagePath = uploadResult.storagePath
            uploadStatus = 'success'
            
            console.log('Image uploaded to Firebase Storage successfully!')
            console.log('Storage Path:', storagePath)
            console.log('Download URL:', storageImageUrl)
            
          } catch (uploadError) {
            console.error('Failed to upload image to storage:', uploadError)
            console.log('Using generated URL as fallback')
            uploadStatus = 'failed'
            
            // 업로드 실패 시 원본 URL 사용
            storageImageUrl = generatedUrl
            storagePath = null
          }
          
          // UI 이미지 카드도 같은 runId로 업데이트(두 장 방지)
          setGeneratedImages(prev =>
            prev.map(img => img.id === runId ? { ...img, storageImageUrl, imageUrl: storageImageUrl } : img)
          )
          // URL 없는 카드 제거 (No Image 방지)
          setGeneratedImages(prev => prev.filter(img => !!img.imageUrl))
          
          // ✅ Firestore 업데이트 시 절대 base64 저장 금지
          if (firestoreDocId) {
            const safeResult = {
              status: 'completed',
              generationId: generationId,               // ← 결과 객체에도 고유 ID 복제
              asset: {
                // base64/dataURL은 버린다
                svg: '',
                png: '',          // ❌ 저장하지 않음
                jpeg: '',
                storageImageUrl,  // ✅ 최종 표준
                sourceUrl: (result.asset?.dalleImage && !isDataUrl(result.asset.dalleImage))
                            ? safeShort(result.asset.dalleImage, 2000)
                            : ''
              },
              code: {
                svg: safeShort(result.code?.svg || '', 200_000),
                react: safeShort(result.code?.react || '', 200_000),
                html: safeShort(result.code?.html || '', 200_000),
                dataUrl: ''       // ❌ 저장하지 않음
              },
              meta: {
                type: String(result.meta?.type || selectedOptions.type || ''),
                style: String(result.meta?.style || selectedOptions.style || ''),
                size: String(result.meta?.size || selectedOptions.size || ''),
                extras: Array.isArray(result.meta?.extras) ? result.meta.extras.map(String) : [],
                checksum: safeShort(String(result.meta?.checksum || ''), 128),
                description: safeShort(String(result.meta?.description || prompt || ''), 2000)
              },
              message: safeShort(String(result.message || ''), 2000)
            }
            
            // ✅ 현재 최신 히스토리 스냅샷에서 로딩 제거 + 이미지생성 이벤트 유지
            const base = Array.isArray(chatHistoryRef.current) ? chatHistoryRef.current : []
            const withoutLoaders = base.filter(m => !m.isLoading)
            const ensuredEvent = (() => {
              const hasEvent = withoutLoaders.some(m => m.subtype === 'image_generated')
              if (hasEvent) return withoutLoaders
              return [
                ...withoutLoaders,
                { id: `evt_${generationId}`, type: 'assistant', subtype: 'image_generated',
                  message: '🖼️ Image generated', timestamp: new Date().toLocaleTimeString(),
                  date: new Date(), isLoading: false }
              ]
            })()
            const updatedHistoryForFs = normalizeChatForFirestore(ensuredEvent)

            const updateData = {
              status: 'completed',
              result: safeResult,
              chatHistory: updatedHistoryForFs,   // ✅ 추가: Firestore에도 기록
              updatedAt: new Date(),
              metadata: {
                projectName: 'iconic',
                generationId,
                storageInfo: {
                  uploaded: !!storageImageUrl,
                  storagePath,
                  originalUrl: isDataUrl(generatedUrl) ? '' : safeShort(generatedUrl, 2000),
                  uploadStatus
                }
              }
            }
            
            try {
              const { updateGeneration } = await import('../utils/firestore')
              await updateGeneration(firestoreDocId, updateData)
              console.log('✅ Generation completed and updated in Firestore')
              
              // 사이드바 새로고침 (완료 상태 반영)
              if (onRefreshSidebar) {
                onRefreshSidebar()
              }
            } catch (e) {
              console.warn('Full update failed, retrying with minimal payload', e)
              // 최소 안전 페이로드로 재시도(거의 실패하지 않음)
              const minimal = {
                status: 'completed',
                result: {
                  status: 'completed',
                  generationId: generationId, // ✅ 최소 페이로드에도 generationId 포함
                  asset: { storageImageUrl },
                  code: {},
                  meta: { size: String(selectedOptions.size || '1024') },
                  message: ''
                },
                chatHistory: updatedHistoryForFs, // ✅ 최소 페이로드에도 chatHistory 포함
                updatedAt: new Date()
              }
              const { updateGeneration } = await import('../utils/firestore')
              await updateGeneration(firestoreDocId, minimal)
            }
          }
          
        } catch (error) {
          console.error('Failed to process generation completion:', error)
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          })
        }
      } else {
        console.log('No current user found, skipping Firestore update')
      }
      
      // ✅ 로딩만 제거(이벤트는 유지)
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isLoading)
        saveChatToStorage(filtered)
        return filtered
      })
      
    } catch (error) {
      console.error('Generation failed:', error)
      
      // 에러 메시지 추가
      const errorMessage = {
        id: Date.now() + 2,
        type: 'assistant',
        message: `Generation failed: ${error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        date: new Date()
      }
      
      // 로딩 메시지 제거하고 에러 메시지 추가 (기존 히스토리 유지)
      setChatHistory(prev => {
        const filteredHistory = prev.filter(msg => !msg.isLoading)
        const updatedHistory = [...filteredHistory, errorMessage]
        // localStorage에 저장
        saveChatToStorage(updatedHistory)
        return updatedHistory
      })
      
      // 에러가 발생했을 때 Firestore 상태 업데이트 (실패 상태)
      if (currentUser && firestoreDocId) {
        try {
          const errorUpdateData = {
            status: 'failed',
            error: error.message || 'Unknown error',
            result: {
              status: 'failed',
              asset: {},
              code: {},
              meta: {},
              message: error.message || 'Unknown error'
            },
            updatedAt: new Date()
          }
          
          const { updateGeneration } = await import('../utils/firestore')
          await updateGeneration(firestoreDocId, errorUpdateData)
          console.log('✅ Generation error state updated in Firestore')
          
          // 사이드바 새로고침
          if (onRefreshSidebar) {
            onRefreshSidebar()
          }
        } catch (saveError) {
          console.error('Failed to update error state in Firestore:', saveError)
        }
      }
    } finally {
      setIsGenerating(false) // 이미 중간에 껐지만 안전차원
      window.__genInFlight = false
    }
  }



  // 리사이징 시작
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // 리사이징 중
  const handleMouseMove = (e) => {
    if (!isResizing) return
    
    requestAnimationFrame(() => {
      const newWidth = e.clientX
      const minWidth = 200 // 최소 너비
      const maxWidth = window.innerWidth * 0.8 // 최대 너비 (화면의 80%)
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setLeftPanelWidth(newWidth)
      }
    })
  }

  // 리사이징 종료
  const handleMouseUp = () => {
    setIsResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

      // 컴포넌트 마운트 시 임시 저장된 채팅 이력 읽기
    useEffect(() => {
      // ✅ Session → Creation 핸드오프: 선택해야 할 generationId가 있다면 사이드바에 전달
      const pendingId = localStorage.getItem('openGenerationId')
      if (pendingId) {
        setCurrentGenerationDocId(pendingId)
        setCurrentChatId(pendingId)
        // 사이드바가 아직 mount 안 됐을 수 있으니 잠깐 재시도
        const trySelect = () => {
          if (window.setSelectedGenerationId) {
            window.setSelectedGenerationId(pendingId)
            clearInterval(t)
          }
        }
        const t = setInterval(trySelect, 50)
        // 3초 내에 준비되면 선택됨(준비되자마자 종료)
        setTimeout(() => clearInterval(t), 3000)
        localStorage.removeItem('openGenerationId')
      }
      
      try {
        const tempData = localStorage.getItem('tempChatHistory')
        if (tempData) {
          const { history, prompt: promptText, generationResult } = JSON.parse(tempData)
          if (history && Array.isArray(history)) {
            setChatHistory(history)
            // 프롬프트는 입력창에 표시하지 않음 (이미 채팅 히스토리에 포함됨)
            // if (promptText) {
            //   setPrompt(promptText)
            // }
            if (generationResult) {
              setGenerationResult(generationResult)
            }
          }
          // 사용 후 삭제
          localStorage.removeItem('tempChatHistory')
        } else {
          // 임시 데이터가 없으면 저장된 채팅 이력 복원
          restoreChatHistory()
        }
      } catch (error) {
        console.error('Failed to load temp chat history:', error)
        // 에러 발생 시 저장된 채팅 이력 복원
        restoreChatHistory()
      }
      
      // 생성된 이미지들은 더 이상 자동으로 로드하지 않음 (디폴트 상태에서는 불필요)
      
      // window 객체에 함수 등록 (사이드바에서 호출 가능하도록)
      window.handleNewChat = handleNewChat
      window.loadChatHistoryFromSidebar = loadChatHistory
      
      // 컴포넌트 언마운트 시 정리
      return () => {
        delete window.handleNewChat
        delete window.loadChatHistoryFromSidebar
      }
    }, [])

  // ✅ chatHistory가 변경될 때마다 ref 동기화
  useEffect(() => { chatHistoryRef.current = chatHistory }, [chatHistory])

  // 다운로드 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadDropdown && !event.target.closest('.download-dropdown')) {
        setShowDownloadDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadDropdown])

  // chatHistory가 변경될 때마다 localStorage에 자동 저장
  useEffect(() => {
    if (chatHistory.length > 0) {
      saveChatToStorage(chatHistory)
    }
  }, [chatHistory])

  // activeSegment가 변경되어도 leftPanelWidth 유지
  useEffect(() => {
    // activeSegment가 변경되어도 패널 너비는 그대로 유지
    // 사용자가 직접 리사이징할 때만 너비 변경 허용
  }, [activeSegment])

  // activeSegment 변경 함수 (패널 너비 유지)
  const handleSegmentChange = (segment) => {
    setActiveSegment(segment)
    // leftPanelWidth는 변경하지 않음 - 사용자가 설정한 구분선 위치 그대로 유지
    // Code 세그먼트에서도 사용자가 드래그한 구분선 위치를 그대로 사용
  }

  // 컴포넌트 마운트 시 마우스 이벤트 리스너 추가
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])



  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => ({
        id: Date.now() + Math.random(),
        file: file,
        name: file.name
      }))
      setUploadedImages(prev => [...prev, ...newImages])
    }
  }

  // startNewChat이 변경될 때 새 채팅 시작
  useEffect(() => {
    if (startNewChat) {
      // Home에서 전달받은 프롬프트와 옵션 확인
      const homePrompt = localStorage.getItem('creationPrompt')
      const homeOptions = localStorage.getItem('creationOptions')
      const startImmediately = localStorage.getItem('startGenerationImmediately')
      
      let initialMessage = "Hello! I'm Afterwon 1.0, your creative AI assistant specializing in visual content creation. I can help you create stunning images, videos, and bring your creative ideas to life. What would you like to create today? Feel free to describe your vision or ask for suggestions to get started."
      
      // Home에서 프롬프트가 전달된 경우
      if (homePrompt && homeOptions) {
        try {
          const parsedOptions = JSON.parse(homeOptions)
          const optionsText = Object.entries(parsedOptions)
            .filter(([_, value]) => value && (typeof value === 'string' ? value.trim() : value.length > 0))
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
          
          // 프롬프트를 입력창에 설정
          setPrompt(homePrompt)
          
          // 즉시 AI 생성 시작이 필요한 경우
          if (startImmediately === 'true') {
            // 기존 히스토리에 사용자 메시지 추가
            const existingHistory = localStorage.getItem('currentChatHistory')
            let newHistory
            
            if (existingHistory) {
              try {
                const parsedHistory = JSON.parse(existingHistory)
                if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                  // 기존 히스토리에 사용자 메시지 추가
                  const userMessage = {
                    id: Date.now(),
                    type: 'user',
                    message: homePrompt,
                    timestamp: new Date().toLocaleTimeString(),
                    date: new Date()
                  }
                  newHistory = [...parsedHistory, userMessage]
                } else {
                  // 새 채팅 시작
                  const userMessage = {
                    id: Date.now(),
                    type: 'user',
                    message: homePrompt,
                    timestamp: new Date().toLocaleTimeString(),
                    date: new Date()
                  }
                  newHistory = [userMessage]
                }
              } catch (e) {
                // 파싱 실패 시 새 채팅 시작
                const userMessage = {
                  id: Date.now(),
                  type: 'user',
                  message: homePrompt,
                  timestamp: new Date().toLocaleTimeString(),
                  date: new Date()
                }
                newHistory = [userMessage]
              }
            } else {
              // 새 채팅 시작
              const userMessage = {
                id: Date.now(),
                type: 'user',
                message: homePrompt,
                timestamp: new Date().toLocaleTimeString(),
                date: new Date()
              }
              newHistory = [userMessage]
            }
            
            setChatHistory(newHistory)
            saveChatToStorage(newHistory)
            
            // localStorage에서 데이터 제거
            localStorage.removeItem('creationPrompt')
            localStorage.removeItem('creationOptions')
            localStorage.removeItem('startGenerationImmediately')
            
            // 즉시 AI 생성 시작
            setTimeout(() => {
              generateWithAI(homePrompt)
            }, 500)
            
            return // 여기서 종료
          }
          
          initialMessage = `I see you want to create: "${homePrompt}"${optionsText ? `\n\nSelected options: ${optionsText}` : ''}\n\nLet me help you bring this idea to life! What specific details would you like me to focus on?`
          
          // localStorage에서 데이터 제거 (한 번만 사용)
          localStorage.removeItem('creationPrompt')
          localStorage.removeItem('creationOptions')
        } catch (e) {
          console.error('Failed to parse creation options:', e)
        }
      }
      
      // 기존 채팅 히스토리가 있으면 유지하고, 없으면 새로 시작
      const existingHistory = localStorage.getItem('currentChatHistory')
      let newHistory
      
      if (existingHistory) {
        try {
          const parsedHistory = JSON.parse(existingHistory)
          if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
            // 기존 히스토리 유지
            newHistory = parsedHistory
          } else {
            // 새 채팅 시작
            const newChat = {
              id: Date.now(),
              type: 'assistant',
              message: initialMessage,
              timestamp: new Date().toLocaleTimeString(),
              date: new Date()
            }
            newHistory = [newChat]
          }
        } catch (e) {
          // 파싱 실패 시 새 채팅 시작
          const newChat = {
            id: Date.now(),
            type: 'assistant',
            message: initialMessage,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date()
          }
          newHistory = [newChat]
        }
      } else {
        // 새 채팅 시작
        const newChat = {
          id: Date.now(),
          type: 'assistant',
          message: initialMessage,
          timestamp: new Date().toLocaleTimeString(),
          date: new Date()
        }
        newHistory = [newChat]
      }
      
      setChatHistory(newHistory)
      saveChatToStorage(newHistory)
      setUploadedImages([])
    }
  }, [startNewChat])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim() && uploadedImages.length === 0) return

    // 사용자 메시지 추가 (이미지가 첨부된 경우 이미지 정보도 포함)
    let messageText = prompt
    if (uploadedImages.length > 0) {
      messageText += `\n\n[${uploadedImages.length} reference image(s) attached]`
    }
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: messageText,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date()
    }
    
    // 후속질문인지 확인 (이미 생성된 이미지가 있는 경우)
    const isFollowUpQuestion = generatedImages.length > 0 && currentChatId
    
    console.log('Follow-up question check:', {
      generatedImagesLength: generatedImages.length,
      currentChatId: currentChatId,
      isFollowUpQuestion: isFollowUpQuestion
    })
    
    if (isFollowUpQuestion) {
      console.log('Follow-up question detected, adding to existing chat')
      // 기존 채팅방에 메시지 추가
      const newHistory = [...chatHistory, userMessage]
      setChatHistory(newHistory)
      saveChatToStorage(newHistory)
    } else {
      console.log('New chat question, starting fresh conversation')
      // 새 채팅 시작
      const newHistory = [userMessage]
      setChatHistory(newHistory)
      saveChatToStorage(newHistory)
    }

    // 실제 AI 생성 함수 호출 (사용자 메시지는 이미 추가됨)
    generateWithAI(prompt, false) // false는 사용자 메시지 중복 추가 방지

    setPrompt('')
    setUploadedImages([])
  }

  // 파일을 base64로 변환하는 함수
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        // data:image/jpeg;base64, 부분을 제거하고 base64만 추출
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  // 파일 업로드 처리
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => ({
        id: Date.now() + Math.random(),
        file: file,
        name: file.name
      }))
      setUploadedImages(prev => [...prev, ...newImages])
    }
  }

  const removeImage = (imageId) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId)
      if (imageToRemove) {
        // File 객체는 자동으로 정리되므로 URL.revokeObjectURL은 필요 없음
        console.log('Removed image:', imageToRemove.name)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const creationOptions = [
    { icon: Camera, label: 'Create/modify an image or video' },
    { icon: Smile, label: 'Character performance' }
  ]

  return (
    <div className={`h-full flex theme-transition ${
      isDark ? 'bg-dark-bg' : 'bg-white'
    }`}>
      {/* Left Section - Chat Interface (리사이즈 가능한 너비) */}
      <div 
        className={`flex flex-col border-r theme-transition ${
          isDark ? 'border-dark-border' : 'border-slate-200'
        }`}
        style={{ width: `${leftPanelWidth}px` }}
      >
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h1 className={`text-xl font-bold theme-transition ${
              isDark ? 'text-dark-text' : 'text-slate-800'
            }`}>Afterwon 1.0</h1>
            <div className="flex items-center space-x-2">
              {/* 테스트 모드 토글 버튼 */}
              <button
                onClick={() => setShowTestMode(!showTestMode)}
                className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                  showTestMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🧪 Test Mode
              </button>
            </div>
          </div>

          {/* Chat History - 스크롤 가능한 영역 */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6 min-h-0">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-full px-4 py-3 rounded-2xl ${
                    chat.type === 'user'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                  style={{ maxWidth: `${leftPanelWidth - 64}px` }}
                >
                  {chat.isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{chat.message}</p>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-line">{chat.message}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* 테스트 모드 컴포넌트 */}
            {showTestMode && (
              <div className="mt-4">
                <ImageUploadTest />
              </div>
            )}
          </div>

          {/* Uploaded Images Display - 채팅창 위쪽에 표시 */}
          {uploadedImages.length > 0 && (
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-700">Reference Images</h4>
                <button
                  onClick={() => setUploadedImages([])}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={URL.createObjectURL(image.file)}
                      alt={image.name}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Selection Panel */}
          <div className="mb-4 flex-shrink-0">
            {/* Template Toggle Button */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowTemplatePanel(!showTemplatePanel)}
                className="flex items-center space-x-2 text-xs text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Template Options</span>
                {getSelectedOptionsCount() > 0 ? (
                  <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                    {getSelectedOptionsCount()}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">(Optional)</span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showTemplatePanel ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Clear All Button */}
              {getSelectedOptionsCount() > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedOptions({ type: '', style: '', size: '', extras: [] })}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Template Options Panel */}
            {showTemplatePanel && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                {/* Type Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-3 h-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">Type</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {typeOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect('type', option)}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          selectedOptions.type === option
                            ? 'bg-slate-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-3 h-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">Style</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {styleOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect('style', option)}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          selectedOptions.style === option
                            ? 'bg-slate-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Ruler className="w-3 h-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">Size</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sizeOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect('size', option)}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          selectedOptions.size === option
                            ? 'bg-slate-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra Options */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-3 h-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">Extra</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {extraOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect('extra', option)}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          (selectedOptions.extras || []).includes(option)
                            ? 'bg-slate-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Section - 하단에 고정 */}
          <div className="flex-shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <div
                className={`relative border border-slate-300 rounded-2xl p-4 transition-all duration-200 ${
                  isDragOver ? 'border-slate-500 bg-slate-50 ring-2 ring-slate-300' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragOver && (
                  <div className="absolute inset-0 bg-slate-100/80 rounded-2xl flex items-center justify-center z-10">
                    <div className="text-slate-600 text-sm font-medium">
                      Drop images here to upload
                    </div>
                  </div>
                )}
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your idea..."
                  className="w-full resize-none border-none outline-none bg-transparent text-slate-800 placeholder-slate-500 text-sm"
                  rows={3}
                />
                
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-4 bottom-4 text-slate-600 p-2 rounded-lg transition-all hover:text-slate-800"
                  title="Upload reference image"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!prompt.trim() && uploadedImages.length === 0}
                  className="absolute right-4 bottom-4 p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </form>
            
            <p className="text-xs text-slate-500 mt-2 text-center">
              Just describe your idea and generate!
            </p>
          </div>
        </div>
      </div>

      {/* Resizable Divider */}
      <div
        className="w-1 bg-slate-300 hover:bg-slate-500 cursor-col-resize transition-colors duration-200 relative group z-10"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          e.preventDefault()
          const touch = e.touches[0]
          setIsResizing(true)
          document.body.style.userSelect = 'none'
        }}
        onTouchMove={(e) => {
          if (!isResizing) return
          e.preventDefault()
          const touch = e.touches[0]
          const newWidth = touch.clientX
          const minWidth = 200
          const maxWidth = window.innerWidth * 0.8
          
          if (newWidth >= minWidth && newWidth <= maxWidth) {
            setLeftPanelWidth(newWidth)
          }
        }}
        onTouchEnd={() => {
          setIsResizing(false)
          document.body.style.userSelect = ''
        }}
        title="드래그하여 채팅창 크기 조절"
        style={{ 
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#64748b' : '#cbd5e1'
        }}
      >
        {/* 드래그 핸들 시각적 표시 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-1 h-16 bg-slate-500 rounded-full"></div>
        </div>
        
        {/* 확장된 드래그 영역 (투명하지만 드래그 가능) */}
        <div 
          className="absolute inset-0 w-12 -left-6 cursor-col-resize"
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* Right Section - AI Generated Content & Code */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* Header with Segment Control */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            {/* Segment Control */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => handleSegmentChange('image')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSegment === 'image'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Image
              </button>
              <button
                onClick={() => handleSegmentChange('code')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSegment === 'code'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Code
              </button>
            </div>
          </div>

          {/* Content Area - Image or Code based on activeSegment */}
          <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden">
            {activeSegment === 'image' ? (
              /* Image Content */
              <div className="h-full bg-slate-50 p-6">
                {isGenerating ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-600 mx-auto mb-4"></div>
                      <p className="text-lg mb-2">Generating your image...</p>
                      <p className="text-sm">Please wait while AI creates your masterpiece</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Generated Images</h3>
                      <p className="text-sm text-slate-600">All your AI-generated images in one place</p>
                    </div>
                    
                    {/* Image Card Stack */}
                    <div className="flex-1 overflow-y-auto">
                      <ImageCardStack
                        generatedImages={generatedImages}
                        onImageClick={(image) => {
                          // 이미지 클릭 시 처리 (필요시 추가 로직)
                          console.log('Image clicked:', image);
                        }}
                        onRegenerate={(image) => {
                          // 이미지 재생성 처리
                          handleRegenerateFromImage(image);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Code Content */
              <div className="h-full bg-slate-900 p-6">
                {isGenerating ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-slate-400 mx-auto mb-4"></div>
                      <p className="text-lg mb-2">Generating your code...</p>
                      <p className="text-sm">Please wait while AI writes your code</p>
                    </div>
                  </div>
                ) : generationResult ? (
                  <div className="h-full flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-300 mb-2">Generated Code</h3>
                      <p className="text-sm text-slate-400">"{generationResult.meta.description}"</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex bg-slate-800 rounded-lg p-1">
                          {(['svg', 'react', 'html', 'dataUrl']).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveCodeTab(tab)}
                              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                activeCodeTab === tab
                                  ? 'bg-slate-600 text-white'
                                  : 'text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              {tab === 'svg' ? 'SVG' : tab === 'react' ? 'React' : tab === 'html' ? 'HTML' : 'DataURL'}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => copyCode(generationResult.code[activeCodeTab])}
                          className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                          title="Copy code"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        ✅ Synced with preview (checksum: {generationResult.meta.checksum.substring(0, 8)}...)
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-lg p-4 overflow-x-auto overflow-y-auto">
                      <pre className="text-sm text-slate-300 font-mono whitespace-pre">
                        <code>{generationResult.code[activeCodeTab]}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <p className="text-lg mb-2">Generated code will appear here</p>
                      <p className="text-sm">View React, HTML, CSS, and other code snippets</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )



  // 기존 이미지를 바탕으로 재생성하는 함수
  const handleRegenerateFromImage = (image) => {
    // 기존 이미지 정보를 프롬프트에 추가하여 재생성 요청
    const regenerationPrompt = `Please modify this image: "${image.prompt}". The current image is not quite what I wanted. Please make it better based on the same description.`
    
    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: regenerationPrompt,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date()
    }
    
    const newHistory = [...chatHistory, userMessage]
    setChatHistory(newHistory)
    saveChatToStorage(newHistory)
    
    // AI 재생성 시작
    generateWithAI(regenerationPrompt)
  }

  // 코드 복사 함수
  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    })
  }
}

export default CreationPage 