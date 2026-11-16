export function customerProfileInput(data: FormData) {
  const read = (key: string, max: number) => {
    const value = String(data.get(key) ?? "").trim();
    if (value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) throw new Error("Un champ est trop long ou contient des caractères invalides.");
    return value;
  };
  const profile = { name: read("name", 150), phone: read("phone", 40), addressLine1: read("addressLine1", 250), addressLine2: read("addressLine2", 250), postalCode: read("postalCode", 5), city: read("city", 100), country: read("country", 2) };
  if (!profile.name) throw new Error("Indiquez votre nom.");
  if (!["RE", "FR"].includes(profile.country)) throw new Error("Choisissez La Réunion ou la France métropolitaine.");
  if (profile.postalCode && !/^\d{5}$/.test(profile.postalCode)) throw new Error("Le code postal doit comporter 5 chiffres.");
  return profile;
}
