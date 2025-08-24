import { useState, useEffect } from 'react'
import { Plus, ChevronDown, Clock, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserGenerations } from '../utils/firestore'
import { useNavigate } from 'react-router-dom'

const SessionPage = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState('Date updated')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // 실제 생성 이력 데이터 로드
  useEffect(() => {
    const loadSessions = async () => {
      if (currentUser) {
        try {
          setLoading(true)
          const generations = await getUserGenerations(currentUser.uid)
          console.log('Loaded generations for sessions:', generations) // 디버깅 로그
          
          // 생성 이력을 세션 형태로 변환
          const sessionData = generations.map(generation => {
            console.log('Processing generation:', {
              id: generation.id,
              prompt: generation.prompt,
              result: generation.result,
              storageImageUrl: generation.result?.asset?.storageImageUrl,
              dalleImage: generation.result?.asset?.dalleImage
            })
            
            return {
              id: generation.id,
              title: generation.prompt || 'Untitled',
              thumbnail: generation.result?.asset?.storageImageUrl || generation.result?.asset?.dalleImage || null,
              lastUpdated: formatTimeAgo(generation.createdAt),
              generations: 1, // 각 생성은 하나의 세션
              type: generation.options?.type || 'Icon',
              emoji: getEmojiForType(generation.options?.type)
            }
          })
          
          setSessions(sessionData)
        } catch (error) {
          console.error('Failed to load sessions:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    loadSessions()
  }, [currentUser])

  // 시간을 "~전" 형태로 변환하는 함수
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown'
    
    const now = new Date()
    const created = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diffInMs = now - created
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7))

    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
    return `${Math.floor(diffInWeeks / 4)} months ago`
  }

  // 타입에 따른 이모지 반환 함수
  const getEmojiForType = (type) => {
    const emojiMap = {
      'Icon': '🎯',
      'Emoji': '😊',
      'Illustration': '🎨',
      'Logo': '🏢',
      'Character': '👤'
    }
    return emojiMap[type] || '🎯'
  }

  const sortOptions = [
    'Date updated',
    'Date created',
    'Name',
    'Type',
    'Generations'
  ]

  return (
    <main className="flex-1 p-4 sm:p-6 overflow-y-auto pt-8 h-full bg-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Sessions</h1>
          <button className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
            New Session
          </button>
        </div>

        {/* Sort Section */}
        <div className="mb-6">
          <div className="relative">
            <select 
              className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500" 
            >
              <option>Sort by: Last updated</option>
              <option>Sort by: Name</option>
              <option>Sort by: Type</option>
              <option>Sort by: Generations</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // 로딩 상태
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="h-48 bg-slate-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded animate-pulse mb-3"></div>
                  <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))
          ) : sessions.length > 0 ? (
            // 실제 데이터 표시
            sessions.map((session) => (
              <div 
                key={session.id} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  // Creation 페이지에서 이 값을 읽어 사이드바 선택
                  localStorage.setItem('openGenerationId', session.id)
                  navigate('/creation') // 라우트 경로는 앱에 맞게 조정
                }}
              >
                {/* Thumbnail */}
                <div className="h-48 bg-slate-50 border-b border-slate-200 flex items-center justify-center overflow-hidden relative">
                  {/* Background Image - 모든 카드에 동일한 배경 */}
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  
                  {/* 생성된 이미지 미리보기 (여러 소스 시도) */}
                  {session.thumbnail ? (
                    <img 
                      src={session.thumbnail}
                      alt={session.title}
                      className="w-32 h-32 object-contain rounded-lg shadow-lg relative z-10"
                      onError={(e) => {
                        console.log('Session image failed to load:', e.target.src)
                        // 이미지 로드 실패 시 이모지 표시
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                  ) : null}
                  {/* 이미지가 없거나 로드 실패 시 이모지 표시 */}
                  <div className={`text-6xl relative z-10 ${session.thumbnail ? 'hidden' : ''}`}>
                    {session.emoji}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-2 truncate">{session.title}</h3>
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                    <span>{session.lastUpdated}</span>
                    <span>{session.generations} generation</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs">
                      {session.type}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // 데이터가 없는 경우
            <div className="col-span-full text-center py-12">
              <div className="text-slate-400 mb-4">
                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No sessions yet</h3>
                <p className="text-slate-500">Create your first AI-generated image to get started!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default SessionPage 