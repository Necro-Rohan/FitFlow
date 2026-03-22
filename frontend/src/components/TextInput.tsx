interface TextInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  id?: string;
}

export function TextInput({ label, value, onChange, placeholder, type = 'text', required, id }: TextInputProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-text-muted mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors duration-150"
      />
    </div>
  );
}
