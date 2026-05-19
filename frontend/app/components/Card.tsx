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
  glow: _glow = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={`rounded-xl surface-card ${className}`}
      style={{
        transition: hover ? "box-shadow 0.15s, border-color 0.15s" : undefined,
        cursor: hover || onClick ? "pointer" : undefined,
      }}
      onMouseEnter={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(2,132,199,0.12)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--qhali-primary-light)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)";
      } : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
