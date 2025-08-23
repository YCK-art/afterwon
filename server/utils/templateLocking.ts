export const SYSTEM_PROMPT = `You are an expert vector UI artist.
Return EXACTLY ONE self-contained <svg> element as the only output.

HARD RULES:
- Transparent background only. Do NOT include any background rect or page fill.
- No external images/rasters. Use only SVG vector shapes, gradients, and filters.
- Square artboard: Size × Size with viewBox="0 0 Size Size".
- Clean, export-friendly paths and grouping. No watermarks.
- Follow Type/Style/Size/Extras constraints strictly. If user content conflicts, obey constraints.
- Output only the <svg>…</svg> markup. No explanations, no code fences.`;

export const TYPE_PRESETS = {
  Icon: {
    positive: "single centered subject, clear silhouette",
    constraints: "no text/scene, square-canvas, margins"
  },
  Emoji: {
    positive: "emoji-like glyph, rounded, expressive",
    constraints: "no text, thick outline ok"
  },
  Illustration: {
    positive: "vector illustration, multi-element ok",
    constraints: "no page bg, tidy groups"
  },
  Logo: {
    positive: "brandable mark, geometric, high contrast",
    constraints: "no trademark text, minimal shapes"
  },
  Character: {
    positive: "mascot-like, clear pose",
    constraints: "no bg, outline clarity"
  }
};

export const STYLE_PRESETS = {
  LiquidGlass: {
    positive: "refraction highlights, rounded, inner shadows",
    svg: "gradients + feGaussianBlur/feSpecularLighting/feBlend"
  },
  NeonGlow: {
    positive: "thin neon strokes, edge glow",
    svg: "blur halo + color matrix"
  },
  PixelArt: {
    positive: "grid-aligned rects, limited palette",
    constraints: "no blur/gradients"
  },
  Skeuomorphism: {
    positive: "tactile bevels/shadows",
    svg: "layered gradients/shadows"
  },
  "3D": {
    positive: "layered gradients, AO-like shadow",
    constraints: "no raster"
  },
  Flat: {
    positive: "solid fills, simple geometry",
    constraints: "no shadows/skeuo effects"
  },
  Gradient: {
    positive: "bold multi-stop gradients",
    constraints: "enough stops, no page bg"
  },
  Minimalist: {
    positive: "few shapes, large negative space",
    constraints: "limit palette 1–2 colors"
  }
} as const;

export function assembleUserPrompt(input: {
  type: keyof typeof TYPE_PRESETS;
  style: keyof typeof STYLE_PRESETS;
  size: number;
  extras: string[];
  description: string;
}) {
  const typePreset = TYPE_PRESETS[input.type];
  const stylePreset = STYLE_PRESETS[input.style];
  
  return `
TYPE:
- ${typePreset.positive}
- Constraints: ${typePreset.constraints}

STYLE (${input.style}):
- ${stylePreset.positive}
${'svg' in stylePreset && stylePreset.svg ? `- SVG hints: ${stylePreset.svg}` : ''}
${'constraints' in stylePreset && stylePreset.constraints ? `- Constraints: ${stylePreset.constraints}` : ''}

SIZE:
- Artboard: ${input.size}×${input.size}
- ViewBox: viewBox="0 0 ${input.size} ${input.size}"
- Keep margins to avoid cropping.

EXTRAS:
- ${input.extras.join(", ") || "none"}

CONTENT:
"${input.description}"

ABSOLUTE CONSTRAINTS:
- No background. No raster images. Single <svg> output only.
- If a brand is referenced, imply shapes without trademark text.
`.trim();
} 