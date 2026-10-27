"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { FormRow, FormSection } from "@/components/ui/FormRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RgnAutocomplete, RgnOption } from "@/components/features/animals/RgnAutocomplete";
import { useAgendaReminderForm } from "@/hooks/forms/useAgendaReminderForm";
import { AgendaReminderType } from "@/types/agenda_reminder.type";

interface AgendaReminderFormProps {
  defaultDate?: string | null;
  rgnOptions: RgnOption[];
  onCancel: () => void;
  onSaved: () => void;
}

export function AgendaReminderForm({
  defaultDate,
  rgnOptions,
  onCancel,
  onSaved,
}: AgendaReminderFormProps) {
  const { data, loading, actions } = useAgendaReminderForm(defaultDate);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const saved = await actions.submit();
    if (saved) onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSection title="Novo lembrete">
        <FormRow label="Tipo" required>
          <Select
            value={data.type}
            onValueChange={(value) => actions.setType(value as AgendaReminderType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacinacao">Vacinação</SelectItem>
              <SelectItem value="inseminacao">Inseminação</SelectItem>
              <SelectItem value="nascimento">Nascimento</SelectItem>
              <SelectItem value="manejo">Manejo</SelectItem>
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Data" required>
          <DatePicker value={data.date} onChange={actions.setDate} />
        </FormRow>
        <FormRow label="RGN" hint="Opcional">
          <RgnAutocomplete
            options={rgnOptions}
            value={data.rgn}
            onSelect={actions.setRgn}
            placeholder="Animal (opcional)"
          />
        </FormRow>
        <FormRow label="Nota" hint="Opcional">
          <Input
            value={data.notes}
            onChange={(event) => actions.setNotes(event.target.value)}
            placeholder="Ex: lote pasto 3"
          />
        </FormRow>
      </FormSection>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Confirmar"}
        </Button>
      </div>
    </form>
  );
}
