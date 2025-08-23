import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uploadImageToStorage } from '../utils/storage'
import { saveGenerationHistory } from '../utils/firestore'

const ImageUploadTest = () => {
  const { currentUser } = useAuth()
  const [testImageUrl, setTestImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [error, setError] = useState(null)

  // 테스트 이미지 URL로 업로드 테스트
  const handleTestUpload = async () => {
    if (!currentUser || !testImageUrl) {
      setError('사용자 로그인이 필요하거나 이미지 URL을 입력해주세요.')
      return
    }

    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      console.log('🧪 Starting test upload...')
      
      // 테스트용 이미지 업로드
      const uploadResult = await uploadImageToStorage(
        testImageUrl,
        currentUser.uid,
        `test_${Date.now()}`,
        'iconic'
      )

      console.log('✅ Test upload successful:', uploadResult)
      setUploadResult(uploadResult)

      // Firestore에 테스트 데이터 저장
      const testGenerationData = {
        prompt: '테스트 이미지 업로드',
        options: {
          type: 'Test',
          style: 'Test',
          size: '1024px',
          extras: []
        },
        result: {
          asset: {
            storageImageUrl: uploadResult.downloadURL,
            storagePath: uploadResult.storagePath,
            dalleImage: testImageUrl
          }
        },
        chatHistory: [],
        createdAt: new Date()
      }

      const generationId = await saveGenerationHistory(
        currentUser.uid, 
        testGenerationData, 
        'iconic'
      )

      console.log('💾 Test generation saved to Firestore:', generationId)

    } catch (error) {
      console.error('❌ Test upload failed:', error)
      setError(`업로드 실패: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <p className="text-yellow-800">로그인이 필요합니다.</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Firebase Storage 이미지 업로드 테스트
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테스트 이미지 URL
          </label>
          <input
            type="url"
            value={testImageUrl}
            onChange={(e) => setTestImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleTestUpload}
          disabled={uploading || !testImageUrl}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? '업로드 중...' : '테스트 업로드'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {uploadResult && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-md">
            <h4 className="font-medium text-green-800 mb-2">✅ 업로드 성공!</h4>
            <div className="space-y-2 text-sm text-green-700">
              <p><strong>Storage Path:</strong> {uploadResult.storagePath}</p>
              <p><strong>Download URL:</strong> {uploadResult.downloadURL}</p>
              <p><strong>File Size:</strong> {uploadResult.metadata?.size || 'Unknown'} bytes</p>
            </div>
            
            {/* 업로드된 이미지 미리보기 */}
            <div className="mt-4">
              <img 
                src={uploadResult.downloadURL} 
                alt="Uploaded test image"
                className="w-32 h-32 object-cover rounded-lg border border-green-300"
              />
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>현재 사용자:</strong> {currentUser.email}</p>
          <p><strong>사용자 ID:</strong> {currentUser.uid}</p>
          <p><strong>프로젝트:</strong> iconic</p>
        </div>
      </div>
    </div>
  )
}

export default ImageUploadTest 