"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { FormRow } from "@/components/ui/FormRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/hooks/db/clients/useClients";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useCreateAnimal } from "@/hooks/db/animals/useCreateAnimal";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { ANIMAL_BREEDS, ANIMAL_COLORS } from "@/constants/animalVariations";
import { STATUS_ABCZ_OPTIONS } from "@/types/status.type";
import type { AnimalBreed, AnimalColor } from "@/types/animal.type";
import { todayISO, isFutureDate } from "@/utils/dates";
import { toast } from "sonner";

interface PurchaseFormProps {
  onSuccess?: () => void;
}

const CLASSIFICATION_OPTIONS = ["A", "B", "C", "D"] as const;

export function PurchaseForm({ onSuccess }: PurchaseFormProps) {
  const { data: clients = [] } = useClients();
  const { data: farms = [] } = useFarms();
  const {
    actions: { createAnimal },
  } = useCreateAnimal();
  const {
    actions: { createMovement },
  } = useMovements();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dados da Compra
  const [date, setDate] = useState(todayISO());
  const [clientId, setClientId] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [gtaNumber, setGtaNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [adt, setAdt] = useState("");

  // Dados do Animal (entra no rebanho)
  const [serieRgd, setSerieRgd] = useState("INDI");
  const [rgn, setRgn] = useState("");
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"" | "M" | "F">("");
  const [bornDate, setBornDate] = useState("");
  const [breed, setBreed] = useState<AnimalBreed>("Nelore");
  const [bornColor, setBornColor] = useState<AnimalColor>("Branca");
  const [farmId, setFarmId] = useState("");
  const [classification, setClassification] = useState("");
  const [status, setStatus] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherSerieRgd, setMotherSerieRgd] = useState("INDI");
  const [motherRgn, setMotherRgn] = useState("");
  const [maternalGrandfatherName, setMaternalGrandfatherName] = useState("");
  const [paternalGrandfatherName, setPaternalGrandfatherName] = useState("");
  const [partnership, setPartnership] = useState("");

  const isFormValid =
    !!date && !!serieRgd.trim() && !!rgn.trim() && !!clientId && !!sex;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      setErrorMessage(
        "Preencha os campos obrigatórios: Data, RGD, RGN, Cliente e Sexo.",
      );
      return;
    }

    if (bornDate && isFutureDate(bornDate)) {
      setErrorMessage("A data de nascimento não pode ser no futuro.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdAnimal = await createAnimal({
        serie_rgd: serieRgd.trim().toUpperCase(),
        rgn: rgn.trim().toUpperCase(),
        name: name.trim() || undefined,
        sex,
        born_date: bornDate || undefined,
        breed,
        born_color: bornColor,
        farm_id: farmId || undefined,
        classification: classification || undefined,
        status: status || undefined,
        father_name: fatherName.trim() || undefined,
        mother_serie_rgd: motherRgn.trim()
          ? motherSerieRgd.trim().toUpperCase() || "INDI"
          : undefined,
        mother_rgn: motherRgn.trim().toUpperCase() || undefined,
        maternal_grandfather_name: maternalGrandfatherName.trim() || undefined,
        paternal_grandfather_name: paternalGrandfatherName.trim() || undefined,
        partnership: partnership.trim() || undefined,
      });

      await createMovement({
        type: "compra",
        animal_id: createdAnimal.rgn,
        animal_key: createdAnimal.animal_key,
        date,
        event_date: date,
        details: {
          client_id: clientId,
          total_value: Number(totalValue) || 0,
          gta_number: gtaNumber.trim() || undefined,
          invoice_number: invoiceNumber.trim() || undefined,
          adt: adt.trim() || undefined,
        },
      });

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 800);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Erro ao registrar compra e cadastrar animal.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-primary uppercase">
          Compra Registrada!
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          O animal foi adicionado ao rebanho com sucesso.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-primary uppercase">Nova Compra</h2>
        <p className="text-muted-foreground text-sm">
          Registre a compra e cadastre o animal no rebanho.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-primary border-b border-border pb-1">
          Dados da Compra
        </h3>

        <FormRow label="Data" required>
          <DatePicker value={date} onChange={setDate} required />
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="RGD (Série)" htmlFor="purchase-rgd" required>
            <Input
              id="purchase-rgd"
              value={serieRgd}
              onChange={(e) => setSerieRgd(e.target.value.toUpperCase())}
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Ex: INDI"
              required
            />
          </FormRow>

          <FormRow label="RGN" htmlFor="purchase-rgn" required>
            <Input
              id="purchase-rgn"
              value={rgn}
              onChange={(e) => setRgn(e.target.value.toUpperCase())}
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Ex: 1234"
              required
            />
          </FormRow>
        </div>

        <FormRow label="Cliente" required>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger
              className={`bg-muted border-0 rounded-sm mt-1 w-full text-left ${
                !clientId ? "ring-1 ring-orange-400" : ""
              }`}
            >
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!clientId && (
            <p className="text-[10px] text-orange-500 font-semibold mt-1 px-1">
              Obrigatório selecionar um cliente.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-1 px-1">
            Não encontrou o cliente?{" "}
            <Link
              href="/gerenciar/clientes/novo"
              className="font-semibold text-primary underline hover:text-primary/80"
            >
              Cadastrar novo cliente
            </Link>
          </p>
        </FormRow>

        <FormRow label="Valor Total (R$)" htmlFor="purchase-total-value">
          <Input
            id="purchase-total-value"
            type="number"
            step="0.01"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            className="bg-muted border-0 rounded-sm mt-1"
            placeholder="0,00"
          />
        </FormRow>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormRow label="GTA" htmlFor="purchase-gta">
            <Input
              id="purchase-gta"
              value={gtaNumber}
              onChange={(e) => setGtaNumber(e.target.value)}
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Nº GTA"
            />
          </FormRow>

          <FormRow label="Nota Fiscal" htmlFor="purchase-invoice">
            <Input
              id="purchase-invoice"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Nº NF"
            />
          </FormRow>

          <FormRow label="ADT" htmlFor="purchase-adt">
            <Input
              id="purchase-adt"
              value={adt}
              onChange={(e) => setAdt(e.target.value)}
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Nº ADT"
            />
          </FormRow>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-primary border-b border-border pb-1">
          Cadastro do Animal
        </h3>

        <FormRow label="Nome do Animal" htmlFor="purchase-animal-name">
          <Input
            id="purchase-animal-name"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
            placeholder="Opcional"
          />
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Sexo" required>
            <Select
              value={sex}
              onValueChange={(v) => setSex(v as "M" | "F")}
            >
              <SelectTrigger className="bg-muted border-0 rounded-sm mt-1 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="F">Fêmea</SelectItem>
                <SelectItem value="M">Macho</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow label="Data de Nascimento">
            <DatePicker value={bornDate} onChange={setBornDate} />
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Raça">
            <Select
              value={breed}
              onValueChange={(v) => setBreed(v as AnimalBreed)}
            >
              <SelectTrigger className="bg-muted border-0 rounded-sm mt-1 w-full">
                <SelectValue placeholder="Selecione a raça" />
              </SelectTrigger>
              <SelectContent>
                {ANIMAL_BREEDS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow label="Cor">
            <Select
              value={bornColor}
              onValueChange={(v) => setBornColor(v as AnimalColor)}
            >
              <SelectTrigger className="bg-muted border-0 rounded-sm mt-1 w-full">
                <SelectValue placeholder="Selecione a cor" />
              </SelectTrigger>
              <SelectContent>
                {ANIMAL_COLORS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </div>

        <FormRow label="Fazenda/Pasto">
          <Select
            value={farmId || "__none__"}
            onValueChange={(v) => setFarmId(v === "__none__" ? "" : v)}
          >
            <SelectTrigger className="bg-muted border-0 rounded-sm mt-1 w-full">
              <SelectValue placeholder="Selecione a fazenda/pasto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Nenhuma</SelectItem>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.farm_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Classe Visual">
            <Select
              value={classification || "__none__"}
              onValueChange={(v) =>
                setClassification(v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger className="bg-muted border-0 rounded-sm mt-1 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Não informada</SelectItem>
                {CLASSIFICATION_OPTIONS.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>

          <FormRow label="Status ABCZ">
            <Select
              value={status || "__none__"}
              onValueChange={(v) => setStatus(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="bg-muted border-0 rounded-sm mt-1 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {STATUS_ABCZ_OPTIONS.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </div>

        <FormRow label="Pai" htmlFor="purchase-father">
          <Input
            id="purchase-father"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value.toUpperCase())}
            className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
            placeholder="Nome do pai (opcional)"
          />
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Série da Mãe" htmlFor="purchase-mother-serie">
            <Input
              id="purchase-mother-serie"
              value={motherSerieRgd}
              onChange={(e) =>
                setMotherSerieRgd(e.target.value.toUpperCase())
              }
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Ex: INDI"
            />
          </FormRow>

          <FormRow label="RGN da Mãe" htmlFor="purchase-mother-rgn">
            <Input
              id="purchase-mother-rgn"
              value={motherRgn}
              onChange={(e) => setMotherRgn(e.target.value.toUpperCase())}
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="RGN da mãe (opcional)"
            />
          </FormRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Avô Materno" htmlFor="purchase-maternal-gf">
            <Input
              id="purchase-maternal-gf"
              value={maternalGrandfatherName}
              onChange={(e) =>
                setMaternalGrandfatherName(e.target.value.toUpperCase())
              }
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Opcional"
            />
          </FormRow>

          <FormRow label="Avô Paterno" htmlFor="purchase-paternal-gf">
            <Input
              id="purchase-paternal-gf"
              value={paternalGrandfatherName}
              onChange={(e) =>
                setPaternalGrandfatherName(e.target.value.toUpperCase())
              }
              className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
              placeholder="Opcional"
            />
          </FormRow>
        </div>

        <FormRow label="Sociedade" htmlFor="purchase-partnership">
          <Input
            id="purchase-partnership"
            value={partnership}
            onChange={(e) => setPartnership(e.target.value.toUpperCase())}
            className="bg-muted border-0 rounded-sm mt-1 placeholder:text-xs"
            placeholder="Opcional"
          />
        </FormRow>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !isFormValid}
        className="h-12 w-full text-base uppercase font-bold rounded-md mt-4 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 flex gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            Finalizar Compra
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
}
