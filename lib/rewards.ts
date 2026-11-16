export const REWARDS = [
  { code: "KREA050", amountCents: 50, minimumCents: 50, maximumCents: 1800, title: "La petite attention", condition: "Jusqu’à 18 € d’articles" },
  { code: "KREA2", amountCents: 200, minimumCents: 3500, maximumCents: null, title: "Le coup de pouce créatif", condition: "Dès 35 € d’articles" },
] as const;
export type Reward = (typeof REWARDS)[number];
export function findReward(code: string): Reward | undefined {
  return REWARDS.find(reward => reward.code === code.trim().toUpperCase());
}
export function rewardDiscount(code: string, subtotalCents: number): number {
  const reward = findReward(code);
  return reward && Number.isSafeInteger(subtotalCents) && subtotalCents >= reward.minimumCents && (reward.maximumCents === null || subtotalCents <= reward.maximumCents) ? reward.amountCents : 0;
}
