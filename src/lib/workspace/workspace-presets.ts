// Shared presets, sample payloads, color swatches, and byte stream helpers used by the tool workspace.

export const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

export const SAMPLE_VISUAL_TEST = `<div style="width: 100%; min-height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #eef2ff; display: flex; justify-content: center; align-items: center; padding: 40px 20px; box-sizing: border-box;">
  <div style="background: #ffffff; border-radius: 28px; box-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.8); max-width: 820px; width: 100%; padding: 44px; box-sizing: border-box;">
    <div style="display: inline-block; padding: 6px 14px; background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; border-radius: 9999px; margin-bottom: 20px;">HTML &rarr; IMAGE TEST</div>
    <h1 style="font-size: 38px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0 0 12px 0; line-height: 1.2;">Visual Rendering Test</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #64748b; margin: 0 0 32px 0;">This HTML file is designed to test fonts, colors, gradients, spacing, borders, shadows, emoji, and multilingual text in your converter.</p>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 28px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; box-sizing: border-box;">
        <div style="font-size: 20px; font-weight: 900; color: #4f46e5; margin-bottom: 10px;">01</div>
        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Typography</div>
        <div style="font-size: 12px; line-height: 1.5; color: #64748b;">Heading, paragraph and italic text.</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; box-sizing: border-box;">
        <div style="font-size: 20px; font-weight: 900; color: #4f46e5; margin-bottom: 10px;">02</div>
        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Layout</div>
        <div style="font-size: 12px; line-height: 1.5; color: #64748b;">Cards, grid, padding and alignment.</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; box-sizing: border-box;">
        <div style="font-size: 20px; font-weight: 900; color: #4f46e5; margin-bottom: 10px;">03</div>
        <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Effects</div>
        <div style="font-size: 12px; line-height: 1.5; color: #64748b;">Rounded corners and soft shadows.</div>
      </div>
    </div>
    <div style="background: #f5f3ff; border-left: 4px solid #6366f1; border-radius: 14px; padding: 18px 24px; margin-bottom: 24px; font-style: italic; color: #312e81; font-size: 14px; line-height: 1.6; box-sizing: border-box;">
      &ldquo;A good HTML-to-image converter should preserve the visual structure accurately &mdash; including spacing, fonts and CSS effects.&rdquo;
    </div>
    <div style="font-size: 13px; color: #334155; margin-bottom: 24px; padding-top: 8px;">
      Multilingual test: नमस्ते • ગુજરાતી • हिन्दी • العربية • 日本語 • 한국어
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 11px; font-weight: 600; color: #94a3b8;">
      <span>Converter QA Test</span>
      <span>&copy; 2026</span>
    </div>
  </div>
</div>`;

export const SAMPLE_OG_CARD = `<div style="width: 100%; height: 100%; padding: 60px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
  <div>
    <span style="background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; color: #818cf8; padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">HTML to Image</span>
    <h1 style="font-size: 44px; font-weight: 800; margin-top: 20px; margin-bottom: 14px; line-height: 1.2; color: #ffffff;">Render HTML &amp; CSS Code to Image</h1>
    <p style="font-size: 18px; color: #94a3b8; max-width: 700px; line-height: 1.5;">Upload an HTML file or paste custom HTML code to generate pixel-perfect PNG or JPG screenshots.</p>
  </div>
  <div style="font-size: 14px; color: #64748b; font-weight: 600;">BG Tool Studio · High Resolution Output</div>
</div>`;

export const SAMPLE_BADGE = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0f172a; padding: 20px; box-sizing: border-box;">
  <div style="padding: 24px 40px; background: linear-gradient(135deg, #f97316 0%, #e11d48 100%); color: white; font-family: system-ui, sans-serif; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(249, 115, 22, 0.4);">
    <div style="font-size: 14px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9;">PRO VERIFIED</div>
    <div style="font-size: 32px; font-weight: 900; margin-top: 6px;">HTML TO IMAGE CONVERTER</div>
  </div>
