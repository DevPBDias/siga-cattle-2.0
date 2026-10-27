"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShortHeader from "@/components/layout/ShortHeader";
import { MovementForm } from "@/components/features/commercial/movements";
import { DeathForm } from "@/components/features/mortes/DeathForm";
import {
  MovementTypeSelector,
  CreateMovementType,
} from "@/components/features/commercial/movements/MovementTypeSelector";

export default function CriarMovimentacaoPage() {
  const router = useRouter();
  const [movementType, setMovementType] = useState<CreateMovementType | "">("");
  const goToList = () => router.push("/movimentacoes");

  return (
    <div className="flex h-dvh min-h-screen flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Nova movimentação" />

      <main className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-3 py-3">
        <MovementTypeSelector value={movementType} onChange={setMovementType} />

        {movementType === "morte" && (
          <DeathForm movementMode onSuccess={goToList} />
        )}
        {(movementType === "venda" || movementType === "troca") && (
          <MovementForm
            key={movementType}
            initialType={movementType}
            hideTypeSelector
            onSuccess={goToList}
          />
        )}
      </main>
    </div>
  );
}
