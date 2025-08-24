import { Router } from "express";
import { z } from "zod";
import { openai } from "../openai";

const router = Router();

const bodySchema = z.object({
  type: z.enum(["Icon", "Emoji", "Illustration", "Logo", "Character"]),
  style: z.enum([
    "LiquidGlass",
    "NeonGlow",
    "PixelArt",
    "Skeuomorphism",
    "3D",
    "Flat",
    "Gradient",
    "Minimalist"
  ]),
  // GPT-Image-1 지원 크기: 1024x1024, 1024x1536, 1536x1024, auto
  size: z.enum(["256", "512", "1024"]).transform((s) => {
    // GPT-Image-1은 1024x1024 지원
    return "1024x1024";
  }),
  extras: z.array(z.string()).default([]),
  description: z.string().min(1)
});

// 스타일 설명(프롬프트 보조)
function styleDesc(style: string): string {
  const dict: Record<string, string> = {
    LiquidGlass:
      "liquid glass aesthetic with refraction-like highlights, rounded corners, subtle inner shadows; clean export-friendly gradients",
    NeonGlow:
      "thin neon strokes with strong outer glow; crisp edges; avoid page fill",
    PixelArt:
      "grid-aligned rectangular blocks; limited palette; no blur; no gradients",
    Skeuomorphism:
      "tactile bevels and material cues; layered gradients; vector-friendly",
    "3D":
      "layered gradients for depth; AO-like soft shadow; no raster textures",
    Flat: "solid fills; simple geometry; high contrast; no shadows",
    Gradient: "bold multi-stop gradients with smooth transitions; no page background",
    Minimalist: "few shapes; large negative space; 1–2 colors; consistent thin strokes"
  };
  return dict[style] ?? "clean, professional vector look";
}

// GPT-Image-1 최적화 프롬프트 (투명 배경 지원)
function buildImagePrompt(input: z.infer<typeof bodySchema>) {
  return [
    `TYPE: ${input.type} | STYLE: ${input.style} | TARGET SIZE: 1024x1024`,
    `STYLE-DESC: ${styleDesc(input.style)}`,
    `MAIN REQUEST: ${input.description}`,
    "",
    "COMPOSITION:",
    "- centered single subject; balanced margins; no scene; no typography",
    "",
    "QUALITY & LOOK:",
    "- crisp, clean edges; professional, export-friendly rendering",
    "- avoid photographic textures, noise, banding, watermark",
    "",
    "CRITICAL BACKGROUND RULES:",
    "- transparent background only",
    "- no background color, no textures, no vignette, no canvas fill",
    "- do not add outer drop shadows that read as page background"
  ].join("\n");
}

router.post("/generate", async (req, res) => {
  try {
    const input = bodySchema.parse(req.body);

    // 1) 프롬프트 조립
    const prompt = buildImagePrompt(input);

    // 2) GPT-Image-1로 이미지 생성 (투명 배경 지원)
    console.log("🚀 Sending request to GPT-Image-1 with prompt:", prompt);
    console.log("📏 Size:", input.size);
    
    const imgResp = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: input.size as "1024x1024",
      background: "transparent" // 투명 배경 강제
    });

    console.log("📡 GPT-Image-1 response:", JSON.stringify(imgResp, null, 2));
    
    const data = imgResp.data?.[0];
    console.log("📊 First data item:", data);
    
    // GPT-Image-1은 b64_json 또는 url을 반환할 수 있음
    const imageUrl = data?.url || data?.b64_json;
    if (!imageUrl) {
      console.error("❌ No image data in response");
      console.error("❌ Full response data:", imgResp.data);
      throw new Error("Image generation failed (no data)");
    }
    
    // b64_json이 있으면 data URL로 변환, 없으면 URL 그대로 사용
    let finalImageUrl = imageUrl;
    if (data?.b64_json) {
      finalImageUrl = `data:image/png;base64,${data.b64_json}`;
    }

    // 3) 응답 (GPT-Image-1은 투명 배경 지원)

    res.json({
      status: "ok",
      asset: {
        svg: "", // SVG는 생성하지 않으므로 빈 문자열
        png: finalImageUrl,
        jpeg: null,
        dalleImage: finalImageUrl, // 클라이언트 호환성을 위해 dalleImage 필드 추가
        storageImageUrl: finalImageUrl // storageImageUrl도 추가
      },
      code: {
        svg: "",
        react: "",
        html: "",
        dataUrl: finalImageUrl
      },
      meta: {
        type: input.type,
        style: input.style,
        size: String(input.size),
        extras: input.extras,
        checksum: `gpt-image-1-${Date.now()}`,
        description: input.description
      },
      message: "Image generated successfully with GPT-Image-1 (transparent background)"
    });
  } catch (e: any) {
    console.error("[GPT-Image-1] generation error:", e);
    console.error("Error details:", {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
      code: e?.code,
      status: e?.status
    });
    
    // OpenAI API 에러인지 확인
    if (e?.status) {
      res.status(e.status).json({
        status: "error",
        message: `OpenAI API Error: ${e.message}`,
        code: e.status
      });
    } else {
      res.status(500).json({
        status: "error",
        message: e?.message || "Generation failed",
        details: e?.toString()
      });
    }
  }
});

export default router; 