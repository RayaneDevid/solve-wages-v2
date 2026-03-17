import { useState, useMemo } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { t } from '@/i18n';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import type { NewMemberData } from './add-member-modal';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: NewMemberData[]) => void;
}

function parseCsv(raw: string): { members: NewMemberData[]; error: string | null } {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { members: [], error: null };
  }

  const members: NewMemberData[] = [];

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      return { members: [], error: t().payroll.bulkImport.invalidFormat };
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

export default function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const tr = t();
  const [csv, setCsv] = useState('');

  const { members, error } = useMemo(() => parseCsv(csv), [csv]);

  function handleImport() {
    if (members.length === 0 || error) return;
    onImport(members);
    setCsv('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.payroll.bulkImport.title} className="max-w-[640px]">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-secondary">
          <p>{tr.payroll.bulkImport.description}</p>
          <code className="mt-1 block rounded bg-white/[0.04] px-2 py-1 text-xs text-text-tertiary">
            {tr.payroll.bulkImport.format}
          </code>
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={tr.payroll.bulkImport.placeholder}
          rows={6}
          className="w-full rounded-lg border border-border-secondary bg-white/[0.03] px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {members.length > 0 && !error && (
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              {tr.payroll.bulkImport.preview} — {tr.payroll.bulkImport.importCount.replace('{count}', String(members.length))}
            </p>
            <div className="max-h-[200px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell header>{tr.payroll.fields.discordUsername}</TableCell>
                    <TableCell header>{tr.payroll.fields.grade}</TableCell>
                    <TableCell header>{tr.payroll.fields.discordId}</TableCell>
                    <TableCell header>{tr.payroll.fields.steamId}</TableCell>
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
          <Button onClick={handleImport} disabled={members.length === 0 || !!error}>
            {tr.payroll.bulkImport.import} ({members.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
