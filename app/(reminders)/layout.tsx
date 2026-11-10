import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function ReminderLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-2xl px-5 py-12"><Link href="/" className="font-display text-2xl font-bold">Kréarun</Link><div className="mt-10">{children}</div><Link href="/confidentialite" className="mt-10 inline-block text-sm underline">Confidentialité</Link></main>;
}
