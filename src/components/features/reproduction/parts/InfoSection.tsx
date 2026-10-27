import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface InfoSectionProps {
  value: string;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

/** Seção recolhível (ícone + título) usada dentro de um <Accordion>. */
export const InfoSection = ({
  value,
  icon: Icon,
  title,
  children,
}: InfoSectionProps) => (
  <AccordionItem value={value} className="border-b-0">
    <AccordionTrigger className="w-full justify-between py-1 hover:no-underline [&>svg]:ml-auto [&>svg]:shrink-0">
      <span className="flex items-center gap-1.5 text-primary">
        <Icon size={14} className="stroke-3" />
        <span className="text-[11px] font-black uppercase tracking-wider">
          {title}
        </span>
      </span>
    </AccordionTrigger>
    <AccordionContent>
      <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
        {children}
      </div>
    </AccordionContent>
  </AccordionItem>
);
