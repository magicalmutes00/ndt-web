import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { metaFor, socialIconOptions } from "../../shared/content/editorMeta.js";
import { iconChoices } from "../components/ui/Icon";
import { ImageField } from "./ImageField";

/**
 * Schema-driven form renderer.
 *
 * Walks the content document and renders one control per leaf, using
 * `editorMeta` for labels and widget kinds. Adding a field to the Zod schema
 * plus one metadata entry yields a working control with no new JSX — which is
 * what keeps "the admin can edit everything" tractable as content grows.
 */

interface FieldRendererProps {
  path: string;
  value: unknown;
  onChange: (next: unknown) => void;
  /** Label override, used when rendering list rows. */
  labelOverride?: string;
}

export function FieldRenderer({ path, value, onChange, labelOverride }: FieldRendererProps) {
  const meta = metaFor(path);
  const label = labelOverride ?? meta.label;

  // --- primitives ---------------------------------------------------------
  if (typeof value === "string" || typeof value === "number" || value === undefined) {
    return (
      <PrimitiveField
        path={path}
        label={label}
        value={value}
        onChange={onChange}
        kind={meta.kind}
        help={meta.help}
        placeholder={meta.placeholder}
        wide={meta.wide}
      />
    );
  }

  // --- array of strings ---------------------------------------------------
  if (Array.isArray(value)) {
    const allStrings = value.every((item) => typeof item === "string");
    if (allStrings) {
      return (
        <StringListField
          path={path}
          label={label}
          help={meta.help}
          items={value as string[]}
          onChange={onChange}
        />
      );
    }
    return (
      <ObjectListField
        path={path}
        label={label}
        help={meta.help}
        rowTitle={meta.rowTitle}
        items={value as Record<string, unknown>[]}
        onChange={onChange}
      />
    );
  }

  // --- nested object ------------------------------------------------------
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      <fieldset className="rounded-2xl border border-surface-200 bg-white/60 p-5">
        <legend className="px-2 text-sm font-semibold text-primary">{label}</legend>
        {meta.help && <p className="text-xs text-primary/40 mb-3">{meta.help}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(record).map(([key, child]) => {
            const childPath = path ? `${path}.${key}` : key;
            const childMeta = metaFor(childPath);
            if (childMeta.hidden) return null;
            return (
              <div key={childPath} className={childMeta.wide ? "md:col-span-2" : undefined}>
                <FieldRenderer
                  path={childPath}
                  value={child}
                  onChange={(next) => onChange({ ...record, [key]: next })}
                />
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */

interface PrimitiveFieldProps {
  path: string;
  label: string;
  value: unknown;
  onChange: (next: unknown) => void;
  kind: string;
  help?: string;
  placeholder?: string;
  wide?: boolean;
}

function PrimitiveField({
  label,
  value,
  onChange,
  kind,
  help,
  placeholder,
  wide,
}: PrimitiveFieldProps) {
  const stringValue = value === undefined || value === null ? "" : String(value);

  if (kind === "image") {
    return (
      <div className={wide ? "md:col-span-2" : undefined}>
        <ImageField label={label} value={stringValue} onChange={onChange} help={help} />
      </div>
    );
  }

  if (kind === "icon") {
    return (
      <div className="space-y-1.5">
        <FieldLabel label={label} />
        <select
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-white border border-surface-300 text-sm text-primary focus:border-accent/40"
        >
          {iconChoices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
        {help && <Help text={help} />}
      </div>
    );
  }

  if (kind === "select") {
    return (
      <div className="space-y-1.5">
        <FieldLabel label={label} />
        <select
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-white border border-surface-300 text-sm text-primary focus:border-accent/40"
        >
          {socialIconOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {help && <Help text={help} />}
      </div>
    );
  }

  if (kind === "textarea") {
    return (
      <div className="space-y-1.5">
        <FieldLabel label={label} />
        <textarea
          rows={4}
          value={stringValue}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white border border-surface-300 text-sm text-primary placeholder:text-primary/30 focus:border-accent/40 resize-y"
        />
        {help && <Help text={help} />}
      </div>
    );
  }

  const inputType = kind === "number" ? "number" : kind === "email" ? "email" : kind === "tel" ? "tel" : kind === "url" ? "url" : "text";

  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} />
      <input
        type={inputType}
        value={stringValue}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(kind === "number" ? Number(event.target.value || 0) : event.target.value)
        }
        className="w-full h-10 px-3 rounded-lg bg-white border border-surface-300 text-sm text-primary placeholder:text-primary/30 focus:border-accent/40"
      />
      {help && <Help text={help} />}
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <label className="text-xs font-mono tracking-wider text-primary/50 uppercase">{label}</label>;
}

function Help({ text }: { text: string }) {
  return <p className="text-xs text-primary/40">{text}</p>;
}

/* -------------------------------------------------------------------------- */

interface StringListFieldProps {
  path: string;
  label: string;
  help?: string;
  items: string[];
  onChange: (next: string[]) => void;
}

function StringListField({ path, label, help, items, onChange }: StringListFieldProps) {
  const update = (index: number, next: string) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      <FieldLabel label={label} />
      {help && <Help text={help} />}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${path}-${index}`} className="flex items-center gap-2">
            <span className="w-6 text-xs text-primary/30 font-mono">{index + 1}</span>
            <input
              type="text"
              value={item}
              onChange={(event) => update(index, event.target.value)}
              className="flex-1 h-10 px-3 rounded-lg bg-white border border-surface-300 text-sm text-primary focus:border-accent/40"
            />
            <RowButtons
              onUp={() => move(index, -1)}
              onDown={() => move(index, 1)}
              onRemove={() => onChange(items.filter((_, i) => i !== index))}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
        ))}
      </div>

      <AddButton label="Add item" onClick={() => onChange([...items, ""])} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface ObjectListFieldProps {
  path: string;
  label: string;
  help?: string;
  rowTitle?: string;
  items: Record<string, unknown>[];
  onChange: (next: Record<string, unknown>[]) => void;
}

function ObjectListField({ path, label, help, rowTitle, items, onChange }: ObjectListFieldProps) {
  const meta = metaFor(path);
  const titleKey = rowTitle ?? meta.rowTitle ?? Object.keys(items[0] ?? {})[0] ?? "item";

  const update = (index: number, key: string, next: unknown) => {
    const copy = items.map((item) => ({ ...item }));
    copy[index][key] = next;
    onChange(copy);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const copy = items.map((item) => ({ ...item }));
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onChange(copy);
  };

  /** Builds a new row from the shape of an existing one, so the schema decides. */
  const emptyRow = (): Record<string, unknown> => {
    const template = items[0] ?? {};
    const row: Record<string, unknown> = {};
    for (const [key, sample] of Object.entries(template)) {
      if (Array.isArray(sample)) row[key] = [];
      else if (typeof sample === "number") row[key] = 0;
      else row[key] = "";
    }
    return row;
  };

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label={label} />
        {help && <Help text={help} />}
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${path}-${index}`} className="rounded-2xl border border-surface-200 bg-white/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-primary">
                {String(item[titleKey] ?? "") || `Item ${index + 1}`}
              </span>
              <RowButtons
                onUp={() => move(index, -1)}
                onDown={() => move(index, 1)}
                onRemove={() => onChange(items.filter((_, i) => i !== index))}
                disableUp={index === 0}
                disableDown={index === items.length - 1}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(item).map(([key, child]) => {
                const childPath = `${path}[].${key}`;
                const childMeta = metaFor(childPath);
                if (childMeta.hidden) return null;
                return (
                  <div key={childPath} className={childMeta.wide ? "md:col-span-2" : undefined}>
                    <FieldRenderer
                      path={childPath}
                      value={child}
                      onChange={(next) => update(index, key, next)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AddButton label="Add row" onClick={() => onChange([...items, emptyRow()])} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RowButtons({
  onUp,
  onDown,
  onRemove,
  disableUp,
  disableDown,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  const base =
    "w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-primary/50 hover:text-primary disabled:opacity-30 disabled:hover:text-primary/50";
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onUp} disabled={disableUp} className={base} aria-label="Move up">
        <ChevronUp className="w-4 h-4" />
      </button>
      <button type="button" onClick={onDown} disabled={disableDown} className={base} aria-label="Move down">
        <ChevronDown className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"
        aria-label="Remove"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-surface-400 text-xs font-medium text-primary/60 hover:text-accent hover:border-accent/40"
    >
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
