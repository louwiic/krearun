import { ORDER_STATUSES } from "@/lib/types";

export default function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-sand/60 text-ink-soft",
    paid: "bg-sage/30 text-sage-deep",
    preparing: "bg-lavande/40 text-ink",
    shipped: "bg-blush/40 text-terra-deep",
    delivered: "bg-sage/50 text-sage-deep",
    cancelled: "bg-ink/10 text-ink-faint line-through",
  };
  const label = ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-bold ${styles[status] ?? "bg-sand"}`}
    >
      {label}
    </span>
  );
}
