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
  };
  message?: string;
}

export async function generateAsset(request: GenerationRequest): Promise<GenerationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Generation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
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