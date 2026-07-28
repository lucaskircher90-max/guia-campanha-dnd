import { useState } from "react";

export function Card({ title, className = "", children, actions }) {
  return (
    <section className={`card p-4 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <h2 className="font-display text-gold-400 text-lg tracking-wide">{title}</h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, className = "", children }) {
  return (
    <label className={`flex flex-col gap-1 text-xs ${className}`}>
      {label && <span className="uppercase tracking-wide text-parchment-300/70">{label}</span>}
      {children}
    </label>
  );
}

export function TextInput({ value, onChange, className = "", ...rest }) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full ${className}`}
      {...rest}
    />
  );
}

export function NumberInput({ value, onChange, className = "", ...rest }) {
  return (
    <input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className={`w-full ${className}`}
      {...rest}
    />
  );
}

export function TextArea({ value, onChange, className = "", rows = 3, ...rest }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={`w-full resize-y ${className}`}
      {...rest}
    />
  );
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 accent-[var(--color-gold-500)]"
      />
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}

export function Button({ children, variant = "default", className = "", type = "button", ...rest }) {
  const variants = {
    default: "bg-ink-700 hover:bg-ink-600 text-parchment-100 border border-ink-600",
    primary: "bg-blood-600 hover:bg-blood-500 text-parchment-50 border border-blood-700",
    gold: "bg-gold-600 hover:bg-gold-500 text-ink-950 border border-gold-600 font-semibold",
    ghost: "bg-transparent hover:bg-ink-700 text-parchment-200 border border-transparent",
    danger: "bg-transparent hover:bg-blood-700 text-blood-500 hover:text-parchment-50 border border-blood-700",
  };
  return (
    <button
      type={type}
      className={`px-3 py-1.5 rounded text-sm transition-colors cursor-pointer ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Botão de remover com confirmação embutida na própria UI (não usa window.confirm,
// que é bloqueado/suprimido em alguns navegadores e webviews).
export function ConfirmButton({ onConfirm, children = "Remover", confirmLabel = "Confirmar", className = "" }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className={`inline-flex gap-1.5 ${className}`}>
        <Button variant="primary" onClick={() => { setConfirming(false); onConfirm(); }}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </span>
    );
  }

  return (
    <Button variant="danger" className={className} onClick={() => setConfirming(true)}>
      {children}
    </Button>
  );
}

export function Pill({ children, className = "" }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border border-ink-600 bg-ink-900 ${className}`}>
      {children}
    </span>
  );
}
