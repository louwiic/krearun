"use client";

import { useState, type ReactNode } from "react";

export default function AdminShell({
  sidebar,
  mobileNavigation,
  children,
}: {
  sidebar: ReactNode;
  mobileNavigation: ReactNode;
  children: ReactNode;
}) {
  // The shared layout keeps this preference when navigating between admin pages.
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-linen">
      <aside
        id="admin-sidebar"
        aria-label="Menu du backoffice"
        className={`fixed inset-y-0 left-0 w-60 flex-col overflow-y-auto border-r border-sand/70 bg-cream px-5 py-8 ${collapsed ? "hidden" : "hidden md:flex"}`}
      >
        {sidebar}
      </aside>

      <nav
        aria-label="Menu mobile du backoffice"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-start overflow-x-auto border-t border-sand bg-cream py-2 md:hidden"
      >
        {mobileNavigation}
      </nav>

      <main
        className={`min-w-0 flex-1 px-5 py-10 pb-24 md:px-10 md:pb-10 ${collapsed ? "md:ml-0" : "md:ml-60"}`}
      >
        <button
          type="button"
          aria-controls="admin-sidebar"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
          className="mb-6 hidden items-center gap-2 rounded-full border border-sand bg-cream px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-linen hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra md:inline-flex"
        >
          <span aria-hidden="true">{collapsed ? "☰" : "←"}</span>
          {collapsed ? "Afficher le menu" : "Masquer le menu"}
        </button>
        {children}
      </main>
    </div>
  );
}
