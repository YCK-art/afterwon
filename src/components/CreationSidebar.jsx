import { useState, useEffect, useRef } from 'react'
import { 
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  FolderOpen,
  Globe,
  Plus,
  Clock,
  FileText,
  PanelLeft,
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const CreationSidebar = ({ isCollapsed, setIsCollapsed, currentPage, setCurrentPage, startNewChat }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
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

  // localStorage에서 채팅 이력을 읽어와서 recentActivity 생성
  const generateRecentActivity = () => {
    try {
      const saved = localStorage.getItem('creationChatHistory')
      if (!saved) return []
      
      const chatHistory = JSON.parse(saved)
      if (!Array.isArray(chatHistory) || chatHistory.length === 0) return []
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const todayChats = chatHistory.filter(chat => new Date(chat.date) >= today)
      const lastWeekChats = chatHistory.filter(chat => {
        const chatDate = new Date(chat.date)
        return chatDate >= lastWeek && chatDate < today
      })
      
      const activity = []
      
      if (todayChats.length > 0) {
        activity.push({
          period: 'Today',
          items: todayChats.slice(0, 3).map(chat => ({
            icon: FileText,
            title: chat.message.substring(0, 30) + (chat.message.length > 30 ? '...' : ''),
            count: chat.type === 'user' ? 1 : null
          }))
        })
      }
      
      if (lastWeekChats.length > 0) {
        activity.push({
          period: 'Last 7 Days',
          items: lastWeekChats.slice(0, 3).map(chat => ({
            icon: FileText,
            title: chat.message.substring(0, 30) + (chat.message.length > 30 ? '...' : ''),
            count: chat.type === 'user' ? 1 : null
          }))
        })
      }
      
      return activity
    } catch (e) {
      console.error('Failed to generate recent activity:', e)
      return []
    }
  }

  const recentActivity = generateRecentActivity()

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
                  if (item.action === 'newChat' && startNewChat) {
                    startNewChat();
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

        {/* Recent Activity */}
        {!isCollapsed && (
          <div className="mt-8">
            {recentActivity.map((period, periodIndex) => (
              <div key={periodIndex} className="mb-6">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 whitespace-nowrap">
                  {period.period}
                </h3>
                <ul className="space-y-1">
                  {period.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <a
                        href="#"
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-800 hover:bg-slate-200 transition-all duration-300"
                        title={item.title}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-700 truncate">{item.title}</div>
                          {item.count !== null && (
                            <div className="text-xs text-slate-500">{item.count}</div>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
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