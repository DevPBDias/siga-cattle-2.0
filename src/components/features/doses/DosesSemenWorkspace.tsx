"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";
import { MyBullsTab } from "@/components/features/doses/MyBullsTab";
import { DosesCatalogTab } from "@/components/features/doses/DosesCatalogTab";
import { useDosesSemenWorkspace } from "@/hooks/forms/useDosesSemenWorkspace";

const TABS = [
  { value: "meus-touros", label: "Meus touros" },
  { value: "doses", label: "Doses" },
];

export function DosesSemenWorkspace() {
  const workspace = useDosesSemenWorkspace();

  return (
    <Tabs
      value={workspace.actions.activeTab}
      onValueChange={workspace.actions.setActiveTab}
      className="w-full"
    >
      <div className="px-4 pt-3">
        <StandardTabList
          tabs={TABS}
          activeTab={workspace.actions.activeTab}
          variant="simple"
        />
      </div>

      <TabsContent value="meus-touros" className="px-4 py-4">
        <MyBullsTab />
      </TabsContent>

      <TabsContent value="doses" className="mt-0">
        <DosesCatalogTab workspace={workspace} />
      </TabsContent>
    </Tabs>
  );
}
