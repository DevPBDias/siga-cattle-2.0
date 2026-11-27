"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ManageOptionItem {
  id: string;
  label: string;
}

interface ManageOptionsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  inputPlaceholder: string;
  emptyMessage: string;
  duplicateMessage?: string;
  items: ManageOptionItem[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Modal reutilizável para listar, cadastrar e excluir opções de tabelas auxiliares.
 */
export function ManageOptionsModal({
  open,
  onClose,
  title,
  description,
  inputPlaceholder,
  emptyMessage,
  duplicateMessage = "Esta opção já está cadastrada.",
  items,
  onAdd,
  onDelete,
}: ManageOptionsModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
      setIsSubmitting(false);
      setDeletingId(null);
    }
  }, [open]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
    );
  }, [items]);

  if (!open) return null;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Informe um nome válido.");
      return;
    }

    const exists = items.some(
      (item) =>
        item.label.trim().toLocaleLowerCase("pt-BR") ===
        trimmed.toLocaleLowerCase("pt-BR"),
    );
    if (exists) {
      setError(duplicateMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd(trimmed);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar opção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      setDeletingId(id);
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir opção.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4 max-h-[85vh]">
          <header className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-primary">{title}</h2>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-1 text-gray-400 hover:text-foreground rounded-md cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              type="text"
              value={name}
              placeholder={inputPlaceholder}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="shrink-0 gap-1"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </form>

          {error && <span className="text-xs text-red-500">{error}</span>}

          <div className="border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="overflow-y-auto max-h-64 divide-y divide-border">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/60 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase text-gray-500">
                      Nome
                    </th>
                    <th className="px-3 py-2 text-[11px] font-bold uppercase text-gray-500 text-right w-16">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-6 text-xs text-muted-foreground text-center"
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((item) => {
                      const isDeleting = deletingId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 text-sm text-foreground font-medium">
                            {item.label}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting || deletingId !== null}
                              title={`Excluir ${item.label}`}
                              aria-label={`Excluir ${item.label}`}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40 cursor-pointer transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
