"use client";

import { useMemo, useState } from "react";
import { Search, Loader2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useMatrizes } from "@/hooks/matrizes/useMatrizes";
import {
  useBulkReproduction,
} from "@/hooks/reproduction/useBulkReproduction";
import { EventType } from "@/types/reproduction_event.type";
import { toast } from "sonner";
import { todayISO } from "@/utils/dates";

const eventTypes: EventType[] = ["IATF", "FIV"];
const protocolOptions = ["Sync D10", "Sync D11"] as const;

type ProtocolOption = (typeof protocolOptions)[number];

export function BulkReproductionPanel() {
  const { matrizes, isLoading: matrizesLoading } = useMatrizes();
  const {
    selectedCows,
    selectedCount,
    addCow,
    removeCow,
    createEvents,
    retryFailedSync,
    isProcessing,
    error,
    hasErrors,
  } = useBulkReproduction();
  const anchor = useComboboxAnchor();

  const handleComboboxValueChange = (value: string[] | string) => {
    const values = Array.isArray(value) ? value : [value];
    const currentRgns = selectedCows.map((cow) => cow.rgn);
    const nextSet = new Set(values);

    currentRgns.forEach((rgn) => {
      if (!nextSet.has(rgn)) {
        removeCow(rgn);
      }
    });

    const addedRgns = values.filter((rgn) => !currentRgns.includes(rgn));
    if (addedRgns.length > 0) {
      addedRgns.forEach((rgn) => {
        const cow = matrizes.find(
          (item) => item.rgn.toLowerCase() === rgn.toLowerCase(),
        );
        if (cow) {
          addCow(cow);
        }
      });
      setQuery("");
    }
  };

  const [query, setQuery] = useState("");
  const [eventDate, setEventDate] = useState(todayISO());
  const [eventType, setEventType] = useState<EventType>("IATF");
  const [protocolType, setProtocolType] = useState<ProtocolOption>("Sync D10");

  const selectedCowsSorted = useMemo(
    () =>
      [...selectedCows].sort((a, b) =>
        a.rgn.localeCompare(b.rgn, undefined, { numeric: true }),
      ),
    [selectedCows],
  );

  const searchOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return matrizes
      .filter((cow) => {
        const rgn = cow.rgn.toLowerCase();
        const name = cow.name?.toLowerCase() ?? "";
        return rgn.includes(term) || name.includes(term);
      })
      .sort((a, b) => a.rgn.localeCompare(b.rgn, undefined, { numeric: true }))
      .slice(0, 8);
  }, [query, matrizes]);

  const handleAddCow = (rgn: string) => {
    const cow = matrizes.find(
      (item) => item.rgn.toLowerCase() === rgn.toLowerCase(),
    );
    if (!cow) {
      toast.error("Matriz não encontrada.");
      return;
    }

    const added = addCow(cow);
    if (!added) {
      toast.error(`A matriz ${cow.rgn} já está na lista.`);
      return;
    }

    toast.success(`Matriz ${cow.rgn} adicionada.`);
    setQuery("");
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    const exact = matrizes.find(
      (cow) => cow.rgn.toLowerCase() === value.toLowerCase(),
    );
    if (exact) {
      handleAddCow(exact.rgn);
      return;
    }

    const fuzzy = matrizes.find(
      (cow) => cow.rgn.toLowerCase().includes(value.toLowerCase()),
    );
    if (fuzzy) {
      handleAddCow(fuzzy.rgn);
      return;
    }

    toast.error("Nenhuma matriz encontrada para esse RGN.");
  };

  const handleCreateEvents = async () => {
    const result = await createEvents({
      date: eventDate,
      event_type: eventType,
      protocolName: protocolType,
    });

    if (result.synced) {
      toast.success(`${result.insertedEvents.length} eventos criados.`);
      setQuery("");
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleRetry = async () => {
    const result = await retryFailedSync();
    if (result.synced) {
      toast.success("Sincronização em lote concluída.");
      setQuery("");
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  return (
    <section className="p-5 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <span className="text-xs font-bold text-primary uppercase">
              Buscar matriz por RGN
            </span>
          </label>

          <Combobox
            multiple
            autoHighlight
            items={searchOptions.map((cow) => cow.rgn)}
            value={selectedCowsSorted.map((cow) => cow.rgn)}
            onValueChange={handleComboboxValueChange}
          >
            <ComboboxChips ref={anchor} className="min-h-[2rem] w-full">
              <ComboboxValue>
                {() => (
                  <>
                    {selectedCowsSorted.map((cow) => (
                      <ComboboxChip key={cow.rgn} value={cow.rgn}>
                        <span className="font-bold text-primary">{cow.rgn}</span>
                      </ComboboxChip>
                    ))}
                    <ComboboxChipsInput
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Digite o RGN e pressione Enter"
                      disabled={matrizesLoading || isProcessing}
                      className="min-w-[12rem]"
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>

            {query.trim().length > 0 && (
              <ComboboxContent className="w-4/5 ml-6 -mt-2" anchor={anchor}>
                <ComboboxEmpty>Nenhuma matriz encontrada.</ComboboxEmpty>
                <ComboboxList className="w-[200px]">
                  {(item) => {
                    const cow = searchOptions.find(
                      (candidate) => candidate.rgn === item,
                    )
                    if (!cow) {
                      return null
                    }

                    return (
                      <ComboboxItem key={cow.rgn} value={cow.rgn}>
                        <span className="font-semibold">{cow.rgn}</span>
                      </ComboboxItem>
                    )
                  }}
                </ComboboxList>
              </ComboboxContent>
            )}
          </Combobox>

          {matrizesLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando matrizes...
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid gap-2">
            <label className="text-[11px] font-bold text-primary uppercase">
              Data do evento
            </label>
            <Input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-[11px] font-bold text-primary uppercase">
              Tipo de evento
            </label>
            <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-[11px] font-bold text-primary uppercase">
              Tipo de protocolo
            </label>
            <Select value={protocolType} onValueChange={(value) => setProtocolType(value as ProtocolOption)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {protocolOptions.map((protocol) => (
                  <SelectItem key={protocol} value={protocol}>
                    {protocol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}


      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="w-full sm:w-auto"
          onClick={handleCreateEvents}
          disabled={selectedCount === 0 || isProcessing}
        >
          {isProcessing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Criando eventos
            </span>
          ) : (
            "Criar eventos de reprodução"
          )}
        </Button>

        {hasErrors && (
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleRetry}
            disabled={isProcessing}
          >
            <Repeat className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        )}
      </div>
    </section>
  );
}
