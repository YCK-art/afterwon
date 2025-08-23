import { useState, useEffect } from 'react'
import { ImageIcon, Heart, Download, Palette, Sparkles, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserGenerations } from '../utils/firestore'

const RecommendationCards = () => {
  const { currentUser } = useAuth()
  const [recentGenerations, setRecentGenerations] = useState([])
  const [loading, setLoading] = useState(true)

  // 실제 생성 이력 데이터 로드
  useEffect(() => {
    const loadRecentGenerations = async () => {
      if (currentUser) {
        try {
          setLoading(true)
          const generations = await getUserGenerations(currentUser.uid)
          console.log('Loaded generations:', generations) // 디버깅 로그
          
          // 데이터 구조 확인
          generations.forEach((gen, index) => {
            console.log(`Generation ${index}:`, {
              id: gen.id,
              prompt: gen.prompt,
              result: gen.result,
              storageImageUrl: gen.result?.asset?.storageImageUrl,
              dalleImage: gen.result?.asset?.dalleImage
            })
          })
          
          // 최근 6개만 표시
          setRecentGenerations(generations.slice(0, 6))
        } catch (error) {
          console.error('Failed to load recent generations:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    loadRecentGenerations()
  }, [currentUser])

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

  const recommendedStyles = [
    {
      title: 'Liquid Glass Icons',
      description: 'Transparent and sparkling glass-like texture icons',
      image: '🎨',
      color: 'from-blue-500/20 to-purple-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Neon Emoji',
      description: 'Bright and colorful neon effect emojis',
      image: '✨',
      color: 'from-pink-500/20 to-orange-500/20',
      borderColor: 'border-pink-500/30'
    },
    {
      title: 'Pixel Art Characters',
      description: 'Retro-style pixel art characters',
      image: '🎮',
      color: 'from-green-500/20 to-teal-500/20',
      borderColor: 'border-green-500/30'
    }
  ]

  const recentCreations = [
    {
      title: 'Dog with Glasses',
      style: 'Liquid Glass',
      image: '🐕',
      timestamp: '2 hours ago'
    },
    {
      title: 'Game Console',
      style: 'Neon Glow',
      image: '🎮',
      timestamp: '5 hours ago'
    },
    {
      title: 'Space Cat',
      style: '3D',
      image: '🐱',
      timestamp: '1 day ago'
    },
    {
      title: 'Robot Friend',
      style: 'Pixel Art',
      image: '🤖',
      timestamp: '2 days ago'
    },
    {
      title: 'Magic Potion',
      style: 'Liquid Glass',
      image: '🧪',
      timestamp: '3 days ago'
    },
    {
      title: 'Flying Dragon',
      style: '3D',
      image: '🐉',
      timestamp: '4 days ago'
    }
  ]

  const trendingStyles = [
    {
      title: 'Minimalist Icons',
      description: 'Clean and simple minimalist icons',
      trend: '+45%',
      image: '⚡',
      color: 'from-yellow-500/20 to-orange-500/20'
    },
    {
      title: 'Gradient Logos',
      description: 'Smooth gradient logos',
      trend: '+32%',
      image: '🌈',
      color: 'from-purple-500/20 to-pink-500/20'
    }
  ]

  return (
    <div className="space-y-12">
      {/* Recent Creations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Recent Creations</h2>
          <button className="text-slate-600 hover:text-slate-800 text-sm font-medium">
            View All →
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 pr-4">
          {loading ? (
            // 로딩 상태
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="relative flex-shrink-0 w-80 h-64 rounded-2xl overflow-hidden bg-slate-200 animate-pulse">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-slate-400">Loading...</div>
                </div>
              </div>
            ))
          ) : recentGenerations.length > 0 ? (
            // 실제 데이터 표시
            recentGenerations.map((generation, index) => (
              <div key={generation.id || index} className="relative flex-shrink-0 w-80 h-64 rounded-2xl overflow-hidden">
                {/* Background Image - 모든 카드에 동일한 배경 */}
                <img 
                  src="/images/homepage/background.png" 
                  alt="Background"
                  className="w-full h-full object-cover"
                />
                
                {/* 생성된 이미지 미리보기 (여러 소스 시도) */}
                {(generation.result?.asset?.storageImageUrl || generation.result?.asset?.dalleImage) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      src={generation.result.asset.storageImageUrl || generation.result.asset.dalleImage}
                      alt={generation.prompt}
                      className="w-32 h-32 object-contain rounded-lg shadow-lg"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src)
                        // 이미지 로드 실패 시 이모지 표시
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    {/* 이미지 로드 실패 시 대체 이모지 */}
                    <div className="text-6xl hidden">
                      {getEmojiForType(generation.options?.type)}
                    </div>
                  </div>
                )}
                
                {/* Title and Style at bottom */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-medium text-white drop-shadow-lg truncate">
                    {generation.prompt || 'Untitled'}
                  </h3>
                  <p className="text-xs text-white/80 drop-shadow-lg">
                    {generation.options?.style || 'Default Style'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            // 데이터가 없는 경우 기본 카드들 표시
            recentCreations.map((creation, index) => (
              <div key={index} className="relative flex-shrink-0 w-80 h-64 rounded-2xl overflow-hidden">
                {/* Background Image */}
                <img 
                  src="/images/homepage/background.png" 
                  alt="Background"
                  className="w-full h-full object-cover"
                />
                
                {/* Centered Emoji/Component */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl">{creation.image}</div>
                </div>
                
                {/* Title at bottom left */}
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-sm font-medium text-white drop-shadow-lg">{creation.title}</h3>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recommended Styles */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Recommended Styles</h2>
          <button className="text-slate-600 hover:text-slate-800 text-sm font-medium">
            View All Styles →
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 pr-4">
          {[
            {
              title: 'Liquid Glass',
              description: 'Transparent glass-like texture with liquid flow effects.',
              image: '/images/homepage/liquidglass.png'
            },
            {
              title: 'Classic macOS',
              description: 'Vintage Apple design with retro interface elements.',
              image: '/images/homepage/mac.png'
            },
            {
              title: 'Pixel',
              description: 'Retro pixelated design style with 8-bit aesthetics.',
              image: '/images/homepage/pixel.png'
            },
            {
              title: '3D Icon',
              description: 'Three-dimensional icon designs with depth.',
              image: '/images/homepage/3dicon.png'
            },
            {
              title: '3D Realistic',
              description: 'Three-dimensional realistic rendering.',
              image: null
            }
          ].map((style, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300 flex-shrink-0 w-80"
            >
              {/* Main Image Area */}
              <div className="h-64 bg-slate-50 border-b border-slate-200 flex items-center justify-center overflow-hidden">
                {style.image ? (
                  <img 
                    src={style.image} 
                    alt={style.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-400 text-sm">Image will be added here</span>
                )}
              </div>
              
              {/* Bottom Section - Feature Description */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{style.title}</h3>
                <p className="text-slate-700 text-sm">{style.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Styles */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Trending</h2>
          <TrendingUp className="w-6 h-6 text-slate-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trendingStyles.map((style, index) => (
            <div
              key={index}
              className={`card bg-gradient-to-br ${style.color} relative overflow-hidden`}
            >
              <div className="absolute top-4 right-4 bg-slate-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                {style.trend}
              </div>
              <div className="text-4xl mb-4">{style.image}</div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900">{style.title}</h3>
              <p className="text-slate-700 text-sm mb-4">{style.description}</p>
              <button className="btn-secondary w-full">
                Follow Trend
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default RecommendationCards 