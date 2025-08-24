import React, { useState } from 'react';
import { Download, Copy, Check, X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const ImageCardStack = ({ generatedImages, onImageClick, onRegenerate }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    if (onImageClick) {
      onImageClick(image);
    }
  };

  const handleCloseDetail = () => {
    setSelectedImage(null);
  };

  const copyPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  // 다운로드 함수 추가
  const downloadImage = async (imageUrl, format = 'png') => {
    if (!imageUrl) {
      console.error('No image URL provided for download');
      return;
    }

    try {
      // base64 데이터 URL인 경우 직접 다운로드
      if (imageUrl.startsWith('data:image/')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ai-generated-image-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Image downloaded successfully');
        return;
      }

      // Firebase Storage URL인 경우 프록시를 통해 다운로드
      let finalImageUrl = imageUrl
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        finalImageUrl = `/api/proxy-storage?url=${encodeURIComponent(imageUrl)}`
      }

      // 일반 URL인 경우 fetch로 다운로드
      const response = await fetch(finalImageUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-generated-image-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Image downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      alert('다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const getStatusIcon = (image) => {
    if (image.error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (image.isProcessing) {
      return <Info className="w-4 h-4 text-blue-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusColor = (image) => {
    if (image.error) {
      return 'border-red-200 bg-red-50';
    }
    if (image.isProcessing) {
      return 'border-blue-200 bg-blue-50';
    }
    return 'border-green-200 bg-green-50';
  };

  const getStatusText = (image) => {
    if (image.error) {
      return 'Error';
    }
    if (image.isProcessing) {
      return 'Processing';
    }
    return 'Success';
  };

  if (generatedImages.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        <p className="text-lg mb-2">No images generated yet</p>
        <p className="text-sm">Start a conversation to see your creations here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Image Cards Stack */}
      <div className="space-y-3">
        {generatedImages.map((image, index) => (
          <div
            key={image.id}
            className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getStatusColor(image)}`}
            onClick={() => handleImageClick(image)}
          >
            <div className="flex items-center space-x-4">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(image)}
              </div>
              
              {/* Image Thumbnail */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                {(image.storageImageUrl || image.imageUrl) ? (
                  <img
                    src={(() => {
                      // Firebase Storage URL인 경우 프록시를 통해 로드
                      const imageUrl = image.storageImageUrl || image.imageUrl
                      if (imageUrl.includes('firebasestorage.googleapis.com')) {
                        return `/api/proxy-storage?url=${encodeURIComponent(imageUrl)}`
                      }
                      return imageUrl
                    })()}
                    alt="Generated thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Firebase Storage URL이 실패하면 원본 URL로 fallback
                      if (image.storageImageUrl && image.imageUrl && e.target.src.includes('/api/proxy-storage')) {
                        e.target.src = image.imageUrl;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <span className="text-xs">No Image</span>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-slate-800">
                    {getStatusText(image)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(image.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {image.prompt || 'No prompt provided'}
                </p>
                {image.options && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(image.options).map(([key, value]) => {
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;
                      return (
                        <span
                          key={key}
                          className="inline-block px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-md"
                        >
                          {key}: {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {(image.storageImageUrl || image.imageUrl) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(image.storageImageUrl || image.imageUrl, 'png');
                    }}
                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRegenerate) onRegenerate(image);
                  }}
                  className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Regenerate image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">Image Details</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Generated on {new Date(selectedImage.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Large Image */}
              {(selectedImage.storageImageUrl || selectedImage.imageUrl) && (
                <div className="mb-6">
                  <img
                    src={selectedImage.storageImageUrl || selectedImage.imageUrl}
                    alt="Generated image"
                    className="w-full max-h-96 object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      // Firebase Storage URL이 실패하면 원본 URL로 fallback
                      if (selectedImage.storageImageUrl && selectedImage.imageUrl && e.target.src === selectedImage.storageImageUrl) {
                        e.target.src = selectedImage.imageUrl;
                      }
                    }}
                  />
                </div>
              )}

              {/* Image Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Prompt</h4>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-800">{selectedImage.prompt || 'No prompt provided'}</p>
                      <button
                        onClick={() => copyPrompt(selectedImage.prompt)}
                        className="mt-2 flex items-center space-x-2 text-xs text-slate-600 hover:text-slate-800 transition-colors"
                      >
                        {copiedPrompt ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedImage.options && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Generation Options</h4>
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                        {Object.entries(selectedImage.options).map(([key, value]) => {
                          if (!value || (Array.isArray(value) && value.length === 0)) return null;
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="text-xs font-medium text-slate-600 capitalize">{key}:</span>
                              <span className="text-xs text-slate-800">
                                {Array.isArray(value) ? value.join(', ') : value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Actions</h4>
                    <div className="space-y-2">
                      {(selectedImage.storageImageUrl || selectedImage.imageUrl) && (
                        <button 
                          onClick={() => downloadImage(selectedImage.storageImageUrl || selectedImage.imageUrl, 'png')}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Image</span>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (onRegenerate) onRegenerate(selectedImage);
                          handleCloseDetail();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Metadata</h4>
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">ID:</span>
                        <span className="text-slate-800 font-mono">{selectedImage.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={`font-medium ${
                          selectedImage.error ? 'text-red-600' : 
                          selectedImage.isProcessing ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {getStatusText(selectedImage)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Created:</span>
                        <span className="text-slate-800">
                          {new Date(selectedImage.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCardStack; 