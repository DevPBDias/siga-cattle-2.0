interface InfoRowProps {
  label: string;
  value: string | number | undefined;
}

export default function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-row items-center gap-1 p-2 border-b border-border last:border-b-0">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
        {label}:
      </span>
      <span className={`text-sm font-medium text-primary`}>{value}</span>
    </div>
  );
}
