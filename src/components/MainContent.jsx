import { useState, useEffect, useRef } from 'react'
import { Plus, ArrowUp, X, Download, Image as ImageIcon, Heart, Palette, Sparkles, Ruler, Settings } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import PromptInput from './PromptInput'
import RecommendationCards from './RecommendationCards'

const MainContent = ({ 
  prompt, 
  setPrompt, 
  selectedOptions, 
  onOptionChange, 
  onGenerate,
  isSidebarCollapsed = false
}) => {
  const { isDark } = useTheme()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const dropdownRefs = useRef({})
  
  const fullText = "What do you want to design?"

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, fullText])

  // 드롭다운 밖 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  const handleOptionSelect = (key, value) => {
    onOptionChange(key, value)
    setActiveDropdown(null)
  }

  const removeOption = (key) => {
    onOptionChange(key, '')
  }

  const getSelectedOptionsCount = () => {
    return Object.values(selectedOptions).filter(Boolean).length
  }

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown)
  }

  const styleOptions = [
    'Liquid Glass', 'Neon Glow', 'Pixel Art', 'Skeuomorphism', '3D', 'Flat Design', 'Gradient', 'Minimalist'
  ]

  const typeOptions = [
    'Icon', 'Emoji', 'Illustration', 'Logo', 'Character'
  ]

  const sizeOptions = [
    '128px', '256px', '512px', '1024px'
  ]

  const extraOptions = [
    'Transparent Background', 'High Resolution', 'Vector Format'
  ]

  return (
    <main className={`p-4 sm:p-6 pt-8 theme-transition ${isDark ? 'bg-dark-bg text-dark-text' : 'bg-white'}`}>
      <div className={`mx-auto transition-all duration-300 w-full ${isSidebarCollapsed ? 'max-w-6xl' : 'max-w-5xl'} sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-8xl`}>
        {/* Main Card - 모든 내용을 하나의 카드에 통합 */}
        <div className={`border rounded-2xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-12 md:mb-16 min-h-[600px] sm:min-h-[650px] flex flex-col justify-center theme-transition ${
          isDark 
            ? 'bg-dark-surface border-dark-border' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Title and Description */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-4 min-h-[2rem] sm:min-h-[3rem] theme-transition ${
              isDark ? 'text-dark-text' : 'text-slate-900'
            }`}>
              {displayText}
              <span className="animate-pulse">|</span>
            </h1>
            <p className={`text-sm sm:text-base md:text-lg theme-transition ${
              isDark ? 'text-dark-text-secondary' : 'text-slate-700'
            }`}>
              From icons to full UI components, just say it.
            </p>
          </div>

          {/* Option Buttons */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {/* Type Button */}
            <div className="relative" ref={el => dropdownRefs.current['type'] = el}>
              <button
                onClick={() => toggleDropdown('type')}
                className="flex items-center space-x-2 bg-white/80 hover:bg-white border border-slate-300 text-slate-800 hover:text-slate-900 px-4 py-2 rounded-xl transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Type</span>
                {selectedOptions.type && (
                  <span className="bg-slate-200 text-slate-800 text-xs px-2 py-1 rounded-full">
                    {selectedOptions.type}
                  </span>
                )}
              </button>
              
              {/* Type Dropdown */}
              {activeDropdown === 'type' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-300 rounded-xl shadow-lg z-10">
                  <div className="p-2">
                    {typeOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect('type', option)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Style Button */}
            <div className="relative" ref={el => dropdownRefs.current['style'] = el}>
              <button
                onClick={() => toggleDropdown('style')}
                className="flex items-center space-x-2 bg-white/80 hover:bg-white border border-slate-300 text-slate-800 hover:text-slate-900 px-4 py-2 rounded-xl transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span>Style</span>
                {selectedOptions.style && (
                  <span className="bg-slate-200 text-slate-800 text-xs px-2 py-1 rounded-full">
                    {selectedOptions.style}
                  </span>
                )}
              </button>
              
              {/* Style Dropdown */}
              {activeDropdown === 'style' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-300 rounded-xl shadow-lg z-10">
                  <div className="p-2">
                    {styleOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect('style', option)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Size Button */}
            <div className="relative" ref={el => dropdownRefs.current['size'] = el}>
              <button
                onClick={() => toggleDropdown('size')}
                className="flex items-center space-x-2 bg-white/80 hover:bg-white border border-slate-300 text-slate-800 hover:text-slate-900 px-4 py-2 rounded-xl transition-colors"
              >
                <Ruler className="w-4 h-4" />
                <span>Size</span>
                {selectedOptions.size && (
                  <span className="bg-slate-200 text-slate-800 text-xs px-2 py-1 rounded-full">
                    {selectedOptions.size}
                  </span>
                )}
              </button>
              
              {/* Size Dropdown */}
              {activeDropdown === 'size' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-300 rounded-xl shadow-lg z-10">
                  <div className="p-2">
                    {sizeOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect('size', option)}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Extra Options Button */}
            <div className="relative" ref={el => dropdownRefs.current['extra'] = el}>
              <button
                onClick={() => toggleDropdown('extra')}
                className="flex items-center space-x-2 bg-white/80 hover:bg-white border border-slate-300 text-slate-800 hover:text-slate-900 px-4 py-2 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Extra</span>
                {Object.values(selectedOptions).filter(v => typeof v === 'boolean' && v).length > 0 && (
                  <span className="bg-slate-200 text-slate-800 text-xs px-2 py-1 rounded-full">
                    {Object.values(selectedOptions).filter(v => typeof v === 'boolean' && v).length}
                  </span>
                )}
              </button>
              
              {/* Extra Options Dropdown */}
              {activeDropdown === 'extra' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-300 rounded-xl shadow-lg z-10">
                  <div className="p-2">
                    {extraOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(option, !selectedOptions[option])}
                        className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                          selectedOptions[option] 
                            ? 'bg-slate-200 text-slate-800' 
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl mx-auto">
            <PromptInput 
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={onGenerate}
              selectedOptions={selectedOptions}
              onRemoveOption={removeOption}
            />
          </div>

          {/* Prompt Suggestions - 같은 카드 안에 배치 */}
          <div className="mt-4 sm:mt-6 md:mt-8">
            <div className="max-w-full sm:max-w-2xl md:max-w-3xl mx-auto">
              {/* First Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-x-8">
                <div className="relative group">
                  <div className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors group-hover:bg-slate-200 group-hover:border-slate-400 border border-transparent h-12 cursor-pointer" onClick={() => setPrompt("Game console + Coca-Cola can")}>
                    <span className="text-slate-700 text-sm truncate pr-2 group-hover:text-slate-900">Game console + Coca-Cola can</span>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors group-hover:bg-slate-200 group-hover:border-slate-400 border border-transparent h-12 cursor-pointer" onClick={() => setPrompt("Cat in astronaut helmet")}>
                    <span className="text-slate-700 text-sm truncate pr-2 group-hover:text-slate-900">Cat in astronaut helmet</span>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-px bg-slate-200/50 my-1"></div>
              
              {/* Second Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-x-8">
                <div className="relative group">
                  <div className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors group-hover:bg-slate-200 group-hover:border-slate-400 border border-transparent h-12 cursor-pointer" onClick={() => setPrompt("Coffee cup with musical steam")}>
                    <span className="text-slate-700 text-sm truncate pr-2 group-hover:text-slate-900">Coffee cup with musical steam</span>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="flex items-center justify-between py-3 px-3 rounded-lg transition-colors group-hover:bg-slate-200 group-hover:border-slate-400 border border-transparent h-12 cursor-pointer" onClick={() => setPrompt("Phone becoming butterfly")}>
                    <span className="text-slate-700 text-sm truncate pr-2 group-hover:text-slate-900">Phone becoming butterfly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Cards */}
        <RecommendationCards />
      </div>
    </main>
  )
}

export default MainContent 