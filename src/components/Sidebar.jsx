import { useState, useEffect, useRef } from 'react'
import { 
  Home, 
  Heart, 
  Image, 
  Users, 
  Settings, 
  Palette,
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
  FileText,
  ChevronDown,
  CreditCard,
  UserPlus,
  TrendingUp,
  ArrowLeftRight,
  PanelLeft,
  User,
  Building2,
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const Sidebar = ({ isCollapsed, setIsCollapsed, currentPage, setCurrentPage }) => {
  const { isDark } = useTheme()
  const [activeDropdown, setActiveDropdown] = useState(null)
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

  // 로그아웃 처리
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
    { icon: Home, label: 'Home', page: 'home' },
    { icon: Image, label: 'Creation', page: 'creation' },
    { icon: Palette, label: 'Session', page: 'session' },
    { icon: Settings, label: 'Settings', page: 'settings' }
  ]

  const assetItems = [
    { icon: Image, label: 'Private' },
    { icon: Users, label: 'Shared' },
    { icon: Heart, label: 'Favorited' }
  ]

  const createItems = [
    { icon: Plus, label: 'Start a session' },
    { icon: Image, label: 'Generate Image' },
    { icon: Palette, label: 'All Tools' }
  ]

  const profileDropdownItems = [
    { icon: Settings, label: 'Settings' },
    { icon: User, label: 'Profile' },
    { icon: Building2, label: 'Switch Workspace' },
    { icon: LogOut, label: 'Log out' }
  ]

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} border-r h-screen p-4 flex flex-col transition-all duration-300 absolute left-0 top-0 z-10 theme-transition ${
      isDark 
        ? 'bg-dark-surface border-dark-border' 
        : 'bg-slate-100 border-slate-300'
    }`}>
      {/* Sidebar Collapse/Expand Button - Top Center */}
      <div className={`${isCollapsed ? 'flex justify-center' : 'flex justify-start'} mb-6`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <PanelLeft className={`w-5 h-5 text-slate-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* User Profile Section */}
      <div className="mb-6">
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} p-3 rounded-lg hover:bg-slate-200 transition-colors group`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium group-hover:opacity-80 transition-all ${getRandomColor(currentUser?.uid)}`}>
                {getUserInitials(currentUser?.displayName)}
              </div>
              {!isCollapsed && (
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                    {currentUser?.displayName || 'Guest'}
                  </div>
                  <div className="text-xs text-slate-600 group-hover:text-slate-700 transition-colors whitespace-nowrap">
                    {currentUser?.email || 'Personal - Free'}
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && !isCollapsed && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-xl shadow-lg z-20" ref={profileDropdownRef}>
              <div className="p-2">
                {profileDropdownItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (item.label === 'Log out') {
                        handleLogout()
                      } else if (item.label === 'Settings') {
                        setCurrentPage('settings')
                      }
                      setIsProfileDropdownOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700 hover:text-slate-900"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
                  setCurrentPage(item.page);
                }}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>

        {/* ASSETS Section */}
        {!isCollapsed && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 whitespace-nowrap" style={{ fontFamily: 'ProductSans, sans-serif' }}>
              ASSETS
            </h3>
            <ul className="space-y-1">
              {assetItems.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-800 hover:bg-slate-200 transition-all duration-300"
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap" style={{ fontFamily: 'ProductSans, sans-serif' }}>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CREATE Section */}
        {!isCollapsed && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 whitespace-nowrap" style={{ fontFamily: 'ProductSans, sans-serif' }}>
              CREATE
            </h3>
            <ul className="space-y-1">
              {createItems.map((item) => (
                <li key={item.label}>
                  <a
                    href="#"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-800 hover:bg-slate-200 transition-all duration-300"
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap" style={{ fontFamily: 'ProductSans, sans-serif' }}>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer Links */}
      {!isCollapsed && (
        <div className="mt-auto space-y-2">
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-all duration-300"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap" style={{ fontFamily: 'ProductSans, sans-serif' }}>Help Center</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-all duration-300"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap" style={{ fontFamily: 'ProductSans, sans-serif' }}>Privacy Policy</span>
          </a>
        </div>
      )}
    </div>
  )
}

export default Sidebar 