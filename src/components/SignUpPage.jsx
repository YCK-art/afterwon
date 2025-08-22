import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { FaApple } from 'react-icons/fa'
import { signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const SignUpPage = ({ onBackToLanding, onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: 회원가입 로직 구현
    console.log('Email submitted:', email)
  }

  const saveUserToFirestore = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        // 기존 사용자: 접속 정보 업데이트
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          loginCount: (userDoc.data().loginCount || 0) + 1
        })
        console.log('기존 사용자 정보 업데이트 완료')
      } else {
        // 새 사용자: 전체 정보 저장
        const userData = {
          uid: user.uid,
          displayName: user.displayName || 'Unknown',
          email: user.email,
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          loginCount: 1
        }
        
        await setDoc(userRef, userData)
        console.log('새 사용자 정보 저장 완료:', userData)
      }
    } catch (error) {
      console.error('Firestore 저장 에러:', error)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Google sign-in successful:', result.user)
      
      // Firestore에 사용자 정보 저장
      await saveUserToFirestore(result.user)
      
      // 로그인 성공 후 홈화면으로 이동
      if (onLoginSuccess) {
        onLoginSuccess()
      }
      
    } catch (error) {
      console.error('Google sign-in error:', error)
      // TODO: 에러 처리 (사용자에게 알림 등)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Video Container */}
      <div className="w-3/5 bg-black relative">
        {/* Logo - 왼쪽 위에 Afterwon 로고 */}
        <div className="absolute top-8 left-8 z-10">
          <button 
            onClick={onBackToLanding}
            className="text-white font-bold text-2xl tracking-wide hover:text-gray-200 transition-colors"
            style={{ fontFamily: 'Workbench, sans-serif' }}
          >
            Afterwon
          </button>
        </div>
        
        {/* 동영상 삽입 */}
        <div className="w-full h-full flex items-center justify-center p-8">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="/images/landing6.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Background Overlay for better logo readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Right Section - Account Creation Form */}
      <div className="w-2/5 bg-white flex items-center justify-center px-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create an account
            </h2>
            <p className="text-gray-600">
              Already have an account?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Log in
              </button>
            </p>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button 
              onClick={handleGoogleSignIn}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : (
                <>
                  <FcGoogle className="w-5 h-5 mr-3" />
                  Sign up with Google
                </>
              )}
            </button>
            
            <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
              <FaApple className="w-5 h-5 mr-3" />
              Sign up with Apple
            </button>
            
            <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Use Single Sign-On (SSO)
            </button>
          </div>

          {/* Legal Disclaimer */}
          <div className="text-xs text-gray-500 text-center leading-relaxed">
            By clicking "Sign up with Google" or "Sign up with Apple" you agree to our{' '}
            <button className="text-blue-600 hover:text-blue-700">Terms of Use</button>
            {' '}and acknowledge that you have read and understand our{' '}
            <button className="text-blue-600 hover:text-blue-700">Privacy Policy</button>.
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage 