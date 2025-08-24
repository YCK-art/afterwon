import { useState, useEffect } from 'react'
import TopBar from './TopBar'
import TypewriterText from './TypewriterText'
import { ChevronDown } from 'lucide-react'
import Footer from './Footer'

const LandingPage = ({ onLogin, onSignUp, onExplore, onGetStarted }) => {
  const [firstLineComplete, setFirstLineComplete] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const images = [
    '/images/example/example3.png',
    '/images/example/gameicon.png',
    '/images/example/chaticon.png'
  ]
  
  const handleGetStarted = () => {
    // Get Started 버튼 클릭 시 회원가입 페이지로 이동
    if (onGetStarted) onGetStarted()
  }

  const handleFirstLineComplete = () => {
    console.log('First line completed!')
    setFirstLineComplete(true)
  }

  // 디버깅을 위한 상태 로깅
  useEffect(() => {
    console.log('LandingPage mounted, firstLineComplete:', firstLineComplete)
  }, [firstLineComplete])

  const scrollToNextSection = () => {
    // 부드러운 스크롤로 다음 섹션으로 이동
    const targetScrollPosition = window.innerHeight
    
    window.scrollTo({
      top: targetScrollPosition,
      behavior: 'smooth'
    })
  }

  // 3초마다 이미지 변경
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="min-h-screen bg-black relative overflow-y-auto">
      {/* TopBar */}
      <TopBar onGetStarted={handleGetStarted} />
      
      {/* Video Container - 75% height */}
      <div className="relative h-screen w-full">
        {/* Background GIF */}
        <img
          src="/images/pinterest-video.gif"
          alt="Background Animation"
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(1.1) contrast(1.1) saturate(1.1)',
            objectFit: 'cover',
            minWidth: '100%',
            minHeight: '100%'
          }}
        />
        
        {/* Background Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Main Content */}
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 z-10">
          {/* Main Slogan */}
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-wide mb-4 hero-text-shadow gpu-accelerated" style={{ 
              fontFamily: 'Doto, sans-serif'
            }}>
              <TypewriterText 
                text="The moment you imagine," 
                speed={100} 
                delay={0}
                onComplete={handleFirstLineComplete}
              />
            </h1>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-wide hero-text-shadow gpu-accelerated" style={{ 
              fontFamily: 'Doto, sans-serif'
            }}>
              {firstLineComplete && (
                <TypewriterText 
                  text="it's already won" 
                  speed={100} 
                  delay={0}
                />
              )}
            </h2>
          </div>
        </div>

        {/* Scroll Down Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={scrollToNextSection}
            className="w-14 h-14 bg-black/80 backdrop-blur-md border border-white/50 rounded-full flex items-center justify-center text-white hover:bg-black hover:border-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl group"
            aria-label="Scroll to next section"
          >
            <ChevronDown className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Black Section Below */}
      <div className="bg-black w-full" style={{ minHeight: '140vh' }}>
        <div className="flex flex-col items-center justify-start pt-20 pb-60">
          <div className="text-center w-full px-6">
            <p className="text-white text-2xl md:text-3xl lg:text-4xl font-medium mb-8">
              Create <span style={{ fontFamily: 'Workbench, sans-serif', color: '#87CEEB' }}>UI Components</span> to <span style={{ fontFamily: 'Workbench, sans-serif', color: '#FFD700' }}>Unique Emojis</span>
            </p>
            
            {/* Tag Section */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <div className="bg-white/5 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/15 hover:border-white/50 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl" style={{ fontFamily: 'ProductSans, sans-serif' }}>
                Toolbar
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/15 hover:border-white/50 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl" style={{ fontFamily: 'ProductSans, sans-serif' }}>
                Button
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/15 hover:border-white/50 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl" style={{ fontFamily: 'ProductSans, sans-serif' }}>
                Icon
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/15 hover:border-white/50 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl" style={{ fontFamily: 'ProductSans, sans-serif' }}>
                Emoji
              </div>
            </div>

            {/* Puzzle Gallery */}
            <div className="grid grid-cols-3 gap-0 w-full h-[400px] mb-32">
              {/* Top Row */}
              <div className="col-span-1 row-span-1">
                <div className="relative w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/example/example1.png" 
                    alt="Example 1" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/example/example2.png" 
                    alt="Example 2" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/example/example3.png" 
                    alt="Example 3" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Middle Row */}
              <div className="col-span-1 row-span-1">
                <div className="relative w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/example/example4.png" 
                    alt="Example 4" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/example/example5.png" 
                    alt="Example 5" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/example/example6.png" 
                    alt="Example 6" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default LandingPage 