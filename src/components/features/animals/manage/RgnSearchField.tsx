"use client";

import { RgnAutocomplete, RgnOption } from "@/components/features/animals/RgnAutocomplete";

interface RgnSearchFieldProps {
  label: string;
  options: RgnOption[];
  value: string;
  onSelect: (rgn: string) => void;
  placeholder?: string;
  requireSearchTerm?: boolean;
  emptyMessage?: string;
}

export function RgnSearchField({
  label,
  options,
  value,
  onSelect,
  placeholder,
  requireSearchTerm,
  emptyMessage,
}: RgnSearchFieldProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-700 ease-in-out">
      <label className="text-primary font-bold text-xs uppercase block mb-2">
        {label}
      </label>
      <RgnAutocomplete
        options={options}
        value={value}
        onSelect={onSelect}
        placeholder={placeholder}
        requireSearchTerm={requireSearchTerm}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
