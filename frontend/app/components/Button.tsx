"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "orange" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer select-none";

  const variants: Record<string, string> = {
    primary:
      "text-white",
    secondary:
      "text-[var(--text-secondary)]",
    orange:
      "text-white",
    outline:
      "text-[var(--qhali-primary)]",
    ghost:
      "text-[var(--text-muted)]",
    danger:
      "text-white",
  };

  const variantStyle: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--qhali-primary)",
      boxShadow: "var(--shadow-primary)",
    },
    secondary: {
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-button)",
    },
    orange: {
      background: "var(--qhali-orange)",
      boxShadow: "0 2px 10px rgba(234,88,12,0.3)",
    },
    outline: {
      background: "transparent",
      border: "1.5px solid var(--qhali-primary)",
    },
    ghost: {
      background: "transparent",
    },
    danger: {
      background: "var(--color-error)",
      boxShadow: "var(--shadow-button)",
    },
  };

  const sizes: Record<string, string> = {
    sm: "text-sm px-3 py-2 min-h-[36px]",
    md: "text-sm px-4 py-2.5 min-h-[42px]",
    lg: "text-base px-6 py-3 min-h-[48px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      style={variantStyle[variant]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
