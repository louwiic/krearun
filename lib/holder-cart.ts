import { canPayHolder, HOLDER_NAME, HOLDER_SLUG, HOLDER_WEIGHT_GRAMS, holderModelLabel, type HolderRequest } from "./custom-holder";
import type { CartItem, OrderItem } from "./types";

export const HOLDER_CART_PRODUCT_ID = "custom-holder";
export const HOLDER_CART_DEMO_KEY = "demo-mixed-cart-v1";
export const isHolderDemo = (request: HolderRequest) => request.submissionKey === HOLDER_CART_DEMO_KEY;
const HOLDER_DEMO_UNIT_CENTS = 2490;

export function canAddHolderToCart(request: HolderRequest, customerId: string) {
  if (!isHolderDemo(request)) return canPayHolder(request, customerId);
  return request.customerId === customerId && !request.orderId && request.decision?.status === "approved" && request.decision.unitPriceCents === 0;
}

export function holderCartItem(request: HolderRequest): CartItem {
  if (!canAddHolderToCart(request, request.customerId)) throw new Error("Cette personnalisation n’est plus disponible.");
  return {
    productId: HOLDER_CART_PRODUCT_ID, slug: HOLDER_SLUG, variantId: request.id,
    variantName: holderModelLabel(request.configuration), color: request.configuration.bodyColorName,
    name: `${HOLDER_NAME}${isHolderDemo(request) ? " · Démonstration" : ""}`,
    image: "/products/porte-boisson-personnalise.svg", priceCents: isHolderDemo(request) ? HOLDER_DEMO_UNIT_CENTS : request.decision!.unitPriceCents,
    weightGrams: HOLDER_WEIGHT_GRAMS, quantity: request.quantity, stock: request.quantity,
    holderShippingCents: request.decision!.shippingCents, holderDemo: isHolderDemo(request),
  };
}

export function holderCartShipping(standard: number, quotes: number[], mixed: boolean, pickup = false): number {
  if (pickup || !quotes.length) return standard;
  return Math.max(mixed ? standard : 0, ...quotes);
}

export function holderOrderItem(request: HolderRequest): OrderItem {
  const cart = holderCartItem(request);
  return {
    productId: cart.productId, holderRequestId: request.id, color: cart.color,
    name: cart.name, variantName: cart.variantName, priceCents: cart.priceCents,
    quantity: cart.quantity, weightGrams: cart.weightGrams, image: cart.image,
  };
}
