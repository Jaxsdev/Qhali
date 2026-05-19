"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-slate-700/50 bg-slate-800/40
        backdrop-blur-sm
        ${hover ? "hover:border-emerald-500/30 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer" : ""}
        ${glow ? "pulse-glow" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
