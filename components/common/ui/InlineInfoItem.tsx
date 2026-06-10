import type { ReactNode } from "react";

type InlineInfoItemProps = {
  label: string;
  value: ReactNode;
  onClick?: () => void;
  valueClassName?: string;
};

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="ml-1 h-3.5 w-3.5 text-stone-400 transition-colors group-hover:text-stone-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1 1a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.2a1.2 1.2 0 0 1-1.2 1.2h-1.6a1.2 1.2 0 0 1-1.2-1.2v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0l-1-1a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6h-.2A1.2 1.2 0 0 1 3 13.6V12a1.2 1.2 0 0 1 1.2-1.2h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1L5 8.9a1.2 1.2 0 0 1 0-1.7l1-1a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9v-.2A1.2 1.2 0 0 1 10.7 4h1.6a1.2 1.2 0 0 1 1.2 1.2v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1 1a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.7h.2A1.2 1.2 0 0 1 21 12v1.6a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.9.2Z" />
    </svg>
  );
}

export default function InlineInfoItem({ label, value, onClick, valueClassName = "text-stone-900" }: InlineInfoItemProps) {
  if (onClick) {
    return (
      <button
        data-wafl-component="button"
        type="button"
        onClick={onClick}
        className="group pbp-interactive-button inline-flex min-w-0 items-center gap-1 wafl-shape-control bg-transparent px-1 py-0 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <span className="shrink-0 text-stone-500">{label}</span>
        <span className={`truncate ${valueClassName}`}>{value}</span>
        <GearIcon />
      </button>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-sm font-medium text-stone-600">
      <span className="shrink-0 text-stone-500">{label}</span>
      <span className={`truncate ${valueClassName}`}>{value}</span>
    </span>
  );
}
