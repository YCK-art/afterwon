import { Router } from "express";

const router = Router();

// 이미지 프록시 엔드포인트 (CORS 문제 해결)
router.get("/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        error: 'Image URL is required' 
      });
    }

    console.log('🔄 Proxying image from:', url);

    // URL 유효성 검사
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    // 이미지 다운로드
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // Azure Blob Storage의 경우 인증 헤더가 필요할 수 있음
      mode: 'cors',
      // 타임아웃 설정
      signal: AbortSignal.timeout(30000) // 30초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // 응답 헤더 설정
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1시간 캐시

    // 이미지 데이터 스트리밍
    if (response.body) {
      // Node.js 환경에서는 response.body가 ReadableStream이므로
      // Buffer로 변환하여 전송
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } else {
      throw new Error('No response body');
    }

  } catch (error: any) {
    console.error('❌ Image proxy error:', error);
    
    // 타임아웃 에러 처리
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timeout',
        message: 'Image fetch timed out after 30 seconds'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to proxy image',
      message: error.message || 'Unknown error'
    });
  }
});

// Firebase Storage 이미지 프록시 엔드포인트 (CORS 문제 해결)
router.get("/proxy-storage", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        error: 'Storage URL is required' 
      });
    }

    console.log('🔄 Proxying Firebase Storage image from:', url);

    // Firebase Storage URL 유효성 검사
    if (!url.includes('firebasestorage.googleapis.com')) {
      return res.status(400).json({ 
        error: 'Invalid Firebase Storage URL' 
      });
    }

    // 이미지 다운로드 (더 안정적인 설정)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive'
      },
      mode: 'cors',
      // 타임아웃 설정
      signal: AbortSignal.timeout(30000), // 30초 타임아웃
      // 추가 옵션
      redirect: 'follow',
      referrerPolicy: 'no-referrer'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // 응답 헤더 설정 (CORS 문제 해결)
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1시간 캐시
    res.setHeader('Vary', 'Origin');

    // 이미지 데이터 스트리밍
    if (response.body) {
      // Node.js 환경에서는 response.body가 ReadableStream이므로
      // Buffer로 변환하여 전송
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } else {
      throw new Error('No response body');
    }

  } catch (error: any) {
    console.error('❌ Firebase Storage proxy error:', error);
    
    // 타임아웃 에러 처리
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timeout',
        message: 'Image fetch timed out after 30 seconds'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to proxy Firebase Storage image',
      message: error.message || 'Unknown error'
    });
  }
});

// 이미지 정보 확인 엔드포인트
router.get("/check-image", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        error: 'Image URL is required' 
      });
    }

    console.log('🔍 Checking image:', url);

    // HEAD 요청으로 이미지 정보 확인
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(404).json({
        exists: false,
        status: response.status,
        message: response.statusText
      });
    }

    // 이미지 정보 반환
    res.json({
      exists: true,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      lastModified: response.headers.get('last-modified'),
      etag: response.headers.get('etag')
    });

  } catch (error: any) {
    console.error('❌ Image check error:', error);
    res.status(500).json({ 
      error: 'Failed to check image',
      message: error.message || 'Unknown error'
    });
  }
});

export default router; 