export interface WithdrawalDeclaration {
  submissionKey: string; name: string; email: string; contract: string; address: string;
}
export interface WithdrawalRecord extends WithdrawalDeclaration {
  id: string; receivedAt: string; receiptSent: boolean; notificationSent: boolean;
}
function field(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\r/g, "").slice(0, max) : "";
}
export function parseWithdrawal(value: unknown): WithdrawalDeclaration | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const declaration = { submissionKey: field(v.submissionKey, 36), name: field(v.name, 120), email: field(v.email, 254).toLowerCase(), contract: field(v.contract, 2000), address: field(v.address, 500) };
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(declaration.submissionKey) || !declaration.name || /[\r\n]/.test(declaration.name) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(declaration.email) || !declaration.contract) return null;
  return declaration;
}
export function withdrawalReceipt(record: WithdrawalRecord) {
  return `KRÉARUN — ACCUSÉ DE RÉCEPTION D’UNE RÉTRACTATION\n\nRéférence : ${record.id}\nDate et heure de réception : ${record.receivedAt} (UTC)\n\nNom et prénom : ${record.name}\nAdresse électronique pour cet accusé : ${record.email}\n${record.address ? `Adresse postale : ${record.address}\n` : ""}\nDéclaration : Je vous notifie ma décision de me rétracter du contrat identifié ci-dessous.\n\nContrat / articles concernés :\n${record.contract}\n\nCet accusé constate la réception de votre déclaration. Il ne préjuge pas d’une éventuelle exception légale applicable à un article personnalisé et ne constitue pas un remboursement automatique. Les droits légaux du consommateur restent applicables.\n`;
}
