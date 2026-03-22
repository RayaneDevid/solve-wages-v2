import { useState, useMemo, useRef } from 'react';
import { Upload } from 'lucide-react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { ASSIGNABLE_ROLES } from '@/lib/constants';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

interface ParsedUser {
  discord_id: string;
  username: string;
  role: string;
}

interface BulkImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: ParsedUser[]) => void;
  loading?: boolean;
  existingDiscordIds: string[];
}

function parseCsv(raw: string): { users: ParsedUser[]; error: string | null } {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { users: [], error: null };
  }

  const users: ParsedUser[] = [];

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      return { users: [], error: 'Format attendu : username,discord_id,role' };
    }
    users.push({
      username: parts[0],
      discord_id: parts[1],
      role: parts[2],
    });
  }

  return { users, error: null };
}

export default function BulkImportUsersModal({ isOpen, onClose, onImport, loading, existingDiscordIds }: BulkImportUsersModalProps) {
  const tr = t();
  const [csv, setCsv] = useState('');
  const [defaultRole, setDefaultRole] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { users, error } = useMemo(() => parseCsv(csv), [csv]);

  const usersWithRole = useMemo(() => {
    if (!defaultRole) return users;
    return users.map((u) => ({
      ...u,
      role: u.role || defaultRole,
    }));
  }, [users, defaultRole]);

  const newUsers = useMemo(
    () => usersWithRole.filter((u) => !existingDiscordIds.includes(u.discord_id)),
    [usersWithRole, existingDiscordIds],
  );

  const roleOptions = ASSIGNABLE_ROLES.map((r) => ({
    value: r,
    label: tr.roles[r as keyof typeof tr.roles],
  }));

  function handleImport() {
    if (newUsers.length === 0 || error) return;
    onImport(newUsers);
    setCsv('');
  }

  function handleFileContent(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') setCsv(content);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.admin.bulkImport.title} className="max-w-[640px]">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-secondary">
          <p>{tr.admin.bulkImport.description}</p>
          <code className="mt-1 block rounded bg-white/[0.04] px-2 py-1 text-xs text-text-tertiary">
            {tr.admin.bulkImport.format}
          </code>
        </div>

        <Select
          label={tr.admin.bulkImport.defaultRole}
          value={defaultRole}
          onChange={(e) => setDefaultRole(e.target.value)}
          options={roleOptions}
          placeholder={tr.admin.bulkImport.defaultRolePlaceholder}
        />

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
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

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={tr.admin.bulkImport.placeholder}
          rows={4}
          className="w-full rounded-lg border border-border-secondary bg-white/[0.03] px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {usersWithRole.length > 0 && !error && (
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              {tr.members.bulkModal.preview} — {newUsers.length} {tr.admin.bulkImport.toImport}
              {usersWithRole.length !== newUsers.length && (
                <span className="text-text-tertiary"> ({usersWithRole.length - newUsers.length} {tr.admin.bulkImport.alreadyExist})</span>
              )}
            </p>
            <div className="max-h-[200px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell header>{tr.admin.fields.username}</TableCell>
                    <TableCell header>{tr.admin.fields.discordId}</TableCell>
                    <TableCell header>{tr.admin.fields.role}</TableCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {usersWithRole.map((u, i) => {
                    const exists = existingDiscordIds.includes(u.discord_id);
                    return (
                      <TableRow key={i} className={exists ? 'opacity-40 line-through' : ''}>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{u.discord_id}</span>
                        </TableCell>
                        <TableCell>
                          {tr.roles[u.role as keyof typeof tr.roles] ?? u.role}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tr.common.cancel}
          </Button>
          <Button onClick={handleImport} disabled={newUsers.length === 0 || !!error} loading={loading}>
            {tr.admin.bulkImport.import} ({newUsers.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
