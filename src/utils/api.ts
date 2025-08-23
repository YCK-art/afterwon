const API_BASE_URL = '/api';

export interface GenerationRequest {
  type: 'Icon' | 'Emoji' | 'Illustration' | 'Logo' | 'Character';
  style: 'LiquidGlass' | 'NeonGlow' | 'PixelArt' | 'Skeuomorphism' | '3D' | 'Flat' | 'Gradient' | 'Minimalist';
  size: '128' | '256' | '512' | '1024';
  extras: string[];
  description: string;
}

export interface GenerationResponse {
  status: 'ok' | 'error';
  asset: {
    svg: string;
    png: string | null;
    jpeg: string | null;
    dalleImage?: string; // DALL-E 이미지 URL 추가
  };
  code: {
    svg: string;
    react: string;
    html: string;
    dataUrl: string;
  };
  meta: {
    type: string;
    style: string;
    size: string;
    extras: string[];
    checksum: string;
    description?: string; // 설명 추가
  };
  message?: string;
}

export async function generateAsset(request: GenerationRequest): Promise<GenerationResponse> {
  try {
    console.log('🚀 Sending generation request to:', `${API_BASE_URL}/generate`)
    console.log('📝 Request data:', request)
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError)
      }
      
      throw new Error(errorMessage)
    }

    const responseText = await response.text()
    console.log('📄 Raw response:', responseText.substring(0, 200) + '...')
    
    if (!responseText.trim()) {
      throw new Error('Empty response from server')
    }

    try {
      const result = JSON.parse(responseText)
      console.log('✅ Parsed response successfully')
      return result
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('❌ Response text:', responseText)
      throw new Error(`Failed to parse server response: ${parseError.message}`)
    }
  } catch (error) {
    console.error('❌ API Error:', error)
    throw error
  }
}

export function downloadSvg(svg: string, filename: string = 'generated.svg') {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPng(dataUrl: string, filename: string = 'generated.png') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
} 