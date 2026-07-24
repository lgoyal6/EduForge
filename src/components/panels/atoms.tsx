"use client";

import type { ReactNode } from "react";
import { humanize } from "@/world/payloads";

export function Section({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="section">
      <header className="section__head">
        <div>
          <h3 className="section__title">{title}</h3>
          {subtitle && <p className="section__subtitle">{subtitle}</p>}
        </div>
        {actions}
      </header>
      <div className="section__body">{children}</div>
    </section>
  );
}

export function Chip({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
  title?: string;
}) {
  return (
    <span className={`chip chip--${tone}`} title={title}>
      {children}
    </span>
  );
}

export function Meter({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const resolvedTone = tone ?? (value >= 0.7 ? "good" : value >= 0.45 ? "warn" : "bad");
  return (
    <div className="meter">
      <div className="meter__row">
        <span className="meter__label">{label}</span>
        <span className="meter__value">{percent}%</span>
      </div>
      <div className="meter__track">
        <div
          className={`meter__fill meter__fill--${resolvedTone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {hint && <span className="meter__hint">{hint}</span>}
    </div>
  );
}

export function EvidenceList({ refs }: { refs: string[] }) {
  if (!refs || refs.length === 0) {
    return <p className="muted">No evidence attached.</p>;
  }
  return (
    <ul className="evidence">
      {refs.map((ref) => (
        <li key={ref} className="evidence__item">
          <code>{ref}</code>
        </li>
      ))}
    </ul>
  );
}

export function LabelList({ values }: { values: string[] }) {
  if (!values || values.length === 0) return <span className="muted">None</span>;
  return (
    <div className="label-list">
      {values.map((value) => (
        <Chip key={value}>{humanize(value)}</Chip>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      <p className="empty__body">{body}</p>
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="kv">
      <span className="kv__key">{label}</span>
      <div className="kv__value">{children}</div>
    </div>
  );
}
