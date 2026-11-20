// Main tool registry combining image, AI, document, and PDF tool catalogs.
// Keeping the catalog split by domain makes individual tool configs easier to maintain.
import { TOOL_CATEGORIES, type Tool, type ToolCategory } from "./tools-catalog/types";
import { imageAndAiTools } from "./tools-catalog/image-and-ai-tools";
import { pdfCoreTools } from "./tools-catalog/pdf-core-tools";
import { pdfLayoutTools } from "./tools-catalog/pdf-layout-tools";
import { pdfConversionTools } from "./tools-catalog/pdf-conversion-tools";

export { TOOL_CATEGORIES, type Tool, type ToolCategory };

export const tools: Tool[] = [
  ...imageAndAiTools,
  ...pdfCoreTools,
  ...pdfLayoutTools,
  ...pdfConversionTools,
];


export const LEGACY_TOOL_SLUG_ALIASES: Record<string, string> = {
  "clean-upscale": "upscale-image",
  "rotate-crop": "rotate-image",
  "convert-compress": "compress-image",
  "images-to-pdf": "image-to-pdf",
  "image-to-text": "image-to-text-ocr",
  "remove-bg": "remove-background",
  "face-blur": "blur-face",
  "convert-image": "convert-to-jpg",
  "batch-png": "convert-from-jpg",
  "create-electronic-invoice": "create-invoice",
  "create-invoice-visually": "create-invoice",
  "pdf-converter": "pdf-to-word",
  "pdf-to-images": "pdf-to-jpg",
};

export const resolveCanonicalToolSlug = (slug: string): string =>
  LEGACY_TOOL_SLUG_ALIASES[slug] || slug;

export const getTool = (slug: string) => {
  const canonical = resolveCanonicalToolSlug(slug);
  return tools.find((t) => t.slug === canonical);
};
