"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  activeAlert?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = false,
  glow: _glow = false,
  onClick,
  activeAlert = false,
}: CardProps) {
  return (
    <div
      className={`surface-card ${className}`}
      style={{
        transition: hover ? "background-color 0.15s, border-color 0.15s" : undefined,
        cursor: hover || onClick ? "pointer" : undefined,
        borderLeft: activeAlert ? "4px solid var(--qhali-primary)" : undefined,
      }}
      onMouseEnter={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--text-primary)";
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--bg-primary)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "";
      } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
