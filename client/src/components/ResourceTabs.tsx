import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

export interface ResourceTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Phase B.2 — Azure-style resource-detail tab pattern.
 *
 * One URL, one entity (institution / student / credential…), multiple tabs
 * (Overview / Students / Credentials / Trust / Integrations / Activity /
 * Settings). Avoids long scrolling pages; mirrors the cloud-console resource
 * view. Reusable across every workspace.
 */
export function ResourceTabs({
  tabs,
  defaultValue,
}: {
  tabs: ResourceTab[];
  defaultValue?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.id} className="w-full">
      <TabsList className="h-12 bg-neutral-100 dark:bg-neutral-800/60 p-1 rounded-xl mb-6 flex-wrap">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="h-10 px-4 rounded-lg text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-primary data-[state=active]:shadow-sm text-neutral-600 dark:text-neutral-400"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-0 focus-visible:outline-none">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
