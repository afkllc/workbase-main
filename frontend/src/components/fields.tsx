export function FieldLabel({label}: {label: string}) {
  return <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</label>;
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="wb-field"
      />
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition duration-200 ease-out hover:border-blue-200 hover:bg-blue-50/40">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
    </label>
  );
}
