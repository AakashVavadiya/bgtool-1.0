import { tools, resolveCanonicalToolSlug, type Tool, type ToolCategory } from "@/lib/tools";

/**
 * News & Guides engine.
 *
 * Every tool in `tools.ts` gets one long-form article (minimum 4,000 characters)
 * assembled from:
 *   1. the tool's own SEO data (intro, steps, benefits, FAQs, keywords), and
 *   2. category-specific long-form sections (how it works, use cases, tips,
 *      privacy, comparison) written to be useful rather than filler.
 *
 * Because articles are derived from `tools`, adding a new tool automatically
 * adds its article, news card, route and sitemap entry.
 */

export interface NewsSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
  ordered?: boolean;
}

export interface NewsFaq {
  q: string;
  a: string;
}

export interface NewsArticle {
  slug: string;
  toolSlug: string;
  toolName: string;
  category: ToolCategory;
  title: string;
  metaTitle: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  sections: NewsSection[];
  faqs: NewsFaq[];
}

export const NEWS_PUBLISHED_AT = "2026-10-20";

interface CategoryProfile {
  lead: string;
  deepDive: (n: string) => { heading: string; paragraphs: string[] }[];
  useCases: (n: string) => string[];
  tips: (n: string) => string[];
  privacy: (n: string) => string[];
  comparison: (n: string) => string[];
  extraFaqs: (n: string) => NewsFaq[];
}

