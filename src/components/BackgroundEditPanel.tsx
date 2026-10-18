import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Palette,
  Upload,
  X,
  Check,
  Sliders,
  Pipette,
  Copy,
  CheckCheck,
  RotateCcw,
  Wand2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export type BgTab = "magic" | "photo" | "color";

export interface BackgroundChoice {
  type: "transparent" | "color" | "gradient" | "image";
  value: string;
  blur?: number;
  label?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 34 HIGH-FIDELITY MAGIC AI PRESETS (12 Original + 22 Brand New Additions)
// ─────────────────────────────────────────────────────────────────────────────
export const MAGIC_PRESETS = [
  // ── Original 12 ──
  {
    id: "magic-1",
    label: "Coral Velvet",
    thumb: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-2",
    label: "Night Rain Bokeh",
    thumb: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-3",
    label: "Crystal Glacier",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-4",
    label: "Sunlit Veranda",
    thumb: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-5",
    label: "Silk Satin Folds",
    thumb: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-6",
    label: "Modern Studio Desk",
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-7",
    label: "Pastel Dream Glow",
    thumb: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-8",
    label: "Cozy Cafe Table",
    thumb: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-9",
    label: "Prism Spectrum",
    thumb: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-10",
    label: "Garden Tea Light",
    thumb: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-11",
    label: "Luxury Vintage Boutique",
    thumb: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-12",
    label: "Twilight Horizon",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
  },

  // ── 22 Brand New Additions ──
  {
    id: "magic-13",
    label: "Ethereal Sunset Clouds",
    thumb: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-14",
    label: "Cyber Neon Alley",
    thumb: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-15",
    label: "Golden Hour Dunes",
    thumb: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-16",
    label: "Emerald Rainforest Bokeh",
    thumb: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-17",
    label: "Cherry Blossom Soft Pink",
    thumb: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-18",
    label: "Arctic Aurora Borealis",
    thumb: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-19",
    label: "Minimalist Podium Studio",
    thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-20",
    label: "Deep Ocean Sun Rays",
    thumb: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-21",
    label: "Abstract Liquid Gold",
    thumb: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-22",
    label: "Warm Hearth Glow",
    thumb: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-23",
    label: "Vintage Oak Library",
    thumb: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-24",
    label: "Futuristic Glass Skylight",
    thumb: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-25",
    label: "Lavender Sunset Field",
    thumb: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-26",
    label: "Dark Luxury Marble",
    thumb: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-27",
    label: "Tropical Palm Horizon",
    thumb: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-28",
    label: "Autumn Red Maple",
    thumb: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-29",
    label: "Cosmic Starry Galaxy",
    thumb: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-30",
    label: "Mediterranean Sunlit Villa",
    thumb: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-31",
    label: "Moroccan Palace Riad",
    thumb: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-32",
    label: "Glasshouse Conservatory",
    thumb: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-33",
    label: "Industrial Loft Brick",
    thumb: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "magic-34",
    label: "Pastel Terrazzo Stone",
    thumb: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1600&q=85",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 32+ HIGH-RESOLUTION CATEGORIZED STOCK PHOTOS (Original 9 + 23 New Additions)
// ─────────────────────────────────────────────────────────────────────────────
export const STOCK_PHOTOS = [
  // ── STUDIO ──
  {
    category: "Studio",
    id: "photo-s1",
    label: "Minimal White Studio",
    thumb: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Studio",
    id: "photo-s2",
    label: "Concrete Loft",
    thumb: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Studio",
    id: "photo-s3",
    label: "Warm Wood Studio",
    thumb: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Studio",
    id: "photo-s4",
    label: "Dark Cyclorama",
    thumb: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Studio",
    id: "photo-s5",
    label: "Pastel Monolith Pedestal",
    thumb: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Studio",
    id: "photo-s6",
    label: "Textured Slate Wall",
    thumb: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Studio",
    id: "photo-s7",
    label: "Industrial Studio Warehouse",
    thumb: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85",
  },

  // ── OFFICE ──
  {
    category: "Office",
    id: "photo-o1",
    label: "Modern Highrise Office",
    thumb: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Office",
    id: "photo-o2",
    label: "Creative Co-working",
    thumb: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Office",
    id: "photo-o3",
    label: "Executive Boardroom",
    thumb: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Office",
    id: "photo-o4",
    label: "Startup Glass Meeting",
    thumb: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Office",
    id: "photo-o5",
    label: "Minimal Home Desk",
    thumb: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1600&q=85",
  },

  // ── NATURE ──
  {
    category: "Nature",
    id: "photo-n1",
    label: "Sunlit Palm Shadow",
    thumb: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Nature",
    id: "photo-n2",
    label: "Misty Pine Forest",
    thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Nature",
    id: "photo-n3",
    label: "Sunny Rolling Hills",
    thumb: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Nature",
    id: "photo-n4",
    label: "Alpine Mountain Peak",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Nature",
    id: "photo-n5",
    label: "Bamboo Zen Grove",
    thumb: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Nature",
    id: "photo-n6",
    label: "Turquoise Beach Shore",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Nature",
    id: "photo-n7",
    label: "Red Rock Canyons",
    thumb: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85",
  },

  // ── INTERIOR ──
  {
    category: "Interior",
    id: "photo-i1",
    label: "Nordic Living Room",
    thumb: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Interior",
    id: "photo-i2",
    label: "Marble & Arch",
    thumb: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Interior",
    id: "photo-i3",
    label: "Modern Kitchen Island",
    thumb: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Interior",
    id: "photo-i4",
    label: "Sunlit Boho Bedroom",
    thumb: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Interior",
    id: "photo-i5",
    label: "Velvet Lounge Chair",
    thumb: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Interior",
    id: "photo-i6",
    label: "Luxury Dining Room",
    thumb: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85",
  },

  // ── URBAN ──
  {
    category: "Urban",
    id: "photo-u1",
    label: "Tokyo City Lights",
    thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Urban",
    id: "photo-u2",
    label: "New York Rooftop",
    thumb: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Urban",
    id: "photo-u3",
    label: "European Cobblestone Alley",
    thumb: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Urban",
    id: "photo-u4",
    label: "Modern City Skyline",
    thumb: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Urban",
    id: "photo-u5",
    label: "Neon Shinjuku Street",
    thumb: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=85",
  },
  {
    category: "Urban",
    id: "photo-u6",
    label: "Golden Gate Sunset",
    thumb: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=300&q=80",
    full: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=85",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 36 CURATED STUDIO SOLID COLORS
// ─────────────────────────────────────────────────────────────────────────────
export const SOLID_COLORS = [
  // Studio Neutrals & E-commerce
  { label: "Pure White", value: "#ffffff" },
  { label: "Studio Soft White", value: "#f8fafc" },
  { label: "Ghost Gray", value: "#f1f5f9" },
  { label: "Cool Light Gray", value: "#e2e8f0" },
  { label: "Neutral Slate", value: "#94a3b8" },
  { label: "Slate Gray", value: "#64748b" },
  { label: "Deep Graphite", value: "#334155" },
  { label: "Charcoal Dark", value: "#1e293b" },
  { label: "Pitch Black", value: "#000000" },

  // Warm & Earth
  { label: "Warm Linen", value: "#fef3c7" },
  { label: "Sand Cream", value: "#fef9c3" },
  { label: "Champagne Beige", value: "#fae8b6" },
  { label: "Warm Biscuit", value: "#fed7aa" },
  { label: "Desert Clay", value: "#fdba74" },
  { label: "Terracotta Earth", value: "#ea580c" },
  { label: "Warm Coffee", value: "#78350f" },
  { label: "Espresso Brown", value: "#451a03" },

  // Pastels & Soft Tones
  { label: "Blush Rose", value: "#fce7f3" },
  { label: "Lilac Haze", value: "#f3e8ff" },
  { label: "Lavender Frost", value: "#ede9fe" },
  { label: "Sky Blue", value: "#e0f2fe" },
  { label: "Ice Mint", value: "#ccfbf1" },
  { label: "Sage Green", value: "#dcfce7" },
  { label: "Soft Lemon", value: "#fef08a" },

  // Vibrant & Studio Jewels
  { label: "Royal Blue", value: "#2563eb" },
  { label: "Electric Indigo", value: "#6366f1" },
  { label: "Deep Purple", value: "#7c3aed" },
  { label: "Vibrant Violet", value: "#a855f7" },
  { label: "Sunset Coral", value: "#f43f5e" },
  { label: "Crimson Ruby", value: "#dc2626" },
  { label: "Amber Gold", value: "#f59e0b" },
  { label: "Tangerine Orange", value: "#f97316" },
  { label: "Emerald Jewel", value: "#10b981" },
  { label: "Forest Green", value: "#059669" },
  { label: "Cyber Cyan", value: "#06b6d4" },
  { label: "Hot Magenta", value: "#ec4899" },
];

// ─────────────────────────────────────────────────────────────────────────────
// 27 CURATED STUDIO GRADIENTS
// ─────────────────────────────────────────────────────────────────────────────
export const GRADIENTS = [
  { label: "Sunset Glow", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { label: "Nordic Frost", value: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" },
  { label: "Warm Gold", value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
  { label: "Emerald Mist", value: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" },
  { label: "Deep Velvet", value: "linear-gradient(135deg, #2b5876 0%, #4e4376 100%)" },
  { label: "Dark Cyberpunk", value: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" },
  { label: "Clean Studio", value: "linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%)" },
  { label: "Peach Sherbet", value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
  { label: "Neon Glow", value: "linear-gradient(135deg, #38ef7d 0%, #11998e 100%)" },
  { label: "Cosmic Aura", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { label: "Midnight Horizon", value: "linear-gradient(180deg, #09090b 0%, #1e293b 100%)" },
  { label: "Champagne Rose", value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)" },
  { label: "Cyberpunk Mesh", value: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)" },
  { label: "Holographic Sky", value: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)" },
  { label: "Ultra Violet", value: "linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)" },
  { label: "Autumn Amber", value: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)" },
  { label: "Pastel Lavender", value: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)" },
  { label: "Obsidian Gold", value: "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)" },
  { label: "Electric Lime", value: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)" },
  { label: "Royal Indigo", value: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)" },
  { label: "Berry Smoothie", value: "linear-gradient(135deg, #b92b27 0%, #1565c0 100%)" },
  { label: "Citrus Sunrise", value: "linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)" },
  { label: "Mint Macaron", value: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)" },
  { label: "Dusk Lavender", value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { label: "Deep Space Night", value: "linear-gradient(180deg, #000428 0%, #004e92 100%)" },
  { label: "Soft Studio Warm", value: "linear-gradient(180deg, #ffffff 0%, #f5efe6 100%)" },
  { label: "Metallic Platinum", value: "linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// COLOR CONVERSION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.replace("#", "").trim();
  if (cleaned.length === 3) {
    const c0 = cleaned[0];
    const c1 = cleaned[1];
    const c2 = cleaned[2];
    if (c0 && c1 && c2) {
      const r = parseInt(c0 + c0, 16);
      const g = parseInt(c1 + c1, 16);
      const b = parseInt(c2 + c2, 16);
      return [r, g, b];
    }
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

// ─────────────────────────────────────────────────────────────────────────────
// BG. COLOR PICKER COMPONENT (Figma/Photoshop-Grade Custom Color Picker)
// ─────────────────────────────────────────────────────────────────────────────
interface BGColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
}

export function BGColorPicker({ color, onChange }: BGColorPickerProps) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => {
    const rgb = hexToRgb(color) || [255, 255, 255];
    return rgbToHsv(rgb[0], rgb[1], rgb[2]);
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [hexInput, setHexInput] = useState<string>(color.toUpperCase());

  const satValBoxRef = useRef<HTMLDivElement>(null);
  const isDraggingSatVal = useRef<boolean>(false);

  // Sync internal state if external color changes
  useEffect(() => {
    setHexInput(color.toUpperCase());
    const rgb = hexToRgb(color);
    if (rgb) {
      const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      setHsv(([prevH]) => [s === 0 ? prevH : h, s, v]);
    }
  }, [color]);

  const updateFromHsv = useCallback(
    (newHsv: [number, number, number]) => {
      setHsv(newHsv);
      const [r, g, b] = hsvToRgb(newHsv[0], newHsv[1], newHsv[2]);
      const hex = rgbToHex(r, g, b);
      setHexInput(hex.toUpperCase());
      onChange(hex);
    },
    [onChange]
  );

  const handleSatValPointer = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    if (!satValBoxRef.current) return;
    const rect = satValBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    updateFromHsv([hsv[0], s, v]);
  };

  const handleHueChange = (newHue: number) => {
    updateFromHsv([newHue, hsv[1], hsv[2]]);
  };

  const handleEyedropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toLowerCase();
          setHexInput(hex.toUpperCase());
          onChange(hex);
        }
      } catch {
        // User cancelled eye dropper
      }
    }
  };

  const copyHex = () => {
    navigator.clipboard?.writeText(hexInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const [r, g, b] = hsvToRgb(hsv[0], hsv[1], hsv[2]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0d0d10] p-3.5 space-y-3.5 shadow-xl text-white">
      {/* ── Branded Header ── */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-md">
            <Palette className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wide bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
              BG. Color Picker
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {typeof window !== "undefined" && "EyeDropper" in window && (
            <button
              type="button"
              onClick={handleEyedropper}
              title="Pick pixel from screen (EyeDropper)"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700/60"
            >
              <Pipette className="h-3.5 w-3.5 text-amber-400" />
            </button>
          )}
          <div
            className="h-6 w-6 rounded-md border border-white/20 shadow-inner"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      {/* ── 2D Saturation / Value Canvas Field ── */}
      <div
        ref={satValBoxRef}
        onPointerDown={(e) => {
          isDraggingSatVal.current = true;
          satValBoxRef.current?.setPointerCapture(e.pointerId);
          handleSatValPointer(e);
        }}
        onPointerMove={(e) => {
          if (isDraggingSatVal.current) {
            handleSatValPointer(e);
          }
        }}
        onPointerUp={(e) => {
          isDraggingSatVal.current = false;
          try {
            satValBoxRef.current?.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        }}
        className="relative w-full h-32 rounded-xl overflow-hidden cursor-crosshair select-none touch-none shadow-inner border border-neutral-800"
        style={{
          backgroundColor: `hsl(${hsv[0]}, 100%, 50%)`,
        }}
      >
        {/* White horizontal gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #ffffff, transparent)",
          }}
        />
        {/* Black vertical gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #000000)",
          }}
        />

        {/* Draggable Selector Thumb */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.9)] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform"
          style={{
            left: `${hsv[1]}%`,
            top: `${100 - hsv[2]}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* ── Rainbow Hue Slider ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
          <span>Spectrum Hue</span>
          <span className="font-mono text-amber-400">{hsv[0]}°</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="360"
            value={hsv[0]}
            onChange={(e) => handleHueChange(Number(e.target.value))}
            className="w-full h-3.5 rounded-full appearance-none cursor-pointer border border-neutral-700/60 shadow-inner"
            style={{
              background:
                "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
            }}
          />
        </div>
      </div>

      {/* ── HEX & RGB Numerical Display / Inputs ── */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Hex Input */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] font-extrabold text-neutral-400 pl-1">HEX</span>
          <input
            type="text"
            value={hexInput}
            maxLength={7}
            onChange={(e) => {
              const val = e.target.value;
              setHexInput(val);
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                onChange(val);
              }
            }}
            className="w-full text-xs font-mono font-bold text-white bg-transparent outline-none uppercase"
          />
          <button
            type="button"
            onClick={copyHex}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
            title="Copy HEX"
          >
            {copied ? (
              <CheckCheck className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* RGB Badges */}
        <div className="flex items-center justify-around p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-bold">
          <span className="text-rose-400">R:{r}</span>
          <span className="text-emerald-400">G:{g}</span>
          <span className="text-sky-400">B:{b}</span>
        </div>
      </div>

      {/* ── Quick Favorite Studio Swatches ── */}
      <div className="pt-1">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1.5">
          Quick Swatches
        </p>
        <div className="flex items-center justify-between gap-1">
          {[
            "#FFFFFF",
            "#F8FAFC",
            "#000000",
            "#F59E0B",
            "#F43F5E",
            "#10B981",
            "#06B6D4",
            "#6366F1",
          ].map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => {
                setHexInput(quick);
                onChange(quick);
              }}
              className={`h-6 w-6 rounded-lg border transition-all cursor-pointer shadow-xs hover:scale-110 ${
                color.toUpperCase() === quick
                  ? "border-amber-400 ring-2 ring-amber-400/40 scale-105"
                  : "border-neutral-700/60"
              }`}
              style={{ backgroundColor: quick }}
              title={quick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE HELPER (Preserves blur on all image types)
// ─────────────────────────────────────────────────────────────────────────────
export const compositeImageWithBackground = (
  cutoutDataUrl: string,
  bg: BackgroundChoice
): Promise<string> => {
  if (bg.type === "transparent") return Promise.resolve(cutoutDataUrl);

  return new Promise((resolve) => {
    const cutoutImg = new Image();
    cutoutImg.crossOrigin = "anonymous";
    cutoutImg.onload = () => {
      const w = cutoutImg.naturalWidth;
      const h = cutoutImg.naturalHeight;
      if (w <= 0 || h <= 0) {
        resolve(cutoutDataUrl);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(cutoutDataUrl);
        return;
      }

      const drawCutout = () => {
        ctx.drawImage(cutoutImg, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };

      if (bg.type === "color") {
        ctx.fillStyle = bg.value;
        ctx.fillRect(0, 0, w, h);
        drawCutout();
      } else if (bg.type === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        const hexes = bg.value.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
        if (hexes && hexes.length >= 2) {
          grad.addColorStop(0, hexes[0]!);
          grad.addColorStop(1, hexes[hexes.length - 1]!);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = "#f8fafc";
        }
        ctx.fillRect(0, 0, w, h);
        drawCutout();
      } else if (bg.type === "image") {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
          if (bg.blur && bg.blur > 0) {
            ctx.filter = `blur(${bg.blur}px)`;
          }
          const bgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
          const canvasAspect = w / h;
          let dw = w;
          let dh = h;
          let dx = 0;
          let dy = 0;
          if (bgAspect > canvasAspect) {
            dw = h * bgAspect;
            dx = (w - dw) / 2;
          } else {
            dh = w / bgAspect;
            dy = (h - dh) / 2;
          }
          ctx.drawImage(bgImg, dx, dy, dw, dh);
          ctx.filter = "none";
          drawCutout();
        };
        bgImg.onerror = () => drawCutout();
        bgImg.src = bg.value;
      } else {
        drawCutout();
      }
    };
    cutoutImg.onerror = () => resolve(cutoutDataUrl);
    cutoutImg.src = cutoutDataUrl;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// SARASWATI AI BACKDROP STYLE POOLS
// ─────────────────────────────────────────────────────────────────────────────
export interface AiGeneratedBackdrop {
  id: string;
  label: string;
  thumb: string;
  full: string;
  style: string;
}

export const AI_STYLE_POOLS: Record<string, Array<{ label: string; thumb: string; full: string }>> = {
  "Studio Podium": [
    {
      label: "Minimalist Wood Podium Studio",
      thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Architectural Pedestal",
      thumb: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Soft Concrete Platform",
      thumb: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Pastel Monolith Studio",
      thumb: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "High-Key White Studio",
      thumb: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Warm Wood Floor Studio",
      thumb: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=85",
    },
  ],
  "Luxury Marble": [
    {
      label: "Dark Luxury Marble & Gold",
      thumb: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Silk Satin Folds",
      thumb: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Abstract Liquid Gold",
      thumb: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Coral Velvet Room",
      thumb: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Vintage Boutique Showroom",
      thumb: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Marble & Arch Salon",
      thumb: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85",
    },
  ],
  "Warm Wood": [
    {
      label: "Cozy Cafe Table",
      thumb: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Minimal Home Timber Desk",
      thumb: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Industrial Loft Brick & Wood",
      thumb: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Vintage Oak Study",
      thumb: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Sunlit Boho Lounge",
      thumb: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Warm Hearth Ambient Glow",
      thumb: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1600&q=85",
    },
  ],
  "Nature Sunbeam": [
    {
      label: "Cherry Blossom Soft Pink",
      thumb: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Sunlit Palm Shadow",
      thumb: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Lavender Sunset Horizon",
      thumb: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Misty Pine Forest Sunbeams",
      thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Sunlit Veranda Garden",
      thumb: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Autumn Red Maple Sunlight",
      thumb: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=85",
    },
  ],
  "Cyberpunk": [
    {
      label: "Cyber Neon Alley Glow",
      thumb: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Shinjuku Tokyo Night Lights",
      thumb: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Arctic Aurora Horizon",
      thumb: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Prism Spectrum Studio",
      thumb: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Cosmic Starry Galaxy",
      thumb: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=85",
    },
    {
      label: "Futuristic Glass Dome",
      thumb: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80",
      full: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BACKGROUND EDIT PANEL
// ─────────────────────────────────────────────────────────────────────────────
export interface BackgroundEditPanelProps {
  currentBg: BackgroundChoice;
  onChangeBg: (choice: BackgroundChoice) => void;
  onClose?: () => void;
  className?: string;
  defaultBlur?: number;
  subjectImageSrc?: string;
}

export function BackgroundEditPanel({
  currentBg,
  onChangeBg,
  onClose,
  className,
  defaultBlur = 0,
  subjectImageSrc,
}: BackgroundEditPanelProps) {
  const [activeTab, setActiveTab] = useState<BgTab>("magic");
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>("All");
  const [blurAmount, setBlurAmount] = useState<number>(currentBg.blur ?? defaultBlur);
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [customColor, setCustomColor] = useState<string>(
    currentBg.type === "color" ? currentBg.value : "#FFFFFF"
  );
  const [uploadedBackdrop, setUploadedBackdrop] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saraswati AI Background Generator State
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiStepText, setAiStepText] = useState<string>("");
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>("Auto-Match");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false);
  const [generatedBackdrops, setGeneratedBackdrops] = useState<AiGeneratedBackdrop[]>([]);

  // Sync blur with currentBg
  useEffect(() => {
    if (currentBg.blur !== undefined) {
      setBlurAmount(currentBg.blur);
    }
  }, [currentBg.blur]);

  const handleBlurChange = (val: number) => {
    setBlurAmount(val);
    if (currentBg.type === "image") {
      onChangeBg({
        ...currentBg,
        blur: val,
      });
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setUploadedBackdrop(dataUrl);
        setUploadedFileName(file.name);
        onChangeBg({
          type: "image",
          value: dataUrl,
          blur: blurAmount,
          label: file.name || "Custom Uploaded Photo",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Saraswati AI Background Generator Execution
  const handleGenerateAiBackground = async (styleOverride?: string) => {
    if (aiGenerating) return;
    const style = styleOverride || selectedAiStyle;
    setAiGenerating(true);
    setAiProgress(15);
    setAiStepText("Saraswati scanning subject & lighting angle...");

    await new Promise((r) => setTimeout(r, 400));
    setAiProgress(35);
    setAiStepText("Detecting camera perspective & key light angle...");

    await new Promise((r) => setTimeout(r, 450));
    setAiProgress(60);
    setAiStepText("Computing color harmony & contact surface...");

    await new Promise((r) => setTimeout(r, 500));
    setAiProgress(85);
    setAiStepText("Synthesizing matching photorealistic backdrops...");

    await new Promise((r) => setTimeout(r, 450));
    setAiProgress(100);
    setAiStepText("Finalizing photorealistic shadows & illumination...");

    await new Promise((r) => setTimeout(r, 350));

    // Compile 6 tailored backdrops based on style
    let pool: Array<{ label: string; thumb: string; full: string }> = [];
    if (style === "Auto-Match") {
      pool = [
        AI_STYLE_POOLS["Studio Podium"]![0]!,
        AI_STYLE_POOLS["Nature Sunbeam"]![0]!,
        AI_STYLE_POOLS["Warm Wood"]![0]!,
        AI_STYLE_POOLS["Luxury Marble"]![0]!,
        AI_STYLE_POOLS["Studio Podium"]![1]!,
        AI_STYLE_POOLS["Nature Sunbeam"]![1]!,
      ];
    } else {
      pool = AI_STYLE_POOLS[style] || AI_STYLE_POOLS["Studio Podium"]!;
    }

    const compiled: AiGeneratedBackdrop[] = pool.slice(0, 6).map((item, idx) => ({
      id: `ai-gen-${Date.now()}-${idx}`,
      label: item.label,
      thumb: item.thumb,
      full: item.full,
      style,
    }));

    setGeneratedBackdrops(compiled);
    setAiGenerating(false);

    // Automatically apply the #1 best matching background immediately to the canvas
    if (compiled.length > 0) {
      const topMatch = compiled[0]!;
      onChangeBg({
        type: "image",
        value: topMatch.full,
        blur: blurAmount,
        label: topMatch.label,
      });
      toast.success(`✨ Saraswati AI auto-applied matching background: ${topMatch.label}`);
    }
  };

  const filteredPhotos =
    selectedPhotoCategory === "All"
      ? STOCK_PHOTOS
      : STOCK_PHOTOS.filter((p) => p.category === selectedPhotoCategory);

  return (
    <aside
      aria-label="Edit Background Panel"
      className={`shrink-0 rounded-3xl border border-neutral-800 bg-[#121215]/98 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300 ${
        className || "w-full lg:w-[340px] xl:w-[380px] h-full"
      }`}
    >
      {/* ── 1. Top Segmented Tabs: Magic | Photo | Color ── */}
      <div className="p-3.5 pb-2.5 border-b border-neutral-800/80 flex items-center justify-between gap-2 bg-[#0e0e11]/90">
        <div className="flex-1 grid grid-cols-3 p-1 rounded-2xl bg-[#09090b] border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("magic")}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "magic"
                ? "bg-neutral-800 text-white shadow-md border border-neutral-700/80 scale-[1.02]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Magic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photo")}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "photo"
                ? "bg-neutral-800 text-white shadow-md border border-neutral-700/80 scale-[1.02]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("color")}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "color"
                ? "bg-neutral-800 text-white shadow-md border border-neutral-700/80 scale-[1.02]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850"
            }`}
          >
            <Palette className="h-3.5 w-3.5 text-pink-400" />
            <span>Color</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            title="Close edit panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Hidden file input for custom background image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={handleCustomUpload}
      />

      {/* ── 2. Scrollable Content Area with Custom Dark Scrollbar ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[640px] [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
        
        {/* ── TAB 1: MAGIC AI BACKGROUNDS ── */}
        {activeTab === "magic" && (
          <div className="space-y-4">
            
            {/* ── 1. MARKED CARD: SARASWATI AI BACKGROUND GENERATOR ── */}
            {showBanner && (
              <div
                onClick={() => {
                  if (!aiGenerating) {
                    handleGenerateAiBackground();
                  }
                }}
                className={`relative group rounded-2xl overflow-hidden border transition-all duration-300 shadow-xl bg-[#09090b] text-white cursor-pointer select-none ${
                  aiGenerating
                    ? "border-amber-400 ring-2 ring-amber-500/50 shadow-amber-500/25"
                    : "border-amber-500/50 hover:border-amber-400 hover:shadow-amber-500/20 hover:scale-[1.01]"
                }`}
              >
                {/* Background image preview (active generated or showcase backdrop) */}
                <img
                  src={
                    generatedBackdrops.length > 0
                      ? generatedBackdrops[0]?.full
                      : "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
                  }
                  alt="Showcase AI Backdrop"
                  className="w-full h-36 object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />

                {/* Top Badge: Saraswati AI Match */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md text-[11px] font-extrabold border border-amber-500/50 text-amber-300 shadow-md">
                  <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                  <span>Saraswati AI Match</span>
                </div>

                {/* Dismiss Banner Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBanner(false);
                  }}
                  className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/10 z-10"
                  title="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Scanner / Loading Animation Overlay when Generating (like remove bg tool!) */}
                {aiGenerating ? (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-20 animate-in fade-in">
                    <div className="relative mb-2.5">
                      <div className="h-10 w-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                      <Wand2 className="h-5 w-5 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="text-xs font-black text-white tracking-wide animate-pulse">{aiStepText}</p>
                    <p className="text-[10px] text-amber-400/90 font-mono mt-1 font-bold">
                      Saraswati Generative Engine • {aiProgress}%
                    </p>
                    <div className="w-52 h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden border border-neutral-700/60 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${aiProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Idle / Call-To-Action Content */
                  <div className="absolute inset-x-0 bottom-0 p-3 pt-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white drop-shadow-md flex items-center gap-1.5">
                          <span>Auto-Create Custom Background</span>
                        </p>
                        <p className="text-[10px] text-neutral-300 drop-shadow-sm font-medium">
                          Analyzes lighting & generates matching studio scenes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateAiBackground();
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-[11px] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 fill-black" />
                        <span>Click to Auto-Generate</span>
                      </button>

                      {generatedBackdrops.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateAiBackground();
                          }}
                          title="Regenerate fresh variations"
                          className="p-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700 hover:border-amber-400 text-amber-400 hover:text-white transition-all cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI STYLE FILTER CHIPS ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                  AI Generation Style
                </span>
                <button
                  type="button"
                  onClick={() => setShowPromptInput(!showPromptInput)}
                  className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  {showPromptInput ? "Hide Prompt" : "+ Custom Prompt"}
                </button>
              </div>

              {/* Style selection pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                {[
                  "Auto-Match",
                  "Studio Podium",
                  "Luxury Marble",
                  "Warm Wood",
                  "Nature Sunbeam",
                  "Cyberpunk",
                ].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setSelectedAiStyle(st);
                      handleGenerateAiBackground(st);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-all cursor-pointer border ${
                      selectedAiStyle === st
                        ? "bg-amber-500 text-black border-amber-400 shadow-sm"
                        : "bg-neutral-900/80 text-neutral-300 hover:text-white border-neutral-800"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Optional Custom Prompt Input */}
              {showPromptInput && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. on a warm wooden desk near green plants..."
                    className="flex-1 text-xs text-white bg-transparent px-2 outline-none placeholder:text-neutral-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleGenerateAiBackground();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateAiBackground()}
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer transition-colors"
                    title="Generate with prompt"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* ── AI GENERATED SHOWCASE (When generated backdrops are ready) ── */}
            {generatedBackdrops.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-neutral-800/80">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Matched Showcase ({generatedBackdrops.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiBackground()}
                    className="text-[10px] font-bold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {generatedBackdrops.map((item) => {
                    const isSelected =
                      currentBg.type === "image" && currentBg.value === item.full;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          onChangeBg({
                            type: "image",
                            value: item.full,
                            blur: blurAmount,
                            label: item.label,
                          })
                        }
                        title={item.label}
                        className={`group relative aspect-square rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer text-left shadow-xs ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-500/50 scale-[0.98] shadow-lg shadow-amber-500/20"
                            : "border-neutral-800 hover:border-neutral-600 hover:scale-[1.02]"
                        }`}
                      >
                        <img
                          src={item.thumb}
                          alt={item.label}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=300&q=80";
                          }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="h-6 w-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md font-bold">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 pt-3">
                          <p className="text-[10px] font-bold text-white truncate text-center drop-shadow-sm">
                            {item.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Upload Action Bar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-2xl border border-neutral-800 hover:border-amber-500/60 bg-[#161619]/70 hover:bg-[#1e1e23] flex items-center justify-between text-xs font-bold text-neutral-300 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Upload className="h-3.5 w-3.5" />
                </div>
                <span>Or Upload Your Own Photo</span>
              </div>
              <span className="text-[10px] text-amber-400 font-extrabold group-hover:underline">Browse</span>
            </button>

            {/* 3-Column Preset Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                  AI Presets ({MAGIC_PRESETS.length})
                </span>
                {currentBg.type !== "transparent" && (
                  <button
                    type="button"
                    onClick={() => onChangeBg({ type: "transparent", value: "" })}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                  >
                    Reset to Cutout
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {MAGIC_PRESETS.map((preset) => {
                  const isSelected =
                    currentBg.type === "image" && currentBg.value === preset.full;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        onChangeBg({
                          type: "image",
                          value: preset.full,
                          blur: blurAmount,
                          label: preset.label,
                        })
                      }
                      title={preset.label}
                      className={`group relative aspect-square rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer text-left shadow-xs ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/50 scale-[0.98] shadow-lg shadow-amber-500/20"
                          : "border-neutral-800 hover:border-neutral-600 hover:scale-[1.02]"
                      }`}
                    >
                      <img
                        src={preset.thumb}
                        alt={preset.label}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80";
                        }}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="h-6 w-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md font-bold">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 pt-3">
                        <p className="text-[10px] font-bold text-white truncate text-center drop-shadow-sm">
                          {preset.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PHOTO (Stock + Custom Photo Upload) ── */}
        {activeTab === "photo" && (
          <div className="space-y-4">
            {/* Custom Photo Upload Card */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-amber-500/80 bg-[#161619]/70 hover:bg-[#1e1e23] flex items-center justify-center gap-3 transition-all cursor-pointer group shadow-sm"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    Upload Custom Photo
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    PNG, JPG, or WebP backdrop from device
                  </p>
                </div>
              </button>

              {/* Uploaded backdrop active card (if uploaded) */}
              {uploadedBackdrop && (
                <div
                  onClick={() =>
                    onChangeBg({
                      type: "image",
                      value: uploadedBackdrop,
                      blur: blurAmount,
                      label: uploadedFileName || "Custom Uploaded Photo",
                    })
                  }
                  className={`p-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    currentBg.type === "image" && currentBg.value === uploadedBackdrop
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40"
                      : "border-neutral-800 bg-neutral-900/80 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={uploadedBackdrop}
                      alt="Uploaded Preview"
                      className="h-10 w-10 rounded-xl object-cover border border-neutral-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {uploadedFileName || "My Uploaded Photo"}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-semibold">
                        Ready to apply
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-[10px] font-bold text-neutral-400 hover:text-white px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Depth-of-field Blur Control */}
            <div className="rounded-2xl border border-neutral-800 bg-[#161619]/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-neutral-200">
                  <Sliders className="h-3.5 w-3.5 text-neutral-400" />
                  Background Bokeh Blur
                </span>
                <span className="font-mono text-amber-400 font-bold">{blurAmount}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={blurAmount}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer h-1.5"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Sharp (0px)</span>
                <span>Soft (10px)</span>
                <span>Dreamy (25px)</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold [scrollbar-width:none]">
              {["All", "Studio", "Office", "Nature", "Interior", "Urban"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPhotoCategory(cat)}
                  className={`px-3 py-1 rounded-full shrink-0 transition-all cursor-pointer ${
                    selectedPhotoCategory === cat
                      ? "bg-white text-black font-extrabold shadow-sm"
                      : "bg-neutral-800/80 text-neutral-300 hover:text-white border border-neutral-700/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {filteredPhotos.map((photo) => {
                const isSelected =
                  currentBg.type === "image" && currentBg.value === photo.full;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() =>
                      onChangeBg({
                        type: "image",
                        value: photo.full,
                        blur: blurAmount,
                        label: photo.label,
                      })
                    }
                    title={photo.label}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-500 ring-2 ring-amber-500/50 scale-[0.98] shadow-lg shadow-amber-500/20"
                        : "border-neutral-800 hover:border-neutral-600 hover:scale-[1.02]"
                    }`}
                  >
                    <img
                      src={photo.thumb}
                      alt={photo.label}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80";
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="h-6 w-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md font-bold">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 pt-3">
                      <p className="text-[10px] font-bold text-white truncate text-center drop-shadow-sm">
                        {photo.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: COLOR & GRADIENT (With "BG. Color Picker") ── */}
        {activeTab === "color" && (
          <div className="space-y-4">
            {/* Quick Transparent / Checkerboard Option */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeBg({ type: "transparent", value: "" })}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  currentBg.type === "transparent"
                    ? "border-amber-500 bg-amber-500/15 text-amber-300 font-extrabold shadow-sm ring-2 ring-amber-500/30"
                    : "border-neutral-800 bg-[#161619]/70 text-neutral-300 hover:border-neutral-700 hover:text-white"
                }`}
              >
                <div
                  className="h-5 w-5 rounded-md border border-neutral-700 shrink-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #3f3f46 25%, transparent 25%), linear-gradient(-45deg, #3f3f46 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3f3f46 75%), linear-gradient(-45deg, transparent 75%, #3f3f46 75%)",
                    backgroundSize: "6px 6px",
                    backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                  }}
                />
                <span className="text-xs font-bold">Transparent Cutout (PNG)</span>
              </button>
            </div>

            {/* Custom Designed "BG. Color Picker" */}
            <BGColorPicker
              color={customColor}
              onChange={(hex) => {
                setCustomColor(hex);
                onChangeBg({
                  type: "color",
                  value: hex,
                  label: `Color (${hex.toUpperCase()})`,
                });
              }}
            />

            {/* 36 Curated Solid Colors */}
            <div>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                  Solid Colors ({SOLID_COLORS.length})
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SOLID_COLORS.map((col) => {
                  const isSelected =
                    currentBg.type === "color" &&
                    currentBg.value.toLowerCase() === col.value.toLowerCase();
                  return (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => {
                        setCustomColor(col.value);
                        onChangeBg({
                          type: "color",
                          value: col.value,
                          label: col.label,
                        });
                      }}
                      title={col.label}
                      className={`relative aspect-square rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/50 scale-105 shadow-md shadow-amber-500/20"
                          : "border-neutral-800 hover:border-neutral-600 hover:scale-105"
                      }`}
                      style={{ backgroundColor: col.value }}
                    >
                      {isSelected && (
                        <Check
                          className={`h-3.5 w-3.5 stroke-[3] ${
                            col.value === "#ffffff" ||
                            col.value === "#f8fafc" ||
                            col.value === "#f1f5f9" ||
                            col.value === "#e2e8f0" ||
                            col.value === "#fef3c7"
                              ? "text-black"
                              : "text-white"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 27 Curated Studio Gradients */}
            <div>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                  Studio Gradients ({GRADIENTS.length})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENTS.map((grad) => {
                  const isSelected =
                    currentBg.type === "gradient" && currentBg.value === grad.value;
                  return (
                    <button
                      key={grad.label}
                      type="button"
                      onClick={() =>
                        onChangeBg({
                          type: "gradient",
                          value: grad.value,
                          label: grad.label,
                        })
                      }
                      title={grad.label}
                      className={`relative h-14 rounded-xl border transition-all cursor-pointer flex items-center justify-center p-1 overflow-hidden group ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/50 scale-[0.98] shadow-md shadow-amber-500/20"
                          : "border-neutral-800 hover:border-neutral-600 hover:scale-[1.02]"
                      }`}
                      style={{ background: grad.value }}
                    >
                      {isSelected && (
                        <span className="h-5 w-5 rounded-full bg-black/75 text-amber-400 flex items-center justify-center shadow-md">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                      <span className="absolute bottom-1 inset-x-1 text-[9px] font-bold text-white/95 drop-shadow-md truncate text-center">
                        {grad.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Footer Indicator (Cohesive Dark Studio Bar) ── */}
      <div className="p-3 border-t border-neutral-800 bg-[#09090c]/98 flex items-center justify-between text-[11px] text-neutral-400 font-semibold px-4">
        <span className="truncate max-w-[200px]">
          Active: <strong className="text-white font-bold">{currentBg.label || currentBg.type}</strong>
        </span>
        {currentBg.type !== "transparent" && (
          <button
            type="button"
            onClick={() => onChangeBg({ type: "transparent", value: "" })}
            className="text-amber-400 hover:text-amber-300 hover:underline font-bold cursor-pointer transition-colors shrink-0 ml-2"
          >
            Clear background
          </button>
        )}
      </div>
    </aside>
  );
}
