import { useState, useEffect } from 'react'

const TypewriterText = ({ text, speed = 100, delay = 0, onComplete, highlightWords = [], className = "" }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // 초기 지연
    const startTimer = setTimeout(() => {
      setCurrentIndex(0)
    }, delay)
    
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1))
        setCurrentIndex(prev => prev + 1)
      }, speed)
      
      return () => clearTimeout(timer)
    } else if (onComplete) {
      // 타이핑이 완료되면 콜백 함수 호출
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  // 하이라이트할 단어들을 포함한 텍스트 렌더링
  const renderHighlightedText = (text) => {
    if (highlightWords.length === 0) {
      return text
    }

    let result = []
    let lastIndex = 0

    highlightWords.forEach((word, index) => {
      const wordIndex = text.indexOf(word, lastIndex)
      if (wordIndex !== -1) {
        // 하이라이트 전 텍스트
        if (wordIndex > lastIndex) {
          result.push(
            <span key={`text-${index}`} className="text-white">
              {text.slice(lastIndex, wordIndex)}
            </span>
          )
        }
        
        // 하이라이트된 단어
        result.push(
          <span 
            key={`highlight-${index}`}
            className="video-text"
          >
            {word}
          </span>
        )
        
        lastIndex = wordIndex + word.length
      }
    })

    // 마지막 하이라이트 후 텍스트
    if (lastIndex < text.length) {
      result.push(
        <span key="text-end" className="text-white">
          {text.slice(lastIndex)}
        </span>
      )
    }

    return result
  }

  return (
    <span className={className}>
      {renderHighlightedText(displayText)}
      {currentIndex < text.length && (
        <span className="inline-block w-0.5 h-8 bg-white ml-1 animate-pulse" />
      )}
    </span>
  )
}

export default TypewriterText 