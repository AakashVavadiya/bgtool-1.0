// Shared type definitions and category list for the tool catalog.
import {
  Minimize2,
  Scaling,
  Crop,
  FileImage,
  ImageDown,
  ScanText,
  Binary,
  FileType2,
  FileText,
  Sheet,
  Presentation,
  Code2,
  FileDown,
  Table2,
  FileSpreadsheet,
  MonitorPlay,
  ImagePlus,
  Sparkle,
  Scissors,
  Eraser,
  Stamp,
  RotateCw,
  SmilePlus,
  Laugh,
  SlidersHorizontal,
  Pipette,
  FileCode,
  FileDigit,
  Terminal,
  Type,
  Hash,
  Square,
  Merge,
  SplitSquareVertical,
  FilePlus,
  FilePen,
  FileSignature,
  FileOutput,
  Images,
  Camera,
  Globe,
  ClipboardList,
  Briefcase,
  QrCode,
  Receipt,
  CreditCard,
  FileX,
  BookOpen,
  Layers,
  Lock,
  Unlock,
  ShieldOff,
  GitCompare,
  Wrench,
  Zap,
  Shield,
  BookMarked,
  FileSearch,
  ArrowLeftRight,
  Eye,
  Settings2,
  LayoutGrid,
  Columns,
  Printer,
  KeyRound,
  Maximize2,
  FileInput,
  FileCheck,
  FileStack,
  FormInput,
  type LucideIcon,
} from "lucide-react";

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

