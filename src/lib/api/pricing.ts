import { configRepo } from "../db";

export interface ToolPricingConfig {
  endpoint: string;
  toolSlug: string;
  name: string;
  creditCost: number;
  description: string;
  category: "ai" | "conversion";
  scope: string;
}

export const API_TOOL_PRICING: Record<string, ToolPricingConfig> = {
  "remove-background": {
    endpoint: "/api/v1/remove-background",
    toolSlug: "remove-bg",
    name: "Remove Background",
    creditCost: 1,
    description: "Neural AI background removal with transparency preservation.",
    category: "ai",
    scope: "remove-bg",
  },
  "remove-watermark": {
    endpoint: "/api/v1/remove-watermark",
    toolSlug: "remove-watermark",
    name: "Remove Watermark",
    creditCost: 1,
    description: "Deep inpainting watermark and text remover.",
    category: "ai",
    scope: "remove-watermark",
  },
  "blur-face": {
    endpoint: "/api/v1/blur-face",
    toolSlug: "blur-face",
    name: "Face Blur & Anonymization",
    creditCost: 1,
    description: "Automated neural facial detection and privacy blurring.",
    category: "ai",
    scope: "blur-face",
  },
  "detect-faces": {
    endpoint: "/api/v1/detect-faces",
    toolSlug: "blur-face",
    name: "Face Detection",
    creditCost: 0.5,
    description: "Fast face detection returning bounding box coordinates.",
    category: "ai",
    scope: "detect-faces",
  },
  "compress-image": {
    endpoint: "/api/v1/compress-image",
    toolSlug: "compress-image",
    name: "Compress Image",
    creditCost: 0.25,
    description: "Smart quality loss-minimized image size compression.",
    category: "conversion",
    scope: "compress-image",
  },
  "convert-image": {
    endpoint: "/api/v1/convert-image",
    toolSlug: "convert-image",
    name: "Convert Image Format",
    creditCost: 0.25,
    description: "Cross-format conversion between PNG, JPEG, and WebP.",
    category: "conversion",
    scope: "convert-image",
  },
  "resize-image": {
    endpoint: "/api/v1/resize-image",
    toolSlug: "resize-image",
    name: "Resize Image",
    creditCost: 0.25,
    description: "Scale dimensions with high-fidelity Lanczos/Bicubic resampling.",
    category: "conversion",
    scope: "resize-image",
  },
  "crop-image": {
    endpoint: "/api/v1/crop-image",
    toolSlug: "crop-image",
    name: "Crop Image",
    creditCost: 0.25,
    description: "Pixel-accurate cropping with bounding rectangle or aspect ratio.",
    category: "conversion",
    scope: "crop-image",
  },
};

/**
 * Get current effective credit cost for an API endpoint.
 * Checks SQLite configRepo for dynamic admin overrides if present.
 */
export function getEndpointCreditCost(endpointKey: string): number {
  const defaultCfg = API_TOOL_PRICING[endpointKey];
  if (!defaultCfg) return 1;

  try {
    const tools = configRepo.getToolsConfig();
    const match = tools.find(
      (t) => t.slug === defaultCfg.toolSlug || t.slug === endpointKey || (t.slug === "remove-bg" && endpointKey === "remove-background")
    );
    if (match && typeof match.creditCost === "number" && match.creditCost >= 0) {
      return match.creditCost;
    }
  } catch {}

  return defaultCfg.creditCost;
}
