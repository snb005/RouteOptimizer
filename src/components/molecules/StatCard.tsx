/* ═══════════════════════════════════════════════════════════════════════════
   MOLECULE — StatCard
   A compact metric display with a big value + subtitle label.
   Uses ion-hover-lift for a subtle lift on hover.
   ═══════════════════════════════════════════════════════════════════════════ */

interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm ion-stroke-subtle ion-hover-lift">
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
