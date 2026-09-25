"use client";

import { useState } from "react";

type Props = {
  value: string;
  label?: string;
};

export default function CopyTextButton({ value, label = "コピー" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className="copy-button"
      onClick={handleCopy}
      aria-label={`${value} をコピー`}
    >
      {copied ? "コピーしました" : label}
    </button>
  );
}
