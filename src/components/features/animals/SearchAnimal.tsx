"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import SearchCard from "@/components/features/animals/lists/SearchCard";
import DetailsAnimalLayout from "./details/DetailsAnimalLayout";
import { SkeletonSearchAnimal } from "@/components/ui/skeletons/SkeletonSearchAnimal";
import ShortHeader from "@/components/layout/ShortHeader";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { SelectedEntityCard } from "@/components/shared/SelectedEntityCard";

export default function SearchAnimal() {
  const { canAccess } = useUserAccess();
  const { data: animals, loading: isLoading } = useAnimals();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRgn, setSelectedRgn] = useState<string | null>(null);
  const [isEditingAnimal, setIsEditingAnimal] = useState(false);

  const searchResults = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return [];

    const query = rawQuery.toLowerCase();
    const compactQuery = query.replace(/\s+/g, "");

    const exactMatch = (animals || []).find(
      (animal) =>
        animal.rgn?.toLowerCase() === query ||
        `${animal.serie_rgd || "INDI"} ${animal.rgn}`.toLowerCase() === query,
    );
    if (exactMatch) return [exactMatch];

    return (animals || []).filter((animal) => {
      const rgn = animal.rgn?.toString().toLowerCase() || "";
      const name = animal.name?.toLowerCase() || "";
      const serieRgd = (animal.serie_rgd || "INDI").toLowerCase();
      const fullDisplay = `${serieRgd} ${rgn}`.toLowerCase();
      const compactDisplay = `${serieRgd}${rgn}`.toLowerCase();

      return (
        rgn.includes(query) ||
        name.includes(query) ||
        serieRgd.includes(query) ||
        fullDisplay.includes(query) ||
        compactDisplay.includes(compactQuery)
      );
    });
  }, [animals, searchQuery]);

  const selectedAnimal = useMemo(() => {
    if (!selectedRgn) return null;
    return (animals || []).find((a) => a.rgn === selectedRgn) || null;
  }, [animals, selectedRgn]);

  const hasSearched = searchQuery.trim().length > 0;

  const handleSelectAnimal = (rgn: string) => {
    setSelectedRgn(rgn);
    setIsEditingAnimal(false);
  };

  const handleClearSelection = () => {
    setSelectedRgn(null);
    setIsEditingAnimal(false);
  };

  const selectedDisplayName = selectedAnimal
    ? `${selectedAnimal.serie_rgd || "INDI"} ${selectedAnimal.rgn}`
    : "";

  const isSelectedNeloreMocha =
    selectedAnimal?.breed?.trim().toLowerCase() === "nelore mocha";

  return (
    <main className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-background pb-20">
      <ShortHeader title="CONSULTA" />

      <div className="h-[calc(100dvh-68px-70px)] overflow-y-auto px-4 my-2 no-scrollbar">
        {selectedAnimal ? (
          /* Visualização de animal selecionado com card fixado no topo (padrão /gerenciar) */
          <div className="space-y-3 animate-in fade-in-50 duration-300">
            {/* Card do animal selecionado */}
            <SelectedEntityCard
              caption="Animal Selecionado"
              title={selectedDisplayName}
              subtitle={isSelectedNeloreMocha ? "* Nelore Mocha" : undefined}
              badge={
                isSelectedNeloreMocha ? (
                  <sup
                    className="text-amber-600 font-extrabold text-sm select-none cursor-help -top-1"
                    title="* Nelore Mocha"
                    aria-label="* Nelore Mocha"
                  >
                    *
                  </sup>
                ) : undefined
              }
              onClear={handleClearSelection}
              clearLabel="Fechar detalhes do animal"
              onEdit={() => setIsEditingAnimal((prev) => !prev)}
              editLabel="Editar informações"
            />

            {/* Componente de detalhes do animal */}
            <DetailsAnimalLayout
              rgn={selectedAnimal.rgn}
              isEditing={isEditingAnimal}
              onToggleEdit={() => setIsEditingAnimal((prev) => !prev)}
              onSaveSuccess={() => setIsEditingAnimal(false)}
            />
          </div>
        ) : (
          /* Seção de busca de animais (quando nenhum animal estiver selecionado) */
          <section aria-label="Busca de animais">
            <label
              id="search-title"
              className="block mb-1.5 text-primary text-sm font-extrabold uppercase"
              htmlFor="animal-search"
            >
              BUSCAR ANIMAL:
            </label>
            <div className="flex items-center h-10 overflow-hidden border border-[#d7e0ee] rounded-[9px] bg-[#eaf0fb]">
              <input
                id="animal-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o RGN, nome ou série..."
                aria-label="Código ou nome do animal"
                className="min-w-0 flex-1 h-full px-3 border-0 outline-none bg-transparent text-foreground text-sm"
              />
              <button
                aria-label="Pesquisar animal"
                type="button"
                className="w-11 h-full grid place-items-center border-0 bg-transparent text-[#91a0b5] cursor-pointer hover:text-field-green transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="h-px my-3 bg-border" />

            {isLoading ? (
              <div className="space-y-3 my-4">
                <h2 className="mb-2 text-primary text-lg font-bold">Carregando...</h2>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonSearchAnimal key={index} />
                ))}
              </div>
            ) : hasSearched ? (
              <div className="my-2">
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <h2 className="mb-2 text-primary text-lg font-bold">
                      {searchResults.length === 1
                        ? "Animal encontrado:"
                        : `Resultados encontrados (${searchResults.length}):`}
                    </h2>
                    <div className="grid gap-3">
                      {searchResults.map((animal) => (
                        <SearchCard
                          key={animal.rgn}
                          animal={animal}
                          onDetailsClick={() => handleSelectAnimal(animal.rgn)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                    <p className="text-sm font-semibold text-destructive">
                      Animal não encontrado... <br />
                      Verifique o RGN ou realize o cadastro.
                    </p>
                    {canAccess("cadastro") && (
                      <Link
                        href="/cadastro"
                        className="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-5 rounded-lg text-xs tracking-wider uppercase shadow-md active:scale-95 transition-all"
                      >
                        <Plus size={16} />
                        Cadastrar Animal
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Estado inicial sem busca: não renderizar a lista completa */
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground animate-in fade-in-50 duration-300">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">
                    Buscar animal por RGN
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Digite o RGN ou nome para consultar a ficha do animal.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
