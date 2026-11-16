// Document-to-PDF and PDF-to-Document format conversion tool definitions.
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

import type { Tool } from "./types";

export const pdfConversionTools: Tool[] = [
  {
    slug: "docx-to-pdf",
    name: "DOCX to PDF",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert modern Microsoft Word (.docx) documents to PDF with layout and typography preserved.",
    accepts: ".docx",
    outputs: "PDF Document",
    seo: {
      title: "DOCX to PDF Online Free — Convert Word DOCX to PDF Document",
      description: "Convert Microsoft Word .docx files to PDF online for free. Preserves document layouts, tables, headers, footers, and font styling perfectly.",
      keywords: ["docx to pdf","convert docx to pdf","word docx to pdf free","docx file to pdf online","save docx as pdf"],
      article: {
        intro: "Transform Microsoft Word (.docx) documents into universally readable PDF files without needing Word or Microsoft Office installed.",
        howTo: ["Upload your .docx file.","Review automatic layout and pagination conversion.","Click Convert to PDF.","Download your print-ready PDF."],
        benefits: [
          {
                    "heading": "Strict Layout Fidelity",
                    "body": "Retains complex margins, tables, bullet points, and column formats."
          },
          {
                    "heading": "Preserves Links & Bookmarks",
                    "body": "Hyperlinks, table of contents, and internal page jumps remain clickable."
          },
          {
                    "heading": "Cross-Platform Sharing",
                    "body": "Eliminates font shifting and formatting issues across different devices."
          },
          {
                    "heading": "Instant & Free",
                    "body": "Converts documents in seconds without watermarks or limits."
          }
],
        faqs: [
          {
                    "q": "Do I need Microsoft Word installed?",
                    "a": "No, conversion is performed entirely in your browser using cloud-grade parsers."
          },
          {
                    "q": "Are embedded images preserved?",
                    "a": "Yes, all photos, charts, and diagrams remain at their original resolution."
          }
],
      },
    },
  },

  // PPTX to PDF
  {
    slug: "pptx-to-pdf",
    name: "PPTX to PDF",
    category: "PDF Tools",
    icon: Presentation,
    blurb: "Convert PowerPoint (.pptx) presentation decks into printable, presentation-ready PDF slides.",
    accepts: ".pptx",
    outputs: "PDF Slides",
    seo: {
      title: "PPTX to PDF Online Free — Convert PowerPoint to PDF Presentation",
      description: "Convert PowerPoint .pptx presentations to PDF online. Perfect for sharing presentation slides, printing handouts, and locking formatting.",
      keywords: ["pptx to pdf","convert pptx to pdf","powerpoint to pdf online","save pptx as pdf","slides to pdf converter"],
      article: {
        intro: "Convert Microsoft PowerPoint (.pptx) presentations into compact, universally viewable PDF decks. Ensure slides look identical on every screen.",
        howTo: ["Upload your PowerPoint (.pptx) deck.","Preview slide layouts and aspect ratios (16:9 or 4:3).","Click Convert to PDF.","Download your presentation-ready PDF document."],
        benefits: [
          {
                    "heading": "Slide-by-Slide Precision",
                    "body": "Each presentation slide becomes a crisp, full-bleed PDF page."
          },
          {
                    "heading": "No Font Discrepancies",
                    "body": "Eliminates missing font substitution bugs when presenting on foreign machines."
          },
          {
                    "heading": "Handout Ready",
                    "body": "Easy to print for conferences, lectures, and executive board reviews."
          },
          {
                    "heading": "Safe for Client Sharing",
                    "body": "Locks animations and master templates so recipients cannot alter slides."
          }
],
        faqs: [
          {
                    "q": "Are slide notes included?",
                    "a": "You can choose to export full slides only or slides with presenter notes."
          },
          {
                    "q": "What happens to PowerPoint animations?",
                    "a": "Animations are flattened to the final slide state for clean presentation."
          }
],
      },
    },
  },

  // XLSX to PDF
  {
    slug: "xlsx-to-pdf",
    name: "XLSX to PDF",
    category: "PDF Tools",
    icon: FileSpreadsheet,
    blurb: "Convert Excel (.xlsx) spreadsheets and calculation workbooks into cleanly paginated PDF files.",
    accepts: ".xlsx",
    outputs: "PDF Document",
    seo: {
      title: "XLSX to PDF Online Free — Convert Excel Sheets to PDF",
      description: "Convert Microsoft Excel .xlsx spreadsheets to PDF online for free. Auto-fit wide columns to one page and print clean financial reports.",
      keywords: ["xlsx to pdf","convert xlsx to pdf","excel spreadsheet to pdf","fit excel to one page pdf","excel to pdf online free"],
      article: {
        intro: "Convert Excel spreadsheets (.xlsx) into clean, printable PDF reports. Automatically fits wide sheets to page width without cutoffs.",
        howTo: ["Upload your Excel (.xlsx) file.","Choose orientation (Portrait or Landscape) and scale-to-fit options.","Select specific worksheets or convert the entire workbook.","Download your professional PDF spreadsheet."],
        benefits: [
          {
                    "heading": "No Truncated Columns",
                    "body": "Smart auto-fit ensures wide tables fit cleanly on standard paper sizes."
          },
          {
                    "heading": "Multi-Sheet Conversion",
                    "body": "Convert all tabs into consecutive sections or export selected tabs."
          },
          {
                    "heading": "Preserves Formulas & Values",
                    "body": "Displays calculated numbers, currencies, and percentages accurately."
          },
          {
                    "heading": "Financial Grade Privacy",
                    "body": "Files are handled securely with immediate client-side disposal."
          }
],
        faqs: [
          {
                    "q": "Can I fit wide tables onto one page?",
                    "a": "Yes, select 'Fit all columns on one page' to prevent horizontal splitting."
          },
          {
                    "q": "Are cell borders and colors preserved?",
                    "a": "Yes, styling, gridlines, and cell background colors are accurately rendered."
          }
],
      },
    },
  },

  // DOC to PDF
  {
    slug: "doc-to-pdf",
    name: "DOC to PDF",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert legacy Microsoft Word 97-2003 (.doc) files into standard, modern PDF documents.",
    accepts: ".doc",
    outputs: "PDF Document",
    seo: {
      title: "Convert DOC to PDF Online Free — Word 97-2003 to PDF",
      description: "Convert legacy Word .doc files to modern PDF documents online. Fast, secure, and preserves fonts, tables, and document structures.",
      keywords: ["doc to pdf","convert doc to pdf","legacy word to pdf","doc file to pdf free","microsoft word doc converter"],
      article: {
        intro: "Older .doc files from Word 97-2003 can be difficult to open in modern workflows. Convert them to universally supported PDFs instantly.",
        howTo: ["Upload your legacy .doc document.","Wait while binary formatting tags are translated.","Preview the converted document.","Download the modern PDF."],
        benefits: [
          {
                    "heading": "Legacy Compatibility",
                    "body": "Revives older archival documents without requiring vintage software."
          },
          {
                    "heading": "Secure Modern Format",
                    "body": "Protects outdated binary files from corruption and malware."
          },
          {
                    "heading": "Standard Pagination",
                    "body": "Locks pagination so files print identically across all environments."
          },
          {
                    "heading": "Free & Fast",
                    "body": "Process files in seconds directly in your web browser."
          }
],
        faqs: [
          {
                    "q": "Can this convert Word 97, 2000, and 2003 files?",
                    "a": "Yes, all legacy binary .doc revisions are supported."
          },
          {
                    "q": "Will track changes or comments be visible?",
                    "a": "You can choose to render documents with or without markup."
          }
],
      },
    },
  },

  // PPT to PDF
  {
    slug: "ppt-to-pdf",
    name: "PPT to PDF",
    category: "PDF Tools",
    icon: Presentation,
    blurb: "Convert classic PowerPoint 97-2003 (.ppt) slide decks into universal PDF documents.",
    accepts: ".ppt",
    outputs: "PDF Slides",
    seo: {
      title: "Convert PPT to PDF Online Free — Classic PowerPoint to PDF",
      description: "Convert legacy PowerPoint .ppt presentations into modern PDF files online. Preserves classic slide backgrounds, fonts, and graphics.",
      keywords: ["ppt to pdf","convert ppt to pdf","powerpoint 97-2003 to pdf","classic ppt to pdf","slide deck to pdf converter"],
      article: {
        intro: "Easily convert legacy Microsoft PowerPoint (.ppt) presentation decks into clean, portable PDF documents compatible with all devices.",
        howTo: ["Upload your .ppt presentation file.","Review the converted slide deck.","Click Convert to PDF.","Download your PDF presentation."],
        benefits: [
          {
                    "heading": "Revive Older Decks",
                    "body": "Open and present vintage slide files on modern laptops and tablets."
          },
          {
                    "heading": "Crisp Typography",
                    "body": "Renders text cleanly without missing font errors."
          },
          {
                    "heading": "Easy Distribution",
                    "body": "Send lightweight PDF decks to clients and students without compatibility issues."
          },
          {
                    "heading": "100% Free",
                    "body": "Convert as many presentations as you need."
          }
],
        faqs: [
          {
                    "q": "Does this require Microsoft Office 2003?",
                    "a": "No, conversion works completely online in any modern browser."
          },
          {
                    "q": "Can I print multi-slide handouts?",
                    "a": "Yes, you can configure pages per sheet for easy physical printing."
          }
],
      },
    },
  },

  // XLS to PDF
  {
    slug: "xls-to-pdf",
    name: "XLS to PDF",
    category: "PDF Tools",
    icon: FileSpreadsheet,
    blurb: "Convert classic Excel 97-2003 (.xls) spreadsheets into formatted, printable PDF documents.",
    accepts: ".xls",
    outputs: "PDF Document",
    seo: {
      title: "Convert XLS to PDF Online Free — Excel 97-2003 to PDF",
      description: "Convert legacy Excel .xls workbooks into professional PDF documents. Preserves tables, currencies, charts, and gridlines cleanly.",
      keywords: ["xls to pdf","convert xls to pdf","excel 97-2003 to pdf","legacy excel to pdf","xls workbook converter"],
      article: {
        intro: "Convert older Microsoft Excel binary workbooks (.xls) into standard PDF documents. Perfect for archival financial records and audits.",
        howTo: ["Upload your .xls workbook.","Configure sheet orientation and scaling.","Click Convert to PDF.","Download your formatted PDF report."],
        benefits: [
          {
                    "heading": "Archival Compliance",
                    "body": "Convert legacy spreadsheets into permanent, non-editable PDF records."
          },
          {
                    "heading": "Accurate Cell Alignment",
                    "body": "Preserves numbers, formulas, dates, and column widths."
          },
          {
                    "heading": "Chart Rendering",
                    "body": "Converts embedded Excel graphs and charts into vector PDF visuals."
          },
          {
                    "heading": "Secure Processing",
                    "body": "No sensitive financial data is retained on servers."
          }
],
        faqs: [
          {
                    "q": "Are macro-enabled sheets supported?",
                    "a": "Yes, sheet contents and visual outputs are rendered safely without executing macros."
          },
          {
                    "q": "Will multiple sheets be included?",
                    "a": "Yes, you can export all sheets into a single multi-page PDF."
          }
],
      },
    },
  },

  // ODT to PDF
  {
    slug: "odt-to-pdf",
    name: "ODT to PDF",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert OpenDocument Text (.odt) files from LibreOffice or OpenOffice into PDF.",
    accepts: ".odt",
    outputs: "PDF Document",
    seo: {
      title: "Convert ODT to PDF Online Free — OpenOffice & LibreOffice to PDF",
      description: "Convert OpenDocument .odt files to PDF online for free. Flawless conversion for LibreOffice Writer and Apache OpenOffice documents.",
      keywords: ["odt to pdf","convert odt to pdf","libreoffice to pdf","openoffice to pdf","opendocument text to pdf"],
      article: {
        intro: "OpenDocument Text (.odt) is the standard format for LibreOffice and open source suites. Convert your .odt files into universal PDFs in seconds.",
        howTo: ["Upload your .odt document.","Preview layout, fonts, and page breaks.","Click Convert to PDF.","Download your clean PDF document."],
        benefits: [
          {
                    "heading": "Open Source Standard",
                    "body": "Full fidelity rendering for LibreOffice Writer and OpenOffice files."
          },
          {
                    "heading": "Preserves Footnotes & Tables",
                    "body": "Academic papers, citations, and tables transfer seamlessly."
          },
          {
                    "heading": "Universal Sharing",
                    "body": "Recipients don't need LibreOffice installed to view your work."
          },
          {
                    "heading": "No Installation",
                    "body": "Works directly in your browser on Mac, Windows, Linux, and mobile."
          }
],
        faqs: [
          {
                    "q": "Are tables of contents preserved?",
                    "a": "Yes, linked headings and index tables remain fully functional."
          },
          {
                    "q": "Is there a file size limit?",
                    "a": "Generous file size limits accommodate large manuscripts and dissertations."
          }
],
      },
    },
  },

  // ODG to PDF
  {
    slug: "odg-to-pdf",
    name: "ODG to PDF",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Convert OpenDocument Graphics (.odg) vector drawings and diagrams to PDF format.",
    accepts: ".odg",
    outputs: "PDF Document",
    seo: {
      title: "Convert ODG to PDF Online Free — LibreOffice Draw to PDF",
      description: "Convert OpenDocument Graphics (.odg) vector drawings, diagrams, and flowcharts into clean, scalable PDF documents online.",
      keywords: ["odg to pdf","convert odg to pdf","libreoffice draw to pdf","opendocument graphics to pdf","draw file to pdf"],
      article: {
        intro: "LibreOffice Draw saves diagrams and technical vectors in .odg format. Convert them to vector PDFs for publishing and sharing.",
        howTo: ["Upload your .odg drawing or diagram.","Verify vector shapes and diagram canvas bounds.","Click Convert to PDF.","Download your vector-sharp PDF document."],
        benefits: [
          {
                    "heading": "Vector Preservation",
                    "body": "Flowcharts, technical schematics, and vector art remain infinitely scalable."
          },
          {
                    "heading": "Easy Collaboration",
                    "body": "Share technical drawings with teammates who lack LibreOffice Draw."
          },
          {
                    "heading": "High-DPI Printing",
                    "body": "Perfect for posters, blueprints, and engineering schematics."
          },
          {
                    "heading": "Private Processing",
                    "body": "Files are handled client-side with zero retention."
          }
],
        faqs: [
          {
                    "q": "Can I zoom in without pixelation?",
                    "a": "Yes, vector lines and bezier curves remain perfectly crisp at any zoom level."
          },
          {
                    "q": "Are embedded bitmap photos supported?",
                    "a": "Yes, hybrid vector and bitmap diagrams are rendered accurately."
          }
],
      },
    },
  },

  // ODS to PDF
  {
    slug: "ods-to-pdf",
    name: "ODS to PDF",
    category: "PDF Tools",
    icon: FileSpreadsheet,
    blurb: "Convert OpenDocument Spreadsheet (.ods) files from LibreOffice Calc into PDF.",
    accepts: ".ods",
    outputs: "PDF Document",
    seo: {
      title: "Convert ODS to PDF Online Free — LibreOffice Calc to PDF",
      description: "Convert OpenDocument .ods spreadsheets to PDF online for free. Retain formulas, gridlines, charts, and clean pagination.",
      keywords: ["ods to pdf","convert ods to pdf","libreoffice calc to pdf","opendocument spreadsheet to pdf","ods to pdf online free"],
      article: {
        intro: "Convert LibreOffice Calc (.ods) spreadsheets into handsome, readable PDF documents. Fit wide data sets cleanly onto printable sheets.",
        howTo: ["Upload your .ods spreadsheet file.","Select landscape or portrait orientation and scaling.","Click Convert to PDF.","Download your printable PDF report."],
        benefits: [
          {
                    "heading": "True OpenDocument Parsing",
                    "body": "Accurately interprets Calc cell formulas, styles, and number formatting."
          },
          {
                    "heading": "Clean Page Fitting",
                    "body": "Prevents awkward horizontal page splits by scaling tables to page width."
          },
          {
                    "heading": "Multi-Sheet Support",
                    "body": "Combines multiple workbook tabs into one structured document."
          },
          {
                    "heading": "Fast & Free",
                    "body": "Zero registration, zero queue times, and no fees."
          }
],
        faqs: [
          {
                    "q": "Can I hide grid lines in the output?",
                    "a": "Yes, you can toggle grid line visibility to match your preferences."
          },
          {
                    "q": "Are charts converted?",
                    "a": "Yes, bar graphs, pie charts, and data plots render as clean vector graphics."
          }
],
      },
    },
  },

  // ODP to PDF
  {
    slug: "odp-to-pdf",
    name: "ODP to PDF",
    category: "PDF Tools",
    icon: Presentation,
    blurb: "Convert OpenDocument Presentation (.odp) slides from LibreOffice Impress into PDF.",
    accepts: ".odp",
    outputs: "PDF Document",
    seo: {
      title: "Convert ODP to PDF Online Free — LibreOffice Impress to PDF",
      description: "Convert OpenDocument .odp presentations to PDF online for free. Retains slide backgrounds, layouts, typography, and graphics.",
      keywords: ["odp to pdf","convert odp to pdf","libreoffice impress to pdf","opendocument presentation to pdf","odp slides to pdf"],
      article: {
        intro: "Convert LibreOffice Impress (.odp) slide presentations into clean, portable PDF decks ready to display on projectors or share with clients.",
        howTo: ["Upload your .odp presentation.","Preview slide sequence and formatting.","Click Convert to PDF.","Download your presentation-ready PDF deck."],
        benefits: [
          {
                    "heading": "Cross-Platform Presentation",
                    "body": "Present your slides on any computer without font substitution glitches."
          },
          {
                    "heading": "Handout Printing",
                    "body": "Easily print slide decks for classroom distribution or meeting packets."
          },
          {
                    "heading": "Slide Integrity",
                    "body": "Locks layout and formatting so recipients cannot alter text."
          },
          {
                    "heading": "Free & Unlimited",
                    "body": "Convert unlimited presentations without watermarks."
          }
],
        faqs: [
          {
                    "q": "What happens to master slides and backgrounds?",
                    "a": "All master slide templates, gradients, and logos are accurately rendered."
          },
          {
                    "q": "Can I convert wide 16:9 slides?",
                    "a": "Yes, widescreen 16:9 and standard 4:3 aspects are automatically detected."
          }
],
      },
    },
  },

  // Text to PDF
  {
    slug: "text-to-pdf",
    name: "Text to PDF",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert plain text (.txt) files or pasted text into structured, clean PDF pages.",
    accepts: ".txt, Plain Text",
    outputs: "PDF Document",
    seo: {
      title: "Text to PDF Online Free — Convert TXT or Pasted Text to PDF",
      description: "Convert plain text (.txt) files or pasted notes into formatted PDF documents online. Customize font family, size, line spacing, and margins.",
      keywords: ["text to pdf","convert txt to pdf","txt file to pdf","paste text to pdf","plain text to pdf converter"],
      article: {
        intro: "Turn raw text notes, code snippets, or .txt files into clean, professional PDF documents with customizable typography and margins.",
        howTo: ["Upload a .txt file or paste your text directly into the editor.","Choose your preferred font (Serif, Sans, or Monospace) and font size.","Set margins and page numbering options.","Download your cleanly paginated PDF."],
        benefits: [
          {
                    "heading": "Custom Typography",
                    "body": "Select fonts, adjust line spacing, and choose font sizes for optimal reading."
          },
          {
                    "heading": "Smart Auto-Pagination",
                    "body": "Automatically breaks long text into numbered pages with clean paragraph flow."
          },
          {
                    "heading": "Code & Monospace Support",
                    "body": "Use fixed-width fonts for clean software logs, configuration files, and code."
          },
          {
                    "heading": "Instant Generation",
                    "body": "Generates formatted PDFs in milliseconds."
          }
],
        faqs: [
          {
                    "q": "Are UTF-8 special characters supported?",
                    "a": "Yes, full international unicode characters, accents, and symbols are supported."
          },
          {
                    "q": "Can I add page numbers?",
                    "a": "Yes, automatic header and footer page numbering can be toggled on."
          }
],
      },
    },
  },

  // RTF to PDF
  {
    slug: "rtf-to-pdf",
    name: "RTF to PDF",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert Rich Text Format (.rtf) documents with font styling and colors into PDF.",
    accepts: ".rtf",
    outputs: "PDF Document",
    seo: {
      title: "Convert RTF to PDF Online Free — Rich Text Format to PDF",
      description: "Convert Rich Text Format (.rtf) files to PDF online for free. Retains bold, italics, font colors, bullet lists, and paragraph formatting.",
      keywords: ["rtf to pdf","convert rtf to pdf","rich text format to pdf","wordpad rtf to pdf","rtf document converter"],
      article: {
        intro: "Rich Text Format (.rtf) documents from WordPad or Word can look inconsistent across devices. Convert them to standardized PDFs in seconds.",
        howTo: ["Upload your .rtf document.","Verify font styling, bolding, and colors.","Click Convert to PDF.","Download your standardized PDF file."],
        benefits: [
          {
                    "heading": "Preserves Rich Styling",
                    "body": "Retains bold, italics, font weights, colors, and text alignment."
          },
          {
                    "heading": "Universal Distribution",
                    "body": "Eliminates platform-specific RTF rendering differences."
          },
          {
                    "heading": "Print & Archive Ready",
                    "body": "Locks pagination for legal and contractual record keeping."
          },
          {
                    "heading": "Free & Private",
                    "body": "No registration and files are processed securely in your browser."
          }
],
        faqs: [
          {
                    "q": "Does this support WordPad files?",
                    "a": "Yes, files created in Windows WordPad or TextEdit are fully compatible."
          },
          {
                    "q": "Are bullet lists preserved?",
                    "a": "Yes, standard RTF bullet points, indents, and numbered lists render cleanly."
          }
],
      },
    },
  },

  // EPUB to PDF
  {
    slug: "epub-to-pdf",
    name: "EPUB to PDF",
    category: "PDF Tools",
    icon: BookOpen,
    blurb: "Convert EPUB electronic books into formatted, paginated PDF documents for printing and reading.",
    accepts: ".epub",
    outputs: "PDF Document",
    seo: {
      title: "Convert EPUB to PDF Online Free — EBook to PDF Converter",
      description: "Convert EPUB eBooks to printable PDF documents online. Retain book chapters, cover art, table of contents, and typography.",
      keywords: ["epub to pdf","convert epub to pdf","ebook to pdf converter","read epub as pdf","print epub book to pdf"],
      article: {
        intro: "Convert reflowable EPUB electronic books into fixed-layout, printable PDF documents. Perfect for reading on larger screens or printing physical copies.",
        howTo: ["Upload your .epub eBook file.","Choose target page size (A4, A5, or US Letter) and font size.","Preview chapter layouts and book cover.","Download your fully paginated PDF book."],
        benefits: [
          {
                    "heading": "Fixed Page Layout",
                    "body": "Turns reflowable e-reader text into permanent, numbered book pages."
          },
          {
                    "heading": "Preserves Chapters & Table of Contents",
                    "body": "Retains internal book navigation and chapter headings."
          },
          {
                    "heading": "Printable Format",
                    "body": "Ideal for printing physical books, academic readers, and manuals."
          },
          {
                    "heading": "Works with Any Reader",
                    "body": "Read on devices that do not have dedicated EPUB software installed."
          }
],
        faqs: [
          {
                    "q": "Are images and illustrations included?",
                    "a": "Yes, all embedded book artwork, covers, and illustrations are retained."
          },
          {
                    "q": "Can I choose A5 book format?",
                    "a": "Yes, you can choose pocket A5, standard A4, or custom book dimensions."
          }
],
      },
    },
  },

  // Markdown to PDF
  {
    slug: "markdown-to-pdf",
    name: "Markdown to PDF",
    category: "PDF Tools",
    icon: FileCode,
    blurb: "Render Markdown (.md) documents with syntax highlighting and headers into formatted PDF files.",
    accepts: ".md, Markdown",
    outputs: "PDF Document",
    seo: {
      title: "Markdown to PDF Online Free — Convert MD to Styled PDF",
      description: "Convert Markdown (.md) files to beautiful PDF documents online. Features syntax highlighting, tables, math equations, and modern typography.",
      keywords: ["markdown to pdf","convert md to pdf","markdown file to pdf","readme to pdf","markdown styled pdf generator"],
      article: {
        intro: "Transform GitHub READMEs, technical documentation, and Markdown notes into beautifully styled, professional PDF documents.",
        howTo: ["Upload a .md file or paste your Markdown text.","Select a visual theme (GitHub, Academic, Minimalist, Dark).","Enable code syntax highlighting and table formatting.","Download your publication-grade PDF."],
        benefits: [
          {
                    "heading": "GitHub Flavor Supported",
                    "body": "Supports GFM tables, checklists, strikethrough, and blockquotes."
          },
          {
                    "heading": "Syntax Highlighted Code",
                    "body": "Renders code blocks with clean color themes and line numbering."
          },
          {
                    "heading": "Modern Typographic Styles",
                    "body": "Beautiful heading hierarchies and readable body typography."
          },
          {
                    "heading": "Ideal for Documentation",
                    "body": "Create user manuals and technical specs from markdown repos."
          }
],
        faqs: [
          {
                    "q": "Are embedded images supported?",
                    "a": "Yes, images referenced via web URLs or base64 are rendered cleanly."
          },
          {
                    "q": "Can I use custom themes?",
                    "a": "Yes, pick from popular themes including GitHub Light, Academic, and Modern."
          }
],
      },
    },
  },

  // PUB to PDF
  {
    slug: "pub-to-pdf",
    name: "PUB to PDF",
    category: "PDF Tools",
    icon: FileType2,
    blurb: "Convert Microsoft Publisher documents (.pub) to PDF without needing MS Office installed.",
    accepts: ".pub",
    outputs: "PDF Document",
    seo: {
      title: "Convert PUB to PDF Online Free — Microsoft Publisher Converter",
      description: "Convert .pub files to PDF online for free. Open and read Microsoft Publisher brochures, newsletters, and flyers on any device.",
      keywords: ["pub to pdf","convert pub to pdf","microsoft publisher converter","open .pub online free","publisher document to pdf"],
      article: {
        intro: "Microsoft Publisher (.pub) files are proprietary and notoriously hard to open. Convert them to universal PDF documents effortlessly.",
        howTo: ["Upload your .pub file.","Our converter extracts and arranges all text boxes, shapes, and images.","Preview the visual layout.","Download the finished PDF."],
        benefits: [
          {
                    "heading": "Universal Accessibility",
                    "body": "Open Publisher designs on Mac, iPhone, iPad, Android, and Linux."
          },
          {
                    "heading": "Flawless Flyer & Brochure Layouts",
                    "body": "Preserves multi-panel folds, columns, and decorative typography."
          },
          {
                    "heading": "High Resolution Export",
                    "body": "Maintains high DPI for crisp high-resolution and desktop printing."
          },
          {
                    "heading": "Free & Fast",
                    "body": "Convert without purchasing an expensive Microsoft 365 license."
          }
],
        faqs: [
          {
                    "q": "Can I convert multi-page Publisher files?",
                    "a": "Yes, all pages of brochures and multi-page newsletters are converted."
          },
          {
                    "q": "Does it support Publisher 2003 through 2021?",
                    "a": "Yes, all major versions of the .pub file specification are handled."
          }
],
      },
    },
  },

  // Convert PDF to...
  {
    slug: "convert-pdf-to",
    name: "Convert PDF to...",
    category: "PDF Tools",
    icon: FileOutput,
    blurb: "Hub to convert any PDF document to Word, Excel, PowerPoint, Images, HTML, or Text.",
    accepts: "PDF",
    outputs: "DOCX, XLSX, PPTX, Images, Text",
    seo: {
      title: "Convert PDF to Word, Excel, Images & More — Universal PDF Converter",
      description: "Universal PDF export hub. Convert PDF to Word (DOCX), Excel (XLSX), PowerPoint (PPTX), JPG, PNG, Text, and HTML online for free.",
      keywords: ["convert pdf to","pdf converter hub","convert pdf to word excel image","universal pdf exporter","free pdf converter online"],
      article: {
        intro: "The central hub for all your PDF conversion needs. Choose your PDF file, pick any target export format, and convert in one click.",
        howTo: ["Upload the PDF document you wish to convert.","Select your target format: Word, Excel, PowerPoint, JPG, PNG, or Text.","Configure export quality and OCR options if needed.","Download your converted editable file."],
        benefits: [
          {
                    "heading": "All Formats in One Place",
                    "body": "Switch effortlessly between document, spreadsheet, slide, and image exports."
          },
          {
                    "heading": "Advanced OCR Engine",
                    "body": "Extract editable text from scanned documents with high accuracy."
          },
          {
                    "heading": "Preserves Original Formatting",
                    "body": "Retains tables, margins, font sizes, and structural alignments."
          },
          {
                    "heading": "Safe & Confidential",
                    "body": "Your files are never sold, indexed, or stored permanently."
          }
],
        faqs: [
          {
                    "q": "Which formats are available?",
                    "a": "DOCX, XLSX, PPTX, JPG, PNG, SVG, TIFF, HTML, EPUB, TXT, and Markdown."
          },
          {
                    "q": "Can I convert scanned PDFs into editable text?",
                    "a": "Yes, built-in OCR recognizes text in scanned images and documents."
          }
],
      },
    },
  },

  // PDF to JPG
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Extract pages of a PDF document into high-resolution JPG images with adjustable compression.",
    accepts: "PDF",
    outputs: "JPG Images",
    seo: {
      title: "PDF to JPG Online Free — Convert PDF Pages to JPG Images",
      description: "Convert PDF pages to JPG images online for free. High-resolution rendering, fast batch page extraction, and customizable image quality.",
      keywords: ["pdf to jpg","convert pdf to jpg","extract images from pdf","pdf to jpeg online","save pdf as jpg"],
      article: {
        intro: "Convert any PDF into high-quality JPG pictures. Extract all pages as separate images or choose specific pages to save as lightweight JPEG files.",
        howTo: ["Upload your PDF document.","Choose render quality (150 DPI for web, 300 DPI for high-res print).","Select whether to extract all pages or specific page numbers.","Download individual JPGs or a single ZIP archive."],
        benefits: [
          {
                    "heading": "High Resolution Output",
                    "body": "Render crisp text and vivid graphics up to 300+ DPI."
          },
          {
                    "heading": "ZIP Batch Download",
                    "body": "Download all converted pages bundled neatly into a single ZIP archive."
          },
          {
                    "heading": "Flexible Quality Controls",
                    "body": "Fine-tune compression levels to balance image size and detail."
          },
          {
                    "heading": "Fast Client-Side Processing",
                    "body": "Processes pages in seconds directly inside your browser."
          }
],
        faqs: [
          {
                    "q": "Can I convert just one page of a PDF to JPG?",
                    "a": "Yes, specify individual page numbers or ranges to convert."
          },
          {
                    "q": "Are passwords supported?",
                    "a": "Yes, enter the document password to unlock and convert encrypted files."
          }
],
      },
    },
  },

  // PDF to PNG
  {
    slug: "pdf-to-png",
    name: "PDF to PNG",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Render and convert PDF pages into crystal-clear lossless PNG images with alpha channel support.",
    accepts: "PDF",
    outputs: "PNG Images",
    seo: {
      title: "PDF to PNG Online Free — Convert PDF Pages to Lossless PNG",
      description: "Convert PDF documents to lossless PNG images online for free. Crisp vector line rendering, transparent background support, and high DPI.",
      keywords: ["pdf to png","convert pdf to png","lossless pdf to png","high res pdf to png","save pdf page as png"],
      article: {
        intro: "PNG offers lossless image compression, ensuring lines, diagrams, and small fonts stay perfectly sharp without compression artifacts.",
        howTo: ["Upload your PDF file.","Choose resolution scale (1x, 2x for Retina, or 3x for print).","Select page ranges to render.","Download your lossless PNG image files."],
        benefits: [
          {
                    "heading": "Zero Compression Artifacts",
                    "body": "Lossless PNG prevents fuzzy halos around text and lines."
          },
          {
                    "heading": "Transparent Background Option",
                    "body": "Export pages with transparent backgrounds for graphic design use."
          },
          {
                    "heading": "Retina / Ultra HD Scale",
                    "body": "Generate 2x and 4x scale images for crisp 4K presentations."
          },
          {
                    "heading": "Batch Export",
                    "body": "Download all pages in one convenient ZIP folder."
          }
],
        faqs: [
          {
                    "q": "Why choose PNG over JPG?",
                    "a": "PNG preserves razor-sharp edges and supports transparency without compression noise."
          },
          {
                    "q": "Is there a limit on page count?",
                    "a": "You can convert documents with dozens of pages smoothly."
          }
],
      },
    },
  },

  // PDF to SVG
  {
    slug: "pdf-to-svg",
    name: "PDF to SVG",
    category: "PDF Tools",
    icon: FileCode,
    blurb: "Convert PDF vector graphics and text paths into scalable, editable SVG vector files.",
    accepts: "PDF",
    outputs: "SVG Vector Files",
    seo: {
      title: "PDF to SVG Online Free — Convert PDF Pages to Scalable Vector SVG",
      description: "Convert PDF pages to scalable vector SVG graphics online. Retains vector curves, editable text paths, and embedded fonts for web design.",
      keywords: ["pdf to svg","convert pdf to svg","pdf vector to svg","extract svg from pdf","pdf to scalable vector graphics"],
      article: {
        intro: "Convert PDF vector artwork and document pages into standard SVG files. Perfect for web design, Figma, Adobe Illustrator, and laser cutters.",
        howTo: ["Upload your vector PDF.","Choose the page you wish to convert to SVG.","Select font handling (embed as paths or preserve web fonts).","Download your scalable vector SVG file."],
        benefits: [
          {
                    "heading": "True Scalability",
                    "body": "Vector paths scale infinitely without pixelation or blur."
          },
          {
                    "heading": "Designer Friendly",
                    "body": "Open directly in Figma, Illustrator, Inkscape, or Canva."
          },
          {
                    "heading": "Clean Code Output",
                    "body": "Generates clean, semantic SVG markup with grouped elements."
          },
          {
                    "heading": "Web Ready",
                    "body": "Embed SVG graphics directly into HTML websites."
          }
],
        faqs: [
          {
                    "q": "Are text paths editable in Illustrator?",
                    "a": "Yes, text is retained as vector glyphs or editable font elements."
          },
          {
                    "q": "Can I convert blueprints to SVG for laser cutting?",
                    "a": "Yes, accurate scale and vector strokes are preserved for CAD and laser cutting."
          }
],
      },
    },
  },

  // PDF to TIFF
  {
    slug: "pdf-to-tiff",
    name: "PDF to TIFF",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Convert PDF documents into high-resolution, uncompressed multi-page TIFF files for archival.",
    accepts: "PDF",
    outputs: "TIFF Images",
    seo: {
      title: "PDF to TIFF Online Free — Convert PDF to Multi-Page TIFF",
      description: "Convert PDF documents to multi-page TIFF files online for free. Ideal for archival systems, government filings, faxes, and print shops.",
      keywords: ["pdf to tiff","convert pdf to tiff","multi-page tiff from pdf","pdf to tif online free","high resolution pdf to tiff"],
      article: {
        intro: "Convert PDF files into multi-page TIFF images compliant with archival, medical, and electronic court filing specifications.",
        howTo: ["Upload your PDF document.","Choose DPI resolution (200 DPI for fax, 300 DPI for archive, 600 DPI for print).","Select single multi-page TIFF or individual TIFF per page.","Download your standardized TIFF file."],
        benefits: [
          {
                    "heading": "Archival Standard",
                    "body": "Converts to uncompressed or LZW-compressed TIFFs suited for long-term storage."
          },
          {
                    "heading": "Multi-Page Packing",
                    "body": "Bundles all document pages into a single multi-page TIFF container."
          },
          {
                    "heading": "Accurate Color Depth",
                    "body": "Supports 24-bit RGB color, 8-bit grayscale, and 1-bit monochrome."
          },
          {
                    "heading": "Court & Fax Compliant",
                    "body": "Meets specifications for electronic filing and legacy fax networks."
          }
],
        faqs: [
          {
                    "q": "Will all pages be in one file?",
                    "a": "Yes, you can generate a single multi-page TIFF containing every page."
          },
          {
                    "q": "What compression methods are supported?",
                    "a": "LZW, PackBits, CCITT Group 4, and uncompressed TIFF."
          }
],
      },
    },
  },

  // PDF to DOCX
  {
    slug: "pdf-to-docx",
    name: "PDF to DOCX",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert PDF documents into fully editable Microsoft Word (.docx) files with paragraphs and tables.",
    accepts: "PDF",
    outputs: "Word (.docx)",
    seo: {
      title: "PDF to DOCX Online Free — Convert PDF to Editable Word Document",
      description: "Convert PDF to editable Word .docx files online for free. Accurately extracts paragraphs, tables, columns, and formatting with OCR.",
      keywords: ["pdf to docx","convert pdf to docx","pdf to word online free","editable docx from pdf","pdf to docx converter with ocr"],
      article: {
        intro: "Convert PDF files into fully editable Microsoft Word (.docx) documents. Edit text, adjust tables, and modify layouts without re-typing from scratch.",
        howTo: ["Upload the PDF document you need to edit.","Choose layout mode (Flowing Text for easy editing or Exact Layout).","Click Convert to DOCX.","Open and edit your new Word file."],
        benefits: [
          {
                    "heading": "Fully Editable Text",
                    "body": "Turn static PDF pages into editable Word paragraphs with natural word wrap."
          },
          {
                    "heading": "Table Reconstruction",
                    "body": "Detects tabular rows and columns and converts them into native Word tables."
          },
          {
                    "heading": "OCR for Scanned PDFs",
                    "body": "Recognizes text in scanned contracts, receipts, and old documents."
          },
          {
                    "heading": "Preserves Font Styling",
                    "body": "Retains bold, italics, font sizes, headings, and alignments."
          }
],
        faqs: [
          {
                    "q": "Can I edit the converted file in Google Docs?",
                    "a": "Yes, the standard .docx output opens seamlessly in Word, Google Docs, and LibreOffice."
          },
          {
                    "q": "How accurate is the table conversion?",
                    "a": "Our layout engine detects cell boundaries and preserves numerical data accurately."
          }
],
      },
    },
  },

  // PDF to PPTX
  {
    slug: "pdf-to-pptx",
    name: "PDF to PPTX",
    category: "PDF Tools",
    icon: Presentation,
    blurb: "Convert PDF slides into editable PowerPoint (.pptx) presentations with preserved layouts.",
    accepts: "PDF",
    outputs: "PowerPoint (.pptx)",
    seo: {
      title: "PDF to PPTX Online Free — Convert PDF Slides to PowerPoint Deck",
      description: "Convert PDF slides to editable PowerPoint .pptx presentations online. Extract text boxes, images, and slide shapes into customizable slides.",
      keywords: ["pdf to pptx","convert pdf to pptx","pdf to powerpoint free","pdf slides to pptx online","editable presentation from pdf"],
      article: {
        intro: "Need to update a presentation only available as a PDF? Convert it into an editable Microsoft PowerPoint (.pptx) deck with distinct slides.",
        howTo: ["Upload your presentation PDF.","Wait while slide layouts and text boxes are reconstructed.","Click Convert to PPTX.","Download and open your presentation in PowerPoint or Keynote."],
        benefits: [
          {
                    "heading": "Slide-by-Slide Separation",
                    "body": "Every PDF page maps directly to a discrete, editable presentation slide."
          },
          {
                    "heading": "Editable Text & Shapes",
                    "body": "Update figures, tweak bullets, and replace images directly in PowerPoint."
          },
          {
                    "heading": "16:9 & 4:3 Preservation",
                    "body": "Maintains original presentation aspect ratios and background layouts."
          },
          {
                    "heading": "Fast & Free",
                    "body": "Revive and polish presentations in seconds without software lock-in."
          }
],
        faqs: [
          {
                    "q": "Are slide backgrounds editable?",
                    "a": "Yes, backgrounds and visual elements are separated for easy editing."
          },
          {
                    "q": "Can I present in Google Slides?",
                    "a": "Yes, the exported .pptx file uploads directly into Google Slides."
          }
],
      },
    },
  },

  // PDF to XLSX
  {
    slug: "pdf-to-xlsx",
    name: "PDF to XLSX",
    category: "PDF Tools",
    icon: FileSpreadsheet,
    blurb: "Extract tables and tabular data from PDF files into editable Excel (.xlsx) spreadsheets.",
    accepts: "PDF",
    outputs: "Excel (.xlsx)",
    seo: {
      title: "PDF to XLSX Online Free — Convert PDF Tables to Excel Spreadsheet",
      description: "Extract tables from PDF to editable Excel .xlsx sheets online for free. Accurate column detection, formula preservation, and zero data loss.",
      keywords: ["pdf to xlsx","convert pdf to xlsx","extract tables from pdf","pdf to excel spreadsheet free","pdf data to xlsx"],
      article: {
        intro: "Stop manually re-typing financial tables, bank statements, and invoices from PDFs. Extract clean, structured Excel (.xlsx) spreadsheets instantly.",
        howTo: ["Upload your PDF with tables or financial statements.","Choose table detection mode (Automatic or Guided Grid).","Click Convert to XLSX.","Download your spreadsheet with editable numbers and formulas."],
        benefits: [
          {
                    "heading": "Flawless Table Extraction",
                    "body": "Recognizes row and column boundaries without misaligned cells."
          },
          {
                    "heading": "Numeric Data Preservation",
                    "body": "Preserves numbers as true numeric values ready for SUM and formulas."
          },
          {
                    "heading": "Multi-Page Statements",
                    "body": "Consolidates multi-page bank statements into a continuous table."
          },
          {
                    "heading": "Secure Financial Processing",
                    "body": "No sensitive financial data is stored on external servers."
          }
],
        faqs: [
          {
                    "q": "Are numbers formatted correctly for formulas?",
                    "a": "Yes, numbers and decimals are stored as raw numbers rather than strings."
          },
          {
                    "q": "Can it handle scanned receipts or bank statements?",
                    "a": "Yes, integrated OCR reads numerical tables from scanned documents."
          }
],
      },
    },
  },

  // PDF to ODT
  {
    slug: "pdf-to-odt",
    name: "PDF to ODT",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert PDF documents into editable OpenDocument Text (.odt) format for LibreOffice Writer.",
    accepts: "PDF",
    outputs: "ODT Document",
    seo: {
      title: "PDF to ODT Online Free — Convert PDF to LibreOffice Writer (.odt)",
      description: "Convert PDF files to OpenDocument Text (.odt) format online for free. Ideal for editing documents in LibreOffice Writer and Apache OpenOffice.",
      keywords: ["pdf to odt","convert pdf to odt","pdf to libreoffice writer","pdf to opendocument text","editable odt from pdf"],
      article: {
        intro: "Convert static PDF documents into editable OpenDocument Text (.odt) files compatible with LibreOffice Writer, OpenOffice, and AbiWord.",
        howTo: ["Upload your PDF document.","Choose text reflow settings and formatting preferences.","Click Convert to ODT.","Download and open your document in LibreOffice."],
        benefits: [
          {
                    "heading": "Open Source Native",
                    "body": "Generates clean OASIS OpenDocument XML compliant with open standards."
          },
          {
                    "heading": "Editable Layouts",
                    "body": "Edit text, headings, headers, and bullet lists with native formatting."
          },
          {
                    "heading": "Privacy Focused",
                    "body": "Files are handled client-side with immediate memory purging."
          },
          {
                    "heading": "100% Free",
                    "body": "No subscription required to convert documents."
          }
],
        faqs: [
          {
                    "q": "Is the output compatible with Apache OpenOffice?",
                    "a": "Yes, fully compliant with both LibreOffice and OpenOffice."
          },
          {
                    "q": "Are embedded images preserved?",
                    "a": "Yes, images remain in their original positions with correct wrapping."
          }
],
      },
    },
  },

  // PDF to ODS
  {
    slug: "pdf-to-ods",
    name: "PDF to ODS",
    category: "PDF Tools",
    icon: FileSpreadsheet,
    blurb: "Extract tabular data from PDF files into OpenDocument Spreadsheet (.ods) for LibreOffice Calc.",
    accepts: "PDF",
    outputs: "ODS Spreadsheet",
    seo: {
      title: "PDF to ODS Online Free — Convert PDF Tables to LibreOffice Calc (.ods)",
      description: "Extract data and tables from PDF to OpenDocument Spreadsheet (.ods) format online. Seamless integration with LibreOffice Calc and OpenOffice.",
      keywords: ["pdf to ods","convert pdf to ods","pdf to libreoffice calc","extract pdf to ods","opendocument spreadsheet from pdf"],
      article: {
        intro: "Extract tabular data from PDF files into OpenDocument Spreadsheet (.ods) workbooks for LibreOffice Calc. Keep formulas and columns aligned.",
        howTo: ["Upload your PDF containing data tables.","Select table detection options.","Click Convert to ODS.","Download your spreadsheet ready to open in Calc."],
        benefits: [
          {
                    "heading": "LibreOffice Calc Ready",
                    "body": "Open extracted data natively in open source spreadsheet tools."
          },
          {
                    "heading": "Accurate Column Separation",
                    "body": "Aligns numbers and text into proper rows and columns."
          },
          {
                    "heading": "Multi-Page Extraction",
                    "body": "Merges consecutive pages into organized worksheets."
          },
          {
                    "heading": "Zero Cost",
                    "body": "Convert unlimited PDF documents for free."
          }
],
        faqs: [
          {
                    "q": "Can I use Calc formulas on the output?",
                    "a": "Yes, numbers are stored with correct numeric types for immediate calculations."
          },
          {
                    "q": "Can I open the ODS file in Excel?",
                    "a": "Yes, Microsoft Excel can also open and edit modern .ods files."
          }
],
      },
    },
  },

  // PDF to ODP
  {
    slug: "pdf-to-odp",
    name: "PDF to ODP",
    category: "PDF Tools",
    icon: Presentation,
    blurb: "Convert PDF pages into editable OpenDocument Presentation (.odp) slides for LibreOffice Impress.",
    accepts: "PDF",
    outputs: "ODP Presentation",
    seo: {
      title: "PDF to ODP Online Free — Convert PDF to LibreOffice Impress (.odp)",
      description: "Convert PDF slides to OpenDocument Presentation (.odp) format online. Edit slide titles, bullets, and graphics in LibreOffice Impress.",
      keywords: ["pdf to odp","convert pdf to odp","pdf to libreoffice impress","pdf to opendocument presentation","editable odp from pdf"],
      article: {
        intro: "Convert PDF presentations into editable OpenDocument Presentation (.odp) files for LibreOffice Impress without vendor lock-in.",
        howTo: ["Upload your PDF presentation.","Wait while pages are mapped into separate slide canvases.","Click Convert to ODP.","Download your editable .odp deck."],
        benefits: [
          {
                    "heading": "Discrete Slide Mapping",
                    "body": "Each PDF page becomes an individual editable presentation slide."
          },
          {
                    "heading": "Open Standard",
                    "body": "Share and edit presentations freely using open source office suites."
          },
          {
                    "heading": "Editable Graphics",
                    "body": "Modify shapes, diagrams, and text blocks directly."
          },
          {
                    "heading": "Safe & Private",
                    "body": "Processed locally without permanent server storage."
          }
],
        faqs: [
          {
                    "q": "Will slide proportions be preserved?",
                    "a": "Yes, widescreen and standard proportions are accurately maintained."
          },
          {
                    "q": "Can I open the ODP file in PowerPoint?",
                    "a": "Yes, modern Microsoft PowerPoint versions can open and save ODP files."
          }
],
      },
    },
  },

  // PDF to RTF
  {
    slug: "pdf-to-rtf",
    name: "PDF to RTF",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Convert PDF documents into cross-platform Rich Text Format (.rtf) preserving formatting.",
    accepts: "PDF",
    outputs: "RTF Document",
    seo: {
      title: "PDF to RTF Online Free — Convert PDF to Rich Text Format",
      description: "Convert PDF files to editable Rich Text Format (.rtf) online for free. Compatible with WordPad, TextEdit, Microsoft Word, and all word processors.",
      keywords: ["pdf to rtf","convert pdf to rtf","pdf to rich text format","editable rtf from pdf","pdf to rtf converter free"],
      article: {
        intro: "Rich Text Format (.rtf) is universally compatible across all operating systems. Convert your PDF files into lightweight, editable RTF documents.",
        howTo: ["Upload your PDF file.","Choose text extraction and formatting retention mode.","Click Convert to RTF.","Download and open your document in any text editor."],
        benefits: [
          {
                    "heading": "Universal Word Processor Support",
                    "body": "Opens in WordPad, TextEdit, LibreOffice, Pages, and Microsoft Word."
          },
          {
                    "heading": "Preserves Font Formatting",
                    "body": "Retains bold, italics, font colors, bullet lists, and paragraphs."
          },
          {
                    "heading": "Compact File Size",
                    "body": "Generates clean, lightweight documents without bulky metadata."
          },
          {
                    "heading": "No Software Needed",
                    "body": "Convert directly inside your web browser on any device."
          }
],
        faqs: [
          {
                    "q": "Can I open the RTF file in WordPad?",
                    "a": "Yes, standard Windows WordPad can open and edit the output without issues."
          },
          {
                    "q": "Are images preserved in RTF?",
                    "a": "Yes, embedded graphics are included within the RTF stream."
          }
],
      },
    },
  },
];
