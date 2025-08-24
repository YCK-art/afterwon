import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App.jsx'
import CreationPage from './components/CreationPage'
import SessionPage from './components/SessionPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* 홈(또는 기존 레이아웃) */}
            <Route path="/" element={<App />} />

            {/* 세션 모아보기 */}
            <Route path="/sessions" element={<SessionPage />} />

            {/* 생성 페이지 */}
            <Route path="/creation" element={<CreationPage />} />

            {/* 기타 경로는 홈으로 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
