import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { ArrowUp, X, Plus, Image as ImageIcon } from 'lucide-react'
import { useRef } from 'react'

const PromptInput = ({ prompt, setPrompt, onGenerate, selectedOptions, onRemoveOption }) => {
  const { isDark } = useTheme()
  const [uploadedImages, setUploadedImages] = useState([])
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    onGenerate()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onGenerate()
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)
    )
    
    const newImages = imageFiles.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      url: URL.createObjectURL(file),
      name: file.name
    }))
    
    setUploadedImages(prev => [...prev, ...newImages])
  }

  const removeImage = (imageId) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const getSelectedOptionsCount = () => {
    return Object.values(selectedOptions).filter(Boolean).length
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <div className={`w-full min-h-[120px] border rounded-2xl px-6 py-4 pr-20 text-lg focus-within:ring-2 focus-within:ring-slate-500/50 focus-within:border-slate-500 transition-all theme-transition ${
          isDark 
            ? 'bg-dark-surface border-dark-border text-dark-text placeholder:text-dark-text-secondary' 
            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
        }`}>
          {/* Selected Options Tags and Uploaded Images Thumbnails */}
          {(getSelectedOptionsCount() > 0 || uploadedImages.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Selected Options Tags */}
              {Object.entries(selectedOptions).map(([key, value]) => {
                if (!value) return null
                const displayValue = value.length > 6 ? value.substring(0, 6) + '...' : value
                return (
                  <div
                    key={key}
                    className="inline-flex items-center space-x-1 bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{displayValue}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveOption(key)}
                      className="hover:bg-slate-300 rounded-full p-0.5 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}

              {/* Uploaded Images Thumbnails */}
              {uploadedImages.map((image) => {
                const displayName = image.name.length > 6 ? image.name.substring(0, 6) + '...' : image.name
                return (
                  <div
                    key={image.id}
                    className="relative inline-flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-600 mr-1" />
                    <span className="text-xs text-slate-700">{displayName}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Text Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getSelectedOptionsCount() > 0 ? "Add your prompt here..." : "Describe your idea"}
            className="w-full bg-transparent border-none outline-none resize-none text-lg placeholder:text-slate-500 text-slate-900"
            style={{ minHeight: '2rem' }}
          />
        </div>
        
        {/* Image Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute left-4 bottom-4 text-slate-600 p-2 rounded-lg transition-all hover:text-slate-800"
          title="Upload reference image"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {/* Generate Button */}
        <button
          type="submit"
          disabled={!prompt.trim() && getSelectedOptionsCount() === 0}
          className="absolute right-4 bottom-4 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 disabled:text-slate-500 text-white p-3 rounded-xl transition-all disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </form>
  )
}

export default PromptInput 