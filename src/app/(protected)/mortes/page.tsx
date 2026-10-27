"use client";

import { useState } from "react";
import ShortHeader from "@/components/layout/ShortHeader";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";
import { DeathForm } from "@/components/features/mortes/DeathForm";
import { DeathHistory } from "@/components/features/mortes/DeathHistory";

const TABS = [
  { value: "registro", label: "Registrar" },
  { value: "historico", label: "Histórico" },
];

export default function MortesPage() {
  const [activeTab, setActiveTab] = useState("registro");

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Mortes" />

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <StandardTabList
            tabs={TABS}
            activeTab={activeTab}
            variant="simple"
            className="mb-4"
          />

          <TabsContent
            value="registro"
            forceMount
            className="mt-0 data-[state=inactive]:hidden"
          >
            <DeathForm />
          </TabsContent>

          <TabsContent value="historico" className="mt-0">
            <DeathHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
