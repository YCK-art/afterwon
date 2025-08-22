import { useState } from 'react'
import TopBar from './TopBar'
import TypewriterText from './TypewriterText'

const LandingPage = ({ onLogin, onSignUp, onExplore, onGetStarted }) => {
  const [firstLineComplete, setFirstLineComplete] = useState(false)
  
  const handleGetStarted = () => {
    // Get Started 버튼 클릭 시 회원가입 페이지로 이동
    if (onGetStarted) onGetStarted()
  }

  const handleFirstLineComplete = () => {
    setFirstLineComplete(true)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* TopBar */}
      <TopBar onGetStarted={handleGetStarted} />
      
      {/* Background GIF - 세로 길이 줄임 */}
      <div className="absolute inset-0 w-full h-4/5">
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
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 w-full h-4/5 flex flex-col items-center justify-center px-4 z-10">
        {/* Main Slogan */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-wide mb-4" style={{ fontFamily: 'Doto, sans-serif' }}>
            <TypewriterText 
              text="The moment you imagine," 
              speed={100} 
              delay={0}
              onComplete={handleFirstLineComplete}
            />
          </h1>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-wide" style={{ fontFamily: 'Doto, sans-serif' }}>
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

      {/* Black Section Below */}
      <div className="relative z-10 bg-black h-1/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg md:text-xl opacity-80">
            Transform your ideas into reality
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage 