import { useState, useEffect, useRef } from 'react'
import { 
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  FolderOpen,
  Globe,
  Plus,
  Clock,
  PanelLeft,
  LogOut,
  Image as ImageIcon
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { getUserGenerations } from '../utils/firestore'

const CreationSidebar = ({ isCollapsed, setIsCollapsed, currentPage, setCurrentPage, startNewChat, onLoadChatHistory, refreshTrigger }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [generations, setGenerations] = useState([])
  const [loadingGenerations, setLoadingGenerations] = useState(false)
  const [selectedGenerationId, setSelectedGenerationId] = useState(null) // 선택된 채팅 이력 ID
  const profileDropdownRef = useRef(null)
  const { currentUser } = useAuth()
  
  // 프로필 드롭다운 밖 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !profileDropdownRef.current?.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  // 사용자 이름의 이니셜 생성
  const getUserInitials = (displayName) => {
    if (!displayName) return 'U'
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // 랜덤 배경색 생성 (사용자 ID 기반으로 일관된 색상)
  const getRandomColor = (uid) => {
    if (!uid) return 'bg-slate-600'
    
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
    ]
    
    // UID를 기반으로 일관된 색상 선택
    const hash = uid.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  const profileDropdownItems = [
    { icon: Clock, label: 'Plans and Billing' },
    { icon: Plus, label: 'Invite members' },
    { icon: Globe, label: 'Upgrade your plan' },
    { icon: ChevronLeft, label: 'Switch Workspace' }
  ]

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setCurrentPage('landing')
      localStorage.setItem('currentPage', 'landing')
    } catch (error) {
      console.error('로그아웃 에러:', error)
    }
  }

  const menuItems = [
    { icon: Grid3X3, label: 'Go to Dashboard', page: 'home' },
    { icon: FolderOpen, label: 'Open Assets', page: 'assets' },
    { icon: Globe, label: 'Discover Workflows', page: 'workflows' },
    { icon: Plus, label: 'New Chat', page: 'creation', action: 'newChat' }
  ]

  // 새 채팅 시작 시 기존 채팅을 보존
  const handleNewChat = () => {
    // 선택된 생성 이력 초기화
    setSelectedGenerationId(null)
    
    if (startNewChat) {
      startNewChat()
    }
  }

  // Firestore에서 생성 이력 불러오기
  const loadGenerations = async () => {
    if (!currentUser) return
    
    setLoadingGenerations(true)
    try {
      const userGenerations = await getUserGenerations(currentUser.uid)
      setGenerations(userGenerations)
    } catch (error) {
      console.error('Failed to load generations:', error)
    } finally {
      setLoadingGenerations(false)
    }
  }

  // 생성 이력 클릭 시 채팅 이력 로드
  const handleGenerationClick = (generation) => {
    console.log('Generation clicked:', generation)
    console.log('Generation chatHistory:', generation.chatHistory)
    console.log('Generation prompt:', generation.prompt)
    console.log('Generation result:', generation.result)
    
    // 선택된 생성 이력 ID 설정
    setSelectedGenerationId(generation.id)
    
    // window 객체를 통해 CreationPage의 함수 직접 호출
    if (window.loadChatHistoryFromSidebar) {
      const chatHistory = generation.chatHistory || []
      const prompt = generation.prompt || ''
      const result = generation.result || null
      
      console.log('Calling loadChatHistoryFromSidebar with:', {
        chatHistory: chatHistory,
        prompt: prompt,
        result: result
      })
      
      window.loadChatHistoryFromSidebar(chatHistory, prompt, result)
    } else {
      console.log('loadChatHistoryFromSidebar is not available')
    }
  }

  // 컴포넌트 마운트 시 및 refreshTrigger 변경 시 생성 이력 불러오기
  useEffect(() => {
    loadGenerations()
  }, [currentUser, refreshTrigger])

  // 생성 이력을 날짜별로 그룹핑
  const groupGenerationsByDate = (generations) => {
    if (!generations || generations.length === 0) return []
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const grouped = {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: []
    }
    
    generations.forEach(generation => {
      if (!generation.createdAt) return
      
      const createdAt = generation.createdAt.toDate ? generation.createdAt.toDate() : new Date(generation.createdAt)
      const createdDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
      
      if (createdDate.getTime() === today.getTime()) {
        grouped.today.push(generation)
      } else if (createdDate.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(generation)
      } else if (createdDate >= lastWeek) {
        grouped.lastWeek.push(generation)
      } else {
        grouped.older.push(generation)
      }
    })
    
    const result = []
    
    if (grouped.today.length > 0) {
      result.push({
        period: 'TODAY',
        items: grouped.today.slice(0, 5)
      })
    }
    
    if (grouped.yesterday.length > 0) {
      result.push({
        period: 'YESTERDAY',
        items: grouped.yesterday.slice(0, 5)
      })
    }
    
    if (grouped.lastWeek.length > 0) {
      result.push({
        period: 'LAST 7 DAYS',
        items: grouped.lastWeek.slice(0, 5)
      })
    }
    
    if (grouped.older.length > 0) {
      result.push({
        period: 'OLDER',
        items: grouped.older.slice(0, 3)
      })
    }
    
    return result
  }



  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-100 border-r border-slate-300 h-screen p-4 flex flex-col transition-all duration-300 absolute left-0 top-0 z-10`}>
      {/* Sidebar Collapse/Expand Button - Top Center */}
      <div className={`${isCollapsed ? 'flex justify-center' : 'flex justify-start'} mb-6`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <PanelLeft className={`w-5 h-5 text-slate-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Menu */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              <a
                href="#"
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                  currentPage === item.page
                    ? 'bg-slate-200 text-slate-800'
                    : 'text-slate-700 hover:text-slate-800 hover:bg-slate-200'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.action === 'newChat') {
                    handleNewChat();
                  } else {
                    setCurrentPage(item.page);
                  }
                }}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>

        {/* Generation History */}
        {!isCollapsed && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 whitespace-nowrap">
              Generation History
            </h3>
            {loadingGenerations ? (
              <div className="text-xs text-slate-500 text-center py-2">Loading...</div>
            ) : generations.length > 0 ? (
              <div className="space-y-4">
                {groupGenerationsByDate(generations).map((period) => (
                  <div key={period.period} className="space-y-2">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {period.period}
                    </h4>
                    <ul className="space-y-1">
                      {period.items.map((generation) => (
                        <li key={generation.id}>
                          <button
                            onClick={() => handleGenerationClick(generation)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 text-left ${
                              selectedGenerationId === generation.id
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'text-slate-700 hover:text-slate-800 hover:bg-slate-200'
                            }`}
                            title={generation.prompt}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-700 truncate">
                                {generation.prompt || 'Untitled'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {generation.options?.style} • {generation.options?.size}
                              </div>
                            </div>
                            {/* 생성된 이미지 썸네일로 ImageIcon 대체 */}
                            {generation.result?.asset?.storageImageUrl ? (
                              <img 
                                src={generation.result.asset.storageImageUrl}
                                alt="Generated preview"
                                className={`w-8 h-8 rounded object-cover flex-shrink-0 ${
                                  selectedGenerationId === generation.id
                                    ? 'ring-2 ring-blue-300'
                                    : ''
                                }`}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-slate-200 flex-shrink-0 flex items-center justify-center">
                                <span className="text-xs text-slate-500">?</span>
                              </div>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2">No generations yet</div>
            )}
          </div>
        )}

        {/* Recent Activity - 제거됨 (Firestore 기반으로 대체) */}
      </nav>

      {/* User Profile Section - Bottom */}
      <div className="mt-auto">
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg hover:bg-slate-200 transition-colors group`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getRandomColor(currentUser?.uid)}`}>
                {getUserInitials(currentUser?.displayName)}
              </div>
              {!isCollapsed && (
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                    {currentUser?.displayName || 'Guest'}
                  </div>
                  <div className="text-xs text-slate-600 group-hover:text-slate-700 transition-colors whitespace-nowrap">
                    {currentUser?.email || 'No email'}
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && !isCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-300 rounded-xl shadow-lg z-50" ref={profileDropdownRef}>
              <div className="p-2">
                {profileDropdownItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700 hover:text-slate-900"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700 hover:text-slate-900"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreationSidebar 