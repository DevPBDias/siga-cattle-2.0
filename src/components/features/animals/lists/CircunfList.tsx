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

interface CircunfListProps {
  CEMedidos: AnimalMetric[];
  editCE: (id: string, valor: number) => void;
  deleteCE: (id: string) => void;
}

export function CircunfList({ CEMedidos, editCE, deleteCE }: CircunfListProps) {
  const [open, setOpen] = useState(false);
  const [valorEdit, setValorEdit] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "" });
  const [successModal, setSuccessModal] = useState({ open: false, title: "" });

  const handleOpen = (id: string, valor: number) => {
    setEditId(id);
    setValorEdit(String(valor));
    setOpen(true);
  };

  const handleSave = () => {
    if (editId !== null) {
      editCE(editId, Number(valorEdit));
      setOpen(false);
      setEditId(null);
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
    const days = diferencaEmDias(CEMedidos[i].date, CEMedidos[i - 1].date);
    return String(days);
  };

  const valueGrowth = (i: number): string => {
    if (i === 0) return "0";
    const current = CEMedidos[i];
    const previous = CEMedidos[i - 1];

    const diffDays = diferencaEmDias(current.date, previous.date);
    if (diffDays === 0) return "0";

    const diffValue = current.value - previous.value;
    const growth = diffValue / diffDays;

    return growth.toFixed(2);
  };

  return (
    <div className="space-y-4 mt-6">
      {CEMedidos?.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 border rounded-xl p-3 bg-white shadow-sm"
        >
          <div className="relative w-full flex flex-col items-start gap-3 border border-gray-400 px-1 py-2.5 rounded-lg">
            <div className="flex flex-col items-start gap-[2px] pl-3">
              <span className="absolute bg-white -top-2 left-2 px-2 text-xs font-semibold text-gray-400">
                {p.born_metric
                  ? "Medição Inicial"
                  : `${CEMedidos.slice(0, i + 1).filter((w) => !w.born_metric).length}ª Medição`}
              </span>
              <span className="text-xs font-semibold text-primary mt-1">
                {formatDate(p.date)}
              </span>
            </div>
            <div className="text-2xl font-bold text-primary flex flex-row items-center pl-3 gap-1">
              {p.value}
              <span className="text-xs font-medium text-gray-400 lowercase">
                cm
              </span>
            </div>
          </div>

          <div className="flex flex-row-reverse gap-2">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteModal({ open: true, id: p.id })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpen(p.id, p.value)}
              >
                <Pencil className="w-4 h-4" />
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
              <div className="relative flex flex-col items-center justify-center w-20 border border-gray-400 px-1 py-2 rounded-lg">
                <h4 className="absolute bg-white -top-2 left-2 px-1 text-xs font-semibold text-gray-400">
                  Cresc.
                </h4>
                <div className="flex flex-row gap-1 items-center justify-center">
                  <span
                    className={`uppercase text-sm font-bold flex items-center gap-1 ${
                      Number(valueGrowth(i)) > 0
                        ? "text-green-600"
                        : Number(valueGrowth(i)) < 0
                          ? "text-red-600"
                          : "text-primary"
                    }`}
                  >
                    {Number(valueGrowth(i)) > 0 && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {Number(valueGrowth(i)) < 0 && (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {valueGrowth(i)}
                  </span>
                  <span className="text-xs text-gray-400">cm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="w-full text-left font-bold text-primary">
              Editar CE
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="number"
              value={valorEdit}
              onChange={(e) => setValorEdit(e.target.value)}
              step="0.1"
              placeholder="Novo valor (cm)"
            />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-primary" onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmModal
        open={deleteModal.open}
        title="Excluir Medição"
        description="Esta ação não pode ser desfeita. Tem certeza que deseja remover este registro de perímetro escrotal?"
        onClose={() => setDeleteModal({ open: false, id: "" })}
        onConfirm={async () => {
          await deleteCE(deleteModal.id);
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
