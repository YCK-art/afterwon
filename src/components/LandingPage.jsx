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
    setFirstLineComplete(true)
  }

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
          src="/images/landing4.gif"
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
      <div className="bg-black min-h-screen w-full">
        <div className="flex flex-col items-center justify-start pt-20">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 w-full mb-12">
              {/* Top Row */}
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>New</span>
                  </div>
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>Top Choice</span>
                  </div>
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 row-span-1 sm:row-span-2">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <img 
                    src="/images/example/example3.png" 
                    alt="Example 3" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>Top Choice</span>
                  </div>
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>New</span>
                  </div>
                </div>
              </div>
              
              {/* Middle Row */}
              <div className="col-span-1 sm:col-span-2 row-span-1 sm:row-span-2">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <img 
                    src="/images/example/gameicon.png" 
                    alt="Game Icon" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-4 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>New</span>
                  </div>
                </div>
              </div>
              
              {/* Bottom Row */}
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>Top Choice</span>
                  </div>
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <img 
                    src="/images/example/chaticon.png" 
                    alt="Chat Icon" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>Top Choice</span>
                  </div>
                </div>
              </div>
              <div className="col-span-1 row-span-1">
                <div className="relative rounded-lg overflow-hidden aspect-square shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <img 
                    src="/images/homepage/background.png" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xs drop-shadow-lg" style={{ fontFamily: 'ProductSans, sans-serif' }}>New</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Get Started Button */}
      <div className="py-16 bg-black">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Doto, sans-serif' }}>
            Ready to Create Something Amazing?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using Afterwon to bring their ideas to life.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-black px-12 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
            style={{ fontFamily: 'ProductSans, sans-serif' }}
          >
            Get Started Now
          </button>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default LandingPage 