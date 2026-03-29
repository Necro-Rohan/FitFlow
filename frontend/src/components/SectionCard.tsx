interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionCard({ title, children, action }: SectionCardProps) {
  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
