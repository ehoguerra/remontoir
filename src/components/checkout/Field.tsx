import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
}

/** Label, input and error message, wired together for assistive technology. */
export function Field({ id, label, error, hint, className = "", ...input }: Props) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[0.875rem] font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="field mt-1.5"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8125rem] text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[0.8125rem] text-ruby" data-testid={`error-${id}`}>
          {error}
        </p>
      )}
    </div>
  );
}
