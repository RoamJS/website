"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityForm } from "./community-form";

const triggerClassName =
  "h-10 flex-none rounded-lg border-0 px-4 py-0 text-sm font-medium text-muted-foreground transition-none after:hidden data-[state=active]:bg-accent data-[state=active]:text-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-accent";

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
      className="mb-7 h-auto w-fit max-w-full justify-start gap-1 rounded-xl border border-border bg-card p-1 group-data-[orientation=horizontal]/tabs:h-auto"
    >
      <TabsTrigger value="guide" className={triggerClassName}>
        Instructions
      </TabsTrigger>
      <TabsTrigger value="suggest" className={triggerClassName}>
        Suggest a change
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
