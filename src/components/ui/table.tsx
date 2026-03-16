import { cn } from '@/lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="glass-card w-full overflow-clip rounded-xl">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('border-b border-border-secondary bg-[rgba(10,8,35,0.4)]', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn('divide-y divide-border-secondary', className)}>{children}</tbody>;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors duration-150 hover:bg-white/[0.02]',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}

export function TableCell({ children, className, header }: TableCellProps) {
  const Tag = header ? 'th' : 'td';
  return (
    <Tag
      className={cn(
        'px-5 py-3.5 text-left',
        header
          ? 'text-[11px] font-semibold uppercase tracking-wider text-text-secondary'
          : 'text-sm text-text-primary',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
