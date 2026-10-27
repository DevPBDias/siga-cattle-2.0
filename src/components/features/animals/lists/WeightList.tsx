"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { AnimalMetric } from "@/types/animal_metrics.type";
import { formatDate } from "@/utils/dates";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { SuccessModal } from "@/components/modals/SuccessModal";

interface GainDaily {
  dailyGain: number;
  days: number;
  endDate: string;
  initialDate: string;
  totalGain: number;
}

interface WeightListProps {
  pesosMedidos: AnimalMetric[];
  editPeso: (id: string, valor: number) => void;
  deletePeso: (id: string) => void;
  gainDaily: GainDaily[];
}

export function WeightList({
  pesosMedidos,
  editPeso,
  deletePeso,
  gainDaily,
}: WeightListProps) {
  const [open, setOpen] = useState(false);
  const [valorEdit, setValorEdit] = useState("");
  const [selectedPeso, setSelectedPeso] = useState<AnimalMetric | null>(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "" });
  const [successModal, setSuccessModal] = useState({ open: false, title: "" });

  const handleOpen = (id: string, valor: number) => {
    setSelectedPeso(pesosMedidos.find((p) => p.id === id) || null);
    setValorEdit(String(valor));
    setOpen(true);
  };

  const handleSave = () => {
    if (selectedPeso !== null) {
      editPeso(selectedPeso.id, Number(valorEdit));
      setOpen(false);
      setSelectedPeso(null);
    }
  };

  function diferencaEmDias(data1: string, data2: string): number {
    // Handle both DD/MM/YYYY and ISO date formats
    let d1: Date, d2: Date;

    if (data1.includes("/")) {
      const [dia1, mes1, ano1] = data1.split("/").map(Number);
      d1 = new Date(ano1, mes1 - 1, dia1);
    } else {
      d1 = new Date(data1);
    }

    if (data2.includes("/")) {
      const [dia2, mes2, ano2] = data2.split("/").map(Number);
      d2 = new Date(ano2, mes2 - 1, dia2);
    } else {
      d2 = new Date(data2);
    }

    const diffEmMs = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffEmMs / (1000 * 60 * 60 * 24));
  }

  const valueInteval = (i: number): string => {
    if (i === 0) return "0";
    const days = diferencaEmDias(
      pesosMedidos[i].date,
      pesosMedidos[i - 1].date,
    );
    return String(days);
  };

  const valueGmd = (i: number): string => {
    if (i === 0) return "0";
    const current = pesosMedidos[i];
    const previous = pesosMedidos[i - 1];

    const diffDays = diferencaEmDias(current.date, previous.date);
    if (diffDays === 0) return "0";

    const diffWeight = current.value - previous.value;
    const gmd = diffWeight / diffDays;

    return gmd.toFixed(2);
  };

  return (
    <div className="space-y-4 mt-6">
      {pesosMedidos?.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 border rounded-xl p-3 bg-white shadow-sm"
        >
          <div className="relative w-full flex flex-col items-start gap-3 border border-gray-400 px-1 py-2.5 rounded-lg">
            <div className="flex flex-col items-start gap-[2px] pl-3">
              <span className="absolute bg-white -top-2 left-2 px-2 text-xs font-semibold text-gray-400">
                {p.born_metric
                  ? "Peso Nascimento"
                  : `${pesosMedidos.slice(0, i + 1).filter((w) => !w.born_metric).length}ª Pesagem`}
              </span>
              <span className="text-xs font-semibold text-primary mt-1">
                {formatDate(p.date)}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary flex flex-row items-center pl-3 gap-1">
              {p.value}
              <span className="text-xs font-medium text-gray-400 lowercase">
                kg
              </span>
            </div>
          </div>

          <div className="flex flex-row-reverse gap-2">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpen(p.id, p.value)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteModal({ open: true, id: p.id })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="relative flex flex-col items-center justify-center w-20 border border-gray-400 px-1 py-2 rounded-lg">
                <h4 className="absolute bg-white -top-2 left-2 px-1 text-xs font-semibold text-gray-400">
                  Intervalo
                </h4>
                <div className="flex flex-row gap-1 items-center justify-center">
                  <span className="uppercase text-sm font-bold text-primary">
                    {valueInteval(i)}
                  </span>
                  <span className="text-xs text-gray-400">dias</span>
                </div>
              </div>
              <div className="mt-1 relative flex flex-col items-center justify-center w-20 border border-gray-400 px-1 py-2 rounded-lg">
                <h4 className="absolute bg-white -top-2 left-2 px-1 text-xs font-semibold text-gray-400">
                  GMD
                </h4>
                <div className="flex flex-row gap-1 items-center justify-center">
                  <span
                    className={`uppercase text-sm font-bold flex items-center gap-1 ${
                      Number(valueGmd(i)) > 0
                        ? "text-green-600"
                        : Number(valueGmd(i)) < 0
                          ? "text-red-600"
                          : "text-primary"
                    }`}
                  >
                    {Number(valueGmd(i)) > 0 && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {Number(valueGmd(i)) < 0 && (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {valueGmd(i)}
                  </span>
                  <span className="text-xs text-gray-400">kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Peso</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              value={valorEdit}
              onChange={(e) => setValorEdit(e.target.value)}
              placeholder="Novo valor do peso"
            />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmModal
        open={deleteModal.open}
        title="Excluir Pesagem"
        description="Esta ação não pode ser desfeita. Tem certeza que deseja remover este registro de peso?"
        onClose={() => setDeleteModal({ open: false, id: "" })}
        onConfirm={async () => {
          await deletePeso(deleteModal.id);
          setDeleteModal({ open: false, id: "" });
          setSuccessModal({ open: true, title: "Excluído com sucesso!" });
        }}
      />

      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ ...successModal, open: false })}
        title={successModal.title}
      />
    </div>
  );
}
