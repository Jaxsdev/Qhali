"use client";

import React from "react";
import BottomNav from "../components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 safe-area-bottom">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
