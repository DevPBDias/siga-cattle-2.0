"use client";

import { useState } from "react";
import ShortHeader from "@/components/layout/ShortHeader";
import { BirthHistory } from "@/components/features/nascimentos/BirthHistory";
import { BirthForm } from "@/components/features/nascimentos/BirthForm";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";

const TABS = [
  { value: "registro", label: "Registrar" },
  { value: "historico", label: "Histórico" },
];

export default function NascimentosPage() {
  const [activeTab, setActiveTab] = useState("registro");

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Nascimentos" />

      <main className="min-h-0 flex-1 overflow-y-auto p-3 no-scrollbar">
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
            <BirthForm />
          </TabsContent>

          <TabsContent value="historico" className="mt-0">
            <BirthHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
