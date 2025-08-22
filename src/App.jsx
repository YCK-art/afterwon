import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import SessionPage from './components/SessionPage'
import CreationSidebar from './components/CreationSidebar'
import CreationPage from './components/CreationPage'
import LandingPage from './components/LandingPage'
import SignUpPage from './components/SignUpPage'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  const [selectedOptions, setSelectedOptions] = useState({
    style: '',
    type: '',
    size: '',
    transparent: false
  })

  const [prompt, setPrompt] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // localStorage에서 페이지 상태 복원
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('currentPage')
    return savedPage || 'landing' // 기본값을 landing으로 변경
  })

  // Creation 페이지 관련 상태
  const [creationKey, setCreationKey] = useState(0) // CreationPage를 강제로 리렌더링하기 위한 키

  // 페이지 변경 시 localStorage에 저장
  const handlePageChange = (page) => {
    setCurrentPage(page)
    localStorage.setItem('currentPage', page)
  }

  // 새 채팅 시작
  const startNewChat = () => {
    setCreationKey(prev => prev + 1) // CreationPage를 강제로 리렌더링
  }

  // 랜딩페이지 액션 핸들러
  const handleLogin = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
  }

  const handleSignUp = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
  }

  const handleExplore = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
  }

  const handleGetStarted = () => {
    setCurrentPage('signup')
    localStorage.setItem('currentPage', 'signup')
  }

  const handleBackToLanding = () => {
    setCurrentPage('landing')
    localStorage.setItem('currentPage', 'landing')
  }

  const handleLoginSuccess = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
  }

  const handleOptionChange = (key, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleGenerate = () => {
    if (!prompt.trim()) return
    
    console.log('Generating with:', { prompt, selectedOptions })
    // TODO: AI 생성 로직 구현
  }

  const renderMainContent = () => {
    switch (currentPage) {
      case 'session':
        return <SessionPage />
      case 'creation':
        return <CreationPage key={creationKey} startNewChat={startNewChat} />
      case 'signup':
        return <SignUpPage onBackToLanding={handleBackToLanding} onLoginSuccess={handleLoginSuccess} />
      case 'landing':
        return <LandingPage onLogin={handleLogin} onSignUp={handleSignUp} onExplore={handleExplore} onGetStarted={handleGetStarted} />
      case 'home':
      default:
        return (
          <MainContent 
            prompt={prompt}
            setPrompt={setPrompt}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
            onGenerate={handleGenerate}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )
    }
  }

  const renderSidebar = () => {
    if (currentPage === 'creation') {
      return (
        <CreationSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          startNewChat={startNewChat}
        />
      )
    }
    
    return (
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
      />
    )
  }

  return (
    <AuthProvider>
      <div className={currentPage === 'landing' || currentPage === 'signup' ? 'h-screen' : 'h-screen flex'}>
        {/* Landing Page - 전체 화면 */}
        {currentPage === 'landing' ? (
          <LandingPage onLogin={handleLogin} onSignUp={handleSignUp} onExplore={handleExplore} onGetStarted={handleGetStarted} />
        ) : currentPage === 'signup' ? (
          <SignUpPage onBackToLanding={handleBackToLanding} onLoginSuccess={handleLoginSuccess} />
        ) : (
          /* Main App with Sidebar and Content */
          <>
            {renderSidebar()}
            <main className={`flex-1 transition-all duration-300 overflow-y-auto ${
              isSidebarCollapsed ? 'ml-20' : 'ml-64'
            }`}>
              {renderMainContent()}
            </main>
          </>
        )}
      </div>
    </AuthProvider>
  )
}

export default App
