// Visual invoice builders, page sizing, metadata, and image-to-PDF tools.
import { FileImage, FileType2, FileCode, Receipt, Layers, Eye, Settings2, LayoutGrid, Columns, Printer, KeyRound, Maximize2, FileInput, FileCheck, FileStack, FormInput } from "lucide-react";

import type { Tool } from "./types";

export const pdfLayoutTools: Tool[] = [
  {
    slug: "create-invoice-visually",
    name: "Create Invoice Visually",
    category: "PDF Tools",
    icon: FormInput,
    blurb: "Design professional PDF invoices visually with live interactive fields and automatic tax/total calculations.",
    accepts: "Visual Builder / Data",
    outputs: "PDF Invoice",
    seo: {
      title: "Create Invoice Visually Online Free — Visual PDF Invoice Maker",
      description: "Build clean, professional PDF invoices visually. Customize your company branding, add line items with tax calculations, and export instantly.",
      keywords: ["create invoice visually","visual invoice maker","free online invoice generator","pdf invoice designer","custom invoice creator"],
      article: {
        intro: "Craft beautiful and compliant PDF invoices directly in your browser with our visual invoice builder. No design experience needed.",
        howTo: ["Enter your business details and logo.","Add client information and invoice terms.","Insert line items, quantities, and tax rates.","Preview visually and download the finished PDF invoice."],
        benefits: [
          {
                    "heading": "Visual Real-Time Preview",
                    "body": "See changes update instantly on a pixel-perfect invoice canvas."
          },
          {
                    "heading": "Automatic Calculations",
                    "body": "Subtotals, discounts, taxes, and grand totals calculate on the fly."
          },
          {
                    "heading": "Brand Customization",
                    "body": "Add company logos, tailored accents, and notes easily."
          },
          {
                    "heading": "Private & Free",
                    "body": "No watermark, no registration, and data stays in your browser."
          }
],
        faqs: [
          {
                    "q": "Can I save my invoice template?",
                    "a": "Yes, you can export and re-open your invoice layout at any time."
          },
          {
                    "q": "Are taxes and discounts supported?",
                    "a": "Yes, multi-item taxes, percentage discounts, and shipping can be applied."
          }
],
      },
    },
  },

  // PDF Invoice to E-Invoice
  {
    slug: "pdf-invoice-to-einvoice",
    name: "PDF Invoice to E-Invoice",
    category: "PDF Tools",
    icon: Receipt,
    blurb: "Extract structured financial data from standard PDF invoices and convert them to compliant electronic XML/UBL e-invoices.",
    accepts: "PDF Invoice",
    outputs: "E-Invoice (XML / UBL)",
    seo: {
      title: "Convert PDF Invoice to E-Invoice Online — XML / UBL / Factur-X",
      description: "Convert standard PDF invoices into electronic XML, UBL 2.1, or Factur-X formats for B2B and tax compliance. Fast, accurate, and free.",
      keywords: ["pdf invoice to e-invoice","convert pdf to xml invoice","ubl invoice converter","factur-x generator","electronic invoice standard"],
      article: {
        intro: "Transform static PDF invoices into machine-readable electronic invoices compliant with European UBL and global e-invoicing mandates.",
        howTo: ["Upload your standard PDF invoice.","Review parsed fields including buyer, seller, and totals.","Select target format (UBL XML, Factur-X, or Peppol).","Download your compliant electronic invoice file."],
        benefits: [
          {
                    "heading": "Global Standard Compliance",
                    "body": "Supports Peppol BIS, UBL 2.1, and Factur-X electronic billing requirements."
          },
          {
                    "heading": "Intelligent Field Extraction",
                    "body": "Accurately identifies invoice numbers, line items, VAT, and totals."
          },
          {
                    "heading": "B2B Ready",
                    "body": "Seamlessly integrate with ERP and accounting software."
          },
          {
                    "heading": "Rapid Processing",
                    "body": "Complete conversion in seconds without manual data entry."
          }
],
        faqs: [
          {
                    "q": "What electronic invoice standards are supported?",
                    "a": "Standard UBL 2.1 XML, Factur-X, and Peppol BIS 3.0."
          },
          {
                    "q": "Can scanned invoices be converted?",
                    "a": "Yes, built-in OCR handles scanned documents and image-based PDFs."
          }
],
      },
    },
  },

  // XML E-Invoice to PDF
  {
    slug: "xml-einvoice-to-pdf",
    name: "XML E-Invoice to PDF",
    category: "PDF Tools",
    icon: FileCheck,
    blurb: "Convert electronic invoice XML files (UBL, Factur-X, ZUGFeRD) into human-readable visual PDF invoices.",
    accepts: "XML / E-Invoice",
    outputs: "Formatted PDF Invoice",
    seo: {
      title: "Convert XML E-Invoice to PDF Online Free — UBL & ZUGFeRD Viewer",
      description: "Easily render electronic XML invoices into readable, printable PDF documents. Supports UBL, ZUGFeRD, and Factur-X with clean layout templates.",
      keywords: ["xml e-invoice to pdf","convert ubl xml to pdf","zugferd to pdf","view xml invoice as pdf","electronic invoice reader"],
      article: {
        intro: "Machine-readable XML invoices can be hard to read. This tool parses UBL and ZUGFeRD data to generate a clean, visual PDF invoice ready to print or share.",
        howTo: ["Upload your XML or e-invoice file.","Choose an invoice visual design template.","Preview parsed line items and totals.","Download your printable visual PDF invoice."],
        benefits: [
          {
                    "heading": "Human-Readable Format",
                    "body": "Turns complex code tags into a clear visual invoice layout."
          },
          {
                    "heading": "Complete Data Display",
                    "body": "Displays tax breakdowns, bank payment details, and terms accurately."
          },
          {
                    "heading": "Print & Archive Ready",
                    "body": "Standard A4 layout ideal for bookkeeping and archiving."
          },
          {
                    "heading": "Instant Client-Side Render",
                    "body": "Files are processed securely and swiftly."
          }
],
        faqs: [
          {
                    "q": "Does this validate the XML schema?",
                    "a": "Yes, it parses and verifies required invoice tags before generating the PDF."
          },
          {
                    "q": "Is ZUGFeRD supported?",
                    "a": "Yes, both standalone XML and hybrid PDF/A-3 ZUGFeRD files are recognized."
          }
],
      },
    },
  },

  // PDF Overlay
  {
    slug: "pdf-overlay",
    name: "PDF Overlay",
    category: "PDF Tools",
    icon: FileStack,
    blurb: "Superimpose one PDF over another to apply letterheads, templates, stamps, or backgrounds.",
    accepts: "Two PDF files",
    outputs: "Combined PDF",
    seo: {
      title: "PDF Overlay Online — Superimpose PDF Pages & Letterheads",
      description: "Overlay one PDF document onto another online for free. Ideal for merging official company letterheads, background grids, or document watermarks.",
      keywords: ["pdf overlay","superimpose pdf","pdf letterhead overlay","merge pdf background","combine pdf layers"],
      article: {
        intro: "PDF Overlay lets you place a foreground PDF directly on top of a background PDF, perfect for applying corporate stationery, borders, or templates.",
        howTo: ["Upload your primary content PDF.","Upload your background or letterhead PDF.","Choose overlay position and layer priority.","Download the merged overlaid PDF."],
        benefits: [
          {
                    "heading": "Corporate Branding",
                    "body": "Apply letterheads and branding across multi-page documents instantly."
          },
          {
                    "heading": "Vector Fidelity",
                    "body": "Preserves vector logos and crisp text without pixelation."
          },
          {
                    "heading": "Multi-Page Support",
                    "body": "Repeat a single-page template over hundreds of pages in one click."
          },
          {
                    "heading": "No Software Needed",
                    "body": "Run entirely in your browser with zero installation."
          }
],
        faqs: [
          {
                    "q": "Does the overlay repeat across all pages?",
                    "a": "Yes, you can choose to apply the overlay to the first page, all pages, or specific ranges."
          },
          {
                    "q": "Will existing links and text be preserved?",
                    "a": "Yes, the vector text stream is preserved while merging the visual layers."
          }
],
      },
    },
  },

  // Change PDF Page Size
  {
    slug: "change-pdf-page-size",
    name: "Change PDF Page Size",
    category: "PDF Tools",
    icon: Maximize2,
    blurb: "Resize PDF document pages to standard formats like A4, Letter, A3, Legal, or custom dimensions.",
    accepts: "PDF",
    outputs: "Resized PDF",
    seo: {
      title: "Change PDF Page Size Online Free — Resize PDF to A4, Letter, A3",
      description: "Change PDF page dimensions online. Resize Letter to A4, A4 to A3, or set custom dimensions with proportional scaling and centering.",
      keywords: ["change pdf page size","resize pdf pages","pdf a4 to letter","resize pdf document","pdf scale page size"],
      article: {
        intro: "Easily adjust the physical page dimensions of any PDF document. Whether standardizing on A4 or fitting Letter paper, adjust sizes in seconds.",
        howTo: ["Upload the PDF document you want to resize.","Select a target standard size (A4, Letter, Legal, A3) or custom dimensions.","Choose scaling mode (fit to page, maintain aspect ratio, or crop).","Download your newly resized PDF."],
        benefits: [
          {
                    "heading": "Standard Print Sizes",
                    "body": "Convert seamlessly between US Letter, ISO A4, Legal, A3, and A5."
          },
          {
                    "heading": "Proportional Scaling",
                    "body": "Prevents distortion by proportionally scaling page contents."
          },
          {
                    "heading": "Batch Resizing",
                    "body": "Resize all pages or specify selected ranges at once."
          },
          {
                    "heading": "High DPI Preservation",
                    "body": "Maintains print-ready resolution and font sharpness."
          }
],
        faqs: [
          {
                    "q": "Will resizing my PDF blur the text?",
                    "a": "No, vector fonts and lines remain crisp at any target dimension."
          },
          {
                    "q": "Can I set custom dimensions?",
                    "a": "Yes, custom widths and heights in millimeters or inches are supported."
          }
],
      },
    },
  },

  // Change PDF Document Information
  {
    slug: "change-pdf-document-info",
    name: "Change PDF Document Information",
    category: "PDF Tools",
    icon: Settings2,
    blurb: "Edit title, author, subject, keywords, creation date, and metadata tags of your PDF document.",
    accepts: "PDF",
    outputs: "Updated PDF",
    seo: {
      title: "Change PDF Document Information & Metadata Online Free",
      description: "Edit PDF properties online: update Title, Author, Subject, Keywords, Creator, and Producer tags. Professional document metadata editor.",
      keywords: ["change pdf document info","edit pdf metadata","modify pdf properties","update pdf author and title","pdf metadata editor"],
      article: {
        intro: "Keep document properties accurate and professional. Update titles, author names, copyright details, and searchable tags directly.",
        howTo: ["Upload your PDF document.","Edit the Title, Author, Subject, and Keywords fields.","Optionally update Producer and Creation dates.","Click Save and download your updated PDF."],
        benefits: [
          {
                    "heading": "Search & SEO Optimization",
                    "body": "Help search engines and document management systems index files correctly."
          },
          {
                    "heading": "Professional Delivery",
                    "body": "Ensure correct author and corporate metadata on published PDFs."
          },
          {
                    "heading": "Quick Metadata Fixes",
                    "body": "Update outdated file descriptions without re-exporting from source apps."
          },
          {
                    "heading": "Secure",
                    "body": "Processed locally without storing personal metadata on external servers."
          }
],
        faqs: [
          {
                    "q": "Can I remove metadata completely?",
                    "a": "Yes, you can clear fields or use our dedicated 'Remove PDF Metadata' tool."
          },
          {
                    "q": "Are custom metadata fields supported?",
                    "a": "Standard PDF Info dictionary fields and common XMP tags are editable."
          }
],
      },
    },
  },

  // Pages per Sheet
  {
    slug: "pages-per-sheet",
    name: "Pages per Sheet",
    category: "PDF Tools",
    icon: LayoutGrid,
    blurb: "Arrange multiple PDF pages onto a single sheet (N-up layout: 2, 4, or 8 pages per sheet).",
    accepts: "PDF",
    outputs: "N-up PDF",
    seo: {
      title: "Pages per Sheet PDF Online Free — N-up PDF Layout Converter",
      description: "Put 2, 4, 8, or 16 PDF pages onto a single sheet online. Save paper and create printable handouts, booklets, and presentation summaries.",
      keywords: ["pages per sheet pdf","n-up pdf","2 pages per sheet pdf","multiple pages on one sheet pdf","pdf handout layout"],
      article: {
        intro: "Combine multiple pages of a PDF document onto a single sheet. Perfect for printing lecture slides, creating handouts, and reducing paper usage.",
        howTo: ["Upload your PDF file.","Choose the number of pages per sheet (2, 4, 8, or 16).","Select page order (horizontal or vertical) and margin spacing.","Download the compact N-up PDF ready for printing."],
        benefits: [
          {
                    "heading": "Save Paper & Printing Costs",
                    "body": "Cut printing volume in half or more by tiling multiple pages."
          },
          {
                    "heading": "Custom Layout Grids",
                    "body": "Choose 2x1, 2x2, 2x4, or 4x4 grids with optional border lines."
          },
          {
                    "heading": "Ideal for Handouts",
                    "body": "Transform slide decks into readable meeting packets."
          },
          {
                    "heading": "Lossless Compression",
                    "body": "Preserves text sharpness and color gradients."
          }
],
        faqs: [
          {
                    "q": "Can I add a border line around each mini-page?",
                    "a": "Yes, you can toggle thin borders around each page."
          },
          {
                    "q": "What paper size is the output?",
                    "a": "You can keep the original sheet size or standardize to A4/Letter."
          }
],
      },
    },
  },

  // Halve PDF Pages
  {
    slug: "halve-pdf-pages",
    name: "Halve PDF Pages",
    category: "PDF Tools",
    icon: Columns,
    blurb: "Split 2-page spreads or book scans horizontally or vertically into separate individual PDF pages.",
    accepts: "PDF",
    outputs: "Split Pages PDF",
    seo: {
      title: "Halve PDF Pages Online Free — Split 2-Page Spreads & Book Scans",
      description: "Split double-page PDF scans into single pages online. Automatically cut 2-page spreads in half vertically or horizontally for easy reading.",
      keywords: ["halve pdf pages","split 2-page spreads","cut pdf pages in half","split scanned book pdf","convert two pages to one pdf"],
      article: {
        intro: "Scanned books and magazines often have two pages per sheet. Halve PDF Pages splits every spread down the center into sequential individual pages.",
        howTo: ["Upload your scanned 2-page spread PDF.","Choose the split direction (vertical for side-by-side, horizontal for top/bottom).","Set page reading order (left-to-right or right-to-left).","Download your sequential single-page PDF."],
        benefits: [
          {
                    "heading": "Perfect for Book Scans",
                    "body": "Converts double-page scans into mobile-friendly e-reading format."
          },
          {
                    "heading": "Automatic Split Line",
                    "body": "Accurately bisects pages right through the binding gutter."
          },
          {
                    "heading": "Reading Direction Control",
                    "body": "Supports standard Left-to-Right and Right-to-Left (e.g. Manga/Hebrew/Arabic)."
          },
          {
                    "heading": "No Re-compression Artifacts",
                    "body": "Keeps the original scan resolution intact."
          }
],
        faqs: [
          {
                    "q": "Will the page count double?",
                    "a": "Yes, each 2-page spread sheet becomes two standalone pages in the correct reading sequence."
          },
          {
                    "q": "Can I preview before splitting?",
                    "a": "Yes, an interactive preview shows where the cut line will be placed."
          }
],
      },
    },
  },

  // Rasterize PDF
  {
    slug: "rasterize-pdf",
    name: "Rasterize PDF",
    category: "PDF Tools",
    icon: Printer,
    blurb: "Convert vector text and layers in a PDF into secure, high-resolution flattened raster images.",
    accepts: "PDF",
    outputs: "Rasterized PDF",
    seo: {
      title: "Rasterize PDF Online Free — Convert PDF Text to Flattened Images",
      description: "Rasterize PDF documents online. Turn text, vectors, and hidden objects into secure, flattened bitmap images to prevent copying and editing.",
      keywords: ["rasterize pdf","flatten pdf to image","convert pdf vectors to bitmap","secure pdf rasterization","prevent text copy pdf"],
      article: {
        intro: "Rasterizing converts every page of a PDF into a high-resolution image layer. This eliminates selectable text and vector shapes, making documents tamper-proof.",
        howTo: ["Upload your vector PDF file.","Select output resolution (150 DPI for web, 300 DPI for print).","Optionally select color mode (color, grayscale, monochrome).","Download your fully rasterized, secure PDF."],
        benefits: [
          {
                    "heading": "Tamper Prevention",
                    "body": "Stops text extraction, editing, and vector reverse engineering."
          },
          {
                    "heading": "Consistent Display",
                    "body": "Looks identical on every printer, operating system, and PDF viewer."
          },
          {
                    "heading": "Strips Hidden Data",
                    "body": "Removes hidden underlying vector paths, comments, and draft layers."
          },
          {
                    "heading": "Custom DPI Selection",
                    "body": "Choose 150, 300, or 600 DPI for optimum quality and file size balance."
          }
],
        faqs: [
          {
                    "q": "Can someone copy text after rasterization?",
                    "a": "No, the text is turned into pixel artwork and cannot be highlighted or selected."
          },
          {
                    "q": "Will the PDF look blurry?",
                    "a": "At 300 DPI, text remains crisp and indistinguishable from vector in standard print."
          }
],
      },
    },
  },

  // Flatten PDF
  {
    slug: "flatten-pdf",
    name: "Flatten PDF",
    category: "PDF Tools",
    icon: Layers,
    blurb: "Merge all form fields, annotations, comments, and layers into an uneditable single background layer.",
    accepts: "PDF",
    outputs: "Flattened PDF",
    seo: {
      title: "Flatten PDF Online Free — Lock Form Fields & Annotations",
      description: "Flatten PDF forms and comments online. Lock fillable form fields, digital signatures, and annotations permanently into the document.",
      keywords: ["flatten pdf","lock pdf form fields","flatten pdf annotations","make pdf uneditable","flatten fillable pdf"],
      article: {
        intro: "Flattening locks all interactive elements—including fillable text fields, checkboxes, stamps, and annotations—into permanent page content.",
        howTo: ["Upload your interactive or annotated PDF.","Click the Flatten PDF button.","Review the flattened preview.","Download your locked, read-only PDF file."],
        benefits: [
          {
                    "heading": "Lock Form Responses",
                    "body": "Ensures filled out contracts and applications cannot be altered."
          },
          {
                    "heading": "Universal Viewer Support",
                    "body": "Fixes missing signature and comment display bugs on older PDF readers."
          },
          {
                    "heading": "Preserves Visual Layout",
                    "body": "All checkmarks, signatures, and notes remain exactly where you placed them."
          },
          {
                    "heading": "Reduces File Errors",
                    "body": "Removes interactive scripts and complex multi-layer form hierarchies."
          }
],
        faqs: [
          {
                    "q": "Can flattened form fields still be edited?",
                    "a": "No, once flattened, all form inputs become static page content."
          },
          {
                    "q": "Is the text still searchable?",
                    "a": "Yes, standard vector text flattening keeps text searchable while locking inputs."
          }
],
      },
    },
  },

  // Generate Password
  {
    slug: "generate-password",
    name: "Generate Password",
    category: "PDF Tools",
    icon: KeyRound,
    blurb: "Generate cryptographically secure, high-entropy passwords to protect your confidential PDF files.",
    accepts: "Configuration",
    outputs: "Secure Password",
    seo: {
      title: "Secure PDF Password Generator — Strong Random Password Tool",
      description: "Generate ultra-secure, cryptographically strong passwords for protecting PDF files and sensitive archives. High entropy with customizable symbols.",
      keywords: ["generate password","pdf password generator","strong random password","secure password maker","high entropy password tool"],
      article: {
        intro: "Protecting confidential PDF files requires high-entropy passwords resilient against brute-force attacks. Generate robust passwords directly in your browser.",
        howTo: ["Choose your preferred password length (12 to 64 characters).","Toggle uppercase, lowercase, numbers, and special symbols.","Click Generate to create a cryptographically secure key.","Copy the password and use it to lock your PDF document."],
        benefits: [
          {
                    "heading": "Cryptographic Entropy",
                    "body": "Uses window.crypto.getRandomValues for true non-deterministic randomness."
          },
          {
                    "heading": "Zero Server Transmission",
                    "body": "Generated 100% on your device—passwords are never sent across the network."
          },
          {
                    "heading": "Brute-Force Immune",
                    "body": "Exceeds standard 128-bit and 256-bit AES cryptographic resistance thresholds."
          },
          {
                    "heading": "One-Click Copy",
                    "body": "Copy directly to clipboard with instant confirmation."
          }
],
        faqs: [
          {
                    "q": "Is this safe to use for sensitive documents?",
                    "a": "Yes, passwords are created entirely client-side using native browser cryptography."
          },
          {
                    "q": "What length is recommended for PDF protection?",
                    "a": "At least 16 to 24 characters containing mixed letters, numbers, and symbols."
          }
],
      },
    },
  },

  // View as PDF
  {
    slug: "view-as-pdf",
    name: "View as PDF",
    category: "PDF Tools",
    icon: Eye,
    blurb: "Preview and inspect any document or image rendered directly inside a clean, high-fidelity PDF viewer.",
    accepts: "PDF / Documents / Images",
    outputs: "PDF Viewer",
    seo: {
      title: "View as PDF Online Free — Fast In-Browser PDF Reader & Viewer",
      description: "Open and view PDF documents online without installing software. Fast page navigation, thumbnail sidebar, high-resolution zoom, and search.",
      keywords: ["view as pdf","online pdf viewer","free pdf reader","in-browser pdf preview","open pdf online"],
      article: {
        intro: "Open, inspect, and read PDF documents directly inside your web browser. Featuring smooth multi-page navigation, zoom, and bookmark support.",
        howTo: ["Upload or drop your PDF document.","Use the toolbar to navigate pages, zoom in/out, or rotate view.","Search for words or phrases across the document.","Read comfortably in single-page, two-page, or continuous mode."],
        benefits: [
          {
                    "heading": "No Downloads Required",
                    "body": "Works instantly on any desktop, tablet, or smartphone browser."
          },
          {
                    "heading": "Fast Rendering",
                    "body": "Powered by modern canvas rendering for smooth 60 FPS scrolling."
          },
          {
                    "heading": "Complete Privacy",
                    "body": "Files are rendered locally without uploading your private pages to cloud storage."
          },
          {
                    "heading": "Feature-Rich Toolbar",
                    "body": "Includes full page zoom, rotation, thumbnails, and text selection."
          }
],
        faqs: [
          {
                    "q": "Can I view password-protected PDFs?",
                    "a": "Yes, you can enter the document password to unlock and read protected files."
          },
          {
                    "q": "Is there a page limit?",
                    "a": "Our optimized reader smoothly handles documents with hundreds of pages."
          }
],
      },
    },
  },

  // Set PDF Viewer Preferences
  {
    slug: "set-pdf-viewer-preferences",
    name: "Set PDF Viewer Preferences",
    category: "PDF Tools",
    icon: Settings2,
    blurb: "Configure default display zoom, page layout, single/facing page view, and toolbar visibility for readers.",
    accepts: "PDF",
    outputs: "Configured PDF",
    seo: {
      title: "Set PDF Viewer Preferences Online Free — Initial View Settings",
      description: "Configure PDF initial view preferences: set default zoom, single or two-page display, hide toolbars, or enable fullscreen mode on open.",
      keywords: ["set pdf viewer preferences","pdf initial view settings","configure pdf default zoom","pdf two page view default","pdf display preferences"],
      article: {
        intro: "Control how your PDF appears when opened in Adobe Acrobat or browser viewers. Specify default zoom level, page spread layout, and UI visibility.",
        howTo: ["Upload your PDF document.","Choose Initial View options: Page Only, Bookmarks Panel, or Thumbnails.","Set default page layout (Single Page, Two Pages, Continuous).","Save and download your configured PDF."],
        benefits: [
          {
                    "heading": "Optimal First Impression",
                    "body": "Ensure recipients see your document at the perfect zoom and layout."
          },
          {
                    "heading": "Showcase Portfolios & Books",
                    "body": "Automatically open presentation brochures in handsome two-page spreads."
          },
          {
                    "heading": "Kiosk & Fullscreen Ready",
                    "body": "Set documents to open in distraction-free presentation mode."
          },
          {
                    "heading": "Standards Compliant",
                    "body": "Writes valid PDF viewer preference dictionary entries supported everywhere."
          }
],
        faqs: [
          {
                    "q": "Will this work in all PDF readers?",
                    "a": "Yes, Adobe Acrobat, Foxit, Apple Preview, and modern browsers respect standard viewer preferences."
          },
          {
                    "q": "Can I hide the menu bar on open?",
                    "a": "Yes, flags like HideMenubar, HideToolbar, and FitWindow can be toggled."
          }
],
      },
    },
  },

  // Convert to PDF
  {
    slug: "convert-to-pdf",
    name: "Convert to PDF",
    category: "PDF Tools",
    icon: FileInput,
    blurb: "Universal converter to turn Word, Excel, PPT, images, and text documents into high-quality PDFs.",
    accepts: "Word, Excel, PPT, Images, Text",
    outputs: "PDF Document",
    seo: {
      title: "Convert to PDF Online Free — Universal Document to PDF Converter",
      description: "Convert any file to PDF online. Supports Word (DOCX/DOC), Excel (XLSX/XLS), PowerPoint (PPTX), Images (JPG/PNG/WEBP), and text files.",
      keywords: ["convert to pdf","all to pdf","universal pdf converter","free document to pdf","convert file to pdf online"],
      article: {
        intro: "Our universal Convert to PDF tool accepts virtually any office document, image, or text file and outputs a clean, standardized PDF.",
        howTo: ["Upload your file (DOCX, XLSX, PPTX, JPG, PNG, TXT, etc.).","Configure layout orientation and page margins.","Click Convert to PDF.","Download your standardized, high-resolution PDF document."],
        benefits: [
          {
                    "heading": "All-in-One Conversion",
                    "body": "Handles dozens of file formats in one convenient workspace."
          },
          {
                    "heading": "Layout Preservation",
                    "body": "Keeps fonts, tables, alignments, and images perfectly in place."
          },
          {
                    "heading": "High Print Resolution",
                    "body": "Exports at 300+ DPI suitable for professional physical printing."
          },
          {
                    "heading": "No Watermarks",
                    "body": "Download 100% clean PDF files with zero branding or watermarks."
          }
],
        faqs: [
          {
                    "q": "Can I convert multiple files at once?",
                    "a": "Yes, batch upload multiple files to convert them sequentially or merge into one PDF."
          },
          {
                    "q": "Is file quality preserved?",
                    "a": "Yes, original image resolutions and font metrics are strictly maintained."
          }
],
      },
    },
  },

  // Publisher to PDF
  {
    slug: "publisher-to-pdf",
    name: "Publisher to PDF",
    category: "PDF Tools",
    icon: FileType2,
    blurb: "Convert Microsoft Publisher (.pub) files into universally viewable, print-ready PDF documents.",
    accepts: "Microsoft Publisher (.pub)",
    outputs: "PDF Document",
    seo: {
      title: "Convert Publisher to PDF Online Free — .PUB to PDF Converter",
      description: "Convert Microsoft Publisher (.pub) files to PDF online without having Microsoft Office installed. Retains layouts, fonts, flyers, and brochures.",
      keywords: ["publisher to pdf","convert pub to pdf","microsoft publisher to pdf free","open pub file as pdf","pub file converter"],
      article: {
        intro: "Microsoft Publisher files can only be opened by select Windows systems. Convert .pub files to universally accessible PDFs readable on any device.",
        howTo: ["Upload your Microsoft Publisher (.pub) document.","Wait while the layout and vector elements are processed.","Preview the generated document pages.","Download the finished, print-ready PDF."],
        benefits: [
          {
                    "heading": "No MS Office Required",
                    "body": "Convert .pub files on Mac, Linux, iOS, Android, or Windows."
          },
          {
                    "heading": "Accurate Layout Rendering",
                    "body": "Retains complex multi-column brochures, flyers, and newsletters."
          },
          {
                    "heading": "CMYK & RGB Support",
                    "body": "Maintains print color fidelity for professional printing presses."
          },
          {
                    "heading": "Instant Access",
                    "body": "Eliminates proprietary software lock-in."
          }
],
        faqs: [
          {
                    "q": "Can I open old Publisher files?",
                    "a": "Yes, supports Publisher 2000, 2003, 2007, 2010, 2013, 2016, and 2019 versions."
          },
          {
                    "q": "Can I print the resulting PDF?",
                    "a": "Yes, the output is formatted at standard print dimensions with sharp vector graphics."
          }
],
      },
    },
  },

  // JPG to PDF
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Convert JPG and JPEG photos into clean, high-quality PDF files with customizable page sizing.",
    accepts: "JPG, JPEG",
    outputs: "PDF Document",
    seo: {
      title: "JPG to PDF Online Free — Convert JPG Images to PDF",
      description: "Convert JPG and JPEG pictures to PDF online for free. Adjust orientation, margins, and page sizes (A4, Letter) in seconds.",
      keywords: ["jpg to pdf","convert jpg to pdf","jpeg to pdf online","combine jpg into pdf","photo to pdf converter"],
      article: {
        intro: "Convert single or multiple JPG images into a clean, paginated PDF document. Ideal for receipts, photo portfolios, and scanned documents.",
        howTo: ["Upload one or more JPG or JPEG photos.","Arrange image order, orientation, and margin spacing.","Click Convert to PDF.","Download your compact, high-quality PDF file."],
        benefits: [
          {
                    "heading": "Multiple Photos into One PDF",
                    "body": "Combine dozens of JPG shots into a single organized document."
          },
          {
                    "heading": "Custom Page Sizing",
                    "body": "Fit images to A4, US Letter, or match the exact image aspect ratio."
          },
          {
                    "heading": "Quality Optimization",
                    "body": "Adjust compression to balance small file size and maximum clarity."
          },
          {
                    "heading": "100% Free & Unlimited",
                    "body": "No daily conversion limits and no registration required."
          }
],
        faqs: [
          {
                    "q": "Can I rearrange the order of pictures?",
                    "a": "Yes, drag and drop image cards to arrange pages in any desired order."
          },
          {
                    "q": "Does it lower image resolution?",
                    "a": "By default, your original image resolution is preserved without loss."
          }
],
      },
    },
  },

  // PNG to PDF
  {
    slug: "png-to-pdf",
    name: "PNG to PDF",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Convert PNG images with transparency preservation directly into crisp, professional PDF documents.",
    accepts: "PNG",
    outputs: "PDF Document",
    seo: {
      title: "PNG to PDF Online Free — Convert PNG Images to PDF Document",
      description: "Convert PNG pictures to PDF online for free. Retain high-resolution details and transparent backgrounds in a professional PDF format.",
      keywords: ["png to pdf","convert png to pdf","png to pdf transparent","combine png to pdf","lossless png to pdf"],
      article: {
        intro: "Convert PNG graphics, illustrations, and screenshots into clean PDF documents with razor-sharp lines and lossless quality.",
        howTo: ["Select and upload your PNG images.","Set background fill color (white, black, or custom) or keep transparency.","Set page layout and margins.","Download the generated PDF."],
        benefits: [
          {
                    "heading": "Lossless Graphics",
                    "body": "Maintains pixel-perfect edges for diagrams, icons, and UI screenshots."
          },
          {
                    "heading": "Multi-Image Batching",
                    "body": "Batch combine multiple PNG files into a multi-page PDF."
          },
          {
                    "heading": "Custom Backgrounds",
                    "body": "Fill transparent areas with clean white paper background."
          },
          {
                    "heading": "Lightning Fast",
                    "body": "Instant conversion running directly inside your browser."
          }
],
        faqs: [
          {
                    "q": "What happens to transparent PNG backgrounds?",
                    "a": "You can keep them transparent or auto-fill with clean white paper background."
          },
          {
                    "q": "Can I combine PNG and JPG files?",
                    "a": "Yes, you can upload both formats together to compile your PDF."
          }
],
      },
    },
  },

  // WEBP to PDF
  {
    slug: "webp-to-pdf",
    name: "WEBP to PDF",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Convert modern web format WEBP images into universally compatible PDF pages.",
    accepts: "WEBP",
    outputs: "PDF Document",
    seo: {
      title: "WEBP to PDF Online Free — Convert Google WEBP Images to PDF",
      description: "Convert WEBP images downloaded from websites into standard PDF documents. Fast, secure, and preserves full visual quality.",
      keywords: ["webp to pdf","convert webp to pdf","webp image to pdf","batch webp to pdf","google webp converter"],
      article: {
        intro: "WEBP is the dominant modern web image format, but older programs and printers struggle with it. Convert your WEBP files to standard PDF in seconds.",
        howTo: ["Upload your WEBP image files.","Reorder images and pick page dimensions.","Click Convert to PDF.","Download your universal PDF document."],
        benefits: [
          {
                    "heading": "Universal Compatibility",
                    "body": "Make web images viewable in any PDF reader or print shop."
          },
          {
                    "heading": "Preserves High Compression",
                    "body": "Maintains the efficiency of modern WEBP compression in PDF form."
          },
          {
                    "heading": "Batch Processing",
                    "body": "Convert multiple downloaded WEBP graphics into one document."
          },
          {
                    "heading": "Private & Local",
                    "body": "Zero cloud upload needed—processed locally in your browser."
          }
],
        faqs: [
          {
                    "q": "Are animated WEBP files supported?",
                    "a": "Yes, animated frames can be extracted into individual pages."
          },
          {
                    "q": "Is quality degraded?",
                    "a": "No, WEBP pixel information is transferred directly into the PDF container."
          }
],
      },
    },
  },

  // HEIC to PDF
  {
    slug: "heic-to-pdf",
    name: "HEIC to PDF",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Convert Apple iPhone & iPad HEIC / HEIF camera photos directly to PDF in seconds.",
    accepts: "HEIC, HEIF",
    outputs: "PDF Document",
    seo: {
      title: "HEIC to PDF Online Free — Convert iPhone Photos to PDF",
      description: "Convert Apple iPhone HEIC and HEIF photos to PDF online for free. Combine multiple iOS camera shots into a single printable PDF document.",
      keywords: ["heic to pdf","convert heic to pdf","iphone photo to pdf","heif to pdf online","apple heic to pdf free"],
      article: {
        intro: "iPhone cameras save photos in HEIC format, which many Windows PCs and document portals cannot open. Convert HEIC to PDF effortlessly.",
        howTo: ["Upload HEIC or HEIF images directly from your iPhone or computer.","Reorder pages and adjust portrait or landscape orientation.","Click Convert to PDF.","Download your standardized, universally viewable PDF."],
        benefits: [
          {
                    "heading": "Open iPhone Photos Anywhere",
                    "body": "Solves compatibility headaches when uploading receipts or IDs."
          },
          {
                    "heading": "Preserves High Dynamic Range",
                    "body": "Maintains rich color gamut and contrast from Apple camera sensors."
          },
          {
                    "heading": "Multi-Photo Consolidation",
                    "body": "Merge multiple receipt photos into a single reimbursement packet."
          },
          {
                    "heading": "Works on Any Device",
                    "body": "Compatible with Windows, Mac, Linux, Android, and iOS."
          }
],
        faqs: [
          {
                    "q": "Can I convert directly from an iPhone Safari browser?",
                    "a": "Yes, you can pick photos straight from your iOS Photo Library."
          },
          {
                    "q": "Are Live Photos supported?",
                    "a": "The high-resolution still frame of the Live Photo is converted."
          }
],
      },
    },
  },

  // SVG to PDF
  {
    slug: "svg-to-pdf",
    name: "SVG to PDF",
    category: "PDF Tools",
    icon: FileCode,
    blurb: "Convert scalable vector graphics (SVG) to vector-preserved, infinitely sharp PDF documents.",
    accepts: "SVG",
    outputs: "Vector PDF",
    seo: {
      title: "SVG to PDF Online Free — Convert Scalable Vector Graphics to PDF",
      description: "Convert SVG vector files to PDF online. Retain scalable vector paths, gradients, and font typography for infinite zoom and high-end printing.",
      keywords: ["svg to pdf","convert svg to pdf","vector svg to pdf","scalable vector graphics to pdf","svg print to pdf"],
      article: {
        intro: "Convert SVG vector artwork, charts, and logos into vector PDF files. No rasterization or pixelation—lines stay razor-sharp at any zoom level.",
        howTo: ["Upload your SVG vector file.","Set target page size or auto-fit to SVG viewBox boundaries.","Click Convert to PDF.","Download your vector-grade PDF document."],
        benefits: [
          {
                    "heading": "True Vector Fidelity",
                    "body": "Keeps bezier curves, fills, strokes, and gradients 100% scalable."
          },
          {
                    "heading": "Print Ready",
                    "body": "Ideal for large-format blueprints, architectural plans, and signage."
          },
          {
                    "heading": "Compact File Size",
                    "body": "Vector commands produce ultra-small PDF files compared to bitmaps."
          },
          {
                    "heading": "Embedded Fonts",
                    "body": "Preserves custom typography and text glyphs accurately."
          }
],
        faqs: [
          {
                    "q": "Will the output PDF be rasterized?",
                    "a": "No, paths and vector commands are converted directly into native PDF vector operators."
          },
          {
                    "q": "Can I print SVG to architectural sheet sizes (A0/A1)?",
                    "a": "Yes, you can choose large format page sizes during export."
          }
],
      },
    },
  },

  // TIFF to PDF
  {
    slug: "tiff-to-pdf",
    name: "TIFF to PDF",
    category: "PDF Tools",
    icon: FileImage,
    blurb: "Convert multi-page TIFF and TIF image files into a single, compact PDF document.",
    accepts: "TIFF, TIF",
    outputs: "PDF Document",
    seo: {
      title: "TIFF to PDF Online Free — Convert Multi-Page TIF to PDF",
      description: "Convert multi-page TIFF and TIF scanner files to PDF online for free. Ideal for archival records, medical scans, faxes, and legal filings.",
      keywords: ["tiff to pdf","convert tiff to pdf","multi page tif to pdf","fax tiff to pdf","scanned tiff converter"],
      article: {
        intro: "Office scanners and legacy fax systems often produce multi-page TIFF files. Convert them to modern, compressed PDF documents in seconds.",
        howTo: ["Upload your single or multi-page TIFF / TIF file.","Preview individual pages and choose layout settings.","Click Convert to PDF.","Download your unified PDF document."],
        benefits: [
          {
                    "heading": "Multi-Page Extraction",
                    "body": "Automatically splits multi-page TIFF files into sequential PDF pages."
          },
          {
                    "heading": "Lossless or Compressed",
                    "body": "Choose between CCITT Group 4, LZW, or Deflate compression modes."
          },
          {
                    "heading": "Ideal for Legal & Medical",
                    "body": "Complies with electronic court filing and healthcare archiving rules."
          },
          {
                    "heading": "Bulk Upload",
                    "body": "Convert multiple independent TIFFs simultaneously."
          }
],
        faqs: [
          {
                    "q": "Are 1-bit monochrome scans supported?",
                    "a": "Yes, CCITT fax and bi-level scanned documents are fully supported."
          },
          {
                    "q": "Can I reduce the huge file size of TIFFs?",
                    "a": "Yes, our smart PDF encoder drastically reduces file size while retaining legibility."
          }
],
      },
    },
  },

  // DOCX to PDF
];
