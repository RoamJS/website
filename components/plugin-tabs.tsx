"use client";
import { ArrowUpRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityForm } from "./community-form";

const triggerClassName =
  "group/tab h-11 flex-none gap-2 rounded-none border-0 px-0 py-1 text-sm font-medium text-muted-foreground shadow-none after:hidden data-[state=active]:bg-transparent data-[state=active]:text-base data-[state=active]:font-semibold data-[state=active]:tracking-tight data-[state=active]:shadow-none data-[state=inactive]:rounded-lg data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:bg-card data-[state=inactive]:px-3 data-[state=inactive]:text-primary sm:data-[state=active]:text-xl dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent dark:data-[state=inactive]:bg-card dark:data-[state=inactive]:text-primary";

export const PluginTabs = ({
  children,
  slug,
  name,
  enabled,
}: {
  children: React.ReactNode;
  slug: string;
  name: string;
  enabled: boolean;
}): React.JSX.Element => (
  <Tabs defaultValue="guide">
    <TabsList
      aria-label="Plugin page views"
      className="mb-7 h-auto w-full justify-between gap-2 rounded-none bg-transparent p-0"
    >
      <TabsTrigger value="guide" className={triggerClassName}>
        <span
          aria-hidden="true"
          className="hidden size-1.5 rounded-full bg-primary group-data-[state=active]/tab:block"
        />
        Instructions
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 group-data-[state=active]/tab:hidden"
        />
      </TabsTrigger>
      <TabsTrigger value="suggest" className={triggerClassName}>
        <span
          aria-hidden="true"
          className="hidden size-1.5 rounded-full bg-primary group-data-[state=active]/tab:block"
        />
        Suggest a change
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 group-data-[state=active]/tab:hidden"
        />
      </TabsTrigger>
    </TabsList>
    <TabsContent value="guide">{children}</TabsContent>
    <TabsContent value="suggest">
      <CommunityForm
        enabled={enabled}
        kind="idea"
        pluginSlug={slug}
        pluginName={name}
      />
    </TabsContent>
  </Tabs>
);
