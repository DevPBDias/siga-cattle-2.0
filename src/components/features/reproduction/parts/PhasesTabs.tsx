import { ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { InfoRow, InfoRowProps } from "./InfoRow";
import { formatDateOrDash, ProtocolConfig } from "../reproduction.config";

interface Phase {
  value: string;
  label: string;
  rows: InfoRowProps[];
}

const buildPhases = (
  event: ReproductionEvent,
  protocol: ProtocolConfig,
): Phase[] => [
  {
    value: "iatf",
    label: protocol.tabLabel,
    rows: [
      { label: "Data D0", value: formatDateOrDash(event.d0_date) },
      { label: protocol.iatf.d8, value: formatDateOrDash(event.d8_date) },
      { label: protocol.iatf.d10, value: formatDateOrDash(event.d10_date) },
      { label: "Touro / Sêmen", value: event.bull_name, highlight: true },
    ],
  },
  {
    value: "resync",
    label: "Resync",
    rows: [
      { label: protocol.resync.d0, value: formatDateOrDash(event.d22_date) },
      { label: protocol.resync.d8, value: formatDateOrDash(event.d30_date) },
      { label: protocol.resync.d10, value: formatDateOrDash(event.d32_date) },
      { label: "Touro / Sêmen", value: event.resync_bull, highlight: true },
    ],
  },
  {
    value: "monta",
    label: "Monta",
    rows: [
      {
        label: protocol.monta.entry,
        value: formatDateOrDash(event.natural_mating_d35_entry),
      },
      {
        label: protocol.monta.exit,
        value: formatDateOrDash(event.natural_mating_d80_exit),
      },
      { label: "Touro", value: event.natural_mating_bull, highlight: true },
    ],
  },
];

interface PhasesTabsProps {
  event: ReproductionEvent;
  protocol: ProtocolConfig;
}

export const PhasesTabs = ({ event, protocol }: PhasesTabsProps) => {
  const phases = buildPhases(event, protocol);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-primary">
        <ClipboardList size={14} className="stroke-3" />
        <h4 className="text-[11px] font-black uppercase tracking-wider">
          Etapas da Reprodução
        </h4>
      </div>

      <Tabs defaultValue="iatf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-9 mb-2">
          {phases.map((phase) => (
            <TabsTrigger
              key={phase.value}
              value={phase.value}
              className="text-[10px] font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              {phase.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((phase) => (
          <TabsContent key={phase.value} value={phase.value} className="mt-0">
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
              {phase.rows.map((row) => (
                <InfoRow key={row.label} {...row} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
