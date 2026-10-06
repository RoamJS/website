import {
  Blocks,
  Search,
  Wrench,
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
  Route,
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
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
const icons = {
  smartblocks: Blocks,
  "query-builder": Search,
  workbench: Wrench,
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
  breadcrumbs: Route,
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
  "static-site": Globe,
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
