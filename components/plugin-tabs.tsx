"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import { CommunityForm } from "./community-form";
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
    <TabsList className="mb-7 h-11 w-full justify-start gap-2 border-b bg-transparent p-0">
      <TabsTrigger
        value="guide"
        className="h-11 rounded-none border-0 border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Instructions
      </TabsTrigger>
      <TabsTrigger
        value="reviews"
        className="h-11 rounded-none border-0 border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Reviews
      </TabsTrigger>
      <TabsTrigger
        value="suggest"
        className="h-11 rounded-none border-0 border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Suggest a change
      </TabsTrigger>
    </TabsList>
    <TabsContent value="guide">{children}</TabsContent>
    <TabsContent value="reviews">
      <div className="rounded-xl border border-dashed p-8">
        <MessageSquare className="mb-4 size-6 text-primary" />
        <h2 className="text-lg font-medium">Room for your experience</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Community reviews haven’t been added to this website yet. There are no
          published ratings for {name} here.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Have feedback now? Use “Suggest a change” to share it.
        </p>
      </div>
    </TabsContent>
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
