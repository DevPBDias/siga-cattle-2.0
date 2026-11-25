"use client";

import { StatusCheckboxList } from "./StatusCheckboxList";

interface StatusSelectorProps {
  selectedStatusNames: string[];
  onToggle: (names: string[]) => void;
}

export function StatusSelector({
  selectedStatusNames,
  onToggle,
}: StatusSelectorProps) {
  return (
    <div className="flex flex-col justify-start items-start w-full gap-2">
      <label
        htmlFor="status"
        className="text-primary font-bold text-sm uppercase w-full text-left"
      >
        Status ABCZ:
      </label>
      <StatusCheckboxList
        selected={selectedStatusNames}
        onToggle={onToggle}
      />
    </div>
  );
}
