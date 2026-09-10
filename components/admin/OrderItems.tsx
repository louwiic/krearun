import type { OrderItem } from "@/lib/types";
import { orderItemDetails } from "@/lib/order-details";
import { formatPrice } from "@/lib/format";

export default function OrderItems({
  items,
  compact = false,
}: {
  items: OrderItem[];
  compact?: boolean;
}) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item.productId}-${index}`} className="min-w-0 break-words">
          <p className="font-semibold">
            {item.quantity} × {item.name}
          </p>
          <dl className="mt-1 space-y-1 text-xs text-ink-soft">
            {orderItemDetails(item).map((detail) => (
              <div key={detail.label}>
                <dt className="inline font-semibold">{detail.label} : </dt>
                <dd className="inline whitespace-pre-wrap">{detail.value}</dd>
              </div>
            ))}
          </dl>
          {!compact && (
            <>
              <p className="mt-2 text-sm">
                Prix unitaire : {formatPrice(item.priceCents)} · Total article :{" "}
                <strong>{formatPrice(item.quantity * item.priceCents)}</strong>
              </p>
              {item.weightGrams !== undefined && (
                <p className="mt-1 text-xs text-ink-soft">
                  Poids unitaire : {item.weightGrams} g
                </p>
              )}
              <p className="mt-1 break-all text-xs text-ink-faint">
                Référence produit : {item.productId || "—"}
                {item.variantId ? ` · Variante : ${item.variantId}` : ""}
              </p>
              {item.image && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 rounded-xl border border-sand object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
