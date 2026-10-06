import { ArrowLeft, ChevronRight, Search, Smile, Sparkles } from "lucide-react";

export const BreadcrumbsPreview = (): React.JSX.Element => (
  <div
    aria-hidden="true"
    className="relative hidden h-[264px] w-full self-center sm:block"
  >
    <div className="absolute inset-y-2 inset-x-0 overflow-hidden rounded-lg border bg-background/60">
      <div className="flex items-center gap-1.5 border-b bg-popover px-3 py-3 text-[10px]">
        <span className="whitespace-nowrap text-muted-foreground">
          Daily notes
        </span>
        <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
        <span className="rounded bg-accent px-2 py-1 text-primary">
          Projects
        </span>
        <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
        <span className="font-medium">Reading</span>
      </div>
      <div className="p-5">
        <p className="text-lg font-semibold">Reading</p>
        <div className="mt-4 border-l pl-3 text-[11px] leading-7 text-muted-foreground">
          <p>• &nbsp; Ideas worth coming back to</p>
          <p>
            • &nbsp; A link to{" "}
            <span className="text-primary">[[Projects]]</span>
          </p>
          <p>• &nbsp; Follow the next connection</p>
        </div>
      </div>
    </div>
    <div className="absolute bottom-0 right-3 flex rotate-[-3deg] items-center gap-3 rounded-lg border border-brand-orange/35 bg-card px-4 py-3 text-xs shadow-sm">
      <ArrowLeft className="size-4 text-brand-orange" />
      <span>
        Back to <span className="font-medium text-primary">Projects</span>
      </span>
    </div>
  </div>
);

export const StatsPreview = (): React.JSX.Element => (
  <span
    aria-hidden="true"
    className="relative hidden h-28 w-36 shrink-0 xl:block"
  >
    <span className="absolute inset-x-1 inset-y-1 rotate-[-3deg] rounded-lg border bg-popover p-2.5 shadow-sm">
      <span className="block border-b pb-1 text-[10px] leading-tight font-medium">
        Your graph
      </span>
      <span className="mt-1.5 grid grid-cols-2 gap-1.5">
        <span className="rounded bg-accent p-1">
          <span className="block text-sm font-semibold leading-none text-primary">
            128
          </span>
          <span className="block text-[8px] leading-tight text-muted-foreground">
            Pages
          </span>
        </span>
        <span className="rounded bg-secondary p-1">
          <span className="block text-sm font-semibold leading-none text-brand-orange">
            2,406
          </span>
          <span className="block text-[8px] leading-tight text-muted-foreground">
            Blocks
          </span>
        </span>
      </span>
      <span className="mt-1.5 block text-[8px] leading-tight text-muted-foreground">
        512 links between ideas
      </span>
    </span>
  </span>
);

export const GiphyPreview = (): React.JSX.Element => (
  <span
    aria-hidden="true"
    className="relative hidden h-28 w-36 shrink-0 xl:block"
  >
    <span className="absolute inset-x-1 inset-y-1 rotate-[3deg] overflow-hidden rounded-lg border bg-popover p-2 shadow-sm">
      <span className="flex items-center gap-1.5 border-b pb-1.5 text-[9px] text-muted-foreground">
        <Search className="size-3" /> Find a GIF
      </span>
      <span className="mt-2 grid grid-cols-2 gap-1.5">
        <span className="flex h-14 items-center justify-center rounded border border-primary/50 bg-accent text-primary">
          <Smile className="size-7" strokeWidth={1.5} />
        </span>
        <span className="flex h-14 flex-col items-center justify-center gap-1 rounded bg-brand-orange/10 text-brand-orange">
          <Sparkles className="size-5" strokeWidth={1.5} />
          <span className="text-[8px] font-semibold tracking-wider">NICE!</span>
        </span>
      </span>
    </span>
  </span>
);
