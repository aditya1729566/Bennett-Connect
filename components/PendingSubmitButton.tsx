"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "dark" | "light" | "danger";
  className?: string;
};

export function PendingSubmitButton({ children, pendingLabel = "Working...", variant = "dark", className = "" }: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const variantClass =
    variant === "light"
      ? "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
      : variant === "danger"
        ? "border border-red-300 bg-white text-red-700 hover:bg-red-50"
        : "bg-zinc-950 text-white hover:bg-zinc-800";

  return (
    <button
      disabled={pending}
      className={`pressable inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-black disabled:cursor-wait disabled:opacity-70 ${variantClass} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
