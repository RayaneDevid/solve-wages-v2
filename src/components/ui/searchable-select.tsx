import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  label,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setSearch('');
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(opt: Option) {
    onChange(opt.value);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <span className="text-[13px] font-medium text-text-secondary">{label}</span>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border bg-white/[0.03] px-3 text-sm transition-all duration-200',
            open ? 'border-accent/40 ring-1 ring-accent/20 bg-white/[0.05]' : 'border-border-secondary',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <span className={cn('truncate', selected ? 'text-text-primary' : 'text-text-tertiary')}>
            {selected ? selected.label : placeholder}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {value && (
              <span
                onClick={handleClear}
                className="rounded p-0.5 text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className={cn('h-4 w-4 text-text-tertiary transition-transform', open && 'rotate-180')} />
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-secondary bg-bg-primary shadow-xl">
            <div className="flex items-center gap-2 border-b border-border-secondary px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-text-tertiary">Aucun résultat</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.05]',
                      opt.value === value ? 'text-accent' : 'text-text-primary',
                    )}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
