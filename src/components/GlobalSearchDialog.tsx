import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { tools } from "@/lib/tools";
import {
  Wand2,
  Sparkles,
  Search,
  Scissors,
  Layers,
  FileText,
  Key,
  CreditCard,
  Download,
  HelpCircle,
  User,
  Zap,
  ArrowRight,
  Sliders,
} from "lucide-react";

export const OPEN_SEARCH_DIALOG_EVENT = "open_global_search_dialog";

export function openGlobalSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_DIALOG_EVENT));
  }
}

interface QuickNavPage {
  title: string;
  description: string;
  to: string;
  icon: typeof Wand2;
  category: "Navigation" | "Developer" | "Account";
  badge?: string;
}

const QUICK_PAGES: QuickNavPage[] = [
  {
    title: "AI Background Remover",
    description: "Remove background instantly with sub-pixel precision",
    to: "/",
    icon: Wand2,
    category: "Navigation",
    badge: "Core AI",
  },
  {
    title: "Precision Cutout Brush",
    description: "Brush fine hair, transparent fabric, and edge refinements",
    to: "/tools/cutout-brush-editor",
    icon: Scissors,
    category: "Navigation",
    badge: "New",
  },
  {
    title: "AI Models & Showcase",
    description: "Compare General, Portrait, Anime, and Product AI models",
    to: "/models",
    icon: Sparkles,
    category: "Navigation",
  },
  {
    title: "All 130+ Creative Tools",
    description: "Explore complete image, conversion, compression & PDF toolkit",
    to: "/tools",
    icon: Layers,
    category: "Navigation",
  },
  {
    title: "Pricing & Token Packs",
    description: "Daily free Bronze tokens, Silver plans, and Gold token packs",
    to: "/pricing",
    icon: CreditCard,
    category: "Navigation",
    badge: "Tokens",
  },
  {
    title: "Desktop Apps (Win / Mac)",
    description: "High-speed offline background removal with zero cloud sync",
    to: "/download",
    icon: Download,
    category: "Navigation",
  },
  {
    title: "API Documentation & Endpoints",
    description: "REST API documentation for developers and automated pipelines",
    to: "/api",
    icon: FileText,
    category: "Developer",
  },
  {
    title: "API Keys Console",
    description: "Generate and manage secure production API keys",
    to: "/account?tab=api-keys",
    icon: Key,
    category: "Developer",
    badge: "v1",
  },
  {
    title: "User Profile & Settings",
    description: "Manage name, security, tokens, and active creative sessions",
    to: "/account",
    icon: User,
    category: "Account",
  },
  {
    title: "Frequently Asked Questions",
    description: "Learn about token usage, billing, refunds, and zero-tracking",
    to: "/pricing#faq",
    icon: HelpCircle,
    category: "Navigation",
  },
];

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setIsOpen(nextOpen);
      if (onOpenChange) onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  // Sync external open prop
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  // Global keyboard shortcut listener (Cmd+K / Ctrl+K / slash)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing inside an input/textarea unless it's Cmd+K
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_SEARCH_DIALOG_EVENT, handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_SEARCH_DIALOG_EVENT, handleCustomOpen);
    };
  }, []);

  const handleSelect = (url: string) => {
    handleOpenChange(false);
    if (url.startsWith("/")) {
      navigate({ to: url as any });
    } else {
      window.location.href = url;
    }
  };

  // Curate popular and active tools
  const popularTools = useMemo(() => {
    return tools.slice(0, 8);
  }, []);

  const allOtherTools = useMemo(() => {
    return tools.slice(8, 45);
  }, []);

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="flex items-center px-4 pt-3 pb-1 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          <Search className="h-3.5 w-3.5 text-orange-500" />
          <span>Quick Finder & Command Palette</span>
        </div>
      </div>

      <CommandInput placeholder="Search AI tools, models, pages, pricing, API docs..." />

      <CommandList className="max-h-[380px] sm:max-h-[440px] p-2 space-y-1">
        <CommandEmpty>
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">No matching tools or pages found</p>
            <p className="text-xs text-muted-foreground">
              Try searching for "cutout", "background", "upscale", "pdf", or "pricing"
            </p>
          </div>
        </CommandEmpty>

        {/* Quick Pages & Destinations */}
        <CommandGroup heading="Pages & Features">
          {QUICK_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem
                key={page.to + page.title}
                value={`${page.title} ${page.description} ${page.category}`}
                onSelect={() => handleSelect(page.to)}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{page.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{page.description}</p>
                  </div>
                </div>
                {page.badge && (
                  <span className="shrink-0 rounded-md bg-secondary border border-border/80 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                    {page.badge}
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Popular AI Tools */}
        <CommandGroup heading="Popular AI Tools">
          {popularTools.map((tool) => {
            const IconComponent = tool.icon || Wand2;
            return (
              <CommandItem
                key={tool.slug}
                value={`${tool.name} ${tool.blurb || ""} ${tool.category} ${tool.tag || ""}`}
                onSelect={() => handleSelect(`/tools/${tool.slug}`)}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <IconComponent className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{tool.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{tool.blurb || tool.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 text-[10px] font-bold">
                    {tool.category}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* All Creative & Document Tools */}
        <CommandGroup heading="All Creative & Utility Tools">
          {allOtherTools.map((tool) => {
            const IconComponent = tool.icon || Layers;
            return (
              <CommandItem
                key={tool.slug}
                value={`${tool.name} ${tool.blurb || ""} ${tool.category} ${tool.tag || ""}`}
                onSelect={() => handleSelect(`/tools/${tool.slug}`)}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">{tool.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {tool.category}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>

      {/* Footer shortcut hints */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">↑↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">↵</kbd>
            <span>Open</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">esc</kbd>
            <span>Close</span>
          </span>
        </div>
        <span className="font-mono text-[10px] text-orange-500 font-semibold">130+ AI Tools</span>
      </div>
    </CommandDialog>
  );
}
