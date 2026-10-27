"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";
import { ManageFarms } from "@/components/features/animals/manage/ManageFarms";
import { ManageStatus } from "@/components/features/animals/manage/ManageStatus";
import { ManageClassification } from "@/components/features/animals/manage/ManageClassification";
import { ManageSociety } from "@/components/features/animals/manage/ManageSociety";
import { ManageSituation } from "@/components/features/animals/manage/ManageSituation";
import { Animal } from "@/types/animal.type";

const TABS = [
  { value: "fazenda", label: "Fazenda" },
  { value: "status", label: "Status" },
  { value: "classe", label: "Classe" },
  { value: "sociedade", label: "Sociedade" },
  { value: "situacao", label: "Situação" },
];

interface AnimalManageTabsProps {
  animal: Animal;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AnimalManageTabs({ animal, activeTab, onTabChange }: AnimalManageTabsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <StandardTabList
          variant="simple"
          tabs={TABS}
          activeTab={activeTab}
          className="mb-4"
        />

        <TabsContent value="fazenda" className="mt-0">
          <ManageFarms selectedAnimal={animal} />
        </TabsContent>
        <TabsContent value="status" className="mt-0">
          <ManageStatus selectedAnimal={animal} />
        </TabsContent>
        <TabsContent value="classe" className="mt-0">
          <ManageClassification selectedAnimal={animal} />
        </TabsContent>
        <TabsContent value="sociedade" className="mt-0">
          <ManageSociety selectedAnimal={animal} />
        </TabsContent>
        <TabsContent value="situacao" className="mt-0">
          <ManageSituation selectedAnimal={animal} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
