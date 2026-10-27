import { Baby, Bell, Heart, Syringe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AgendaItemType } from "@/types/agenda.type";
import type { AgendaReminderType } from "@/types/agenda_reminder.type";

export const AGENDA_TYPE_META: Record<
  AgendaItemType,
  { label: string; dotClass: string; textClass: string; icon: LucideIcon }
> = {
  vacina: {
    label: "Vacinas",
    dotClass: "bg-field-green",
    textClass: "text-field-green",
    icon: Syringe,
  },
  reproducao: {
    label: "Reprodução",
    dotClass: "bg-amber",
    textClass: "text-amber",
    icon: Heart,
  },
  nascimento: {
    label: "Nascimento",
    dotClass: "bg-primary",
    textClass: "text-primary",
    icon: Baby,
  },
  lembrete: {
    label: "Lembrete",
    dotClass: "bg-indi-ouro",
    textClass: "text-amber",
    icon: Bell,
  },
};

export const REMINDER_TYPE_LABEL: Record<AgendaReminderType, string> = {
  vacinacao: "Vacinação programada",
  inseminacao: "Inseminação programada",
  nascimento: "Nascimento programado",
  manejo: "Manejo programado",
};
