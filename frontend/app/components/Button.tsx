"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
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
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer";

  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400",
    secondary:
      "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:from-sky-400 hover:to-blue-400",
    outline:
      "border border-slate-600 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5",
    ghost:
      "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
