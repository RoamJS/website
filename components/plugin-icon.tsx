import {
  Blocks,
  Search,
  Terminal,
  List,
  Share2,
  Link2,
  CheckCheck,
  CalendarDays,
  Cloud,
  Presentation,
  Mic,
  MapPin,
  MessageSquare,
  Highlighter,
  Smile,
  Activity,
  ChartNoAxesCombined,
  PenTool,
  StickyNote,
  Moon,
  ArrowLeftRight,
  ListFilter,
  Images,
  Pin,
  History,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
export const QueryIcon = (
  props: React.SVGProps<SVGSVGElement>,
): React.JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 4h12M3 10h5M3 16h5" />
    <circle cx="15" cy="14" r="4" />
    <path d="m18 17 4 4" />
  </svg>
);
const icons = {
  smartblocks: List,
  "query-builder": QueryIcon,
  workbench: Terminal,
  autotag: Link2,
  "todo-trigger": CheckCheck,
  google: CalendarDays,
  dropbox: Cloud,
  presentation: Presentation,
  otter: Mic,
  mapbox: MapPin,
  slack: MessageSquare,
  hypothesis: Highlighter,
  giphy: Smile,
  breadcrumbs: Share2,
  "oura-ring": Activity,
  stats: ChartNoAxesCombined,
  tldraw: PenTool,
  "sticky-notes": StickyNote,
  "custom-dark-mode": Moon,
  "quick-switcher": ArrowLeftRight,
  "attribute-select": ListFilter,
  "media-gallery": Images,
  "pinned-blocks": Pin,
  "recent-changes": History,
  "ranked-search": Search,
  developer: Code2,
};
export const PluginIcon = ({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}): React.JSX.Element => {
  const Icon = icons[slug as keyof typeof icons] ?? Blocks;
  return (
    <span
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border bg-secondary/50 text-primary",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={1.7} />
    </span>
  );
};
