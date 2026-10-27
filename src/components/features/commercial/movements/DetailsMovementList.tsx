import { useMovementsByAnimal } from "@/hooks/db/movements/useMovementsByAnimal";
import { MovementListItem } from "./MovementListItem";
import { Loader2 } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";

interface DetailsMovementListProps {
  rgn: string;
}

export function DetailsMovementList({ rgn }: DetailsMovementListProps) {
  const { data: movements = [], loading: isLoading } =
    useMovementsByAnimal(rgn);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground text-sm gap-2 bg-muted/20 rounded-xl border border-dashed">
        <p>Nenhuma movimentação registrada.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <div className="space-y-2">
        {movements.map((movement) => (
          <MovementListItem
            key={movement.id}
            movement={movement}
          />
        ))}
      </div>
    </Accordion>
  );
}
