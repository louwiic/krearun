import { resolveOrderColor, type OrderColorCatalog } from "@/lib/order-colors";
import type { OrderItem } from "@/lib/types";

export default function OrderColorName({ name, item, catalog }: {
  name: string;
  item: Pick<OrderItem, "productId" | "variantId">;
  catalog?: OrderColorCatalog;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span className="inline-flex shrink-0 gap-0.5" aria-hidden="true">
        {resolveOrderColor(name, item, catalog).map((hex, index) => (
          <span key={index} data-color-swatch={hex ?? "unknown"}
            title={hex ? name : `${name} : teinte non renseignée`}
            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-black/20"
            style={hex ? { backgroundColor: hex } : { backgroundImage: "linear-gradient(135deg, transparent 44%, #9ca3af 45%, #9ca3af 55%, transparent 56%)" }} />
        ))}
      </span>
      <span>{name}</span>
    </span>
  );
}
