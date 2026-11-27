"use client";

import { useState } from "react";
import ShortHeader from "@/components/layout/ShortHeader";
import { BirthHistory } from "@/components/features/nascimentos/BirthHistory";
import { BirthForm } from "@/components/features/nascimentos/BirthForm";
import { BirthReport } from "@/components/features/nascimentos/BirthReport";
import { WeaningReport } from "@/components/features/nascimentos/WeaningReport";
import { WeaningForm } from "@/components/features/nascimentos/form/WeaningForm";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";

const TABS = [
  { value: "registro", label: "Registrar" },
  { value: "historico", label: "Histórico" },
  { value: "relatorio", label: "Relatório" },
];

const REGISTRATION_TABS = [
  { value: "nascimento", label: "Nascimento" },
  { value: "desmama", label: "Desmama" },
];

const REPORT_TABS = [
  { value: "nascimento", label: "Nascimento" },
  { value: "desmama", label: "Desmama" },
];

export default function NascimentosPage() {
  const [activeTab, setActiveTab] = useState("registro");
  const [activeRegistrationTab, setActiveRegistrationTab] =
    useState("nascimento");
  const [activeReportTab, setActiveReportTab] = useState("nascimento");

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Nascimentos e Desmamas" />

      <main className="min-h-0 flex-1 overflow-y-auto p-3 no-scrollbar">
        <div className="mx-auto w-full max-w-lg">
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
              <Tabs
                value={activeRegistrationTab}
                onValueChange={setActiveRegistrationTab}
                className="w-full"
              >
                <StandardTabList
                  tabs={REGISTRATION_TABS}
                  activeTab={activeRegistrationTab}
                  variant="simple"
                  className="mb-4"
                />

                <TabsContent value="nascimento" className="mt-0">
                  <BirthForm />
                </TabsContent>

                <TabsContent value="desmama" className="mt-0">
                  <WeaningForm />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
              <BirthHistory />
            </TabsContent>

            <TabsContent value="relatorio" className="mt-0">
              <Tabs
                value={activeReportTab}
                onValueChange={setActiveReportTab}
                className="w-full"
              >
                <StandardTabList
                  tabs={REPORT_TABS}
                  activeTab={activeReportTab}
                  variant="simple"
                  className="mb-4"
                />

                <TabsContent value="nascimento" className="mt-0">
                  <BirthReport />
                </TabsContent>

                <TabsContent value="desmama" className="mt-0">
                  <WeaningReport />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
