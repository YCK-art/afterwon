import { useState, useEffect, useRef } from 'react'
import { Camera, Smile, Plus, ChevronDown, ArrowUp, X, Image as ImageIcon } from 'lucide-react'

const CreationPage = ({ startNewChat }) => {
  const [prompt, setPrompt] = useState('')
  const [uploadedImages, setUploadedImages] = useState([])
  const [activeSegment, setActiveSegment] = useState('image') // 'image' 또는 'code'
  const [leftPanelWidth, setLeftPanelWidth] = useState(320) // 기본 너비 320px (w-80)
  const [isResizing, setIsResizing] = useState(false)
  
  // localStorage에서 채팅 이력 불러오기
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('creationChatHistory')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map(chat => ({
          ...chat,
          date: new Date(chat.date)
        }))
      } catch (e) {
        console.error('Failed to parse saved chat history:', e)
      }
    }
    return [{
      id: 1,
      type: 'assistant',
      message: "Hello! I'm Afterwon 1.0, your creative AI assistant specializing in visual content creation. I can help you create stunning images, videos, and bring your creative ideas to life. What would you like to create today? Feel free to describe your vision or ask for suggestions to get started.",
      timestamp: new Date().toLocaleTimeString(),
      date: new Date()
    }]
  })
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

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

  // 채팅 이력을 localStorage에 저장
  const saveChatHistory = (history) => {
    localStorage.setItem('creationChatHistory', JSON.stringify(history))
  }

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
      const newChat = {
        id: Date.now(),
        type: 'assistant',
        message: "Hello! I'm Afterwon 1.0, your creative AI assistant specializing in visual content creation. I can help you create stunning images, videos, and bring your creative ideas to life. What would you like to create today? Feel free to describe your vision or ask for suggestions to get started.",
        timestamp: new Date().toLocaleTimeString(),
        date: new Date()
      }
      const newHistory = [newChat]
      setChatHistory(newHistory)
      saveChatHistory(newHistory)
      setPrompt('')
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
    saveChatHistory(newHistory)

    // AI 응답 시뮬레이션 (실제로는 AI API 호출)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        message: `I understand you want to create: "${prompt}". Let me help you with that!`,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date()
      }
      const updatedHistory = [...newHistory, aiResponse]
      setChatHistory(updatedHistory)
      saveChatHistory(updatedHistory)
    }, 1000)

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
                  <p className="text-sm leading-relaxed whitespace-pre-line">{chat.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Uploaded Images Display - 채팅창 위쪽에 표시 */}
          {uploadedImages.length > 0 && (
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex-shrink-0">
              <div className="text-xs text-slate-600 mb-2 font-medium">Attached Images:</div>
              <div className="flex flex-wrap gap-2">
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative inline-flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-600 mr-1" />
                    <span className="text-xs text-slate-700">
                      {image.name.length > 6 ? image.name.substring(0, 6) + '...' : image.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImages(prev => prev.filter(img => img.id !== image.id))
                      }}
                      className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              Chat Mode can make mistakes. Double check responses.
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
                onClick={() => setActiveSegment('image')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSegment === 'image'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Image
              </button>
              <button
                onClick={() => setActiveSegment('code')}
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
              <div className="h-full bg-slate-50 p-6 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <p className="text-lg mb-2">AI-generated images and videos will appear here</p>
                  <p className="text-sm">Request in chat to see your results</p>
                </div>
              </div>
            ) : (
              /* Code Content */
              <div className="h-full bg-slate-900 p-6 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <p className="text-lg mb-2">Generated code will appear here</p>
                  <p className="text-sm">View React, HTML, CSS, and other code snippets</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreationPage 