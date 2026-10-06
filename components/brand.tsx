import { Network } from "lucide-react";
export const Brand = (): React.JSX.Element => (
  <span className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight">
    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Network className="size-5" strokeWidth={2.4} />
    </span>
    Roam<span className="-ml-2.5 font-normal text-muted-foreground">JS</span>
  </span>
);
