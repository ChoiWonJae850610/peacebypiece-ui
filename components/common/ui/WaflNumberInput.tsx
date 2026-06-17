"use client";

import { useEffect, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import { formatPbpNumber } from "@/lib/utils/formatters";

type WaflNumberInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  id?: string;
  min?: number;
  className?: string;
  inputMode?: "numeric" | "decimal";
  ariaLabel?: string;
  onBeforeInteract?: () => void;
  component?: string;
  disabled?: boolean;
};

function normalizeNumericText(value: string) {
  const stripped = value.replace(/,/g, "").replace(/[^0-9.]/g, "");
  const [integerPart = "", ...fractionParts] = stripped.split(".");
  const nextInteger = integerPart.replace(/^0+(?=\d)/, "");
  const nextFraction = fractionParts.join("");

  if (stripped.includes(".")) {
    return `${nextInteger || "0"}.${nextFraction}`;
  }

  return nextInteger || "";
}

function formatNumberText(value: string) {
  if (value === "") return "";
  const [integerPart = "0", fractionPart] = value.split(".");
  const formattedInteger = formatPbpNumber(Number(integerPart || 0), { maximumFractionDigits: 0 });

  if (fractionPart !== undefined) {
    return `${formattedInteger}.${fractionPart}`;
  }

  return formattedInteger;
}

function numberToDisplay(value: number) {
  return formatPbpNumber(value);
}

export default function WaflNumberInput({
  value,
  onValueChange,
  id,
  min = 0,
  className,
  inputMode = "numeric",
  ariaLabel,
  onBeforeInteract: _onBeforeInteract,
  component = "number-input",
  disabled = false,
}: WaflNumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => numberToDisplay(value));

  useEffect(() => {
    if (focused) return;
    setDisplayValue(numberToDisplay(value));
  }, [focused, value]);

  const commitValue = (nextText: string) => {
    const normalizedText = normalizeNumericText(nextText);
    const nextNumber = Number(normalizedText);
    onValueChange(Number.isFinite(nextNumber) ? Math.max(min, nextNumber) : min);
    setDisplayValue(formatNumberText(normalizedText));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.blur();
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={inputMode}
      enterKeyHint="done"
      data-wafl-component={component}
      aria-label={ariaLabel}
      disabled={disabled}
      value={displayValue}
      onFocus={() => {
        setFocused(true);
        setDisplayValue(value === 0 ? "" : numberToDisplay(value));
      }}
      onBlur={() => {
        setFocused(false);
        if (displayValue.trim() === "") {
          onValueChange(min);
          setDisplayValue(numberToDisplay(min));
          return;
        }
        commitValue(displayValue);
      }}
      onKeyDown={handleKeyDown}
      onChange={(event) => commitValue(event.target.value)}
      className={cn("text-right tabular-nums", className)}
    />
  );
}
