import crypto from "crypto";

export function validateSvg(svg: string, size: number): string {
  const trimmedSvg = svg.trim();
  
  // 단일 <svg> 태그인지 확인
  if (!/^<svg[\s\S]*<\/svg>$/.test(trimmedSvg)) {
    throw new Error("Not a single <svg> element");
  }
  
  // 래스터 이미지 금지
  if (/<(image|img)\b/i.test(trimmedSvg)) {
    throw new Error("Raster <image> elements not allowed");
  }
  
  // 배경 관련 금지
  if (/background/i.test(trimmedSvg)) {
    throw new Error("Background elements not allowed");
  }
  
  // 외부 링크 금지
  if (/href\s*=\s*["']http/i.test(trimmedSvg)) {
    throw new Error("External links not allowed");
  }
  
  // viewBox가 올바른지 확인 (필요시 후처리)
  if (!new RegExp(`viewBox="0 0 ${size} ${size}"`).test(trimmedSvg)) {
    console.warn(`Warning: SVG viewBox may not match expected size ${size}x${size}`);
  }
  
  return trimmedSvg;
}

export function generateCodeVariants(svg: string) {
  return {
    svg: svg,
    react: `export default function Component() {\n  return (\n    ${svg}\n  );\n}`,
    html: `<div>\n  ${svg}\n</div>`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/%20/g, ' ')}`
  };
}

export function generateChecksum(svg: string): string {
  return crypto.createHash("sha256").update(svg).digest("hex");
}

export function convertSvgToPng(svg: string, size: number): Promise<string> {
  // 실제 구현에서는 Playwright나 Sharp를 사용
  // 여기서는 base64로 인코딩된 간단한 PNG 반환 (실제로는 SVG를 렌더링)
  return Promise.resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
} 