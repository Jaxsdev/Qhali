"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-lg text-sm px-4 py-3 min-h-[44px]
            focus:outline-none focus:ring-2 transition-all duration-150
            disabled:opacity-40 disabled:cursor-not-allowed
            ${icon ? "pl-10" : ""}
            ${className}
          `}
          style={{
            background: "var(--bg-card)",
            border: error ? "1.5px solid var(--color-error)" : "1.5px solid var(--border)",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-button)",
          } as React.CSSProperties}
          placeholder={props.placeholder}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-error)" }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
