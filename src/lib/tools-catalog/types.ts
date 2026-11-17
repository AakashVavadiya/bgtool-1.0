// Shared type definitions and category list for the tool catalog.
import { type LucideIcon } from "lucide-react";

export type ToolCategory =
  | "AI Tools"
  | "Image Editing & Optimization"
  | "Format Converters"
  | "Document Converters"
  | "Creative & Utilities"
  | "PDF Tools";

export const TOOL_CATEGORIES: ToolCategory[] = [
  "AI Tools",
  "Image Editing & Optimization",
  "Format Converters",
  "Document Converters",
  "Creative & Utilities",
  "PDF Tools",
];

export type Tool = {
  slug: string;
  name: string;
  category: ToolCategory;
  icon: LucideIcon;
  tag?: string;
  blurb: string;
  accepts: string;
  outputs: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    article: {
      intro: string;
      howTo: string[];
      benefits: { heading: string; body: string }[];
      faqs: { q: string; a: string }[];
    };
  };
};

