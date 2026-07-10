"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { publicColorName } from "@/lib/colors";
import { formatPrice } from "@/lib/format";
import { billableWeight } from "@/lib/free-shipping";
import { calculateShippingCents, formatWeight, parseShippingRates } from "@/lib/shipping";
import { parsePickupPoints } from "@/lib/pickup";
import type { FulfillmentMethod } from "@/lib/types";

const inputClass =
  "w-full rounded-2xl border border-sand bg-cream px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-terra";

function Field({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</span>
      <input
        className={inputClass}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function CheckoutForm({
  freeShippingThresholdCents,
  shippingRatesJson,
  pickupPointsJson,
}: {
  freeShippingThresholdCents: number;
  shippingRatesJson: string;
  pickupPointsJson: string;
}) {
  const { items, subtotalCents, setQuantity, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const pickupPoints = useMemo(() => parsePickupPoints(pickupPointsJson), [pickupPointsJson]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("delivery");
  const [pickupPointId, setPickupPointId] = useState(pickupPoints[0]?.id ?? "");
  const [customer, setCustomer] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    city: "",
    country: "RE",
  });

  const billableWeightGrams = billableWeight(items);
  const shippingRates = useMemo(() => parseShippingRates(shippingRatesJson), [shippingRatesJson]);
  const shippingEstimate = calculateShippingCents(billableWeightGrams || 1, shippingRates);
  const freeShipping =
    freeShippingThresholdCents > 0 && subtotalCents >= freeShippingThresholdCents;
  const selectedPickupPoint =
    pickupPoints.find((point) => point.id === pickupPointId) ?? pickupPoints[0] ?? null;
  const isPickup = fulfillmentMethod === "pickup" && selectedPickupPoint;
  const shippingCents =
    isPickup || billableWeightGrams === 0 ? 0 : freeShipping ? 0 : shippingEstimate.priceCents;
  const totalCents = subtotalCents + shippingCents;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          promoCode,
          fulfillmentMethod,
          pickupPointId: isPickup ? selectedPickupPoint.id : "",
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.color,
            customName: item.customName,
          })),
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Impossible de préparer le paiement.");
      if (!data.url) throw new Error("Le service de paiement n'a pas renvoyé de lien.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 bg-cream px-6 py-16 text-center shadow-soft sm:px-10">
        <p className="font-display text-2xl font-semibold">Votre panier est vide</p>
        <p className="mt-3 text-sm text-ink-soft">
          Ajoutez un objet à votre panier avant de passer commande.
        </p>
        <Link
          href="/boutique"
          className="mt-7 inline-flex rounded-full bg-terra px-7 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="space-y-6 bg-cream p-5 shadow-soft sm:p-8">
        <div>
          <h2 className="font-display text-2xl font-semibold">Coordonnées</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Ces informations seront utilisées pour préparer la commande et créer votre
            espace client après paiement.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
              fulfillmentMethod === "delivery"
                ? "border-terra bg-linen"
                : "border-sand bg-cream hover:border-terra/60"
            }`}
          >
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              checked={fulfillmentMethod === "delivery"}
              onChange={() => setFulfillmentMethod("delivery")}
              className="sr-only"
            />
            <span className="block text-sm font-bold">Envoi à domicile</span>
            <span className="mt-1 block text-xs leading-5 text-ink-soft">
              Frais calculés selon le poids du panier.
            </span>
          </label>
          <label
            className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
              fulfillmentMethod === "pickup"
                ? "border-terra bg-linen"
                : "border-sand bg-cream hover:border-terra/60"
            } ${pickupPoints.length === 0 ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input
              type="radio"
              name="fulfillment"
              value="pickup"
              checked={fulfillmentMethod === "pickup"}
              onChange={() => {
                if (pickupPoints.length > 0) setFulfillmentMethod("pickup");
              }}
              disabled={pickupPoints.length === 0}
              className="sr-only"
            />
            <span className="block text-sm font-bold">Retrait</span>
            <span className="mt-1 block text-xs leading-5 text-ink-soft">
              Principalement le week-end, selon les créneaux proposés.
            </span>
          </label>
        </div>

        {fulfillmentMethod === "pickup" && pickupPoints.length > 0 && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-ink-soft">
              Point de retrait
            </span>
            <select
              className={inputClass}
              value={pickupPointId}
              onChange={(event) => setPickupPointId(event.target.value)}
            >
              {pickupPoints.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name}
                </option>
              ))}
            </select>
            {selectedPickupPoint && (
              <span className="mt-2 block rounded-2xl bg-linen px-4 py-3 text-xs leading-5 text-ink-soft">
                <strong className="text-ink">{selectedPickupPoint.address}</strong>
                <br />
                {selectedPickupPoint.schedule}
                {selectedPickupPoint.note ? (
                  <>
                    <br />
                    {selectedPickupPoint.note}
                  </>
                ) : null}
              </span>
            )}
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Prénom"
            name="firstName"
            autoComplete="given-name"
            value={customer.firstName}
            onChange={(value) => setCustomer((c) => ({ ...c, firstName: value }))}
          />
          <Field
            label="Nom"
            name="lastName"
            autoComplete="family-name"
            value={customer.lastName}
            onChange={(value) => setCustomer((c) => ({ ...c, lastName: value }))}
          />
          <Field
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={customer.email}
            onChange={(value) => setCustomer((c) => ({ ...c, email: value }))}
          />
          <Field
            label="Téléphone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={customer.phone}
            onChange={(value) => setCustomer((c) => ({ ...c, phone: value }))}
          />
        </div>

        <div className="grid gap-4">
          <Field
            label="Adresse"
            name="addressLine1"
            autoComplete="address-line1"
            required={fulfillmentMethod === "delivery"}
            value={customer.addressLine1}
            onChange={(value) => setCustomer((c) => ({ ...c, addressLine1: value }))}
          />
          <Field
            label="Complément d'adresse"
            name="addressLine2"
            required={false}
            autoComplete="address-line2"
            value={customer.addressLine2}
            onChange={(value) => setCustomer((c) => ({ ...c, addressLine2: value }))}
          />
          <div className="grid gap-4 sm:grid-cols-[160px_1fr_120px]">
            <Field
              label="Code postal"
              name="postalCode"
              autoComplete="postal-code"
              required={fulfillmentMethod === "delivery"}
              value={customer.postalCode}
              onChange={(value) => setCustomer((c) => ({ ...c, postalCode: value }))}
            />
            <Field
              label="Ville"
              name="city"
              autoComplete="address-level2"
              required={fulfillmentMethod === "delivery"}
              value={customer.city}
              onChange={(value) => setCustomer((c) => ({ ...c, city: value }))}
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-ink-soft">Pays</span>
              <select
                className={inputClass}
                value={customer.country}
                onChange={(event) =>
                  setCustomer((c) => ({ ...c, country: event.target.value }))
                }
              >
                <option value="RE">Réunion</option>
                <option value="FR">France</option>
              </select>
            </label>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-ink-soft">
            Code promo
          </span>
          <input
            className={inputClass}
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="Facultatif"
          />
          <span className="mt-2 block text-xs text-ink-faint">
            Les codes actifs configurés dans le tableau de bord sont appliqués au paiement.
          </span>
        </label>
      </section>

      <aside className="h-max bg-cream p-5 shadow-soft sm:p-6">
        <h2 className="font-display text-2xl font-semibold">Récapitulatif</h2>
        <ul className="mt-5 divide-y divide-sand/60">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.color}-${item.customName ?? ""}`}
              className="flex gap-3 py-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    {item.color && (
                      <p className="text-xs text-ink-soft">Coloris : {publicColorName(item.color)}</p>
                    )}
                    {item.customName && (
                      <p className="text-xs text-terra-deep">Prénom : {item.customName}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.color, item.customName)}
                    className="text-sm text-ink-faint hover:text-terra"
                  >
                    Retirer
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-sand">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          item.productId,
                          item.color,
                          item.customName,
                          item.quantity - 1
                        )
                      }
                      className="px-3 py-1 text-ink-soft hover:text-ink"
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          item.productId,
                          item.color,
                          item.customName,
                          item.quantity + 1
                        )
                      }
                      disabled={item.quantity >= (item.preorder ? 20 : item.stock)}
                      className="px-3 py-1 text-ink-soft hover:text-ink disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-bold">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-3 border-t border-sand/70 pt-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Sous-total</span>
            <span className="font-semibold">{formatPrice(subtotalCents)}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-ink-soft">
              {isPickup
                ? `Retrait · ${selectedPickupPoint.name}`
                : `Envoi · ${formatWeight(billableWeightGrams)} · ${
                    billableWeightGrams === 0 ? "offert" : shippingEstimate.label
                  }`}
            </span>
            <span className="font-semibold">
              {shippingCents === 0 ? "Offerte" : formatPrice(shippingCents)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-sand/70 pt-4">
            <span className="font-bold">Total estimé</span>
            <span className="font-display text-xl font-semibold">
              {formatPrice(totalCents)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-4 bg-blush/40 px-4 py-3 text-sm font-semibold text-terra-deep">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream transition-colors hover:bg-terra-deep disabled:opacity-60"
        >
          {loading ? "Préparation de la commande..." : "Valider la commande"}
        </button>
        <p className="mt-3 text-center text-[11px] text-ink-faint">
          La commande est confirmée après validation.
        </p>
      </aside>
    </form>
  );
}
