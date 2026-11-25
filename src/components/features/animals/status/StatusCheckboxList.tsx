"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUS_ABCZ_OPTIONS } from "@/types/status.type";

interface StatusCheckboxListProps {
  selected: string[];
  onToggle: (names: string[]) => void;
}

export function StatusCheckboxList({
  selected,
  onToggle,
}: StatusCheckboxListProps) {
  const handleToggle = (name: string, checked: boolean) => {
    if (checked) {
      if (selected.length < 2) {
        onToggle([...selected, name]);
      }
    } else {
      onToggle(selected.filter((s) => s !== name));
    }
  };

  return (
    <div className="flex items-start gap-2 w-full">
      <div className="flex-1 rounded-md px-4 py-3 w-full border-0">
        <div className="grid grid-cols-2 gap-3">
          {STATUS_ABCZ_OPTIONS.map((statusName) => {
            const isChecked = selected.includes(statusName);
            const isDisabled = !isChecked && selected.length >= 2;

            return (
              <label
                key={statusName}
                className={cn(
                  "flex items-center bg-muted rounded-md px-3 py-2 gap-3 text-sm cursor-pointer select-none transition-opacity",
                  isDisabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <Checkbox
                  checked={isChecked}
                  disabled={isDisabled}
                  className="border-primary"
                  onCheckedChange={(val) =>
                    handleToggle(statusName, !!val)
                  }
                  aria-label={statusName}
                />
                <span className="text-sm uppercase text-primary font-medium">
                  {statusName}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
