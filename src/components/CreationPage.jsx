import { useState, useEffect, useRef } from 'react'
import { Camera, Smile, Plus, ChevronDown, ArrowUp, X, Image as ImageIcon, Palette, Ruler, Settings, Sparkles, Download, Copy, Check } from 'lucide-react'
import { generateAsset } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { saveGenerationHistory } from '../utils/firestore'
import { uploadImageToStorage } from '../utils/storage'

const CreationPage = ({ startNewChat, onRefreshSidebar, onLoadChatHistory }) => {
  const { currentUser } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [uploadedImages, setUploadedImages] = useState([])
  const [activeSegment, setActiveSegment] = useState('image') // 'image' 또는 'code'
  const [leftPanelWidth, setLeftPanelWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  

  
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
  const [generatedImages, setGeneratedImages] = useState([]) // 생성된 모든 이미지 저장
  const [activeCodeTab, setActiveCodeTab] = useState('svg')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false) // 다운로드 드롭다운 표시 상태

  // 템플릿 옵션들
  const typeOptions = ['Icon', 'Emoji', 'Illustration', 'Logo', 'Character']
  const styleOptions = ['Liquid Glass', 'Neon Glow', 'Pixel Art', 'Skeuomorphism', '3D', 'Flat', 'Gradient', 'Minimalist']
  const sizeOptions = ['512px', '1024px'] // DALL-E 3 지원 크기로 제한
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

  // 생성된 이미지를 히스토리에 추가하는 함수
  const addGeneratedImage = (imageData) => {
    const newImage = {
      id: Date.now(),
      ...imageData,
      timestamp: new Date()
    }
    setGeneratedImages(prev => [...prev, newImage])
    
    // localStorage에도 저장
    try {
      const savedImages = JSON.parse(localStorage.getItem('generatedImages') || '[]')
      savedImages.push(newImage)
      localStorage.setItem('generatedImages', JSON.stringify(savedImages))
    } catch (error) {
      console.error('Failed to save generated images:', error)
    }
  }

  // localStorage에서 생성된 이미지들을 로드하는 함수
  const loadGeneratedImages = () => {
    try {
      const savedImages = localStorage.getItem('generatedImages')
      if (savedImages) {
        const images = JSON.parse(savedImages)
        setGeneratedImages(images)
      }
    } catch (error) {
      console.error('Failed to load generated images:', error)
    }
  }

  // 새 채팅 시작 함수
  const handleNewChat = () => {
    // 기존 채팅 내용을 보존하고 새로운 채팅 시작
    const newChatHistory = [
      {
        id: Date.now(),
        type: 'assistant',
        message: '👋 Hello! I\'m ready to help you create amazing designs. What would you like to make today?',
        timestamp: new Date().toLocaleTimeString(),
        date: new Date()
      }
    ]
    setChatHistory(newChatHistory)
    setPrompt('')
    setGenerationResult(null)
    saveChatToStorage(newChatHistory)
  }

  // 채팅 이력 로드 함수 (사이드바에서 호출)
  const loadChatHistory = (history, promptText, generationResult) => {
    console.log('Loading chat history:', { history, promptText, generationResult })
    
    // history가 유효한지 확인하고 안전하게 설정
    let validHistory = []
    
    if (history && Array.isArray(history) && history.length > 0) {
      // Firestore에서 로드된 데이터가 유효한지 확인
      validHistory = history.map(msg => ({
        id: msg.id || Date.now() + Math.random(),
        type: msg.type || 'assistant',
        message: msg.message || '',
        timestamp: msg.timestamp || new Date().toLocaleTimeString(),
        date: msg.date ? (msg.date.toDate ? msg.date.toDate() : new Date(msg.date)) : new Date()
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
    
    // 프롬프트 설정
    if (promptText) {
      setPrompt(promptText)
    }
    
    // 생성 결과도 복원
    if (generationResult) {
      setGenerationResult(generationResult)
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

  // 다운로드 함수를 상단으로 이동
  const downloadDalleImage = async (imageUrl, format = 'png') => {
    if (!imageUrl) {
      console.error('No image URL provided for download')
      return
    }

    try {
      // CORS 문제를 해결하기 위해 서버를 통해 이미지 다운로드
      const downloadResponse = await fetch('/api/download-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          format: format
        })
      })

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`)
      }

      const blob = await downloadResponse.blob()
      
      // 파일명 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `ai-generated-image-${timestamp}.${format}`
      
      // 다운로드 링크 생성
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log(`Image downloaded successfully as ${filename}`)
    } catch (error) {
      console.error('Download failed:', error)
      
      // 서버 다운로드가 실패하면 직접 다운로드 시도 (CORS 우회)
      try {
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
            a.download = `ai-generated-image-${Date.now()}.${format}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, `image/${format}`, 0.9)
        }
        
        img.onerror = () => {
          console.error('Failed to load image for direct download')
          alert('다운로드에 실패했습니다. 이미지 URL에 직접 접근할 수 없습니다.')
        }
        
        img.src = imageUrl
      } catch (directError) {
        console.error('Direct download also failed:', directError)
        alert('다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    }
  }

  // AI 생성 함수 (실제 API 호출)
  const generateWithAI = async (prompt) => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    // 로딩 메시지 추가
    const loadingMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      message: "Generating your components...",
      timestamp: new Date().toLocaleTimeString(),
      date: new Date(),
      isLoading: true
    }
    
    setChatHistory(prev => [...prev, loadingMessage])
    
    try {
      // 백엔드 형식에 맞게 데이터 변환
      const request = {
        type: selectedOptions.type || 'Icon', // 기본값: Icon
        style: selectedOptions.style ? selectedOptions.style.replace(/\s+/g, '') : 'Flat', // 공백 제거, 기본값: Flat
        size: selectedOptions.size ? selectedOptions.size.replace('px', '') : '1024', // px 제거, 기본값: 1024 (DALL-E 3 최적)
        extras: selectedOptions.extras || [],
        description: prompt
      }
      
      console.log('Sending request:', request) // 디버깅용
      
      const result = await generateAsset(request)
      setGenerationResult(result)
      
      // 생성된 이미지를 히스토리에 추가
      if (result.asset.dalleImage) {
        addGeneratedImage({
          imageUrl: result.asset.dalleImage,
          prompt: prompt,
          options: selectedOptions,
          timestamp: new Date()
        })
      }
      
      // Firestore에 생성 이력 저장
      if (currentUser) {
        try {
          // DALL-E 이미지를 Firebase Storage에 저장
          let storageImageUrl = null
          if (result.asset.dalleImage) {
            try {
              console.log('Starting Firebase Storage upload for:', result.asset.dalleImage)
              storageImageUrl = await uploadImageToStorage(
                result.asset.dalleImage, 
                currentUser.uid, 
                Date.now().toString()
              )
              console.log('✅ Image uploaded to Firebase Storage:', storageImageUrl)
            } catch (uploadError) {
              console.error('❌ Failed to upload image to storage:', uploadError)
              // 업로드 실패 시 DALL-E 원본 URL 사용
              storageImageUrl = result.asset.dalleImage
              console.log('Using DALL-E original URL as fallback:', storageImageUrl)
            }
          } else {
            console.log('No DALL-E image found in result:', result.asset)
          }
          
          // 완전한 채팅 히스토리 구성 (사용자 프롬프트 + AI 응답 포함)
          const completeChatHistory = [
            ...chatHistory.filter(msg => !msg.isLoading), // 로딩 메시지 제거
            {
              id: Date.now() + 1,
              type: 'user',
              message: prompt,
              timestamp: new Date().toLocaleTimeString(),
              date: new Date()
            },
            {
              id: Date.now() + 2,
              type: 'assistant',
              message: `✅ 생성 완료! "${prompt}"에 대한 이미지를 생성했습니다. 오른쪽 패널에서 결과를 확인하세요.`,
              timestamp: new Date().toLocaleTimeString(),
              date: new Date()
            }
          ]
          
          const generationData = {
            prompt: prompt,
            options: {
              type: selectedOptions.type,
              style: selectedOptions.style,
              size: selectedOptions.size,
              extras: selectedOptions.extras
            },
            result: {
              ...result,
              asset: {
                ...result.asset,
                storageImageUrl: storageImageUrl // Storage URL 추가
              }
            },
            chatHistory: completeChatHistory,
            createdAt: new Date()
          }
          
          const generationId = await saveGenerationHistory(currentUser.uid, generationData)
          console.log('Generation history saved to Firestore with ID:', generationId)
          
          // 사이드바 새로고침
          if (onRefreshSidebar) {
            onRefreshSidebar()
          }
        } catch (error) {
          console.error('Failed to save generation history:', error)
        }
      }
      
      // 로딩 메시지 제거하고 생성 완료 메시지 추가 (기존 히스토리 유지)
      setChatHistory(prev => {
        const filteredHistory = prev.filter(msg => !msg.isLoading)
        const updatedHistory = [...filteredHistory, {
          id: Date.now() + 2,
          type: 'assistant',
          message: `✅ 생성 완료! "${prompt}"에 대한 이미지를 생성했습니다. 오른쪽 패널에서 결과를 확인하세요.`,
          timestamp: new Date().toLocaleTimeString(),
          date: new Date()
        }]
        // localStorage에 저장
        saveChatToStorage(updatedHistory)
        return updatedHistory
      })
      
    } catch (error) {
      console.error('Generation failed:', error)
      
      // 에러 메시지 추가
      const errorMessage = {
        id: Date.now() + 2,
        type: 'assistant',
        message: `❌ 생성 실패: ${error.message || '알 수 없는 오류'}. 다시 시도해주세요.`,
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
      
      // 에러가 발생했을 때도 Firestore에 저장 (실패 이력 보존)
      if (currentUser) {
        try {
          const errorGenerationData = {
            prompt: prompt,
            options: {
              type: selectedOptions.type,
              style: selectedOptions.style,
              size: selectedOptions.size,
              extras: selectedOptions.extras
            },
            result: {
              error: error.message || 'Unknown error',
              status: 'failed'
            },
            chatHistory: [
              ...chatHistory.filter(msg => !msg.isLoading),
              {
                id: Date.now() + 1,
                type: 'user',
                message: prompt,
                timestamp: new Date().toLocaleTimeString(),
                date: new Date()
              },
              errorMessage
            ],
            createdAt: new Date()
          }
          
          await saveGenerationHistory(currentUser.uid, errorGenerationData)
          console.log('Error generation history saved to Firestore')
          
          // 사이드바 새로고침
          if (onRefreshSidebar) {
            onRefreshSidebar()
          }
        } catch (saveError) {
          console.error('Failed to save error generation history:', saveError)
        }
      }
    } finally {
      setIsGenerating(false)
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
    try {
      const tempData = localStorage.getItem('tempChatHistory')
      if (tempData) {
        const { history, prompt: promptText, generationResult } = JSON.parse(tempData)
        if (history && Array.isArray(history)) {
          setChatHistory(history)
          if (promptText) {
            setPrompt(promptText)
          }
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
    
    // 생성된 이미지들도 로드
    loadGeneratedImages()
  }, [])

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
    // leftPanelWidth는 변경하지 않음 - 현재 사용자 설정 유지
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

    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: prompt,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date()
    }
    const newHistory = [...chatHistory, userMessage]
    setChatHistory(newHistory)
    saveChatToStorage(newHistory)

    // 실제 AI 생성 함수 호출
    generateWithAI(prompt)

    setPrompt('')
    setUploadedImages([])
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
        URL.revokeObjectURL(imageToRemove.url)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const creationOptions = [
    { icon: Camera, label: 'Create/modify an image or video' },
    { icon: Smile, label: 'Character performance' }
  ]

  return (
    <div className="h-full flex bg-white">
      {/* Left Section - Chat Interface (리사이즈 가능한 너비) */}
      <div 
        className="flex flex-col border-r border-slate-200"
        style={{ width: `${leftPanelWidth}px` }}
      >
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h1 className="text-xl font-bold text-slate-800">Afterwon 1.0</h1>
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
          </div>

          {/* Uploaded Images Display - 채팅창 위쪽에 표시 */}


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
        className="w-0.5 bg-slate-200 hover:bg-slate-400 cursor-col-resize transition-colors duration-200 relative group"
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
          cursor: isResizing ? 'col-resize' : 'col-resize',
          backgroundColor: isResizing ? '#94a3b8' : '#e2e8f0'
        }}
      >
        {/* 드래그 핸들 시각적 표시 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-0.5 h-12 bg-slate-400 rounded-full"></div>
        </div>
        
        {/* 확장된 드래그 영역 (투명하지만 드래그 가능) */}
        <div 
          className="absolute inset-0 w-8 -left-4 cursor-col-resize"
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
                ) : generationResult ? (
                  <div className="h-full flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Generated Image</h3>
                        <p className="text-sm text-slate-600">"{generationResult.meta.description}"</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {generationResult.meta.type} • {generationResult.meta.style} • {generationResult.meta.size}px
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <div className="relative download-dropdown">
                          <button
                            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                            className="p-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg hover:shadow-xl"
                            title="Download Image"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          
                          {/* 다운로드 드롭다운 메뉴 */}
                          {showDownloadDropdown && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-32">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    downloadDalleImage(generationResult.asset.storageImageUrl || generationResult.asset.dalleImage, 'png')
                                    setShowDownloadDropdown(false)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
                                >
                                  <span>PNG</span>
                                  <span className="text-xs text-slate-500">(Original)</span>
                                </button>
                                <button
                                  onClick={() => {
                                    downloadDalleImage(generationResult.asset.storageImageUrl || generationResult.asset.dalleImage, 'jpg')
                                    setShowDownloadDropdown(false)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
                                >
                                  <span>JPG</span>
                                  <span className="text-xs text-slate-500">(Compressed)</span>
                                </button>
                                <button
                                  onClick={() => {
                                    downloadDalleImage(generationResult.asset.storageImageUrl || generationResult.asset.dalleImage, 'webp')
                                    setShowDownloadDropdown(false)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
                                >
                                  <span>WebP</span>
                                  <span className="text-xs text-slate-500">(Modern)</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col bg-checkerboard rounded-lg overflow-hidden">
                      {/* 현재 생성된 이미지 표시 */}
                      {(generationResult.asset.storageImageUrl || generationResult.asset.dalleImage) && (
                        <div className="flex-1 flex items-center justify-center p-4">
                          <img 
                            src={generationResult.asset.storageImageUrl || generationResult.asset.dalleImage}
                            alt="AI Generated Image"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                          />
                        </div>
                      )}
                      

                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <p className="text-lg mb-2">AI-generated images and videos will appear here</p>
                      <p className="text-sm">Request in chat to see your results</p>
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
                    <div className="flex-1 bg-slate-800 rounded-lg p-4 overflow-auto">
                      <pre className="text-sm text-slate-300 font-mono">
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