</div>`;

export const SAMPLE_INVOICE = `<div style="width: 100%; height: 100%; padding: 40px; background: #ffffff; color: #1e293b; font-family: system-ui, sans-serif; box-sizing: border-box;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
    <h2 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0;">INVOICE #4829</h2>
    <span style="background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 13px;">PAID</span>
  </div>
  <div style="margin-top: 30px; font-size: 15px; line-height: 1.8;">
    <p style="margin: 4px 0;"><strong>Customer:</strong> John Doe</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> August 29, 2026</p>
    <p style="margin: 4px 0;"><strong>Service:</strong> Web App Design & Processing</p>
    <p style="font-size: 24px; font-weight: 900; margin-top: 20px; color: #f97316;">Total: $499.00</p>
  </div>
</div>`;

export const SAMPLE_CODE_BOX = `<div style="width: 100%; height: 100%; padding: 40px; background: #090d16; color: #f8fafc; font-family: monospace; box-sizing: border-box;">
  <div style="display: flex; gap: 8px; margin-bottom: 20px;">
    <span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span>
    <span style="width: 12px; height: 12px; border-radius: 50%; background: #eab308;"></span>
    <span style="width: 12px; height: 12px; border-radius: 50%; background: #22c55e;"></span>
  </div>
  <pre style="margin: 0; font-size: 16px; line-height: 1.6; color: #38bdf8;"><code><span style="color: #c084fc;">const</span> renderHtml = (<span style="color: #f43f5e;">code</span>) => {
  <span style="color: #c084fc;">return</span> convertToPng({
    format: <span style="color: #a3e635;">"PNG"</span>,
    resolution: <span style="color: #a3e635;">"4K"</span>
  });
};</code></pre>
</div>`;

export const SAMPLE_BINARY_INVADER = `00000100000
00000010000
00011111000
00110110100
11111111111
10111111101
10100000101
00011011000`;

export const SAMPLE_BINARY_HEART = `0001100011000
0011110111100
0111111111110
0111111111110
0011111111100
0001111111000
0000111110000
0000011100000
0000001000000`;

export const SAMPLE_BINARY_IMAGE = `01000010 01001101 00111110 00000000 00000000 00000000 00000000 00000000
00110110 00000000 00000000 00000000 00101000 00000000 00000000 00000000
00000010 00000000 00000000 00000000 00000010 00000000 00000000 00000000
00000001 00000000 00011000 00000000 00000000 00000000 00000000 00000000
00001000 00000000 00000000 00000000 00000000 00000000 00000000 00000000
00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000
00000000 00000000 11111111 00000000 00000000 11111111 11111111 11111111
00000000 00000000 00000000 00000000 11111111 00000000 00000000 11111111`;

export type BinaryThemeKey = "matrix" | "cyberpunk" | "mono" | "ocean" | "amber";

export const BINARY_THEMES: Record<BinaryThemeKey, { name: string; bg: string; fg: string; accent: string }> = {
  matrix: { name: "Hacker Matrix", bg: "#0b1320", fg: "#22c55e", accent: "#4ade80" },
  cyberpunk: { name: "Cyberpunk Neon", bg: "#130521", fg: "#f43f5e", accent: "#ec4899" },
  mono: { name: "Monochrome B&W", bg: "#000000", fg: "#ffffff", accent: "#e2e8f0" },
  ocean: { name: "Ocean Blueprint", bg: "#082f49", fg: "#38bdf8", accent: "#7dd3fc" },
  amber: { name: "Retro Amber CRT", bg: "#1c1002", fg: "#f59e0b", accent: "#fbbf24" },
};

export const SAMPLE_BASE64_STAR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAbUlEQVR4nGNgGAWjYBSMglEwCkYBdcD4f2Lw/4mR1k1sGBih8H+i1X1GBjCfhg6wY8LAfwb0sB5p7vj//z+tXPgfD82nRw1AVkCN/x8f/U8LGODg/8Twh4F27mDAgEHQfEYM/f9/GDRgFAy4AQAWU322xZ7ZkwAAAABJRU5ErkJggg==";

export const SAMPLE_BASE64_GRADIENT_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAWUlEQVR4nGNgGAWjYBSMglEwCkbB0ACD//8Z/qOb8J+Bkbq+hYkBbYCRjgwYBaNgFIyCUTAKRsEooA8Y//v3D0U2jYJRMApGwSgYBaNgFIyCYQQA09p6Gz9Xy4kAAAAASUVORK5CYII=";

export const ROTATE_GRADIENT_PRESETS = [
  { id: "midnight", name: "Midnight", css: "linear-gradient(135deg, #0f172a, #1e293b)", stops: ["#0f172a", "#1e293b"] },
  { id: "sunset", name: "Sunset Glow", css: "linear-gradient(135deg, #f97316, #ec4899)", stops: ["#f97316", "#ec4899"] },
  { id: "ocean", name: "Ocean Breeze", css: "linear-gradient(135deg, #0284c7, #2563eb)", stops: ["#0284c7", "#2563eb"] },
  { id: "emerald", name: "Emerald Mint", css: "linear-gradient(135deg, #059669, #0d9488)", stops: ["#059669", "#0d9488"] },
  { id: "neon", name: "Neon Violet", css: "linear-gradient(135deg, #7c3aed, #db2777)", stops: ["#7c3aed", "#db2777"] },
  { id: "amber", name: "Amber Warm", css: "linear-gradient(135deg, #d97706, #b45309)", stops: ["#d97706", "#b45309"] },
];

export const ROTATE_COLOR_SWATCHES = [
  { hex: "#ffffff", name: "Pure White", border: "border-neutral-300" },
  { hex: "#000000", name: "Pure Black", border: "border-neutral-700" },
  { hex: "#0f172a", name: "Dark Slate", border: "border-slate-700" },
  { hex: "#f8fafc", name: "Cloud White", border: "border-slate-300" },
  { hex: "#ef4444", name: "Crimson Red", border: "border-red-500" },
  { hex: "#10b981", name: "Emerald", border: "border-emerald-500" },
  { hex: "#f59e0b", name: "Amber Gold", border: "border-amber-500" },
  { hex: "#0ea5e9", name: "Sky Blue", border: "border-sky-500" },
  { hex: "#8b5cf6", name: "Purple", border: "border-purple-500" },
  { hex: "#ec4899", name: "Pink", border: "border-pink-500" },
];

export type EditorThemeKey = "vs-dark" | "matrix" | "cyberpunk" | "dracula" | "monokai" | "one-dark" | "light";

export const EDITOR_THEMES: Record<
  EditorThemeKey,
  {
    name: string;
    bg: string;
    gutterBg: string;
    gutterText: string;
    text: string;
    accent: string;
    highlight: string;
    border: string;
  }
> = {
  "vs-dark": {
    name: "VS Dark",
    bg: "#1e1e1e",
    gutterBg: "#252526",
    gutterText: "#94a3b8",
    text: "#f8fafc",
    accent: "#38bdf8",
    highlight: "rgba(56, 189, 248, 0.3)",
    border: "#3f3f46",
  },
  matrix: {
    name: "Hacker Matrix",
    bg: "#050b14",
    gutterBg: "#081426",
    gutterText: "#4ade80",
    text: "#86efac",
    accent: "#22c55e",
    highlight: "rgba(34, 197, 94, 0.4)",
    border: "#166534",
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    bg: "#130521",
    gutterBg: "#1e0836",
    gutterText: "#f472b6",
    text: "#fb7185",
    accent: "#38bdf8",
    highlight: "rgba(244, 63, 94, 0.4)",
    border: "#831843",
  },
  dracula: {
    name: "Dracula",
    bg: "#282a36",
    gutterBg: "#21222c",
    gutterText: "#a78bfa",
    text: "#f8f8f2",
    accent: "#bd93f9",
    highlight: "rgba(255, 121, 198, 0.35)",
    border: "#44475a",
  },
  monokai: {
    name: "Monokai",
    bg: "#272822",
    gutterBg: "#1e1f1c",
    gutterText: "#e6db74",
    text: "#f8f8f2",
    accent: "#a6e22e",
    highlight: "rgba(230, 219, 116, 0.35)",
    border: "#3e3d32",
  },
  "one-dark": {
    name: "One Dark Pro",
    bg: "#282c34",
    gutterBg: "#21252b",
    gutterText: "#94a3b8",
    text: "#f1f5f9",
    accent: "#61afef",
    highlight: "rgba(97, 175, 239, 0.3)",
    border: "#3e4451",
  },
  light: {
    name: "Light Clean",
    bg: "#ffffff",
    gutterBg: "#f8fafc",
    gutterText: "#475569",
    text: "#0f172a",
    accent: "#2563eb",
    highlight: "rgba(254, 240, 138, 0.7)",
    border: "#cbd5e1",
  },
};

export const calculateEntropy = (
  bytes: Uint8Array
): { entropy: number; zeroCount: number; oneCount: number; bitDensity: number } => {
  if (!bytes.length) return { entropy: 0, zeroCount: 0, oneCount: 0, bitDensity: 0 };
  const freq = new Array(256).fill(0);
  let zeroCount = 0;
  let oneCount = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    freq[b]++;
    for (let bit = 0; bit < 8; bit++) {
      if ((b >> bit) & 1) oneCount++;
      else zeroCount++;
    }
  }

  let entropy = 0;
  const len = bytes.length;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / len;
      entropy -= p * Math.log2(p);
    }
  }

  const totalBits = zeroCount + oneCount;
  const bitDensity = totalBits > 0 ? Math.round((oneCount / totalBits) * 100) : 0;
  return {
    entropy: Number(entropy.toFixed(3)),
    zeroCount,
    oneCount,
    bitDensity,
  };
};

export const detectMagicSignature = (
  bytes: Uint8Array
): { format: string; description: string; magicHex: string } => {
  if (bytes.length < 4) return { format: "Raw Binary", description: "Generic bitstream", magicHex: "N/A" };
  const b0 = bytes[0] ?? 0,
    b1 = bytes[1] ?? 0,
    b2 = bytes[2] ?? 0,
    b3 = bytes[3] ?? 0;
  const hex = [b0, b1, b2, b3].map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");

  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) {
    return { format: "PNG Image", description: "Portable Network Graphics · Deflate Compressed", magicHex: hex };
  }
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) {
    return { format: "JPEG Image", description: "Joint Photographic Experts Group · DCT Compressed", magicHex: hex };
  }
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46) {
    return { format: "WebP / RIFF", description: "Google WebP Container / RIFF Stream", magicHex: hex };
  }
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) {
    return { format: "GIF Image", description: "Graphics Interchange Format", magicHex: hex };
  }
  if (b0 === 0x42 && b1 === 0x4d) {
    return { format: "BMP Bitmap", description: "Uncompressed Windows Bitmap", magicHex: hex };
  }
  if (b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04) {
    return { format: "ZIP Archive", description: "ZIP Package / Office XML Document", magicHex: hex };
  }
  if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46) {
    return { format: "PDF Document", description: "Adobe Portable Document Format", magicHex: hex };
  }
  return { format: "Binary Data", description: "Raw Byte Sequence / Custom Stream", magicHex: hex };
};

export const MEME_FONTS = [
  { label: "Impact", val: "Impact, 'Arial Black', sans-serif", badge: "Classic", desc: "Bold condensed meme style" },
  { label: "Arial Black", val: "'Arial Black', sans-serif", badge: "Bold", desc: "Heavy modern sans-serif" },
  { label: "Anton", val: "'Anton', Impact, sans-serif", badge: "Poster", desc: "High-impact tall headline" },
  { label: "Oswald", val: "'Oswald', sans-serif", badge: "Modern", desc: "Clean condensed gothic" },
  { label: "Comic Sans", val: "'Comic Sans MS', cursive, sans-serif", badge: "Playful", desc: "Casual comic humor" },
  { label: "Montserrat", val: "'Montserrat', sans-serif", badge: "Clean", desc: "Geometric contemporary" },
];


export const SQUARE_COLOR_PRESETS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Off White", value: "#f8fafc" },
  { name: "Cool Gray", value: "#e2e8f0" },
  { name: "Slate", value: "#334155" },
  { name: "Midnight", value: "#0f172a" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Pink", value: "#ec4899" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Purple", value: "#8b5cf6" },
];

export const SQUARE_GRADIENT_PRESETS = [
  { name: "Deep Violet", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Sunset Rose", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Ocean Cyan", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Mint Fresh", value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { name: "Warm Citrus", value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "Neon Cyber", value: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)" },
  { name: "Royal Navy", value: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" },
  { name: "Emerald Forest", value: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)" },
  { name: "Slate Steel", value: "linear-gradient(135deg, #243949 0%, #517fa4 100%)" },
  { name: "Carbon Dark", value: "linear-gradient(135deg, #111827 0%, #374151 100%)" },
];

export type CropBox = {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
};

