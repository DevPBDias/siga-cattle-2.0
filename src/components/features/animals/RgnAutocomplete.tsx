"use client";

import { Input } from "@/components/ui/input";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary";

export interface RgnOption {
  label: string;
  value: string;
}

interface RgnAutocompleteProps {
  options: RgnOption[];
  value: string;
  onSelect: (rgn: string) => void;
  placeholder?: string;
  requireSearchTerm?: boolean;
  emptyMessage?: string;
}

export function RgnAutocomplete(props: RgnAutocompleteProps) {
  return (
    <FeatureErrorBoundary featureName="Busca de RGN">
      <RgnAutocompleteContent {...props} />
    </FeatureErrorBoundary>
  );
}

function RgnAutocompleteContent({
  options,
  value,
  onSelect,
  placeholder = "Digite o RGN do animal...",
  requireSearchTerm = false,
  emptyMessage = "Nenhum animal encontrado.",
}: RgnAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setSearchTerm(value);
    }
  }, [value, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm?.trim()) {
      return requireSearchTerm ? [] : options;
    }
    const q = searchTerm.toLowerCase().trim();
    return options.filter(
      (o) =>
        o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
    );
  }, [options, searchTerm, requireSearchTerm]);

  return (
    <div ref={containerRef} className="w-full relative">
      <Input
        type="text"
        name="rgn"
        id="rgn"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setOpen(true);
        }}
        required
        className="w-full bg-muted border-0 rounded-md px-4 py-3 text-foreground text-sm"
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md border shadow-lg z-50 max-h-60 overflow-y-auto">
          {filtered.map((option) => (
            <div
              key={option.value}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-muted",
                value === option.value && "bg-muted",
              )}
              onClick={() => {
                onSelect(option.value);
                setSearchTerm(option.value);
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                {value === option.value && <CheckIcon className="h-4 w-4" />}
                <span>{option.label || option.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {open && requireSearchTerm && searchTerm.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-md border shadow-lg z-50 p-3 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}


