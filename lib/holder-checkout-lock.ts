import { acquireHolderCheckoutLock, releaseHolderCheckoutLock } from "./store";

export class HolderCheckoutConflict extends Error {
  override name = "HolderCheckoutConflict";
}

export async function withHolderCheckoutLocks<T>(requestIds: string[], operation: () => Promise<T>): Promise<T> {
  const locks: string[] = [];
  try {
    for (const id of [...new Set(requestIds)].sort()) {
      try {
        locks.push(await acquireHolderCheckoutLock(id));
      } catch (error) {
        if (error instanceof Error && error.message.includes("validation_not_unique")) {
          throw new HolderCheckoutConflict("Un paiement est en cours de préparation. Réessayez dans un instant.");
        }
        throw error;
      }
    }
    return await operation();
  } finally {
    const released = await Promise.allSettled(locks.reverse().map(releaseHolderCheckoutLock));
    if (released.some(result => result.status === "rejected")) console.error("[Holder] Checkout lock cleanup failed");
  }
}
