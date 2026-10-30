"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  X,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Layers,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Animal } from "@/types/animal.type";
import { isSupabaseConfigured } from "@/lib/supabase/api";
import { getSupabase } from "@/lib/supabase/client";
import { useRxDatabase } from "@/providers/RxDBProvider";
import {
  extractDataFromExcel,
  extractActiveProductsFromExcel,
  mergeAnimalData,
} from "@/utils/extractData";
import { useCreateAnimal } from "@/hooks/db/animals/useCreateAnimal";

type ProcessPlanilhaType = "avaliacao" | "ativos";

const SearchCsvFile = () => {
  const {
    actions: { saveAnimal },
  } = useCreateAnimal();
  const db = useRxDatabase();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessType, setCurrentProcessType] =
    useState<ProcessPlanilhaType | null>(null);
  const [processedModelLabel, setProcessedModelLabel] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalCreated, setTotalCreated] = useState(0);
  const [totalUpdated, setTotalUpdated] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"warning" | "error">(
    "warning",
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleProcessFile = async (type: ProcessPlanilhaType) => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setCurrentProcessType(type);

    const modelName =
      type === "ativos"
        ? "Produtos Ativos (ABCZ)"
        : "Avaliação Genética (iABCZ)";
    setProcessedModelLabel(modelName);

    try {
      // 1. Extração conforme o modelo da planilha
      let extractedData: Animal[] = [];

      if (type === "ativos") {
        extractedData = await extractActiveProductsFromExcel(selectedFile);
      } else {
        extractedData = await extractDataFromExcel(selectedFile);
      }

      if (extractedData.length === 0) {
        setIsProcessing(false);
        setCurrentProcessType(null);
        setNotificationType("warning");
        setNotificationTitle("Nenhum dado encontrado");
        setNotificationMessage(
          `Não foi possível extrair nenhum registro de animal com identificação válida deste arquivo para o modelo '${modelName}'. Verifique o arquivo selecionado.`,
        );
        setShowNotificationModal(true);
        return;
      }

      let createdCount = 0;
      let updatedCount = 0;

      // 2. Persistência com merge inteligente: mantém antigos e atualiza/insere novos
      for (const animal of extractedData) {
        try {
          if (!db) {
            await saveAnimal(animal);
            createdCount++;
            continue;
          }

          // A. Procura se já existe no banco de dados local (RxDB)
          const localDoc = await db.animals
            .findOne({ selector: { rgn: animal.rgn } })
            .exec();

          if (localDoc) {
            // Animal existe: mescla mantendo dados anteriores e atualizando campos novos
            const existingData = (localDoc.toJSON() as unknown) as Animal;
            const merged = mergeAnimalData(existingData, animal);
            await localDoc.patch(merged);
            updatedCount++;
          } else {
            // B. Se não está local, verifica no banco remoto (Supabase)
            let foundInGlobal = false;
            if (isSupabaseConfigured()) {
              try {
                const supabase = getSupabase();
                const { data: supaAnimal, error } = await supabase
                  .from("animals")
                  .select("*")
                  .eq("rgn", animal.rgn)
                  .maybeSingle();

                if (!error && supaAnimal) {
                  // Existe no Supabase: mescla e insere localmente
                  const merged = mergeAnimalData(
                    supaAnimal as unknown as Animal,
                    animal,
                  );
                  await db.animals.insert(merged);
                  foundInGlobal = true;
                  updatedCount++;
                }
              } catch (checkError) {
                console.warn(
                  `⚠️ Aviso ao consultar Supabase para RGN ${animal.rgn}:`,
                  checkError,
                );
              }
            }

            // C. Animal novo de fato: insere novo registro
            if (!foundInGlobal) {
              const newAnimal: Animal = {
                breed: "Nelore",
                status: "-",
                ...animal,
                animal_state: animal.animal_state || "ATIVO",
                created_at: Date.now(),
                updated_at: Date.now(),
                _deleted: false,
              };

              await db.animals.insert(newAnimal);
              createdCount++;
            }
          }
        } catch (itemError) {
          console.error(`Erro ao processar animal RGN ${animal.rgn}:`, itemError);
        }
      }

      setTotalProcessed(extractedData.length);
      setTotalCreated(createdCount);
      setTotalUpdated(updatedCount);
      setIsProcessing(false);
      setCurrentProcessType(null);
      setShowSuccessModal(true);
    } catch (error) {
      setIsProcessing(false);
      setCurrentProcessType(null);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao processar o arquivo";

      setNotificationType("error");
      setNotificationTitle("Erro ao processar arquivo");
      setNotificationMessage(
        `${errorMessage}\n\nPor favor, certifique-se de que selecionou o modelo correto para este arquivo e tente novamente.`,
      );
      setShowNotificationModal(true);
    }
  };

  return (
    <section className="p-4">
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-base text-primary uppercase font-bold">
              Importar arquivo:
            </label>

            <div className="rounded-lg bg-muted px-4 py-3 mt-2">
              <p className="text-sm italic text-muted-foreground truncate">
                {selectedFile
                  ? selectedFile.name
                  : "Nenhum arquivo selecionado"}
              </p>
            </div>

            <Button
              onClick={handleChooseFile}
              className="w-full rounded-lg uppercase bg-primary py-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Escolher arquivo
            </Button>

            <Input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Selecionar arquivo Excel"
            />
          </div>

          <div className="border-t border-border" />

          {/* Opções de processamento por modelo de planilha */}
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Escolha como processar a planilha:
            </p>

            {/* Botão 1: Avaliação Genética */}
            <Button
              onClick={() => handleProcessFile("avaliacao")}
              disabled={!selectedFile || isProcessing}
              className="w-full rounded-lg bg-primary py-6 text-xs sm:text-sm uppercase font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing && currentProcessType === "avaliacao" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando Avaliação...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Processar Avaliação Genética (iABCZ)
                </>
              )}
            </Button>

            {/* Botão 2: Produtos Ativos */}
            <Button
              onClick={() => handleProcessFile("ativos")}
              disabled={!selectedFile || isProcessing}
              variant="outline"
              className="w-full rounded-lg border-2 border-primary py-6 text-xs sm:text-sm uppercase font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing && currentProcessType === "ativos" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando Produtos Ativos...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Processar Produtos Ativos (ABCZ)
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <Button
              size="icon"
              variant={"ghost"}
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Fechar"
              onClick={() => setShowSuccessModal(false)}
            >
              <X />
            </Button>

            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <h2 className="text-xl font-semibold text-primary">
                Processamento Concluído
              </h2>
              {processedModelLabel && (
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {processedModelLabel}
                </span>
              )}
              <p className="text-muted-foreground">
                O arquivo{" "}
                <span className="font-medium text-foreground">
                  {selectedFile?.name}
                </span>{" "}
                foi processado com sucesso!
              </p>

              {/* Estatísticas */}
              {totalProcessed > 0 && (
                <div className="w-full bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    📊 Estatísticas da Importação:
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total no arquivo:
                      </span>
                      <span className="font-medium text-foreground">
                        {totalProcessed} animais
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Novos cadastrados:
                      </span>
                      <span className="font-medium text-green-600">
                        {totalCreated} animais
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Existentes atualizados:
                      </span>
                      <span className="font-medium text-blue-600">
                        {totalUpdated} animais
                      </span>
                    </div>
                  </div>
                  {totalUpdated > 0 && (
                    <p className="text-xs text-muted-foreground text-left pt-2 border-t border-border">
                      ℹ️ Os dados pré-existentes dos animais foram mantidos e atualizados com as novas informações da planilha.
                    </p>
                  )}
                </div>
              )}

              <Link
                href="/home"
                className="mt-4 w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 text-center"
              >
                Ir para a página inicial
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificação (Warning/Error) */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <Button
              size="icon"
              variant={"ghost"}
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Fechar"
              onClick={() => setShowNotificationModal(false)}
            >
              <X />
            </Button>

            <div className="flex flex-col items-center space-y-4 text-center">
              {notificationType === "warning" ? (
                <AlertTriangle className="h-12 w-12 text-yellow-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}

              <h2
                className={`text-xl font-semibold ${
                  notificationType === "warning"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {notificationTitle}
              </h2>

              <div className="w-full bg-muted rounded-lg p-4">
                <p className="text-sm text-foreground whitespace-pre-line">
                  {notificationMessage}
                </p>
              </div>

              <Button
                onClick={() => setShowNotificationModal(false)}
                className="mt-4 w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SearchCsvFile;
