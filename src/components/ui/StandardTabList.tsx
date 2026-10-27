"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface StandardTabListProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange?: (value: string) => void;
  className?: string;
  variant?: "premium" | "simple";
}

export function StandardTabList({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = "premium",
}: StandardTabListProps) {
  if (variant === "simple") {
    return (
      <TabsList
        className={cn(
          "h-12 rounded-md bg-primary/20 w-full overflow-hidden",
          className,
        )}
      >
        <div className="flex w-full h-full min-w-max px-1 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              onClick={() => onTabChange?.(tab.value)}
              className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm font-semibold border border-primary/40 bg-white flex items-center justify-center gap-1.5 p-1 transition-all duration-200"
            >
              {tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
              <span className="truncate text-xs">{tab.label}</span>
            </TabsTrigger>
          ))}
        </div>
      </TabsList>
    );
  }

  return (
    <TabsList
      className={cn(
        "flex h-11 w-full gap-1 overflow-x-auto rounded-xl bg-linear-to-r from-muted/50 to-muted/30 px-1 shadow-sm no-scrollbar",
        className,
      )}
    >
      {tabs.map(({ value, label, icon: Icon }) => {
        const isActive = activeTab === value;

        return (
            <TabsTrigger
              key={value}
              value={value}
              onClick={() => onTabChange?.(value)}
              className={cn(
              // base: aba compacta (só o ícone)
              "h-9 w-10 flex-none shrink-0 justify-center gap-2 rounded-md border-none px-2 shadow-none",
              "text-muted-foreground transition-colors duration-200",
              // ativa: ocupa o espaço restante, com largura mínima para ícone + rótulo
              "data-[state=active]:w-auto data-[state=active]:min-w-[96px] data-[state=active]:flex-1",
              "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md",
              "dark:data-[state=active]:bg-primary dark:data-[state=active]:text-white",
            )}
          >
            {Icon && <Icon className="size-5 shrink-0" />}
            {isActive && (
              <span className="animate-in fade-in-0 whitespace-nowrap text-[11px] font-semibold uppercase duration-200">
                {label}
              </span>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
