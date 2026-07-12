"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";

const navItems = [
  {
    href: "/home",
    label: "Inicio",
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    href: "/report",
    label: "Reportar Incidencia",
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Mapa de Incidencias",
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    href: "/nearby",
    label: "Alertas Cercanas",
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    href: "/my-reports",
    label: "Mi Historial",
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";
  const aliasInitial = user?.alias_anonimo?.[0]?.toUpperCase() ?? "C";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside
      className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-50 p-6 border-r transition-all duration-300"
      style={{
        background: "#000000",
        borderColor: "#1F1F1F",
      }}
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 flex items-center justify-center text-white text-xl border border-white"
          style={{ background: "var(--qhali-primary)" }}
        >
          📍
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight leading-none text-white">QHALI</h1>
          <p className="text-[10px] mt-0.5 text-white/50">Huancayo, Junín</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold border transition-all duration-150 group`}
              style={
                isActive
                  ? {
                      background: "#FFFFFF",
                      borderColor: "#000000",
                      color: "var(--qhali-primary)",
                    }
                  : {
                      background: "transparent",
                      borderColor: "transparent",
                      color: "rgba(255, 255, 255, 0.7)",
                    }
              }
            >
              <span className={`transition-transform duration-150 group-hover:scale-110`}>
                {item.icon(isActive)}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Dashboard if authorized */}
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold border transition-all duration-150 group mt-4`}
            style={
              pathname === "/admin/dashboard"
                ? {
                    background: "#FFFFFF",
                    borderColor: "#000000",
                    color: "var(--qhali-primary)",
                  }
                : {
                    background: "transparent",
                    borderColor: "transparent",
                    color: "rgba(255, 255, 255, 0.7)",
                  }
            }
          >
            <span className="transition-transform duration-150 group-hover:scale-110">
              ⚙️
            </span>
            <span>Panel de Admin</span>
          </Link>
        )}
      </nav>

      {/* User profile / Logout at the bottom */}
      <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border border-white"
            style={{ background: "var(--qhali-primary)" }}
          >
            {aliasInitial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate leading-snug text-white">
              {user?.alias_anonimo ?? "Ciudadano"}
            </p>
            <p className="text-[9px] truncate capitalize text-white/50">
              {user?.role ?? "ciudadano"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/60 hover:text-white transition-colors duration-150 flex-shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
