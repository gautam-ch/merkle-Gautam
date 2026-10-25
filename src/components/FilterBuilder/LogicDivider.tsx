/** A labelled line between rules (OR) or between groups (AND). */
export const LogicDivider: React.FC<{ label: 'AND' | 'OR' }> = ({ label }) => (
  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
    <div className="h-px flex-1 bg-slate-200" />
    {label}
    <div className="h-px flex-1 bg-slate-200" />
  </div>
);