const PROFILES: Record<ToolCategory, CategoryProfile> = {
  "AI Tools": {
    lead:
      "Artificial intelligence has moved from research papers into everyday creative and productivity workflows. Tasks that once demanded hours of manual masking, retouching or transcription can now be completed in seconds by neural networks trained on millions of examples.",
    deepDive: (n) => [
      {
        heading: `How ${n} Works Behind the Scenes`,
        paragraphs: [
          `Under the hood, ${n} relies on deep-learning models that have been trained to recognise patterns in pixels, text or audio. Instead of following a fixed list of hand-written rules, the model has learned statistical relationships from very large datasets, which lets it cope with photographs, screenshots and artwork that look nothing alike.`,
          `When you submit a file, it is decoded, normalised and passed through the network. The model produces a prediction, for example a transparency mask, an upscaled pixel grid or a block of recognised text, and that prediction is converted back into a normal file format that you can download and use straight away in any editor, document or website.`,
        ],
      },
      {
        heading: `Getting the Best Accuracy From ${n}`,
        paragraphs: [
          `AI output quality depends heavily on input quality. Sharp, well-lit sources with clear separation between the subject and everything around it give the network more information to work with, so you will usually see cleaner edges, fewer artefacts and more faithful detail than you would from a blurry or heavily compressed original.`,
          `If the first result is not perfect, try again with a different source file, a higher resolution version of the same picture, or any options the tool exposes. Small changes in framing, contrast, lighting or file format can noticeably change how the model interprets the content, and a second attempt often fixes the one detail you were unhappy with.`,
        ],
      },
    ],
    useCases: (n) => [
      `Online sellers use ${n} to prepare consistent, marketplace-ready product images without paying for studio retouching.`,
      `Social media managers use ${n} to turn raw photos into polished, on-brand posts in a few clicks.`,
      `Designers and agencies use ${n} to remove repetitive manual work and spend their time on creative decisions instead.`,
      `Students and researchers use ${n} to process material quickly when a deadline is close and a desktop licence is not an option.`,
      `Photographers use ${n} to rescue older or lower-resolution pictures that would otherwise be unusable.`,
      `Small businesses use ${n} to produce professional-looking assets without hiring a specialist or learning complex software.`,
    ],
    tips: (n) => [
      `Start from the highest quality original you have rather than a screenshot or a re-saved copy; ${n} can only work with the detail that exists in the file.`,
      `Prefer well-lit images with a clear difference between subject and surroundings for the cleanest AI results.`,
      `Check the result at 100 percent zoom before downloading, especially around fine details such as hair, text and thin lines.`,
      `Keep an untouched copy of the original so you can always run the tool again with different settings.`,
      `Use PNG when you need transparency preserved and JPG when you need the smallest possible file for the web.`,
      `If you process many files, work in small batches and review each result so that one unusual image does not slip through unchecked.`,
    ],
    privacy: (n) => [
      `Privacy matters most when the files you process are personal photos, client artwork or confidential documents. bg.tools is built around a zero file storage approach: your input is used to produce the result you asked for and is not kept in a gallery, a training set or an archive that other people can browse.`,
      `That means you can use ${n} for work files and family pictures with the same peace of mind. You do not need to create a public profile, and there is no social feed where your uploads could ever appear. When you close the page, you are finished.`,
    ],
    comparison: (n) => [
      `Traditional desktop software can match or beat AI tools on difficult edits, but it needs an expensive licence, a powerful computer and many hours of practice. ${n} compresses that learning curve into a single page that works on a laptop, a tablet or a phone.`,
      `Compared with generic online editors, ${n} focuses on one job and does it well. There are no pop-ups asking you to subscribe before you can download, no watermark across the result and no forced registration just to try the tool.`,
    ],
    extraFaqs: (n) => [
      {
        q: `Is ${n} really free to use?`,
        a: `Yes. You can try ${n} for free every day. If you need higher volume you can add credits or choose a plan, but the core experience is open to everyone without a watermark.`,
      },
      {
        q: `Can I use the results from ${n} commercially?`,
        a: `In general, yes. The output is your own processed version of your own file, so you can use it in products, advertising and client work. You remain responsible for having the rights to the original image or content you upload.`,
      },
      {
        q: `Why does ${n} sometimes need a second attempt?`,
        a: `AI models make predictions, and unusual lighting, very low resolution or cluttered scenes can lead to an imperfect first result. Trying a cleaner or larger source usually solves it.`,
      },
    ],
  },

  "Image Editing & Optimization": {
    lead:
      "Images make up the majority of the bytes on a typical web page, and they are also the part of a page visitors notice first. Well prepared images load quickly, look sharp on every screen and keep storage and bandwidth costs under control.",
    deepDive: (n) => [
      {
        heading: `Why ${n} Matters for Websites and Social Media`,
        paragraphs: [
          `Search engines measure how quickly the main content of a page appears, and heavy images are the most common reason pages feel slow. Using ${n} before you publish keeps files lean, which helps visitors on mobile networks and supports better Core Web Vitals scores over time.`,
          `The same discipline helps outside of websites. Email clients, messaging apps and social networks all apply their own limits and automatic re-compression. If you prepare the image yourself with ${n}, you stay in control of the final look instead of leaving it to a platform that may soften details or crop the picture awkwardly.`,
        ],
      },
      {
        heading: `Understanding Quality, Resolution and File Size`,
        paragraphs: [
          `Three ideas control almost every image decision: resolution (how many pixels there are), compression (how aggressively detail is thrown away) and format (how those pixels are stored). ${n} lets you adjust the part of that triangle that matters for your task without damaging the others more than necessary.`,
          `A useful rule is to match the image to its destination. A thumbnail rarely needs more than a few hundred pixels across, a full-width hero banner may need two thousand, and a print file needs far more. Choosing the right target before you edit avoids repeated re-saving, which is what really degrades quality.`,
        ],
      },
    ],
    useCases: (n) => [
      `Web developers use ${n} to keep pages light and pass performance audits before launching a site.`,
      `Bloggers and publishers use ${n} so that every article image loads quickly without looking blurry.`,
      `E-commerce teams use ${n} to keep product galleries consistent across hundreds of listings.`,
      `Designers use ${n} to deliver files in exactly the dimensions and weight a client specification asks for.`,
      `Job seekers and students use ${n} to meet strict upload limits on application portals and forms.`,
      `Families and travellers use ${n} to share pictures by email or chat without hitting attachment size limits.`,
    ],
    tips: (n) => [
      `Always work from the original file instead of a copy that has already been compressed; repeated lossy saves add up.`,
      `Decide your target dimensions and file size before you start so that you only need to run ${n} once.`,
      `Use JPG for photographs, PNG for graphics and screenshots, and WEBP when you want the best size-to-quality ratio for the web.`,
      `Compare the preview against the original at full size, paying attention to gradients, skin tones and text edges.`,
      `Name files descriptively, for example red-running-shoes.jpg, because descriptive file names support image search.`,
      `Add meaningful alt text on your website after uploading, which helps accessibility and search visibility.`,
    ],
    privacy: (n) => [
      `Pictures often contain personal moments, ID documents or unreleased product designs. bg.tools follows a zero file storage guarantee, so the images you process with ${n} are not published, shared or kept in a library for later browsing.`,
      `You are not asked to build a profile or reveal personal information before you start, and the output is yours to download immediately. Use it for private photos and client work with the same confidence.`,
    ],
    comparison: (n) => [
      `Desktop editors offer endless control, but they take time to install, update and learn. For routine jobs such as resizing, compressing or tidying an image, ${n} gets the same practical result in a fraction of the time and works on any device with a browser.`,
      `Many free online tools hide limits behind sign-up walls or stamp a watermark on the download. ${n} is designed to give you a clean file that is ready to publish, with clear controls and an instant preview.`,
    ],
    extraFaqs: (n) => [
      {
        q: `Does ${n} reduce the quality of my image?`,
        a: `Only as much as you choose. With sensible settings the difference is hard to see, and the preview lets you compare against the original before you download.`,
      },
      {
        q: `Can I use ${n} on my phone?`,
        a: `Yes. The page is responsive and works in modern mobile browsers, so you can edit pictures straight from your camera roll without installing an app.`,
      },
      {
        q: `Will ${n} add a watermark to my file?`,
        a: `No. Your downloaded file is clean and ready to use in websites, documents and social posts.`,
      },
    ],
  },

  "Format Converters": {
    lead:
      "File formats exist because different devices, browsers and programs were built for different needs. That variety is useful for engineers, but it is frustrating when a file simply will not open or upload where you need it. A reliable converter removes that friction in seconds.",
    deepDive: (n) => [
      {
        heading: `What Happens When You Use ${n}`,
        paragraphs: [
          `Every image or media format is a different recipe for storing the same visual information. ${n} reads your source file, decodes it into raw pixel data and then writes that data back out using the rules of the target format, applying sensible defaults for colour handling and compression along the way.`,
          `Some conversions are effectively lossless, while others involve compromises, for example when a format supports transparency and the other does not, or when a format uses lossy compression. Understanding which case you are in helps you choose the best settings and avoid surprises in the finished file.`,
        ],
      },
      {
        heading: `Choosing the Right Format for the Job`,
        paragraphs: [
          `Photographs usually belong in JPG or WEBP because those formats store smooth colour gradients efficiently. Logos, icons and screenshots look best in PNG or SVG because they keep hard edges crisp and can preserve transparency without smudging.`,
          `Compatibility is the other half of the decision. Older software, print shops and some government portals only accept a short list of formats, while modern browsers handle almost everything. Check what the destination requires, then use ${n} to deliver exactly that.`,
        ],
      },
    ],
    useCases: (n) => [
      `Marketers use ${n} to deliver assets in the exact format an ad platform or email system requires.`,
      `Developers use ${n} to convert design exports into web-friendly formats during a build or handoff.`,
      `Students use ${n} to open files from classmates or school systems that use unfamiliar formats.`,
      `Photographers use ${n} to move between camera-friendly and share-friendly formats without opening heavy software.`,
      `Office teams use ${n} to fix attachments that will not preview correctly for a client or manager.`,
      `Hobbyists use ${n} to prepare images for printing, crafts, stickers and custom merchandise.`,
    ],
    tips: (n) => [
      `Keep the original file after converting so you can always go back to the highest quality version.`,
      `Avoid converting a lossy file to another lossy format repeatedly, because each pass can remove a little more detail.`,
      `If your image has transparency, choose a target format that supports it, such as PNG or WEBP, instead of JPG.`,
      `Check the converted file in the program or website where you plan to use it before deleting the source.`,
      `When file size matters, run the converted result through a compressor after ${n} for extra savings.`,
      `Use clear, descriptive file names so converted files are easy to find later.`,
    ],
    privacy: (n) => [
      `Converted files frequently include private photos or business material. bg.tools is built around a zero file storage guarantee, so what you convert with ${n} is not stored in a public gallery or reused for any other purpose.`,
      `There is no account wall in the way of a quick conversion, and you do not need to share an email address just to download your file.`,
    ],
    comparison: (n) => [
      `Installing a full desktop application just to change a file extension is a lot of overhead. ${n} lets you finish the job in a browser tab, which is especially handy on shared, school or work computers where you cannot install software.`,
      `Other converters may bury the download button under advertising or limit you to a handful of files. Here the workflow is short: choose a file, convert, download.`,
    ],
    extraFaqs: (n) => [
      {
        q: `Is converting with ${n} lossless?`,
        a: `That depends on the formats involved. Converting between lossless formats keeps every pixel, while converting into a lossy format such as JPG trades a little detail for a smaller file.`,
      },
      {
        q: `Will ${n} keep transparency?`,
        a: `Transparency is kept when the target format supports it, for example PNG or WEBP. Formats such as JPG do not support transparency, so transparent areas are filled with a solid colour.`,
      },
      {
        q: `Is there a file size limit for ${n}?`,
        a: `Very large files may take longer to process and depend on your device and browser. For best results use files at a normal working size.`,
      },
    ],
  },

  "Document Converters": {
    lead:
      "Documents travel between people, companies and systems that rarely use the same software. A proposal written in a word processor, a spreadsheet exported from accounting software and a slide deck from a presentation tool all need to be shared, archived or submitted in forms that other people can open reliably.",
    deepDive: (n) => [
      {
        heading: `How ${n} Preserves Your Content`,
        paragraphs: [
          `Documents are more than text. They contain fonts, spacing, tables, images, links and sometimes formulas. ${n} reads the structure of your source file and rebuilds it in the target format so that headings, paragraphs and tables stay in the same order and remain easy to edit or share.`,
          `Because each format has its own rules, tiny visual differences can appear, for example in unusual fonts or very complex layouts. For the vast majority of everyday documents such as reports, invoices and study notes, the converted result looks and reads the way you expect.`,
        ],
      },
      {
        heading: `Preparing a Document for a Clean Conversion`,
        paragraphs: [
          `A well-structured source always converts better. Use real headings and lists instead of manual spacing, keep tables simple and make sure images are inserted as pictures rather than pasted as shapes. These habits make the output tidier and the next edit easier.`,
          `Before converting, remove tracked changes, comments and hidden text that you do not want to share. After converting, scan the result once from top to bottom, because a thirty-second check is far cheaper than discovering a layout problem after you have sent the file.`,
        ],
      },
    ],
    useCases: (n) => [
      `Students use ${n} to turn assignments into the exact file type a teacher or portal asks for.`,
      `Freelancers use ${n} to deliver invoices, proposals and reports in a format every client can open.`,
      `HR and admin teams use ${n} to standardise forms, letters and records before archiving them.`,
      `Accountants use ${n} to move data between spreadsheets, documents and shareable files.`,
      `Researchers use ${n} to extract text and tables from papers and reports for analysis.`,
      `Teams use ${n} to share work with colleagues who use different office suites or devices.`,
    ],
    tips: (n) => [
      `Keep the original editable file; the converted version is best treated as an output for sharing.`,
      `Embed or use common fonts so that the converted document looks the same on every device.`,
      `Keep tables simple and avoid text boxes layered over images when you want the cleanest result from ${n}.`,
      `Review page breaks, headers and footers after converting, since these are the elements most likely to shift.`,
      `If the document contains sensitive information, remove it before conversion rather than relying on later edits.`,
      `Give the converted file a clear name and version number to avoid sending an outdated copy.`,
    ],
    privacy: (n) => [
      `Documents often hold contracts, financial figures and personal details. bg.tools uses a zero file storage approach, so files you convert with ${n} are processed for your request and are not stored in a searchable library.`,
      `We believe a conversion tool should only touch your document for as long as it takes to give you the result. There is no feed, no public link and no hidden copy waiting for someone else to find.`,
    ],
    comparison: (n) => [
      `Opening a document in the original software and exporting it works well when you own that software. ${n} helps when you do not, when you are on a borrowed device, or when you simply want a faster route than launching a heavyweight application.`,
      `Compared with email-gated converters that make you wait for a link, ${n} gives you the result directly in the browser so you can move on with your work.`,
    ],
    extraFaqs: (n) => [
      {
        q: `Will the layout stay the same after using ${n}?`,
        a: `For standard documents the layout is preserved closely. Very complex designs with unusual fonts or layered objects may shift slightly, so a quick review is recommended.`,
      },
      {
        q: `Can ${n} handle large documents?`,
        a: `Yes, within the limits of your browser and device. Very large files simply take longer to process.`,
      },
      {
        q: `Is it safe to convert confidential documents with ${n}?`,
        a: `Our zero file storage approach means files are not kept in a public library. As with any tool, avoid sharing sensitive files on devices you do not trust.`,
      },
    ],
  },

  "Creative & Utilities": {
    lead:
      "Not every task fits neatly into editing, conversion or document work. Small creative and utility jobs, such as generating a QR code, adding a signature or building a meme, come up constantly and deserve a fast, focused tool rather than a bloated application.",
    deepDive: (n) => [
      {
        heading: `What Makes ${n} Different`,
        paragraphs: [
          `${n} is built for speed and clarity. Instead of presenting dozens of menus, it exposes only the controls you need to finish the task, shows a live preview of the result and lets you download the output without creating an account or learning a new interface.`,
          `This focus matters because utility tasks are usually a small step inside a bigger project. Whether you are preparing a campaign, a form or a social post, you want to finish this step in a minute and get back to the work that actually matters.`,
        ],
      },
      {
        heading: `Making the Most of ${n}`,
        paragraphs: [
          `Start with a clear idea of where the result will be used. A QR code on a poster needs more contrast and size than one on a business card, and a sticker or meme needs different dimensions from a presentation graphic. Knowing the destination keeps your settings simple.`,
          `Test the output the way your audience will see it. Scan codes with a phone, view images on a small screen and print a sample before you commit to a large run. A quick real-world check catches problems that a preview alone can miss.`,
        ],
      },
    ],
    useCases: (n) => [
      `Small business owners use ${n} to create practical assets for menus, flyers, shop windows and packaging.`,
      `Marketers use ${n} to speed up campaign assets that would otherwise wait on a designer.`,
      `Teachers use ${n} to prepare classroom materials, worksheets and engaging visuals.`,
      `Event organisers use ${n} to produce tickets, signage and shareable links quickly.`,
      `Social creators use ${n} to make content that stands out and is easy to share.`,
      `Anyone with a one-off task uses ${n} to finish in minutes without installing new software.`,
    ],
    tips: (n) => [
      `Keep designs simple; a clean, high-contrast result works better at small sizes and on printed material.`,
      `Test the finished output on the device or medium where it will actually be used.`,
      `Download at the highest quality available and scale down later rather than the other way around.`,
      `Save your source details somewhere safe so you can regenerate the output with ${n} if plans change.`,
      `Keep brand colours and fonts consistent so that quick utility assets still feel professional.`,
      `Double-check spelling, links and numbers before sharing or printing the final file.`,
    ],
    privacy: (n) => [
      `The details you enter into utility tools, such as links, names and images, can be personal or commercial. bg.tools follows a zero file storage guarantee, so the content you use with ${n} is not published or kept in a public gallery.`,
      `You stay in control of what you create. Generate it, download it and use it where you need it, without leaving a trail on a public profile.`,
    ],
    comparison: (n) => [
      `Full design suites can do almost anything, but they are slow to open and slower to learn. For a focused job, ${n} is faster, simpler and available from any browser, which makes it ideal for quick turnarounds.`,
      `Many single-purpose sites are cluttered with advertising or ask you to subscribe before you can export. ${n} aims to keep the path from idea to downloaded file short and clean.`,
    ],
    extraFaqs: (n) => [
      {
        q: `Do I need an account to use ${n}?`,
        a: `You can start using ${n} right away. An account is only needed for features such as saved credits and purchase history.`,
      },
      {
        q: `Can I use what I make with ${n} commercially?`,
        a: `Yes, what you create is yours to use, provided you have the rights to any images, logos or text you include.`,
      },
      {
        q: `What is the best resolution to download from ${n}?`,
        a: `Download the highest quality available and resize afterwards. This keeps the result sharp whether you use it on a screen or in print.`,
      },
    ],
  },

  "PDF Tools": {
    lead:
      "The PDF is the world's default format for contracts, invoices, applications and manuals because it looks the same on every device. That reliability comes with a catch: PDFs are harder to edit, merge or shrink than ordinary documents, and the right tool saves a great deal of time.",
    deepDive: (n) => [
      {
        heading: `How ${n} Handles Your PDF`,
        paragraphs: [
          `A PDF is a container that stores pages, fonts, images and instructions for drawing them. ${n} opens that container, applies the change you asked for, such as reorganising pages or reducing weight, and then writes a new PDF that remains compatible with the readers people use every day.`,
          `Because the page content is treated as a whole, text, vector graphics and embedded images stay consistent. The goal is a result you can send to a client, upload to a portal or print without any surprises about layout or missing fonts.`,
        ],
      },
      {
        heading: `PDF Best Practices for Professionals`,
        paragraphs: [
          `Name files clearly, keep page order logical and remove anything you do not intend to share, such as draft pages or internal comments. A tidy PDF reflects well on you and makes the recipient's job easier, whether they are a manager, a customer or an official.`,
          `For anything confidential, think about protection before you send. Passwords, restricted permissions and carefully chosen content all help ensure that a document reaches only the people who should see it. Small habits like these prevent big headaches later.`,
        ],
      },
    ],
    useCases: (n) => [
      `Students use ${n} to assemble assignments, scanned notes and certificates into single, well-ordered files.`,
      `Job seekers use ${n} to prepare CVs and supporting documents that meet strict upload limits.`,
      `Finance and legal teams use ${n} to organise contracts, statements and records for sharing or archiving.`,
      `Freelancers use ${n} to deliver professional, consistent paperwork to clients.`,
      `Administrators use ${n} to fix, combine or split PDFs received from different departments.`,
      `Teams use ${n} to turn scans and exports into files that are easy to email and store.`,
    ],
    tips: (n) => [
      `Work on a copy of your PDF so that you can return to the original if you change your mind.`,
      `Check page order and orientation in the preview before downloading the result from ${n}.`,
      `For scanned documents, make sure the pages are straight and well lit before you begin.`,
      `Keep file names and version numbers consistent so recipients always open the latest version.`,
      `If the file will be emailed, aim for a modest size to avoid attachment limits.`,
      `Never share passwords in the same message as a protected file.`,
    ],
    privacy: (n) => [
      `PDFs frequently contain contracts, identity details and financial information. bg.tools is built around a zero file storage guarantee, so documents processed with ${n} are not stored in a public library or reused for other purposes.`,
      `Our aim is simple: process the file you give us, hand back the result and leave nothing behind for others to browse.`,
    ],
    comparison: (n) => [
      `Premium desktop PDF suites are powerful, yet they carry subscriptions and demanding installs. For common jobs, ${n} gets you to the same practical result straight from a browser tab on any device.`,
      `Compared with services that ask you to register or wait for an emailed link, ${n} keeps things direct: choose a file, adjust settings, download.`,
    ],
    extraFaqs: (n) => [
      {
        q: `Will ${n} change how my PDF looks?`,
        a: `The goal is to keep the appearance consistent. Fonts, images and layout should remain stable, with only the change you requested applied.`,
      },
      {
        q: `Can I use ${n} for large PDFs?`,
        a: `Yes, within the limits of your browser and device. Larger files simply take a little longer to process.`,
      },
      {
        q: `Is ${n} safe for confidential PDFs?`,
        a: `We follow a zero file storage approach, so your PDF is not kept in a public library. As always, avoid handling sensitive files on devices you do not trust.`,
      },
    ],
  },
};

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMetaTitle(name: string): string {
  const candidates = [
    `${name} Online Free: Full Guide (2026)`,
    `${name}: Complete Free Guide`,
    `${name} Guide | bg.tools`,
    `${name} | bg.tools`,
  ];
  return candidates.find((c) => c.length <= 60) ?? name.slice(0, 57) + "...";
}

function trimDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : cut.length)}…`;
}

function buildArticle(tool: Tool): NewsArticle {
  const n = tool.name;
  const profile = PROFILES[tool.category];
  const art = tool.seo.article;
  const lowerName = n.toLowerCase();

  const sections: NewsSection[] = [];

  sections.push({
    id: "overview",
    heading: `What Is ${n}?`,
    paragraphs: [
      art.intro,
      profile.lead,
      `${n} on bg.tools is designed around one idea: ${tool.blurb.charAt(0).toLowerCase()}${tool.blurb.slice(1)} It accepts ${tool.accepts} and delivers ${tool.outputs.toLowerCase()}, so you can go from a raw file to a finished result without installing software or learning a complicated interface.`,
    ],
  });

  sections.push({
    id: "how-to",
    heading: `How to Use ${n} Step by Step`,
    paragraphs: [
      `Using ${lowerName} takes less than a minute once you know the flow. Follow these steps for a clean result every time:`,
    ],
    list: art.howTo,
    ordered: true,
  });

  sections.push({
    id: "benefits",
    heading: `Key Benefits of Using ${n}`,
    paragraphs: [
      `People choose ${lowerName} on bg.tools for a handful of practical reasons that save time and protect the quality of their work.`,
    ],
  });
  for (const b of art.benefits) {
    sections.push({
      id: `benefit-${slugifyHeading(b.heading)}`,
      heading: b.heading,
      paragraphs: [b.body],
    });
  }

  for (const block of profile.deepDive(n)) {
    sections.push({
      id: slugifyHeading(block.heading),
      heading: block.heading,
      paragraphs: block.paragraphs,
    });
  }

  sections.push({
    id: "use-cases",
    heading: `Who Uses ${n} and Why`,
    paragraphs: [
      `${n} is useful to a wide range of people, from solo creators to large teams. Here are some of the most common ways it is used in real projects:`,
    ],
    list: profile.useCases(n),
  });

  sections.push({
    id: "tips",
    heading: `Pro Tips for Better Results With ${n}`,
    paragraphs: [
      `A few simple habits make a noticeable difference to the output. Keep these tips in mind the next time you use ${lowerName}:`,
    ],
    list: profile.tips(n),
  });

  sections.push({
    id: "privacy",
    heading: `Privacy and Security When Using ${n}`,
    paragraphs: profile.privacy(n),
  });

  sections.push({
    id: "comparison",
    heading: `${n} Compared With Other Options`,
    paragraphs: profile.comparison(n),
  });

  sections.push({
    id: "why-bg-tools",
    heading: "Why bg.tools Is Built Differently",
    paragraphs: [
      `bg.tools brings more than a hundred free online image, document and PDF tools together in one place, so you do not have to hunt for a new website every time your task changes. The interface is consistent, the tools are fast and the pricing is straightforward, with free daily credits for casual use and affordable packs for heavier workloads.`,
      `The platform is created by Upanishad, an independent software studio that cares about speed, simplicity and respect for user privacy. Every tool is tested on real files and on real devices, and the roadmap is shaped by feedback from the people who use it each day.`,
    ],
  });

  sections.push({
    id: "conclusion",
    heading: `Start Using ${n} Today`,
    paragraphs: [
      `If you need a quick, dependable way to work with ${tool.accepts}, ${lowerName} is ready whenever you are. There is nothing to install, no watermark on the result and no complicated setup standing between you and a finished file.`,
      `Open the tool, add your file and see the result for yourself. If you run into a question along the way, the FAQ below and our support team are here to help.`,
    ],
  });

  const faqs: NewsFaq[] = [...art.faqs, ...profile.extraFaqs(n)];

  const wordCount = sections
    .map((s) => [...(s.paragraphs ?? []), ...(s.list ?? [])].join(" "))
    .concat(faqs.map((f) => `${f.q} ${f.a}`))
    .join(" ")
    .split(/\s+/).length;

  return {
    slug: tool.slug,
    toolSlug: tool.slug,
    toolName: n,
    category: tool.category,
    title: `${n} Online Free: The Complete Guide, Tips and Use Cases`,
    metaTitle: buildMetaTitle(n),
    description: trimDescription(
      `Learn how to use ${lowerName} online for free. ${art.intro}`,
    ),
    keywords: tool.seo.keywords,
    publishedAt: NEWS_PUBLISHED_AT,
    updatedAt: NEWS_PUBLISHED_AT,
    readingMinutes: Math.max(3, Math.ceil(wordCount / 200)),
    sections,
    faqs,
  };
}

let cache: NewsArticle[] | null = null;

export function getNewsArticles(): NewsArticle[] {
  if (!cache) cache = tools.map(buildArticle);
  return cache;
}

export function getNewsArticle(slug: string): NewsArticle | undefined {
  const canonical = resolveCanonicalToolSlug(slug);
  return getNewsArticles().find((a) => a.slug === canonical);
}

export function getRelatedArticles(article: NewsArticle, limit = 4): NewsArticle[] {
  const all = getNewsArticles();
  const same = all.filter((a) => a.category === article.category && a.slug !== article.slug);
  const startIdx = same.findIndex((a) => a.slug > article.slug);
  const rotated =
    startIdx > 0 ? [...same.slice(startIdx), ...same.slice(0, startIdx)] : same;
  return rotated.slice(0, limit);
}

/** Total readable character count of an article (used by the length audit script). */
export function articleCharCount(article: NewsArticle): number {
  const sectionText = article.sections
    .map((s) => [s.heading, ...(s.paragraphs ?? []), ...(s.list ?? [])].join(" "))
    .join(" ");
  const faqText = article.faqs.map((f) => `${f.q} ${f.a}`).join(" ");
  return sectionText.length + faqText.length;
}
