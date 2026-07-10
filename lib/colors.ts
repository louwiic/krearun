export function publicColorName(name: string): string {
  return name.replace(/^PLA\s+/i, "").trim();
}
