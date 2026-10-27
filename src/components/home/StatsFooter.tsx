"use client";

import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useAnimalsByAgeAndSex } from "@/hooks/utils/useAnimalsByAgeAndSex";

const ageRanges = ["0 - 12 m", "13 - 24 m", "25 - 36 m", "+36 m"] as const;

export function StatsFooter() {
  const { data: animals = [] } = useAnimals();
  const activeAnimals = animals.filter(
    (animal) => animal.animal_state === "ATIVO",
  );
  const { total, male, female } = useAnimalsByAgeAndSex(activeAnimals);

  const sexStats = [
    { label: "Machos", total: total.male, ages: male },
    { label: "Fêmeas", total: total.female, ages: female },
  ];

  return (
    <section
      className="relative z-20 p-2 bg-transparent text-primary"
      aria-labelledby="herd-title"
    >
      <div className="flex items-center justify-between gap-2 p-2 rounded-md border border-white/20 text-primary">
        <div className="flex flex-1 items-center justify-between">
          <span id="herd-title" className="text-sm text-white/85 font-extrabold">
            Total de animais
          </span>
          <strong className="text-[#FFCB04] text-[24px] font-extrabold leading-none">
            {total.all}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-2 mt-0.5 gap-3 p-1">
        {sexStats.map(({ label, total: sexTotal, ages }) => (
          <div key={label}>
            <div className="mb-1 flex items-end justify-between gap-4 pb-1 text-xs text-[#FFCB04] font-extrabold border-b border-white/20">
              <span className="font-bold text-white/85">{label}</span>
              <strong className="text-[15px] text-[#FFCB04]">{sexTotal}</strong>
            </div>
            <div
              className="grid grid-cols-2 gap-2 mt-2"
              aria-label={`${label} por período de idade`}
            >
              {ageRanges.map((range) => (
                <div
                  key={range}
                  className="px-1 py-1.5 flex flex-col justify-center items-center border border-white rounded-[8px] bg-transparent [&_strong]:text-[#FFCB04] [&_strong]:text-[16px] [&_strong]:leading-none [&_span]:mt-0.5 [&_span]:text-white/85 [&_span]:text-[9px] [&_span]:font-bold"
                >
                  <strong>{ages[range].length}</strong>
                  <span className="">{range}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
