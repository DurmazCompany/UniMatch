import clsx from "clsx";

const ACCENTS: Record<string, string> = {
  default: "bg-gray-900",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
};

export function StatCard({
  title,
  value,
  accent = "default",
}: {
  title: string;
  value: number | string;
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={clsx("h-1", ACCENTS[accent] ?? ACCENTS.default)} />
      <div className="p-5">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}
