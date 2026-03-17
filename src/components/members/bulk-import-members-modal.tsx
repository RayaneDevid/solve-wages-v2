import { useState, useMemo, useRef } from 'react';
import { Upload } from 'lucide-react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

interface ParsedMember {
  discord_username: string;
  discord_id: string;
  steam_id: string;
  grade: string;
}

interface BulkImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: ParsedMember[]) => void;
  loading?: boolean;
}

function parseCsv(raw: string): { members: ParsedMember[]; error: string | null } {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { members: [], error: null };
  }

  const members: ParsedMember[] = [];

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      return { members: [], error: t().members.bulkModal.format };
    }
    members.push({
      discord_username: parts[0],
      grade: parts[1],
      discord_id: parts[2],
      steam_id: parts[3] ?? '',
    });
  }

  return { members, error: null };
}

export default function BulkImportMembersModal({ isOpen, onClose, onImport, loading }: BulkImportMembersModalProps) {
  const tr = t();
  const [csv, setCsv] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { members, error } = useMemo(() => parseCsv(csv), [csv]);

  function handleImport() {
    if (members.length === 0 || error) return;
    onImport(members);
    setCsv('');
  }

  function handleFileContent(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setCsv(content);
      }
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileContent(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileContent(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.members.bulkModal.title} className="max-w-[640px]">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-secondary">
          <p>{tr.members.bulkModal.description}</p>
          <code className="mt-1 block rounded bg-white/[0.04] px-2 py-1 text-xs text-text-tertiary">
            {tr.members.bulkModal.format}
          </code>
        </div>

        {/* Drop zone / file picker */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 transition-colors',
            isDragOver
              ? 'border-accent/60 bg-accent/5'
              : 'border-border-secondary hover:border-accent/30 hover:bg-white/[0.02]',
          )}
        >
          <Upload className="h-5 w-5 text-text-tertiary" />
          <p className="text-sm text-text-secondary">{tr.members.bulkModal.dropFile}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Or paste textarea */}
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={tr.members.bulkModal.placeholder}
          rows={4}
          className="w-full rounded-lg border border-border-secondary bg-white/[0.03] px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {members.length > 0 && !error && (
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              {tr.members.bulkModal.preview} — {tr.members.bulkModal.importCount.replace('{count}', String(members.length))}
            </p>
            <div className="max-h-[200px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell header>{tr.members.fields.discordUsername}</TableCell>
                    <TableCell header>{tr.members.fields.grade}</TableCell>
                    <TableCell header>{tr.members.fields.discordId}</TableCell>
                    <TableCell header>{tr.members.fields.steamId}</TableCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {members.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{m.discord_username}</TableCell>
                      <TableCell>{m.grade}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{m.discord_id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-text-secondary">{m.steam_id || '—'}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tr.common.cancel}
          </Button>
          <Button onClick={handleImport} disabled={members.length === 0 || !!error} loading={loading}>
            {tr.members.bulkModal.import} ({members.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
