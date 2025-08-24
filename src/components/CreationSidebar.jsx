import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  Grid3X3,
  FolderOpen,
  Globe,
  Plus,
  Clock,
  PanelLeft,
  LogOut,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

// ✅ 실시간 구독으로 교체
import { subscribeToGenerationUpdates } from '../utils/firestore'

/**
 * Props
 * - projectName (선택): Firestore 필터에 사용, 기본 'iconic'
 * - onOpenGeneration: (generationId: string) => void
 *   → CreationPage가 이 콜백을 받아서 해당 generationId의 messages를 subscribeToMessages로 표시하도록 하세요.
 *   (기존 window.loadChatHistoryFromSidebar 브릿지는 유지용으로 남겨둠)
 */
const CreationSidebar = ({
  isCollapsed,
  setIsCollapsed,
  currentPage,
  setCurrentPage,
  startNewChat,
  refreshTrigger,
  projectName = 'iconic'
}) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [generations, setGenerations] = useState([])
  const [loadingGenerations, setLoadingGenerations] = useState(true)
  const [selectedGenerationId, setSelectedGenerationId] = useState(null)
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileDropdownOpen])

  const getUserInitials = (displayName) => {
    if (!displayName) return 'U'
    return displayName
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRandomColor = (uid) => {
    if (!uid) return 'bg-slate-600'
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
    ]
    const hash = uid.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  const menuItems = [
    { icon: Grid3X3, label: 'Go to Dashboard', page: 'home' },
    { icon: FolderOpen, label: 'Open Assets', page: 'assets' },
    { icon: Globe, label: 'Discover Workflows', page: 'workflows' },
    { icon: Plus, label: 'New Chat', page: 'creation', action: 'newChat' }
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

  // New Chat → 선택 해제 + 상위 핸들러
  const handleNewChat = () => {
    setSelectedGenerationId(null)
    if (window.handleNewChat) window.handleNewChat()
    else if (startNewChat) startNewChat()
  }

  // ✅ 실시간 구독: 생성 문서 변경을 즉시 반영
  useEffect(() => {
    if (!currentUser) return
    setLoadingGenerations(true)

    const unsub = subscribeToGenerationUpdates(
      currentUser.uid,
      projectName,
      (docs) => {
        // createdAt 없을 수 있는 초기 스냅샷 가드
        const safe = (docs || []).map((g) => {
          const created =
            g.createdAt?.toDate ? g.createdAt.toDate() :
            (typeof g.createdAt === 'string' ? new Date(g.createdAt) : null)
          const updated =
            g.updatedAt?.toDate ? g.updatedAt.toDate() :
            (typeof g.updatedAt === 'string' ? new Date(g.updatedAt) : null)
          return { ...g, _createdAt: created, _updatedAt: updated }
        })
        setGenerations(safe)
        setLoadingGenerations(false)
      }
    )

    return () => unsub && unsub()
    // refreshTrigger가 바뀔 때도 재구독(필요하면)
  }, [currentUser, projectName, refreshTrigger])



  // 날짜 그룹화
  const groupGenerationsByDate = (items) => {
    if (!items || items.length === 0) return []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const buckets = { today: [], yesterday: [], lastWeek: [], older: [] }

    items.forEach((g) => {
      const d = g._createdAt || g._updatedAt || new Date() // created 없으면 updated, 그래도 없으면 now
      const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      if (dd.getTime() === today.getTime()) buckets.today.push(g)
      else if (dd.getTime() === yesterday.getTime()) buckets.yesterday.push(g)
      else if (dd >= lastWeek) buckets.lastWeek.push(g)
      else buckets.older.push(g)
    })

    const out = []
    if (buckets.today.length) out.push({ period: 'TODAY', items: buckets.today })
    if (buckets.yesterday.length) out.push({ period: 'YESTERDAY', items: buckets.yesterday })
    if (buckets.lastWeek.length) out.push({ period: 'LAST 7 DAYS', items: buckets.lastWeek })
    if (buckets.older.length) out.push({ period: 'OLDER', items: buckets.older.slice(0, 50) }) // 충분히 넉넉히
    return out
  }

  // ✅ 썸네일 URL 선택 로직 (storage > source)
  const getThumbUrl = (g) =>
    g?.result?.asset?.storageImageUrl ||
    g?.result?.asset?.sourceUrl ||
    ''

  // ✅ 상태 뱃지
  const StatusBadge = ({ status }) => {
    const st = (status || '').toLowerCase()
    if (st === 'completed') {
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>
    }
    if (st === 'failed' || st === 'error') {
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Failed</span>
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
        <Loader2 className="w-3 h-3 animate-spin" />
        Generating
      </span>
    )
  }

  // 항목 클릭 → generationId만 넘기고, 상세(메시지/이미지)는 CreationPage가 구독해서 표시
  const handleGenerationClick = (generation) => {
    setSelectedGenerationId(generation.id)
    if (window.loadChatHistoryFromSidebar) {
      // 하위호환: 구 코드가 chatHistory/결과를 인라인에서 읽는 경우
      window.loadChatHistoryFromSidebar([], generation.prompt || '', generation.result || null, generation.id)
    }
  }

  const grouped = groupGenerationsByDate(generations)

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-100 border-r border-slate-300 h-screen p-4 flex flex-col transition-all duration-300 absolute left-0 top-0 z-10`}>
      {/* Collapse Btn */}
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
                  (item.action === 'newChat' && selectedGenerationId === null) ||
                  (item.page === currentPage && selectedGenerationId === null)
                    ? 'bg-slate-200 text-slate-800'
                    : 'text-slate-700 hover:text-slate-800 hover:bg-slate-200'
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  if (item.action === 'newChat') handleNewChat()
                  else setCurrentPage(item.page)
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

            {/* 로딩 상태 */}
            {loadingGenerations && (
              <div className="text-xs text-slate-500 text-center py-2">Loading...</div>
            )}

            {/* 목록 */}
            {!loadingGenerations && generations.length > 0 ? (
              <div className="space-y-4">
                {grouped.map((period) => (
                  <div key={period.period} className="space-y-2">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {period.period}
                    </h4>
                    <ul className="space-y-1">
                      {period.items.map((g) => {
                        const thumb = getThumbUrl(g)
                        const isSelected = selectedGenerationId === g.id
                        const status = g.status || g.result?.status || 'generating'
                        return (
                          <li key={g.id}>
                            <button
                              onClick={() => handleGenerationClick(g)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 text-left ${
                                isSelected
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'text-slate-700 hover:text-slate-800 hover:bg-slate-200'
                              }`}
                              title={g.prompt}
                            >
                              {/* 썸네일 */}
                              <div className="flex-shrink-0">
                                <div className="relative w-8 h-8 rounded bg-white border border-slate-200 overflow-hidden grid place-items-center">
                                  {thumb ? (
                                    <img
                                      src={thumb}
                                      alt="Generated"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        const fb = e.currentTarget.parentElement?.querySelector('.image-fallback')
                                        if (fb) fb.setAttribute('style', 'display:flex')
                                      }}
                                    />
                                  ) : null}
                                  <div className="image-fallback hidden w-full h-full items-center justify-center">
                                    {status?.toLowerCase() === 'generating' ? (
                                      <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-slate-500" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 텍스트 */}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-slate-700 truncate">
                                  {g.prompt || 'Untitled'}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {g?.options?.style} • {g?.options?.size || g?.result?.meta?.size}
                                </div>
                              </div>

                              {/* 상태 뱃지 */}
                              <div className="flex-shrink-0">
                                <StatusBadge status={status} />
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {/* 빈 상태 */}
            {!loadingGenerations && generations.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-2">No generations yet</div>
            )}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="mt-auto">
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg hover:bg-slate-200 transition-colors group`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getRandomColor(currentUser?.uid || '')}`}>
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

          {isProfileDropdownOpen && !isCollapsed && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-300 rounded-xl shadow-lg z-50">
              <div className="p-2">
                {[
                  { icon: Clock, label: 'Plans and Billing' },
                  { icon: Plus, label: 'Invite members' },
                  { icon: Globe, label: 'Upgrade your plan' },
                  { icon: ChevronLeft, label: 'Switch Workspace' }
                ].map((item, idx) => (
                  <button
                    key={idx}
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