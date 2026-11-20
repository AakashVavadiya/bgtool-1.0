// Core PDF workspace tools (merge, split, compress, edit, sign, security, office exports).
import { Minimize2, Crop, FileImage, ScanText, FileType2, FileText, Presentation, Code2, FileDown, Table2, FileSpreadsheet, MonitorPlay, Stamp, RotateCw, FileCode, Hash, Merge, SplitSquareVertical, FilePlus, FilePen, FileSignature, FileOutput, Images, Camera, Globe, ClipboardList, Briefcase, QrCode, Receipt, FileX, BookOpen, Layers, Lock, Unlock, ShieldOff, GitCompare, Wrench, Zap, Shield, BookMarked, FileSearch } from "lucide-react";

import type { Tool } from "./types";

export const pdfCoreTools: Tool[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    category: "PDF Tools",
    icon: Merge,
    tag: "Popular",
    blurb: "Combine multiple PDF files into one document in seconds, in any order.",
    accepts: "PDF",
    outputs: "Merged PDF",
    seo: {
      title: "Merge PDF Online Free — Combine PDF Files Into One",
      description: "Merge multiple PDF files into a single document online for free. Drag to reorder pages, no account required, instant download.",
      keywords: ["merge pdf", "combine pdf", "join pdf files", "merge pdf online free", "pdf merger"],
      article: {
        intro: "Merging PDF files is one of the most common document tasks. Our free online PDF merger lets you combine as many PDFs as you need into a single file, with full control over the order.",
        howTo: ["Upload your PDF files.", "Drag to reorder them as needed.", "Click Merge PDF.", "Download the combined PDF."],
        benefits: [
          { heading: "Unlimited Files", body: "Combine as many PDFs as you need in one go." },
          { heading: "Reorder Pages", body: "Drag and drop files to set the exact order before merging." },
          { heading: "Free & Secure", body: "No account needed. Files are processed securely." },
          { heading: "Instant Result", body: "Get your merged PDF in seconds." },
        ],
        faqs: [
          { q: "How many PDFs can I merge?", a: "You can merge as many PDF files as you need." },
          { q: "Will the quality be affected?", a: "No — the original quality of all content is preserved." },
        ],
      },
    },
  },

  // Split PDF
  {
    slug: "split-pdf",
    name: "Split PDF",
    category: "PDF Tools",
    icon: SplitSquareVertical,
    tag: "Popular",
    blurb: "Extract specific pages or split a PDF into multiple individual files.",
    accepts: "PDF",
    outputs: "Split PDF files",
    seo: {
      title: "Split PDF Online Free — Extract Pages from PDF",
      description: "Split a PDF into multiple files or extract specific pages online for free. Fast, easy, no account required.",
      keywords: ["split pdf", "pdf splitter", "extract pdf pages", "separate pdf pages", "split pdf online free"],
      article: {
        intro: "Split large PDF documents into smaller files or extract only the pages you need. Perfect for sharing specific sections of a document without revealing the rest.",
        howTo: ["Upload your PDF.", "Select pages or ranges to split.", "Click Split PDF.", "Download your split files."],
        benefits: [
          { heading: "Flexible Splitting", body: "Split by page ranges, every page, or extract specific pages." },
          { heading: "Fast Processing", body: "Large PDFs are split in seconds." },
          { heading: "Free to Use", body: "No watermarks, no account, completely free." },
          { heading: "Privacy First", body: "Your documents are handled securely." },
        ],
        faqs: [
          { q: "Can I split a PDF into individual pages?", a: "Yes, you can split every page into its own PDF file." },
          { q: "Can I extract a specific page range?", a: "Yes, specify any page range to extract." },
        ],
      },
    },
  },

  // Compress PDF
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    category: "PDF Tools",
    icon: Minimize2,
    tag: "Popular",
    blurb: "Reduce PDF file size without sacrificing readability or print quality.",
    accepts: "PDF",
    outputs: "Compressed PDF",
    seo: {
      title: "Compress PDF Online Free — Reduce PDF File Size",
      description: "Compress PDF files online for free. Reduce PDF size for email, web, and storage without losing quality.",
      keywords: ["compress pdf", "reduce pdf size", "pdf compressor online", "shrink pdf", "pdf optimizer"],
      article: {
        intro: "Compressing a PDF reduces its file size, making it easier to share via email or upload to websites. Our tool intelligently compresses images and optimizes content streams.",
        howTo: ["Upload your PDF file.", "Choose compression level.", "Click Compress PDF.", "Download the smaller PDF."],
        benefits: [
          { heading: "Up to 90% Smaller", body: "Dramatically reduce file size while maintaining readability." },
          { heading: "Multiple Levels", body: "Choose between extreme, high, medium, and low compression." },
          { heading: "Preserve Quality", body: "Text and vector graphics remain sharp at any compression level." },
          { heading: "Email Ready", body: "Get files under common email attachment size limits." },
        ],
        faqs: [
          { q: "Will text remain readable after compression?", a: "Yes, text is always preserved perfectly. Only image quality may be slightly reduced." },
          { q: "What's the maximum PDF size I can compress?", a: "You can compress PDFs of any size." },
        ],
      },
    },
  },

  // Edit PDF
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    category: "PDF Tools",
    icon: FilePen,
    blurb: "Add text, images, shapes, and annotations directly to any PDF document.",
    accepts: "PDF",
    outputs: "Edited PDF",
    seo: {
      title: "Edit PDF Online Free — Add Text, Images & Shapes to PDF",
      description: "Edit PDF files online for free. Add text, images, drawings, and annotations to any PDF page. No software required.",
      keywords: ["edit pdf", "pdf editor online", "add text to pdf", "pdf annotator", "edit pdf free"],
      article: {
        intro: "Edit any PDF directly in your browser. Add text boxes, images, freehand drawings, shapes, and sticky notes without needing Adobe Acrobat or any desktop software.",
        howTo: ["Upload your PDF.", "Use the editor toolbar to add text, images, or annotations.", "Position and style your additions.", "Download the edited PDF."],
        benefits: [
          { heading: "Full Editing Suite", body: "Text, images, shapes, highlights and freehand drawing in one tool." },
          { heading: "No Installation", body: "Works entirely in your browser — no plugins required." },
          { heading: "Preserves Original", body: "All edits are added as layers, keeping the original content intact." },
          { heading: "Any Device", body: "Edit PDFs on desktop, tablet or mobile." },
        ],
        faqs: [
          { q: "Can I delete text from an existing PDF?", a: "You can cover existing text with white boxes and add new text on top." },
          { q: "Can I add images?", a: "Yes, upload images to place them anywhere on the PDF." },
        ],
      },
    },
  },

  // Sign PDF
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    category: "PDF Tools",
    icon: FileSignature,
    tag: "Popular",
    blurb: "Draw, type, or upload your signature and apply it to any PDF document.",
    accepts: "PDF",
    outputs: "Signed PDF",
    seo: {
      title: "Sign PDF Online Free — Add Signature to PDF",
      description: "Sign PDF documents online for free. Draw, type, or upload your signature and place it anywhere on the PDF. Legally binding e-signature.",
      keywords: ["sign pdf", "pdf signature", "esign pdf", "digital signature pdf", "sign pdf online free"],
      article: {
        intro: "Add your signature to any PDF document without printing. Draw with your mouse or finger, type your name in a handwriting font, or upload an image of your signature.",
        howTo: ["Upload the PDF you need to sign.", "Draw, type or upload your signature.", "Place the signature on the correct field.", "Download the signed PDF."],
        benefits: [
          { heading: "Multiple Signature Methods", body: "Draw, type, or upload an image — choose whatever works best for you." },
          { heading: "Legally Binding", body: "Electronic signatures are legally recognised in most countries." },
          { heading: "No Account Required", body: "Sign documents instantly without creating an account." },
          { heading: "Works Anywhere", body: "Sign contracts, agreements and forms from any device." },
        ],
        faqs: [
          { q: "Is an e-signature legally valid?", a: "Yes, e-signatures are recognised under laws like ESIGN (USA) and eIDAS (EU)." },
          { q: "Can I sign multiple pages?", a: "Yes, apply your signature to any or all pages." },
        ],
      },
    },
  },

  // Create PDF
  {
    slug: "create-pdf",
    name: "Create PDF",
    category: "PDF Tools",
    icon: FilePlus,
    blurb: "Build a PDF from scratch by typing content, adding images, and formatting text.",
    accepts: "Text, Images",
    outputs: "PDF",
    seo: {
      title: "Create PDF Online Free — Build a New PDF Document",
      description: "Create a new PDF document from scratch online for free. Add text, images, and formatting. Download instantly as a PDF file.",
      keywords: ["create pdf", "make pdf", "pdf creator online", "new pdf document", "build pdf"],
      article: {
        intro: "Create a professional PDF document from scratch without any software. Add text with full formatting control, insert images, and structure your content before downloading as a PDF.",
        howTo: ["Open the PDF creator.", "Add text, images, and layout elements.", "Format and style your content.", "Click Create PDF and download."],
        benefits: [
          { heading: "Start From Blank", body: "Build any document from scratch with full creative control." },
          { heading: "Rich Formatting", body: "Control font, size, alignment, colours and spacing." },
          { heading: "Add Images", body: "Insert photos and graphics anywhere in the document." },
          { heading: "Instant Download", body: "Download your new PDF in seconds." },
        ],
        faqs: [
          { q: "Can I choose the page size?", a: "Yes, choose A4, Letter, Legal and more." },
          { q: "Can I add multiple pages?", a: "Yes, you can add as many pages as you need." },
        ],
      },
    },
  },

  // Image to PDF (Multi-Image Select Support)
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    category: "PDF Tools",
    icon: Images,
    tag: "Popular",
    blurb: "Convert one or multiple images (JPG, PNG, WEBP, HEIC) into a single multi-page PDF.",
    accepts: "JPG, PNG, WEBP, HEIC, TIFF, BMP, SVG",
    outputs: "PDF",
    seo: {
      title: "Image to PDF Online Free — Convert JPG, PNG, WEBP to PDF",
      description: "Convert single or multiple images to a single PDF document online for free. Supports JPG, PNG, WEBP, HEIC, TIFF. Drag to reorder, instant download.",
      keywords: ["image to pdf", "images to pdf", "jpg to pdf", "png to pdf", "convert image to pdf", "photos to pdf", "merge photos to pdf"],
      article: {
        intro: "Turn any collection of images into a polished, professional PDF document. Upload multiple photos, reorder them as pages, and download a single compiled PDF — great for scanned documents, portfolios, invoices, and photo albums.",
        howTo: ["Upload your images using the upload zone.", "Reorder them by dragging or using arrow buttons.", "Choose page size (A4 or US Letter).", "Click Convert to PDF and download instantly."],
        benefits: [
          { heading: "Multi-Image Selection", body: "Combine unlimited images into a single beautifully formatted PDF document." },
          { heading: "Multiple Formats Supported", body: "JPG, PNG, WEBP, HEIC, TIFF and SVG all supported with lossless quality." },
          { heading: "Page Control & Layout", body: "Choose standard A4 or US Letter page sizing to fit your printing and sharing needs." },
          { heading: "100% Free Forever", body: "Clean, professional output with zero watermarks or tracking." },
        ],
        faqs: [
          { q: "Can I convert multiple images into one PDF?", a: "Yes! You can select multiple images at once and arrange them into a single multi-page PDF." },
          { q: "Can I control the order of images?", a: "Yes, easily drag and drop or use the reorder buttons to arrange your pages before compiling." },
          { q: "Is there a limit on how many images I can select?", a: "No, you can select and convert as many photos as needed without limits." },
          { q: "Are my files uploaded to a remote server?", a: "No, all conversion runs securely right in your browser with 100% privacy." },
        ],
      },
    },
  },

  // Create PDF with Camera
  {
    slug: "create-pdf-camera",
    name: "Create PDF with Camera",
    category: "PDF Tools",
    icon: Camera,
    blurb: "Capture documents with your camera and instantly convert them into a clean PDF.",
    accepts: "Camera / Image",
    outputs: "PDF",
    seo: {
      title: "Create PDF with Camera Online Free — Scan Document to PDF",
      description: "Use your device camera to scan documents and convert them to PDF online for free. Instant scanning, perspective correction, clean output.",
      keywords: ["scan document to pdf", "camera to pdf", "scan pdf", "document scanner online", "create pdf from camera"],
      article: {
        intro: "Turn your device into a portable document scanner. Capture pages with your camera and instantly get a clean, aligned PDF — great for contracts, receipts, and notes.",
        howTo: ["Allow camera access.", "Point at the document.", "Capture and crop.", "Download as PDF."],
        benefits: [
          { heading: "Instant Scanning", body: "Scan and convert in seconds without any hardware scanner." },
          { heading: "Perspective Correction", body: "Automatic edge detection straightens skewed pages." },
          { heading: "Multi-Page", body: "Scan multiple pages into one PDF document." },
          { heading: "Works on Mobile", body: "Optimised for use on smartphones and tablets." },
        ],
        faqs: [
          { q: "Does it work on iPhone?", a: "Yes, it works on any device with a camera and a modern browser." },
          { q: "Is image enhancement applied?", a: "Yes, automatic contrast and sharpness is applied for clean scans." },
        ],
      },
    },
  },

  // Webpage to PDF
  {
    slug: "webpage-to-pdf",
    name: "Webpage to PDF",
    category: "PDF Tools",
    icon: Globe,
    blurb: "Convert any URL or webpage into a well-formatted, printable PDF document.",
    accepts: "URL",
    outputs: "PDF",
    seo: {
      title: "Webpage to PDF Online Free — Convert URL to PDF",
      description: "Convert any webpage or URL to a PDF online for free. Capture full page, articles, or custom sections as a PDF document.",
      keywords: ["webpage to pdf", "url to pdf", "website to pdf", "convert website to pdf", "save webpage as pdf"],
      article: {
        intro: "Save any webpage as a PDF for offline reading, archiving, or sharing. Paste a URL and get a print-ready PDF with full formatting in seconds.",
        howTo: ["Enter the URL of the webpage.", "Choose full page or article mode.", "Click Convert.", "Download the PDF."],
        benefits: [
          { heading: "Full Page Capture", body: "Capture the entire page scroll, not just the visible area." },
          { heading: "Article Mode", body: "Extract only the main article content without ads or nav." },
          { heading: "Instant Conversion", body: "Most pages render in under 15 seconds." },
          { heading: "Offline Reading", body: "Save any web content for reading without internet." },
        ],
        faqs: [
          { q: "Will JavaScript-rendered content be captured?", a: "Yes, the page is fully rendered before capture." },
          { q: "Can I convert login-protected pages?", a: "Only publicly accessible pages can be converted." },
        ],
      },
    },
  },

  // Create Fillable PDF Form
  {
    slug: "create-fillable-pdf",
    name: "Create Fillable PDF Form",
    category: "PDF Tools",
    icon: ClipboardList,
    blurb: "Design interactive PDF forms with text fields, checkboxes, and dropdowns.",
    accepts: "PDF or blank",
    outputs: "Fillable PDF",
    seo: {
      title: "Create Fillable PDF Form Online Free — Interactive PDF Builder",
      description: "Create fillable PDF forms online for free. Add text fields, checkboxes, radio buttons, and dropdowns to any PDF or start from scratch.",
      keywords: ["fillable pdf form", "create pdf form", "interactive pdf", "pdf form builder", "editable pdf form"],
      article: {
        intro: "Turn any static PDF into an interactive form with fields that recipients can fill in digitally. Add text fields, checkboxes, dropdowns and signature fields with ease.",
        howTo: ["Upload a PDF or start blank.", "Drag form fields onto the page.", "Configure field types and labels.", "Download the fillable PDF."],
        benefits: [
          { heading: "Full Form Controls", body: "Text, checkbox, radio, dropdown, date picker and signature fields." },
          { heading: "No Software Needed", body: "Build professional forms entirely in your browser." },
          { heading: "Works in Any PDF Reader", body: "Output is compatible with Adobe Reader and all major PDF viewers." },
          { heading: "Save Time", body: "Eliminate manual paper-based form data collection." },
        ],
        faqs: [
          { q: "Can I overlay fields on an existing PDF?", a: "Yes, upload any PDF and add fields on top of existing content." },
          { q: "Are responses saved?", a: "Filled forms can be saved and submitted by recipients." },
        ],
      },
    },
  },

  // Create PDF Job Application
  {
    slug: "pdf-job-application",
    name: "Create PDF Job Application",
    category: "PDF Tools",
    icon: Briefcase,
    blurb: "Generate a professional job application form as a fillable PDF in minutes.",
    accepts: "Form input",
    outputs: "PDF Job Application",
    seo: {
      title: "Create PDF Job Application Online Free — Job Application Form",
      description: "Create a professional job application form PDF online for free. Customise fields, branding and layout. Instant download.",
      keywords: ["pdf job application", "job application form pdf", "employment application pdf", "job application creator"],
      article: {
        intro: "Generate a polished, professional job application form as a PDF. Add your company logo, customise fields, and produce a document ready to share with candidates.",
        howTo: ["Choose a template.", "Add your company name and logo.", "Customise the fields.", "Download the PDF."],
        benefits: [
          { heading: "Professional Templates", body: "Ready-made templates designed to impress." },
          { heading: "Fully Customisable", body: "Add, remove or rename any field." },
          { heading: "Brand Ready", body: "Add your logo and company colours." },
          { heading: "Fillable Output", body: "Applicants can fill the form digitally." },
        ],
        faqs: [
          { q: "Can I add my company logo?", a: "Yes, upload your logo and it will appear on every page." },
          { q: "Is the output fillable?", a: "Yes, the form contains interactive fields." },
        ],
      },
    },
  },

  // Generate QR Code
  {
    slug: "generate-qr-code",
    name: "Generate QR Code",
    category: "PDF Tools",
    icon: QrCode,
    blurb: "Create a custom QR code for URLs, text, vCards, or Wi-Fi — embed in PDFs instantly.",
    accepts: "URL / Text",
    outputs: "QR Code PNG / PDF",
    seo: {
      title: "Generate QR Code Online Free — Custom QR Code Maker",
      description: "Generate custom QR codes for URLs, text, email, Wi-Fi and vCards online for free. Download as PNG or embed in a PDF.",
      keywords: ["qr code generator", "create qr code", "qr code maker online", "free qr code", "qr code pdf"],
      article: {
        intro: "Generate QR codes for any URL, contact card, Wi-Fi network, or plain text. Customise the colour and embed the QR code directly into a PDF document.",
        howTo: ["Enter your URL or text.", "Customise colour and size.", "Click Generate QR Code.", "Download as PNG or PDF."],
        benefits: [
          { heading: "Multiple QR Types", body: "URL, email, phone, Wi-Fi, vCard and plain text." },
          { heading: "Custom Colours", body: "Match QR code colours to your brand." },
          { heading: "High Resolution", body: "Download crisp, print-ready QR codes." },
          { heading: "PDF Embed", body: "Embed the QR code directly into a PDF file." },
        ],
        faqs: [
          { q: "Can I add a logo inside the QR code?", a: "Yes, upload a logo to embed it in the centre." },
          { q: "How large can the QR code be?", a: "Up to 2048×2048 pixels for print quality." },
        ],
      },
    },
  },

  // Create Invoice
  {
    slug: "create-invoice",
    name: "Create Invoice",
    category: "PDF Tools",
    icon: Receipt,
    blurb: "Build a professional invoice PDF with itemised billing, tax, and your branding.",
    accepts: "Form input",
    outputs: "Invoice PDF",
    seo: {
      title: "Create Invoice Online Free — PDF Invoice Generator",
      description: "Create professional invoices as PDF online for free. Add items, tax, logo, and payment details. Download and send instantly.",
      keywords: ["create invoice", "invoice generator", "pdf invoice", "free invoice maker", "invoice creator"],
      article: {
        intro: "Create polished, professional invoices in seconds. Add your business details, line items, tax rates and payment terms, then download a print-ready PDF invoice.",
        howTo: ["Enter your business and client details.", "Add line items and amounts.", "Set tax rate and due date.", "Download the invoice PDF."],
        benefits: [
          { heading: "Professional Design", body: "Crisp, branded invoice templates that impress clients." },
          { heading: "Tax Calculation", body: "Automatic VAT and tax calculation." },
          { heading: "Logo Support", body: "Add your business logo for a branded look." },
          { heading: "Instant PDF", body: "Download a ready-to-send invoice immediately." },
        ],
        faqs: [
          { q: "Can I save invoices for later?", a: "Yes, invoices can be saved locally or re-generated from your data." },
          { q: "Are multiple currencies supported?", a: "Yes, choose from all major world currencies." },
        ],
      },
    },
  },

  // Annotate PDF
  {
    slug: "annotate-pdf",
    name: "Annotate PDF",
    category: "PDF Tools",
    icon: Stamp,
    blurb: "Highlight text, add comments, sticky notes, and shapes to any PDF.",
    accepts: "PDF",
    outputs: "Annotated PDF",
    seo: {
      title: "Annotate PDF Online Free — Highlight, Comment & Mark Up PDFs",
      description: "Annotate PDF documents online for free. Add highlights, sticky notes, comments, underlines, and shapes. Download instantly.",
      keywords: ["annotate pdf", "pdf annotation", "highlight pdf", "comment on pdf", "mark up pdf"],
      article: {
        intro: "Mark up PDF documents with a full suite of annotation tools. Highlight text, add sticky notes, draw shapes, underline passages, and leave comments for colleagues or clients.",
        howTo: ["Upload your PDF.", "Choose an annotation tool from the toolbar.", "Apply highlights, notes or shapes.", "Download the annotated PDF."],
        benefits: [
          { heading: "Rich Annotation Set", body: "Highlights, underlines, strikethroughs, sticky notes, and shapes." },
          { heading: "Colour Coding", body: "Use multiple colours to organise your annotations." },
          { heading: "Comment Threads", body: "Add text comments that reviewers can reply to." },
          { heading: "Preserved Original", body: "All annotations are added as a layer without modifying the original." },
        ],
        faqs: [
          { q: "Can other people see my annotations?", a: "Yes, annotations are embedded in the PDF and visible in any PDF reader." },
          { q: "Can I remove annotations later?", a: "Yes, re-open the PDF and delete or modify any annotation." },
        ],
      },
    },
  },

  // Fill out PDF
  {
    slug: "fill-pdf",
    name: "Fill out PDF",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Fill in any PDF form fields directly in your browser and download the completed form.",
    accepts: "PDF with form fields",
    outputs: "Filled PDF",
    seo: {
      title: "Fill out PDF Online Free — Fill PDF Forms in Browser",
      description: "Fill in PDF form fields online for free. Type into text fields, check boxes, and select dropdowns. Download the completed PDF instantly.",
      keywords: ["fill pdf form", "fill out pdf", "complete pdf form online", "pdf form filler", "fill pdf fields"],
      article: {
        intro: "Complete any PDF form directly in your browser — no printing required. Click any field, type your answer, check boxes, and download the fully completed document.",
        howTo: ["Upload the PDF form.", "Click on fields and fill in your answers.", "Check boxes and select dropdowns as needed.", "Download the completed PDF."],
        benefits: [
          { heading: "Works With Any Form", body: "Compatible with all standard PDF form fields." },
          { heading: "No Printing", body: "Fill forms digitally and submit or email directly." },
          { heading: "Instant Preview", body: "See your answers on the PDF in real time." },
          { heading: "Free to Use", body: "No account or software required." },
        ],
        faqs: [
          { q: "Can I fill forms that don't have interactive fields?", a: "Yes, you can add text over static PDF documents using the Edit PDF tool." },
          { q: "Will my filled data be saved?", a: "Your filled PDF is downloaded so you can save it locally." },
        ],
      },
    },
  },

  // Add Watermark
  {
    slug: "add-watermark-pdf",
    name: "Add Watermark to PDF",
    category: "PDF Tools",
    icon: Layers,
    blurb: "Stamp a custom text or image watermark across every page of a PDF.",
    accepts: "PDF",
    outputs: "Watermarked PDF",
    seo: {
      title: "Add Watermark to PDF Online Free — PDF Watermark Stamp",
      description: "Add text or image watermarks to PDF files online for free. Control opacity, position, rotation and font. Download instantly.",
      keywords: ["add watermark pdf", "pdf watermark", "stamp pdf", "watermark document", "pdf watermark maker"],
      article: {
        intro: "Protect your documents or mark them as confidential, draft, or approved by stamping a watermark across every page. Choose text or image watermarks with full style control.",
        howTo: ["Upload your PDF.", "Enter watermark text or upload an image.", "Adjust opacity, rotation and position.", "Download the watermarked PDF."],
        benefits: [
          { heading: "Text & Image Watermarks", body: "Type any text or upload an image to use as a watermark." },
          { heading: "Full Style Control", body: "Adjust font, size, colour, opacity, and angle." },
          { heading: "All Pages", body: "Watermark is applied to every page automatically." },
          { heading: "Non-Destructive", body: "Original content remains intact beneath the watermark." },
        ],
        faqs: [
          { q: "Can I choose watermark position?", a: "Yes, centre, top-left, diagonal and more options available." },
          { q: "Can I use an image as a watermark?", a: "Yes, upload a PNG or SVG logo to use as a watermark." },
        ],
      },
    },
  },

  // Add Page Numbers
  {
    slug: "add-page-numbers-pdf",
    name: "Add Page Numbers",
    category: "PDF Tools",
    icon: Hash,
    blurb: "Insert page numbers on PDF documents with customisable position, font and format.",
    accepts: "PDF",
    outputs: "PDF with page numbers",
    seo: {
      title: "Add Page Numbers to PDF Online Free — PDF Numbering Tool",
      description: "Add page numbers to PDF documents online for free. Choose position, format, starting number and font. Download instantly.",
      keywords: ["add page numbers pdf", "pdf page numbering", "number pdf pages", "insert page numbers pdf", "pdf footer numbering"],
      article: {
        intro: "Add professional page numbers to your PDF with complete control over format, position, and style. Choose header or footer placement and start from any number.",
        howTo: ["Upload your PDF.", "Choose position (header/footer), alignment, and number format.", "Set starting page number.", "Download the numbered PDF."],
        benefits: [
          { heading: "Flexible Positioning", body: "Header or footer, left, centre or right alignment." },
          { heading: "Custom Formats", body: "Page 1 of N, Roman numerals, custom prefixes." },
          { heading: "Starting Number", body: "Start numbering from any page number." },
          { heading: "Font Control", body: "Choose font family, size and colour." },
        ],
        faqs: [
          { q: "Can I skip the first page (cover)?", a: "Yes, you can set the page numbering to start from page 2." },
          { q: "Can I use Roman numerals?", a: "Yes, Roman numeral and letter formats are supported." },
        ],
      },
    },
  },

  // Crop PDF
  {
    slug: "crop-pdf",
    name: "Crop PDF",
    category: "PDF Tools",
    icon: Crop,
    blurb: "Trim the margins or crop a specific region from every page of a PDF.",
    accepts: "PDF",
    outputs: "Cropped PDF",
    seo: {
      title: "Crop PDF Online Free — Trim PDF Margins",
      description: "Crop PDF pages online for free. Trim white margins, crop to a custom region, or adjust page boundaries. Download instantly.",
      keywords: ["crop pdf", "pdf cropping tool", "trim pdf margins", "crop pdf pages", "pdf page crop"],
      article: {
        intro: "Remove unwanted margins, crop to a content area, or define exact page boundaries for every page in a PDF. Ideal for preparing PDFs for print or digital display.",
        howTo: ["Upload your PDF.", "Draw the crop region on the preview.", "Apply to all pages or selected pages.", "Download the cropped PDF."],
        benefits: [
          { heading: "Visual Crop", body: "Draw the exact crop box on a live preview." },
          { heading: "All Pages", body: "Apply the same crop to every page in one click." },
          { heading: "Margin Trimming", body: "Auto-detect and remove white borders." },
          { heading: "Print Ready", body: "Define bleed, trim and media boxes precisely." },
        ],
        faqs: [
          { q: "Does cropping remove page content permanently?", a: "The content outside the crop box is hidden but not deleted — it can be uncropped later." },
          { q: "Can I set different crops per page?", a: "Yes, apply unique crops to individual pages." },
        ],
      },
    },
  },

  // Rearrange PDF Pages
  {
    slug: "rearrange-pdf-pages",
    name: "Rearrange PDF Pages",
    category: "PDF Tools",
    icon: ArrowLeftRight,
    blurb: "Drag and drop to reorder pages within a PDF before saving.",
    accepts: "PDF",
    outputs: "Reordered PDF",
    seo: {
      title: "Rearrange PDF Pages Online Free — Reorder PDF",
      description: "Reorder pages in a PDF document online for free. Drag and drop thumbnails to rearrange. Download the reorganised PDF instantly.",
      keywords: ["rearrange pdf pages", "reorder pdf", "pdf page organizer", "move pdf pages", "pdf page order"],
      article: {
        intro: "Easily rearrange the page order of any PDF with a simple drag-and-drop interface. See thumbnail previews of every page and reorder them before downloading.",
        howTo: ["Upload your PDF.", "See all pages as thumbnails.", "Drag pages to new positions.", "Download the rearranged PDF."],
        benefits: [
          { heading: "Visual Thumbnails", body: "See each page at a glance before rearranging." },
          { heading: "Drag & Drop", body: "Intuitive reordering with instant preview updates." },
          { heading: "Fast Processing", body: "Large PDFs are reorganised instantly." },
          { heading: "Free to Use", body: "No account or watermarks." },
        ],
        faqs: [
          { q: "Can I also rotate pages while rearranging?", a: "Yes, rotation controls are available per page." },
          { q: "Is there a page limit?", a: "No page limit for rearranging." },
        ],
      },
    },
  },

  // Remove PDF Pages
  {
    slug: "remove-pdf-pages",
    name: "Remove PDF Pages",
    category: "PDF Tools",
    icon: FileX,
    blurb: "Delete individual pages or ranges from a PDF document.",
    accepts: "PDF",
    outputs: "PDF (pages removed)",
    seo: {
      title: "Remove PDF Pages Online Free — Delete Pages from PDF",
      description: "Remove specific pages or page ranges from a PDF online for free. Preview all pages and delete unwanted ones. Download instantly.",
      keywords: ["remove pdf pages", "delete pdf pages", "pdf page remover", "remove page from pdf", "pdf delete page"],
      article: {
        intro: "Delete specific pages from a PDF without affecting the rest of the document. Preview all pages, click to select the ones you want to remove, and download the cleaned-up PDF.",
        howTo: ["Upload your PDF.", "Click pages to mark for deletion.", "Review your selection.", "Download the PDF with pages removed."],
        benefits: [
          { heading: "Page Preview", body: "See every page before deciding what to delete." },
          { heading: "Multi-Page Selection", body: "Remove individual pages or full ranges." },
          { heading: "Instant Result", body: "Processed and downloaded immediately." },
          { heading: "No Quality Loss", body: "Remaining pages are unchanged." },
        ],
        faqs: [
          { q: "Can I undo a page deletion?", a: "Re-upload the original file — the tool does not modify your original." },
          { q: "Can I remove blank pages automatically?", a: "Yes, there is an option to auto-detect and remove blank pages." },
        ],
      },
    },
  },

  // Extract PDF Pages
  {
    slug: "extract-pdf-pages",
    name: "Extract PDF Pages",
    category: "PDF Tools",
    icon: FileOutput,
    blurb: "Pull specific pages out of a PDF and save them as a new document.",
    accepts: "PDF",
    outputs: "Extracted PDF",
    seo: {
      title: "Extract PDF Pages Online Free — Save Pages as New PDF",
      description: "Extract specific pages from a PDF and save them as a new PDF file online for free. Select pages or page ranges, instant download.",
      keywords: ["extract pdf pages", "pdf page extractor", "save pdf pages", "pdf page saver", "extract pages from pdf"],
      article: {
        intro: "Pull out exactly the pages you need from a large PDF. Select individual pages or ranges and download them as a separate PDF file.",
        howTo: ["Upload your PDF.", "Select the pages or ranges to extract.", "Click Extract.", "Download the new PDF."],
        benefits: [
          { heading: "Precise Selection", body: "Pick any combination of individual pages or ranges." },
          { heading: "New File", body: "Original PDF is untouched — extracted pages become a separate document." },
          { heading: "Fast", body: "Extraction happens in seconds regardless of file size." },
          { heading: "Free", body: "No account or subscription required." },
        ],
        faqs: [
          { q: "Can I extract non-consecutive pages?", a: "Yes, select any individual pages in any combination." },
          { q: "Is the original PDF modified?", a: "No, the original remains unchanged." },
        ],
      },
    },
  },

  // Rotate PDF Pages
  {
    slug: "rotate-pdf-pages",
    name: "Rotate PDF Pages",
    category: "PDF Tools",
    icon: RotateCw,
    blurb: "Rotate individual pages or the entire PDF by 90°, 180° or 270°.",
    accepts: "PDF",
    outputs: "Rotated PDF",
    seo: {
      title: "Rotate PDF Pages Online Free — Fix PDF Orientation",
      description: "Rotate PDF pages online for free. Rotate individual pages or all pages by 90, 180 or 270 degrees. Download the corrected PDF instantly.",
      keywords: ["rotate pdf", "pdf rotation", "rotate pdf pages", "fix pdf orientation", "turn pdf"],
      article: {
        intro: "Fix incorrectly oriented pages in a PDF by rotating them 90°, 180° or 270°. Rotate all pages or select specific ones with thumbnail previews.",
        howTo: ["Upload your PDF.", "Select pages to rotate.", "Choose 90°, 180° or 270°.", "Download the corrected PDF."],
        benefits: [
          { heading: "Any Angle", body: "Rotate 90° clockwise, 90° counterclockwise, or 180°." },
          { heading: "Per-Page Control", body: "Rotate individual pages independently." },
          { heading: "All Pages at Once", body: "Apply a rotation to every page in one click." },
          { heading: "No Quality Loss", body: "Rotation does not re-compress or degrade PDF content." },
        ],
        faqs: [
          { q: "Can I rotate only landscape pages?", a: "Yes, there's an option to auto-detect and rotate landscape pages." },
          { q: "Does rotation affect image quality?", a: "No, rotation is lossless." },
        ],
      },
    },
  },

  // Bookmark PDF
  {
    slug: "bookmark-pdf",
    name: "Bookmark PDF",
    category: "PDF Tools",
    icon: BookMarked,
    blurb: "Add clickable bookmarks and a table of contents to long PDF documents.",
    accepts: "PDF",
    outputs: "PDF with bookmarks",
    seo: {
      title: "Bookmark PDF Online Free — Add PDF Bookmarks & Table of Contents",
      description: "Add bookmarks and a clickable table of contents to PDF documents online for free. Navigate large PDFs easily. Download instantly.",
      keywords: ["bookmark pdf", "pdf bookmarks", "pdf table of contents", "add bookmarks to pdf", "pdf navigation"],
      article: {
        intro: "Make long PDF documents easy to navigate by adding bookmarks and an interactive table of contents. Readers can jump to any section with a single click.",
        howTo: ["Upload your PDF.", "Add bookmark titles and link to pages.", "Organise into a hierarchy.", "Download the bookmarked PDF."],
        benefits: [
          { heading: "Clickable Navigation", body: "Jump to any section instantly in any PDF reader." },
          { heading: "Hierarchical Bookmarks", body: "Organise chapters and sub-sections into a tree." },
          { heading: "Auto-Detection", body: "Auto-detect headings to generate bookmarks automatically." },
          { heading: "Professional Output", body: "Bookmarked PDFs look polished and are reader-friendly." },
        ],
        faqs: [
          { q: "Will bookmarks show in Adobe Reader?", a: "Yes, bookmarks are standard PDF features visible in all readers." },
          { q: "Can I import existing bookmarks?", a: "Yes, existing bookmarks are shown and can be edited." },
        ],
      },
    },
  },

  // Extract PDF Images
  {
    slug: "extract-pdf-images",
    name: "Extract PDF Images",
    category: "PDF Tools",
    icon: FileSearch,
    blurb: "Pull all embedded images out of a PDF and download them as separate files.",
    accepts: "PDF",
    outputs: "Images (JPG / PNG)",
    seo: {
      title: "Extract PDF Images Online Free — Save Images from PDF",
      description: "Extract all images embedded in a PDF online for free. Download as JPG or PNG files. No account required.",
      keywords: ["extract images from pdf", "pdf image extractor", "save images from pdf", "pull images from pdf"],
      article: {
        intro: "Extract every image embedded in a PDF and download them as individual high-quality files. No need to take screenshots — get the original image data directly.",
        howTo: ["Upload your PDF.", "Click Extract Images.", "Preview all found images.", "Download as a ZIP file."],
        benefits: [
          { heading: "Original Quality", body: "Extract images at their original embedded resolution." },
          { heading: "Batch Download", body: "Download all images in a single ZIP file." },
          { heading: "Multiple Formats", body: "Choose JPG or PNG output format." },
          { heading: "Fast & Free", body: "No account or software required." },
        ],
        faqs: [
          { q: "Will vector graphics be extracted?", a: "Raster images are extracted. Vectors can be exported as SVG." },
          { q: "What if the images are very small?", a: "All embedded images are extracted regardless of size." },
        ],
      },
    },
  },

  // Web Optimize PDF
  {
    slug: "web-optimize-pdf",
    name: "Web Optimize PDF",
    category: "PDF Tools",
    icon: Zap,
    blurb: "Linearise a PDF for fast web viewing — pages load as they stream, not after full download.",
    accepts: "PDF",
    outputs: "Web-Optimised PDF",
    seo: {
      title: "Web Optimize PDF Online Free — Fast Web View PDF",
      description: "Web optimize (linearize) PDF files for fast browser streaming online for free. Enable Fast Web View so pages load instantly as they download.",
      keywords: ["web optimize pdf", "linearize pdf", "fast web view pdf", "pdf streaming optimization", "pdf web ready"],
      article: {
        intro: "Web-optimised (linearised) PDFs load page-by-page as they download, making them feel instant in a browser. Essential for PDF documents hosted on websites.",
        howTo: ["Upload your PDF.", "Click Web Optimize.", "Download the optimised PDF.", "Host it on your website for instant loading."],
        benefits: [
          { heading: "Instant First Page", body: "The first page appears before the full file downloads." },
          { heading: "Better UX", body: "Visitors don't wait for a large PDF to fully load." },
          { heading: "SEO Friendly", body: "Faster page loads improve Core Web Vitals scores." },
          { heading: "Standard Compatible", body: "Linearised PDFs work in all PDF viewers." },
        ],
        faqs: [
          { q: "What is PDF linearisation?", a: "Linearisation restructures a PDF so the first page can be shown while the rest is still downloading." },
          { q: "Does it reduce file size?", a: "It may slightly reduce size as part of optimisation." },
        ],
      },
    },
  },

  // PDF OCR
  {
    slug: "pdf-ocr",
    name: "PDF OCR",
    category: "PDF Tools",
    icon: ScanText,
    blurb: "Make scanned PDFs searchable and selectable by running OCR on every page.",
    accepts: "PDF (Scanned)",
    outputs: "Searchable PDF",
    seo: {
      title: "PDF OCR Online Free — Make Scanned PDF Searchable",
      description: "Run OCR on scanned PDF documents online for free. Convert image-only PDFs into searchable, selectable text PDFs. Supports 100+ languages.",
      keywords: ["pdf ocr", "ocr pdf online", "make pdf searchable", "scanned pdf to text", "pdf text recognition"],
      article: {
        intro: "Apply Optical Character Recognition (OCR) to scanned PDFs to make text searchable and selectable. Ideal for digitising paper archives, contracts, and reports.",
        howTo: ["Upload your scanned PDF.", "Choose the document language.", "Click Run OCR.", "Download the searchable PDF."],
        benefits: [
          { heading: "100+ Languages", body: "OCR recognises text in over 100 languages." },
          { heading: "Searchable Output", body: "Text becomes selectable and Ctrl+F searchable." },
          { heading: "Preserves Layout", body: "Original page layout and images are preserved." },
          { heading: "High Accuracy", body: "Neural OCR engine achieves 99%+ accuracy on clear documents." },
        ],
        faqs: [
          { q: "Does it work on handwritten text?", a: "It performs best on printed text. Handwriting recognition is limited." },
          { q: "Will the original images be kept?", a: "Yes, the OCR text layer is added behind the original page image." },
        ],
      },
    },
  },

  // Repair PDF
  {
    slug: "repair-pdf",
    name: "Repair PDF",
    category: "PDF Tools",
    icon: Wrench,
    blurb: "Fix corrupted, damaged or broken PDF files that won't open or display correctly.",
    accepts: "PDF (Damaged)",
    outputs: "Repaired PDF",
    seo: {
      title: "Repair PDF Online Free — Fix Corrupted PDF Files",
      description: "Repair damaged or corrupted PDF files online for free. Recover content from broken PDFs that won't open. Fast, no account needed.",
      keywords: ["repair pdf", "fix corrupted pdf", "damaged pdf repair", "pdf recovery", "broken pdf fix"],
      article: {
        intro: "Recover content from PDFs that are corrupted, partially downloaded, or won't open. Our repair tool reconstructs the file structure to restore as much content as possible.",
        howTo: ["Upload the damaged PDF.", "Click Repair PDF.", "Download the recovered PDF.", "Review the restored content."],
        benefits: [
          { heading: "Deep Repair", body: "Reconstructs PDF file structure from partially valid data." },
          { heading: "Content Recovery", body: "Recovers text, images and formatting where possible." },
          { heading: "Fast Processing", body: "Most repairs complete in under 30 seconds." },
          { heading: "Free to Try", body: "No cost to attempt a repair." },
        ],
        faqs: [
          { q: "Can all damaged PDFs be repaired?", a: "Success depends on the severity of damage. Partially corrupted files have the highest recovery rate." },
          { q: "Why is my PDF corrupted?", a: "Common causes are interrupted downloads, file transfer errors, or storage issues." },
        ],
      },
    },
  },

  // Protect PDF
  {
    slug: "protect-pdf",
    name: "Protect PDF",
    category: "PDF Tools",
    icon: Lock,
    blurb: "Password-protect a PDF to restrict opening, printing or copying of content.",
    accepts: "PDF",
    outputs: "Password-protected PDF",
    seo: {
      title: "Protect PDF Online Free — Add Password to PDF",
      description: "Password protect PDF files online for free. Add open password, restrict printing and copying. 256-bit AES encryption. No account needed.",
      keywords: ["protect pdf", "password protect pdf", "encrypt pdf", "pdf password", "secure pdf"],
      article: {
        intro: "Add strong password protection to any PDF to prevent unauthorised access. Set an open password, and optionally restrict printing, copying, and editing.",
        howTo: ["Upload your PDF.", "Set an open password and optional permissions password.", "Choose restrictions.", "Download the protected PDF."],
        benefits: [
          { heading: "256-bit AES Encryption", body: "Industry-standard encryption keeps your documents secure." },
          { heading: "Granular Permissions", body: "Control printing, copying, editing and annotation rights separately." },
          { heading: "Instant Encryption", body: "Files are encrypted and ready to share in seconds." },
          { heading: "Works Everywhere", body: "Protected PDFs open with the password in any PDF reader." },
        ],
        faqs: [
          { q: "What encryption level is used?", a: "256-bit AES, the same standard used by banks." },
          { q: "Can I restrict only printing but allow reading?", a: "Yes, permissions are controlled independently." },
        ],
      },
    },
  },

  // Unlock PDF
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    category: "PDF Tools",
    icon: Unlock,
    blurb: "Remove password protection from a PDF you own and have the password for.",
    accepts: "Password-protected PDF",
    outputs: "Unlocked PDF",
    seo: {
      title: "Unlock PDF Online Free — Remove PDF Password",
      description: "Remove password from PDF files online for free. Unlock PDFs you own to enable editing, printing and copying. Instant download.",
      keywords: ["unlock pdf", "remove pdf password", "pdf unlocker", "decrypt pdf", "pdf password remover"],
      article: {
        intro: "Remove the password from a PDF file you own. Enter the current password to unlock the document and download a version without any restrictions.",
        howTo: ["Upload your password-protected PDF.", "Enter the current password.", "Click Unlock PDF.", "Download the unlocked PDF."],
        benefits: [
          { heading: "Instant Unlocking", body: "Remove restrictions in seconds." },
          { heading: "Full Access Restored", body: "Re-enable printing, copying and editing." },
          { heading: "Secure Processing", body: "Files are processed and deleted immediately after." },
          { heading: "Free to Use", body: "No subscription required." },
        ],
        faqs: [
          { q: "Can I unlock a PDF without the password?", a: "No — you must provide the correct password. We cannot bypass encryption." },
          { q: "Will the unlocked PDF have any watermark?", a: "No watermarks are added." },
        ],
      },
    },
  },

  // Redact PDF
  {
    slug: "redact-pdf",
    name: "Redact PDF",
    category: "PDF Tools",
    icon: ShieldOff,
    blurb: "Permanently black out sensitive text and images from a PDF so they cannot be recovered.",
    accepts: "PDF",
    outputs: "Redacted PDF",
    seo: {
      title: "Redact PDF Online Free — Permanently Remove Sensitive Information",
      description: "Redact sensitive text and images from PDF documents online for free. Permanent, unrecoverable redaction. Download instantly.",
      keywords: ["redact pdf", "pdf redaction", "black out pdf text", "remove sensitive info pdf", "pdf censoring"],
      article: {
        intro: "Permanently remove sensitive information from PDFs before sharing. Select text or draw boxes over areas to redact — the content is irreversibly deleted, not just covered.",
        howTo: ["Upload your PDF.", "Highlight or draw over sensitive areas.", "Click Apply Redaction.", "Download the permanently redacted PDF."],
        benefits: [
          { heading: "Permanent Removal", body: "Content is deleted from the PDF, not just visually covered." },
          { heading: "Search & Redact", body: "Find all instances of specific text and redact them at once." },
          { heading: "Legal Compliance", body: "Meets GDPR, HIPAA and FOIA redaction requirements." },
          { heading: "Verified", body: "Redacted areas cannot be recovered even with PDF editors." },
        ],
        faqs: [
          { q: "Is the redaction really permanent?", a: "Yes, the underlying content is deleted, not just covered with a black box." },
          { q: "Can I redact images?", a: "Yes, draw a redaction box over any image area." },
        ],
      },
    },
  },

  // Compare PDFs
  {
    slug: "compare-pdfs",
    name: "Compare PDFs",
    category: "PDF Tools",
    icon: GitCompare,
    blurb: "Side-by-side comparison of two PDF versions highlighting all differences.",
    accepts: "2 × PDF",
    outputs: "Comparison report",
    seo: {
      title: "Compare PDFs Online Free — Find Differences Between PDF Documents",
      description: "Compare two PDF files online for free. Highlight differences in text, images and layout side-by-side. Download a comparison report.",
      keywords: ["compare pdf", "pdf comparison tool", "diff pdf", "find differences in pdf", "pdf vs pdf"],
      article: {
        intro: "Spot every change between two versions of a document. Our tool highlights added, removed and modified text and images side-by-side, saving hours of manual review.",
        howTo: ["Upload the original PDF.", "Upload the revised PDF.", "Click Compare.", "Review highlighted differences and download the report."],
        benefits: [
          { heading: "Text-Level Diff", body: "Every word change is highlighted in red (removed) and green (added)." },
          { heading: "Visual Layout Diff", body: "Detects moved images and shifted elements." },
          { heading: "Side-by-Side View", body: "Original and revised documents displayed simultaneously." },
          { heading: "Comparison Report", body: "Download a summary of all changes." },
        ],
        faqs: [
          { q: "Does it work on scanned PDFs?", a: "Yes, OCR is applied to scanned PDFs before comparison." },
          { q: "Can I compare only specific pages?", a: "Yes, select page ranges for both documents." },
        ],
      },
    },
  },

  // PDF to Word
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    category: "PDF Tools",
    icon: FileType2,
    tag: "Popular",
    blurb: "Convert PDF documents to editable Word (.docx) files while preserving formatting.",
    accepts: "PDF",
    outputs: "DOCX",
    seo: {
      title: "PDF to Word Online Free — Convert PDF to Editable DOCX",
      description: "Convert PDF to Word (.docx) online for free. Preserve fonts, tables, images and layout. Edit the converted document in Microsoft Word.",
      keywords: ["pdf to word", "pdf to docx", "convert pdf to word", "pdf word converter", "editable word from pdf"],
      article: {
        intro: "Convert any PDF to an editable Microsoft Word document without re-typing. Fonts, tables, columns and images are preserved in the converted DOCX file.",
        howTo: ["Upload your PDF.", "Click Convert to Word.", "Download the DOCX file.", "Open and edit in Microsoft Word."],
        benefits: [
          { heading: "Layout Preserved", body: "Tables, columns, fonts and images carry over to Word." },
          { heading: "Editable Output", body: "Full Word document ready for editing and reformatting." },
          { heading: "OCR Included", body: "Scanned PDFs are OCR'd automatically before conversion." },
          { heading: "Fast", body: "Most PDFs convert in under 10 seconds." },
        ],
        faqs: [
          { q: "Does it work on scanned PDFs?", a: "Yes, OCR is applied automatically for scanned documents." },
          { q: "Will tables be preserved?", a: "Yes, tables are converted to native Word tables." },
        ],
      },
    },
  },

  // PDF to Excel
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    category: "PDF Tools",
    icon: FileSpreadsheet,
    tag: "Popular",
    blurb: "Extract tables from PDFs into editable Excel spreadsheets with data intact.",
    accepts: "PDF",
    outputs: "XLSX",
    seo: {
      title: "PDF to Excel Online Free — Convert PDF Tables to Spreadsheet",
      description: "Convert PDF to Excel (.xlsx) online for free. Extract tables and data from PDFs into editable spreadsheets. No account needed.",
      keywords: ["pdf to excel", "pdf to xlsx", "pdf table extractor", "convert pdf spreadsheet", "pdf data to excel"],
      article: {
        intro: "Extract data tables from any PDF and open them in Excel or Google Sheets for editing, analysis and calculations. All rows and columns are preserved in the output XLSX.",
        howTo: ["Upload your PDF.", "Click Convert to Excel.", "Download the XLSX file.", "Open in Microsoft Excel or Google Sheets."],
        benefits: [
          { heading: "Table Detection", body: "Automatically detects and extracts all tables." },
          { heading: "Multiple Tables", body: "Each table is placed on its own sheet." },
          { heading: "Data Integrity", body: "Cell values, merged cells and formatting preserved." },
          { heading: "No Re-Typing", body: "Save hours of manual data entry." },
        ],
        faqs: [
          { q: "What if the PDF has multiple tables per page?", a: "All tables on every page are detected and extracted." },
          { q: "Can it extract data from scanned PDFs?", a: "Yes, OCR is applied to extract table data from scanned documents." },
        ],
      },
    },
  },

  // PDF to PowerPoint
  {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    category: "PDF Tools",
    icon: Presentation,
    blurb: "Convert PDF slides into editable PowerPoint (.pptx) presentations.",
    accepts: "PDF",
    outputs: "PPTX",
    seo: {
      title: "PDF to PowerPoint Online Free — Convert PDF to PPTX",
      description: "Convert PDF files to PowerPoint presentations online for free. Each page becomes an editable slide. Download as PPTX.",
      keywords: ["pdf to powerpoint", "pdf to pptx", "convert pdf to presentation", "pdf slides to ppt"],
      article: {
        intro: "Convert each page of a PDF into an editable PowerPoint slide. Perfect for editing presentations that were exported as PDFs or sharing slides in a more accessible format.",
        howTo: ["Upload your PDF.", "Click Convert to PowerPoint.", "Download the PPTX file.", "Open and edit in PowerPoint."],
        benefits: [
          { heading: "Editable Slides", body: "Each PDF page becomes a fully editable slide." },
          { heading: "Image & Text Preserved", body: "Images, text boxes and layout are carried over." },
          { heading: "Instant Conversion", body: "Get your PPTX file in seconds." },
          { heading: "Free", body: "No account or subscription needed." },
        ],
        faqs: [
          { q: "Can I edit text after conversion?", a: "Yes, text is fully editable in the resulting PPTX." },
          { q: "Does it support multi-page PDFs?", a: "Yes, every page becomes a separate slide." },
        ],
      },
    },
  },

  // Word to PDF
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    category: "PDF Tools",
    icon: FileDown,
    tag: "Popular",
    blurb: "Convert Word (.docx/.doc) documents to PDF with perfect formatting fidelity.",
    accepts: "DOCX, DOC",
    outputs: "PDF",
    seo: {
      title: "Word to PDF Online Free — Convert DOCX to PDF",
      description: "Convert Word documents to PDF online for free. DOCX, DOC to PDF with perfect formatting. No account or software required.",
      keywords: ["word to pdf", "docx to pdf", "doc to pdf", "convert word to pdf", "microsoft word pdf"],
      article: {
        intro: "Convert Word documents to universally compatible PDF files that look identical on any device or OS. Perfect for sending documents that must not be modified.",
        howTo: ["Upload your Word file (.docx or .doc).", "Click Convert to PDF.", "Download the PDF.", "Share with confidence."],
        benefits: [
          { heading: "Perfect Fidelity", body: "Fonts, images, tables and formatting are pixel-perfect." },
          { heading: "Universal Compatibility", body: "PDF opens identically on every device." },
          { heading: "Instant", body: "Conversion takes seconds." },
          { heading: "Free", body: "No subscription required." },
        ],
        faqs: [
          { q: "Does it support .doc as well as .docx?", a: "Yes, both legacy .doc and modern .docx formats are supported." },
          { q: "Will my fonts be embedded?", a: "Yes, all fonts are embedded in the output PDF." },
        ],
      },
    },
  },

  // Excel to PDF
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    category: "PDF Tools",
    icon: Table2,
    blurb: "Convert Excel spreadsheets to clean, print-ready PDF documents.",
    accepts: "XLSX, XLS",
    outputs: "PDF",
    seo: {
      title: "Excel to PDF Online Free — Convert Spreadsheet to PDF",
      description: "Convert Excel spreadsheets to PDF online for free. XLSX and XLS to PDF with all cells, charts and formatting preserved.",
      keywords: ["excel to pdf", "xlsx to pdf", "xls to pdf", "spreadsheet to pdf", "convert excel pdf"],
      article: {
        intro: "Convert Excel files to PDF for sharing, printing or archiving. All cell data, charts, and formatting are preserved in the PDF output.",
        howTo: ["Upload your Excel file.", "Choose the sheets to include.", "Click Convert to PDF.", "Download the PDF."],
        benefits: [
          { heading: "All Sheets", body: "Convert single sheets or the entire workbook." },
          { heading: "Charts & Graphs", body: "All charts and visual elements are rendered." },
          { heading: "Print Ready", body: "Page breaks and print areas from Excel are respected." },
          { heading: "Free", body: "No account or software needed." },
        ],
        faqs: [
          { q: "Can I convert specific sheets only?", a: "Yes, choose which sheets to include in the PDF." },
          { q: "Will charts look correct?", a: "Yes, all charts are rendered exactly as in Excel." },
        ],
      },
    },
  },

  // PowerPoint to PDF
  {
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    category: "PDF Tools",
    icon: MonitorPlay,
    blurb: "Convert PowerPoint presentations to PDF — slides become document pages.",
    accepts: "PPTX, PPT",
    outputs: "PDF",
    seo: {
      title: "PowerPoint to PDF Online Free — Convert PPTX to PDF",
      description: "Convert PowerPoint to PDF online for free. PPTX and PPT to PDF with all slides, animations noted and formatting preserved.",
      keywords: ["powerpoint to pdf", "pptx to pdf", "ppt to pdf", "convert presentation to pdf", "slides to pdf"],
      article: {
        intro: "Convert PowerPoint presentations to PDF for universal sharing. Each slide becomes a PDF page with full graphics, fonts, and layout preserved.",
        howTo: ["Upload your PowerPoint file.", "Click Convert to PDF.", "Download the PDF.", "Share with anyone."],
        benefits: [
          { heading: "All Slides", body: "Every slide becomes a page in the PDF." },
          { heading: "Fonts Embedded", body: "All custom fonts are embedded in the PDF." },
          { heading: "No Software", body: "No PowerPoint or Adobe installation needed." },
          { heading: "Instant", body: "Convert in seconds." },
        ],
        faqs: [
          { q: "Will animations be preserved?", a: "Animations are not shown but slides export in their final state." },
          { q: "Does it support .ppt (old format)?", a: "Yes, both .ppt and .pptx are supported." },
        ],
      },
    },
  },

  // PDF to HTML
  {
    slug: "pdf-to-html",
    name: "PDF to HTML",
    category: "PDF Tools",
    icon: Code2,
    blurb: "Convert PDF documents to responsive HTML web pages for online publishing.",
    accepts: "PDF",
    outputs: "HTML",
    seo: {
      title: "PDF to HTML Online Free — Convert PDF to Web Page",
      description: "Convert PDF to HTML online for free. Turn PDF documents into web pages with text, images and layout. Download the HTML file.",
      keywords: ["pdf to html", "pdf to web page", "convert pdf html", "pdf html converter"],
      article: {
        intro: "Convert PDFs to HTML web pages for online publishing. Text, images and layout are converted to HTML and CSS that displays correctly in any browser.",
        howTo: ["Upload your PDF.", "Click Convert to HTML.", "Download the HTML file.", "Host on your website."],
        benefits: [
          { heading: "Web Ready", body: "Output HTML is clean and ready to publish online." },
          { heading: "Responsive", body: "Generated HTML adapts to all screen sizes." },
          { heading: "SEO Friendly", body: "Text is fully indexable by search engines." },
          { heading: "Image Extraction", body: "All images are extracted and linked in the HTML." },
        ],
        faqs: [
          { q: "Is the HTML valid and clean?", a: "Yes, output HTML passes W3C validation." },
          { q: "Are fonts included?", a: "Web-safe font alternatives are used for broad compatibility." },
        ],
      },
    },
  },

  // PDF to Text
  {
    slug: "pdf-to-text",
    name: "PDF to Text",
    category: "PDF Tools",
    icon: FileText,
    blurb: "Extract all text content from a PDF into a clean, editable plain text file.",
    accepts: "PDF",
    outputs: "TXT",
    seo: {
      title: "PDF to Text Online Free — Extract Text from PDF",
      description: "Extract text from PDF files online for free. Convert PDF to plain text (.txt) while preserving reading order. Download instantly.",
      keywords: ["pdf to text", "extract text from pdf", "pdf to txt", "pdf text extractor", "copy text from pdf"],
      article: {
        intro: "Extract all the text from a PDF and save it as a plain text file. Useful for content re-use, data extraction, and preparing text for NLP or analysis.",
        howTo: ["Upload your PDF.", "Click Extract Text.", "Preview the extracted text.", "Download as a .txt file."],
        benefits: [
          { heading: "Full Extraction", body: "All text from every page is extracted." },
          { heading: "Reading Order", body: "Text follows the natural reading order of the document." },
          { heading: "OCR Supported", body: "Scanned PDFs are OCR'd before text extraction." },
          { heading: "Instant Download", body: "Get your .txt file in seconds." },
        ],
        faqs: [
          { q: "Will column text be in the right order?", a: "Yes, we detect columns and preserve left-to-right reading order." },
          { q: "Can I extract text from scanned PDFs?", a: "Yes, OCR is automatically applied to scanned pages." },
        ],
      },
    },
  },

  // PDF to Markdown
  {
    slug: "pdf-to-markdown",
    name: "PDF to Markdown",
    category: "PDF Tools",
    icon: FileCode,
    blurb: "Convert PDF content into clean Markdown for documentation, CMS, or static sites.",
    accepts: "PDF",
    outputs: "Markdown (.md)",
    seo: {
      title: "PDF to Markdown Online Free — Convert PDF to MD",
      description: "Convert PDF documents to Markdown (.md) format online for free. Headings, lists, and tables are converted to Markdown syntax.",
      keywords: ["pdf to markdown", "pdf to md", "convert pdf markdown", "pdf markdown converter"],
      article: {
        intro: "Transform PDF documents into Markdown text for use in documentation systems, static site generators, or content management platforms.",
        howTo: ["Upload your PDF.", "Click Convert to Markdown.", "Preview the Markdown output.", "Download the .md file."],
        benefits: [
          { heading: "Structure Preserved", body: "Headings, lists, and tables become native Markdown." },
          { heading: "CMS Ready", body: "Use output in Jekyll, Hugo, Ghost, Notion and more." },
          { heading: "Developer Friendly", body: "Clean, minimal Markdown with no junk formatting." },
          { heading: "Free", body: "No account required." },
        ],
        faqs: [
          { q: "Are PDF images included?", a: "Images are referenced as local image links in the Markdown." },
          { q: "Are tables converted to Markdown tables?", a: "Yes, detected tables become Markdown pipe tables." },
        ],
      },
    },
  },

  // PDF to EPUB
  {
    slug: "pdf-to-epub",
    name: "PDF to EPUB",
    category: "PDF Tools",
    icon: BookOpen,
    blurb: "Convert PDF books and documents to EPUB for e-readers and mobile reading.",
    accepts: "PDF",
    outputs: "EPUB",
    seo: {
      title: "PDF to EPUB Online Free — Convert PDF to E-Book",
      description: "Convert PDF documents to EPUB format online for free. Read PDFs on Kindle, Kobo, Apple Books and any e-reader. Download instantly.",
      keywords: ["pdf to epub", "pdf to ebook", "convert pdf epub", "pdf kindle", "pdf ereader"],
      article: {
        intro: "Convert PDFs to EPUB so you can read them comfortably on any e-reader, tablet or phone. Text reflows to fit any screen size, unlike fixed-layout PDFs.",
        howTo: ["Upload your PDF.", "Click Convert to EPUB.", "Download the .epub file.", "Transfer to your e-reader."],
        benefits: [
          { heading: "Reflowable Text", body: "Text adapts to any screen size for comfortable reading." },
          { heading: "E-Reader Compatible", body: "Works on Kindle, Kobo, Apple Books and more." },
          { heading: "Chapters Preserved", body: "PDF headings become EPUB chapters." },
          { heading: "Offline Reading", body: "Read your converted book anywhere." },
        ],
        faqs: [
          { q: "Will images be included in the EPUB?", a: "Yes, all images are embedded in the EPUB file." },
          { q: "Does it work with Kindle?", a: "Yes — transfer the EPUB via Kindle's Send to Kindle feature." },
        ],
      },
    },
  },

  // PDF to PDF/A
  {
    slug: "pdf-to-pdfa",
    name: "PDF to PDF/A",
    category: "PDF Tools",
    icon: Shield,
    blurb: "Convert PDFs to the PDF/A archival format for long-term document preservation.",
    accepts: "PDF",
    outputs: "PDF/A",
    seo: {
      title: "PDF to PDF/A Online Free — Convert to Archival PDF",
      description: "Convert PDF to PDF/A format online for free. PDF/A is ISO-standardised for long-term digital archiving. Supports PDF/A-1b, 2b, and 3b.",
      keywords: ["pdf to pdfa", "pdf archival format", "pdf/a converter", "iso pdf archive", "long term pdf storage"],
      article: {
        intro: "PDF/A is an ISO standard designed to ensure that documents can be reproduced exactly decades from now. Convert any PDF to PDF/A for legal, governmental, or archival use.",
        howTo: ["Upload your PDF.", "Choose the PDF/A version (1b, 2b, 3b).", "Click Convert.", "Download the PDF/A file."],
        benefits: [
          { heading: "ISO Compliant", body: "Meets PDF/A-1b, PDF/A-2b and PDF/A-3b standards." },
          { heading: "Self-Contained", body: "All fonts, colour profiles and metadata are embedded." },
          { heading: "Future Proof", body: "Documents remain readable for 100+ years." },
          { heading: "Legal Compliance", body: "Required by many government and legal archiving standards." },
        ],
        faqs: [
          { q: "What is the difference between PDF/A-1 and PDF/A-2?", a: "PDF/A-2 allows JPEG2000, transparency, and embedded PDF files. PDF/A-3 also allows arbitrary file attachments." },
          { q: "Will my PDF pass a PDF/A validator after conversion?", a: "Yes, output passes veraPDF validation." },
        ],
      },
    },
  },

  //Remove PDF Metadata
  {
    slug: "remove-pdf-metadata",
    name: "Remove PDF Metadata",
    category: "PDF Tools",
    icon: ShieldOff,
    blurb: "Strip all author, software, creation date and custom metadata from a PDF.",
    accepts: "PDF",
    outputs: "Cleaned PDF",
    seo: {
      title: "Remove PDF Metadata Online Free — Strip PDF Information",
      description: "Remove metadata from PDF files online for free. Delete author, creator, creation date and all hidden data before sharing. Download instantly.",
      keywords: ["remove pdf metadata", "strip pdf info", "pdf metadata cleaner", "delete pdf author", "pdf privacy clean"],
      article: {
        intro: "PDFs contain hidden metadata including author name, company, software used, and edit history. Strip this information before sharing sensitive documents.",
        howTo: ["Upload your PDF.", "Click Remove Metadata.", "Download the cleaned PDF.", "Verify metadata is gone."],
        benefits: [
          { heading: "Privacy Protection", body: "Prevents accidental disclosure of personal or company data." },
          { heading: "All Fields Removed", body: "Author, creator, subject, keywords, and XMP data stripped." },
          { heading: "Instant", body: "Metadata is removed in seconds." },
          { heading: "Free", body: "No account required." },
        ],
        faqs: [
          { q: "What metadata fields are removed?", a: "Title, Author, Subject, Keywords, Creator, Producer, Creation Date, Modification Date, and all XMP fields." },
          { q: "Will the PDF content be changed?", a: "No, only metadata is removed. The document content is unchanged." },
        ],
      },
    },
  },
];
