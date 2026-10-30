"use client";
import { useFormStatus } from "react-dom";
export default function PendingSubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={className} aria-busy={pending}>{pending ? "Enregistrement…" : children}</button>;
}
