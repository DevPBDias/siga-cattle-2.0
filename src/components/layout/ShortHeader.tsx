"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const ShortHeader = ({ title }: { title: string }) => {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3.5 shadow-lg md:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h3 className="text-md font-semibold uppercase">{title}</h3>
      </div>
    </div>
  );
};

export default ShortHeader;
