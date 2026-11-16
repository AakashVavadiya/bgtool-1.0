import React from "react";

interface MandalaProps {
  className?: string;
  size?: number | string;
  spin?: boolean;
}

/**
 * Intricate, mathematical 12-fold floral geometry Mandala SVG.
 * Designed with pure vector paths for crisp rendering at any resolution.
 * Supports currentColor styling, rotation, and custom opacity.
 */
export const MandalaDecor: React.FC<MandalaProps> = ({
  className = "w-full h-full text-accent/20",
  size,
  spin = false,
}) => {
  const angles12 = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const angles24 = [
    0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165,
    180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345
  ];

  return (
    <svg
      viewBox="0 0 600 600"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${spin ? "animate-[spin_120s_linear_infinite]" : ""}`}
      style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
      aria-hidden="true"
    >
      <defs>
        {/* Inner Lotus Petal */}
        <path
          id="mandala-petal-inner"
          d="M 300 245 C 288 220 282 195 300 175 C 318 195 312 220 300 245 Z"
          strokeWidth="1.2"
        />
        {/* Inner Petal Vein */}
        <path
          id="mandala-vein-inner"
          d="M 300 240 Q 300 210 300 185"
          strokeWidth="0.8"
          strokeDasharray="1.5 2"
        />
        {/* Middle Ornamental Crown */}
        <path
          id="mandala-petal-mid"
          d="M 300 160 C 275 130 265 95 300 65 C 335 95 325 130 300 160 Z"
          strokeWidth="1.2"
        />
        {/* Mid Teardrop Droplet */}
        <path
          id="mandala-teardrop"
          d="M 300 135 C 290 120 290 105 300 95 C 310 105 310 120 300 135 Z"
          strokeWidth="0.9"
        />
        {/* Outer Grand Lotus Leaf */}
        <path
          id="mandala-petal-outer"
          d="M 300 70 C 265 40 250 10 300 -15 C 350 10 335 40 300 70 Z"
          strokeWidth="1"
        />
        {/* Scallop Arch */}
        <path
          id="mandala-scallop"
          d="M 285 200 A 15 15 0 0 1 315 200"
          strokeWidth="0.9"
        />
      </defs>

      <g transform="translate(0, 0)">
        {/* Center Core */}
        <circle cx="300" cy="300" r="10" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="18" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="300" cy="300" r="32" strokeWidth="1.2" />
        <circle cx="300" cy="300" r="55" strokeWidth="1.4" />

        {/* Layer 1: 12 Tiny Core Dots */}
        {angles12.map((angle) => (
          <circle
            key={`dot-${angle}`}
            cx="300"
            cy="276"
            r="2.5"
            strokeWidth="0.8"
            fill="currentColor"
            fillOpacity="0.35"
            transform={`rotate(${angle} 300 300)`}
          />
        ))}

        {/* Layer 2: 12 Inner Lotus Petals + Veins */}
        {angles12.map((angle) => (
          <g key={`inner-${angle}`} transform={`rotate(${angle} 300 300)`}>
            <use href="#mandala-petal-inner" />
            <use href="#mandala-vein-inner" />
          </g>
        ))}

        {/* Layer 3: Concentric Filigree Ring */}
        <circle cx="300" cy="300" r="130" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="300" cy="300" r="140" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="150" strokeWidth="0.8" />

        {/* 24 Tiny Pearl Beads */}
        {angles24.map((angle) => (
          <circle
            key={`pearl-${angle}`}
            cx="300"
            cy="160"
            r="2"
            strokeWidth="0.6"
            fill="currentColor"
            fillOpacity="0.4"
            transform={`rotate(${angle} 300 300)`}
          />
        ))}

        {/* Layer 4: 12 Mid Ornamental Crowns & Teardrops */}
        {angles12.map((angle) => (
          <g key={`mid-${angle}`} transform={`rotate(${angle + 15} 300 300)`}>
            <use href="#mandala-petal-mid" />
            <use href="#mandala-teardrop" />
            <circle cx="300" cy="80" r="3" strokeWidth="0.9" fill="currentColor" fillOpacity="0.25" />
          </g>
        ))}

        {/* Layer 5: Scalloped Ring */}
        <circle cx="300" cy="300" r="230" strokeWidth="1.2" />
        <circle cx="300" cy="300" r="240" strokeWidth="0.8" strokeDasharray="4 4" />
        <circle cx="300" cy="300" r="248" strokeWidth="1.6" />

        {/* Layer 6: 24 Outer Lotus Leaves / Flame Crests */}
        {angles24.map((angle) => (
          <g key={`outer-${angle}`} transform={`rotate(${angle} 300 300)`}>
            <path
              d="M 300 62 C 285 30 280 10 300 -10 C 320 10 315 30 300 62 Z"
              strokeWidth="1.1"
            />
            <circle
              cx="300"
              cy="-2"
              r="2.5"
              strokeWidth="0.7"
              fill="currentColor"
              fillOpacity="0.3"
            />
            {/* Radiating Ray Tip */}
            <line x1="300" y1="-10" x2="300" y2="-22" strokeWidth="1" strokeDasharray="1 2" />
            <circle cx="300" cy="-25" r="1.5" strokeWidth="0.6" fill="currentColor" />
          </g>
        ))}

        {/* Layer 7: Outermost Fine Orbit Ring */}
        <circle cx="300" cy="300" r="280" strokeWidth="0.8" strokeDasharray="1.5 3" />
        <circle cx="300" cy="300" r="288" strokeWidth="1" />
      </g>
    </svg>
  );
};

/**
 * Corner Mandala Decoration:
 * Anchors gracefully in the corner of a card or container, providing a luxury filigree touch.
 */
export const MandalaCorner: React.FC<{
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
  size?: number | string;
}> = ({ position = "top-right", className = "", size = 160 }) => {
  const positionClasses = {
    "top-right": "-top-10 -right-10 pointer-events-none",
    "top-left": "-top-10 -left-10 pointer-events-none",
    "bottom-right": "-bottom-10 -right-10 pointer-events-none",
    "bottom-left": "-bottom-10 -left-10 pointer-events-none",
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <MandalaDecor
        size={size}
        className="text-accent/25 dark:text-accent/20 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-12"
      />
    </div>
  );
};
