"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/home",
    label: "Inicio",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    href: "/report",
    label: "Reportar",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    isAction: true,
  },
  {
    href: "/map",
    label: "Mapa",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    href: "/my-reports",
    label: "Mis reportes",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-bottom"
      id="bottom-nav"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-[var(--bottom-nav-height)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase()}`}
                className="flex flex-col items-center -mt-6"
              >
                <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 active:scale-90 text-white">
                  {item.icon}
                </div>
                <span className="text-[10px] mt-1 font-medium text-emerald-400">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-emerald-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? "text-emerald-400" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-fade-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
