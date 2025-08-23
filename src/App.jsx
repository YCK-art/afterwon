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
    extras: []
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
  
  // CreationPage의 채팅 이력을 로드하는 함수
  const handleLoadChatHistory = (history, promptText, generationResult) => {
    // CreationPage가 마운트된 후에 호출되어야 하므로
    // localStorage에 임시로 저장하고 CreationPage에서 읽어오도록 함
    localStorage.setItem('tempChatHistory', JSON.stringify({ 
      history, 
      prompt: promptText, 
      generationResult 
    }))
  }
  
  // CreationSidebar 새로고침 함수
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)
  
  const refreshSidebar = () => {
    setSidebarRefreshTrigger(prev => prev + 1)
  }

  // 랜딩페이지 액션 핸들러
  const handleLogin = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
    // 홈페이지로 이동할 때 선택된 옵션들 초기화
    setSelectedOptions({
      style: '',
      type: '',
      size: '',
      extras: []
    })
    setPrompt('')
  }

  const handleSignUp = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
    // 홈페이지로 이동할 때 선택된 옵션들 초기화
    setSelectedOptions({
      style: '',
      type: '',
      size: '',
      extras: []
    })
    setPrompt('')
  }

  const handleExplore = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
    // 홈페이지로 이동할 때 선택된 옵션들 초기화
    setSelectedOptions({
      style: '',
      type: '',
      size: '',
      extras: []
    })
    setPrompt('')
  }

  const handleGetStarted = () => {
    setCurrentPage('signup')
    localStorage.setItem('currentPage', 'signup')
  }

  const handleBackToLanding = () => {
    setCurrentPage('landing')
    localStorage.setItem('currentPage', 'landing')
    // 홈페이지로 돌아갈 때 선택된 옵션들 초기화
    setSelectedOptions({
      style: '',
      type: '',
      size: '',
      extras: []
    })
    setPrompt('')
  }

  const handleLoginSuccess = () => {
    setCurrentPage('home')
    localStorage.setItem('currentPage', 'home')
    // 로그인 성공 후 홈페이지로 이동할 때 선택된 옵션들 초기화
    setSelectedOptions({
      style: '',
      type: '',
      size: '',
      extras: []
    })
    setPrompt('')
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
    
    // Creation 페이지로 이동
    setCurrentPage('creation')
    localStorage.setItem('currentPage', 'creation')
    
    // Creation 페이지에서 사용할 데이터를 localStorage에 저장
    localStorage.setItem('creationPrompt', prompt)
    localStorage.setItem('creationOptions', JSON.stringify(selectedOptions))
    
    // 즉시 AI 생성 시작을 위한 플래그 설정
    localStorage.setItem('startGenerationImmediately', 'true')
    
    // 새 채팅 시작
    startNewChat()
  }

  const renderMainContent = () => {
    switch (currentPage) {
      case 'session':
        return <SessionPage />
      case 'creation':
        return <CreationPage 
          key={creationKey} 
          startNewChat={startNewChat} 
          onRefreshSidebar={refreshSidebar}
          onLoadChatHistory={handleLoadChatHistory}
        />
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
          onLoadChatHistory={handleLoadChatHistory}
          refreshTrigger={sidebarRefreshTrigger}
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
