import { ClipboardList } from "lucide-react";
import { formatDateOrDash } from "../reproduction.config";

const DateCard = ({ label, date }: { label: string; date?: string | null }) => (
  <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
    <span className="text-[10px] uppercase text-muted-foreground block">
      {label}
    </span>
    <span className="text-sm font-bold text-primary">
      {formatDateOrDash(date)}
    </span>
  </div>
);

interface CalvingForecastProps {
  startDate?: string | null;
  endDate?: string | null;
}

export const CalvingForecast = ({ startDate, endDate }: CalvingForecastProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 text-primary">
      <ClipboardList size={14} className="stroke-3" />
      <h4 className="text-[11px] font-black uppercase tracking-wider">
        Previsão Parto
      </h4>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <DateCard label="Início (270d)" date={startDate} />
      <DateCard label="Final (305d)" date={endDate} />
    </div>
  </div>
);
