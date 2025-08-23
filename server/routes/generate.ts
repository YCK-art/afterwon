import { Router } from "express";
import { z } from "zod";
import { openai } from "../openai";
import { assembleUserPrompt, SYSTEM_PROMPT } from "../utils/templateLocking";
import { validateSvg, generateCodeVariants, generateChecksum, convertSvgToPng } from "../utils/svgUtils";

// 스타일별 상세 설명
function getStyleDescription(style: string): string {
  const styleDescriptions: Record<string, string> = {
    LiquidGlass: "smooth, translucent glass effect with realistic refraction and highlights",
    NeonGlow: "vibrant neon colors with glowing edges and cyberpunk aesthetic",
    PixelArt: "retro pixelated style with clear, blocky shapes and limited color palette",
    Skeuomorphism: "realistic 3D appearance with shadows, depth, and tactile feel",
    "3D": "three-dimensional design with depth, perspective, and realistic lighting",
    Flat: "clean, minimalist design with solid colors and simple geometric shapes",
    Gradient: "smooth color transitions and beautiful color blending",
    Minimalist: "simple, elegant design with plenty of white space and clean lines"
  };
  
  return styleDescriptions[style] || "professional and modern design";
}

const router = Router();

const bodySchema = z.object({
  type: z.enum(["Icon", "Emoji", "Illustration", "Logo", "Character"]),
  style: z.enum(["LiquidGlass", "NeonGlow", "PixelArt", "Skeuomorphism", "3D", "Flat", "Gradient", "Minimalist"]),
  size: z.enum(["512", "1024"]).transform(s => parseInt(s, 10)), // DALL-E 3 지원 크기만 허용
  extras: z.array(z.string()).default([]),
  description: z.string().min(1)
});

router.post("/generate", async (req, res) => {
  try {
    const input = bodySchema.parse(req.body);
    const userPrompt = assembleUserPrompt(input);

    console.log("Generating with prompt:", userPrompt);

    // 1단계: DALL-E로 고품질 이미지 생성
    let dalleImageUrl = null;
    
    try {
      const dallePrompt = `Create a high-quality, professional ${input.type.toLowerCase()} with the following specifications:
      
      MAIN REQUEST: ${input.description}
      STYLE: ${input.style} - ${getStyleDescription(input.style)}
      TYPE: ${input.type}
      
      DESIGN APPROACH:
      - Create a VECTOR-STYLE design that looks like it was made in Adobe Illustrator or similar vector software
      - Use clean, geometric shapes and smooth curves typical of vector graphics
      - Apply flat design principles with minimal shadows and depth
      - Focus on crisp, clean edges and solid color fills
      
      QUALITY REQUIREMENTS:
      - Ultra-high definition, detailed, professional design
      - Clean, centered composition with no background clutter
      - Vibrant, professional color palette
      - Sharp, crisp details with no blur or pixelation
      - Professional graphic design quality
      
      CRITICAL REQUIREMENTS:
      - VECTOR STYLE: Make it look like a vector graphic, not a photograph
      - NO BACKGROUND: Create the ${input.type.toLowerCase()} on a completely transparent/white background
      - TRANSPARENT BACKGROUND: The image must have no background, background color, or background elements
      - CENTERED DESIGN: Place the main subject in the center with no background distractions
      - CLEAN EDGES: Ensure the design has clean, crisp edges without any background elements
      - FLAT DESIGN: Use flat design principles with minimal 3D effects or shadows
      - SOLID COLORS: Use solid, vibrant colors typical of vector graphics
      
      IMPORTANT: Focus on the main request "${input.description}" and make it the central element of the design. The final image must look like a professional vector graphic with a completely transparent background, no background colors, patterns, or elements. Make it appear as if it was created in vector design software.`;
      
      // DALL-E 3 크기 제한에 맞춰 크기 조정
      // DALL-E 3는 1024x1024만 지원
      const dalleSize: '1024x1024' = '1024x1024';
      
      const imageGeneration = await openai.images.generate({
        model: "dall-e-3",
        prompt: dallePrompt,
        n: 1,
        size: dalleSize,
        quality: "hd",
        style: "vivid"
      });

      dalleImageUrl = imageGeneration.data?.[0]?.url;
      
      if (dalleImageUrl) {
        console.log("DALL-E image generated:", dalleImageUrl);
      }
    } catch (dalleError) {
      console.warn("DALL-E generation failed:", dalleError);
      throw new Error("Failed to generate image with DALL-E. Please try again.");
    }

    // 2단계: DALL-E 이미지를 기반으로 ChatGPT로 코드 생성
    const codeGenerationPrompt = `Create high-quality SVG code for the following request:

    USER REQUEST: ${input.description}
    STYLE: ${input.style}
    TYPE: ${input.type}
    SIZE: ${input.size}x${input.size}
    
    REQUIREMENTS:
    - Create a professional, high-quality SVG that matches the user's request exactly
    - Use clean, optimized SVG code with proper viewBox and dimensions
    - Include appropriate colors, gradients, and effects for the specified style
    - Make sure the design is centered and properly sized
    - No background, clean design
    
    OUTPUT FORMAT:
    - SVG code only (no explanations)
    - Proper viewBox="0 0 ${input.size} ${input.size}"
    - Clean, export-friendly paths
    - No watermarks or unnecessary elements`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      top_p: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: codeGenerationPrompt }
      ]
    });

    const svg = completion.choices?.[0]?.message?.content?.trim() || "";
    
    if (!svg) {
      throw new Error("No SVG content received from AI");
    }

    console.log("Generated SVG based on DALL-E image:", svg.substring(0, 100) + "...");

    const validSvg = validateSvg(svg, input.size);
    const checksum = generateChecksum(validSvg);
    const codeVariants = generateCodeVariants(validSvg);

    // PNG 변환 (선택사항)
    const png = await convertSvgToPng(validSvg, input.size);

    res.json({
      status: "ok",
      asset: { 
        svg: validSvg, 
        png: png, 
        jpeg: null,
        dalleImage: dalleImageUrl // DALL-E 이미지 URL 추가
      },
      code: codeVariants,
      meta: { 
        ...input, 
        size: input.size.toString(),
        checksum 
      }
    });

  } catch (e: any) {
    console.error("Generation error:", e);
    res.status(400).json({ 
      status: "error", 
      message: e.message || "Generation failed" 
    });
  }
});

// 이미지 다운로드 엔드포인트 추가
router.post("/download-image", async (req, res) => {
  try {
    const { imageUrl, format = 'png' } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log(`Downloading image from: ${imageUrl} as ${format}`);

    // 이미지 다운로드
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    
    // 포맷에 따른 MIME 타입 설정
    let mimeType = 'image/png';
    let fileExtension = 'png';
    
    if (format === 'jpg' || format === 'jpeg') {
      mimeType = 'image/jpeg';
      fileExtension = 'jpg';
    } else if (format === 'webp') {
      mimeType = 'image/webp';
      fileExtension = 'webp';
    }

    // 응답 헤더 설정
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="ai-generated-image.${fileExtension}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 이미지 데이터 전송
    res.send(Buffer.from(imageBuffer));
    
  } catch (error: any) {
    console.error('Image download error:', error);
    res.status(500).json({ 
      error: 'Failed to download image',
      message: error.message || 'Unknown error'
    });
  }
});

export default router; 