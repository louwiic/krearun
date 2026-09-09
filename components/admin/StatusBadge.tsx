import { ORDER_STATUSES } from "@/lib/types";
import {
  paymentStatusStyle,
  productionStatusStyle,
} from "@/lib/order-status-style";

export default function StatusBadge({ status }: { status: string }) {
  const style =
    status === "paid"
      ? paymentStatusStyle(status)
      : productionStatusStyle(status);
  const label = ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-bold ${style}`}
    >
      {label}
    </span>
  );
}
