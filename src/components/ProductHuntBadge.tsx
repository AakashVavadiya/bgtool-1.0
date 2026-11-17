import { ArrowUpRight, Star } from "lucide-react";

interface ProductHuntBadgeProps {
  variant?: "hero" | "footer" | "compact" | "banner";
  className?: string;
}

export function ProductHuntBadge({
  variant = "hero",
  className = "",
}: ProductHuntBadgeProps) {
  const phUrl =
    "https://www.producthunt.com/products/bg-tools?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-bg-tools";

  // Product Hunt Official "P" Mark
  const ProductHuntLogo = ({ size = 20 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <circle cx="16" cy="16" r="16" fill="#FF6154" />
      <path
        d="M17.8 16.5H13.5V11.8H17.8C19.1 11.8 20.1 12.8 20.1 14.1C20.1 15.4 19.1 16.5 17.8 16.5ZM17.8 8.6H10.4V24.2H13.5V19.6H17.8C20.8 19.6 23.2 17.1 23.2 14.1C23.2 11.1 20.8 8.6 17.8 8.6Z"
        fill="white"
      />
    </svg>
  );

  // 1. Footer & Compact Variant: Sleek interactive pill
  if (variant === "footer" || variant === "compact") {
    return (
      <a
        href={phUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View bg.tools on Product Hunt"
        className={`group inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/90 hover:bg-card hover:border-[#FF6154]/50 backdrop-blur-md px-3.5 py-1.5 shadow-2xs hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <ProductHuntLogo size={20} />
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-foreground group-hover:text-[#FF6154] transition-colors">
            Featured on Product Hunt
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>4.9</span>
          </span>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#FF6154] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    );
  }

  // 2. Banner Variant: Full-width social proof banner
  if (variant === "banner") {
    return (
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card/90 backdrop-blur-md p-4 sm:p-5 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-3">
          <ProductHuntLogo size={40} />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">Featured on Product Hunt</h4>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Star className="h-2.5 w-2.5 fill-current" /> 4.9/5
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recognized and voted by designers, developers, and creators worldwide.
            </p>
          </div>
        </div>

        <a
          href={phUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2 text-xs font-bold hover:opacity-90 transition-all hover:gap-2.5 shadow-sm shrink-0"
        >
          <span>View on Product Hunt</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  // 3. Default: "hero" Variant (Unified, High-End Social Proof Badge)
  return (
    <div className={`flex justify-center ${className}`}>
      <a
        href={phUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View bg.tools on Product Hunt"
        className="group relative inline-flex items-center gap-2.5 sm:gap-3 rounded-full border border-border/80 bg-card/90 hover:bg-card hover:border-[#FF6154]/50 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Glowing ambient backlight on hover */}
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#FF6154]/25 via-amber-500/20 to-[#FF6154]/25 blur-xs opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

        {/* Product Hunt Brand Mark */}
        <div className="relative">
          <ProductHuntLogo size={28} />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6154] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6154]" />
          </span>
        </div>

        {/* Brand Text Column */}
        <div className="relative flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
            Featured on
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight leading-tight group-hover:text-[#FF6154] transition-colors">
            Product Hunt
          </span>
        </div>

        {/* Divider */}
        <div className="relative h-6 w-px bg-border/80 mx-0.5" />

        {/* Rating Section */}
        <div className="relative flex items-center gap-1.5 pl-0.5">
          <div className="flex text-amber-500 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-500 text-amber-500" />
            ))}
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-foreground ml-0.5">
            4.9
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground hidden xs:inline sm:inline">
            / 5
          </span>
        </div>

        {/* CTA Arrow */}
        <div className="relative hidden sm:flex items-center gap-1 pl-1 text-xs font-bold text-[#FF6154] group-hover:translate-x-0.5 transition-transform">
          <span>Explore</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </a>
    </div>
  );
}
