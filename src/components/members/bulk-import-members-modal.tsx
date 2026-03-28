import { useState, useMemo, useRef } from 'react';
import { Upload } from 'lucide-react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Badge from '@/components/ui/badge';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { Pole } from '@/types';
import { POLE_LABELS, getGradeColor } from '@/lib/constants';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

export interface ParsedMemberWithPole {
  discord_username: string;
  discord_id: string;
  steam_id: string;
  grade: string;
  pole?: string;
}

interface BulkImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: ParsedMemberWithPole[], pole?: string) => void;
  loading?: boolean;
  showPoleSelector?: boolean;
}

// Map CSV pole labels to Pole enum values
const POLE_LABEL_TO_ENUM: Record<string, Pole> = {
  'direction': Pole.GERANCE,
  'gérance': Pole.GERANCE,
  'gerance': Pole.GERANCE,
  'administration': Pole.ADMINISTRATION,
  'modération': Pole.MODERATION,
  'moderation': Pole.MODERATION,
  'animation': Pole.ANIMATION,
  'mj': Pole.MJ,
  'maître du jeu': Pole.MJ,
  'douane': Pole.DOUANE,
  'builder': Pole.BUILDER,
  'community manager': Pole.COMMUNITY_MANAGER,
  'cm': Pole.COMMUNITY_MANAGER,
  'lore': Pole.LORE,
  'equilibrage': Pole.EQUILIBRAGE_PVP,
  'equilibrage pvp': Pole.EQUILIBRAGE_PVP,
  'équilibrage pvp': Pole.EQUILIBRAGE_PVP,
  'support': Pole.SUPPORT,
  'rp': Pole.GERANCE,
  'serveur': Pole.GERANCE,
  'staff': Pole.GERANCE,
};

function resolvePole(label: string): Pole | null {
  return POLE_LABEL_TO_ENUM[label.toLowerCase()] ?? null;
}

interface ParseResult {
  members: ParsedMemberWithPole[];
  error: string | null;
  hasPolesInCsv: boolean;
}

function parseCsv(raw: string): ParseResult {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { members: [], error: null, hasPolesInCsv: false };
  }

  const members: ParsedMemberWithPole[] = [];

  // Detect format by first line
  const firstParts = lines[0].split(',').map((p) => p.trim());

  // Format A: username,discord_id,pole_label,grade (4 cols, col[1] is discord_id digits)
  // Format B: username,grade,discord_id,steam_id (4 cols, col[2] is discord_id digits)
  // Format C: username,grade,discord_id (3 cols, col[2] is discord_id digits)
  const isFormatA = firstParts.length >= 3 && /^\d{17,20}$/.test(firstParts[1]);

  if (isFormatA) {
    // username,discord_id,pole_label,grade
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 4) {
        return { members: [], error: 'Format attendu : username,discord_id,pole,grade', hasPolesInCsv: false };
      }
      const pole = resolvePole(parts[2]);
      members.push({
        discord_username: parts[0],
        discord_id: parts[1],
        grade: parts[3],
        steam_id: '',
        pole: pole ?? undefined,
      });
    }
    return { members, error: null, hasPolesInCsv: true };
  }

  // Format B/C: username,grade,discord_id[,steam_id]
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      return { members: [], error: t().members.bulkModal.format, hasPolesInCsv: false };
    }
    members.push({
      discord_username: parts[0],
      grade: parts[1],
      discord_id: parts[2],
      steam_id: parts[3] ?? '',
    });
  }

  return { members, error: null, hasPolesInCsv: false };
}

export default function BulkImportMembersModal({ isOpen, onClose, onImport, loading, showPoleSelector }: BulkImportMembersModalProps) {
  const tr = t();
  const [csv, setCsv] = useState('');
  const [selectedPole, setSelectedPole] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { members, error, hasPolesInCsv } = useMemo(() => parseCsv(csv), [csv]);

  // In all-staffs mode: if CSV has poles, no need for pole selector
  const needsPoleSelector = showPoleSelector && !hasPolesInCsv;

  const poleOptions = Object.values(Pole).map((p) => ({
    value: p,
    label: POLE_LABELS[p],
  }));

  const canImport = members.length > 0 && !error && (!needsPoleSelector || !!selectedPole);

  function handleImport() {
    if (!canImport) return;
    if (hasPolesInCsv) {
      // Members already have poles from CSV
      onImport(members);
    } else {
      onImport(members, needsPoleSelector ? selectedPole : undefined);
    }
    setCsv('');
    setSelectedPole('');
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

  const formatHint = showPoleSelector
    ? 'username,discord_id,pole,grade'
    : tr.members.bulkModal.format;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.members.bulkModal.title} className="max-w-[640px]">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-secondary">
          <p>{tr.members.bulkModal.description}</p>
          <code className="mt-1 block rounded bg-white/[0.04] px-2 py-1 text-xs text-text-tertiary">
            {formatHint}
          </code>
        </div>

        {needsPoleSelector && (
          <Select
            label="Pôle"
            value={selectedPole}
            onChange={(e) => setSelectedPole(e.target.value)}
            options={poleOptions}
            placeholder="Sélectionner un pôle"
            required
          />
        )}

        {/* Drop zone / file picker */}
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
                    {hasPolesInCsv && <TableCell header>Pôle</TableCell>}
                    <TableCell header>{tr.members.fields.grade}</TableCell>
                    <TableCell header>{tr.members.fields.discordId}</TableCell>
                    {!hasPolesInCsv && <TableCell header>{tr.members.fields.steamId}</TableCell>}
                  </tr>
                </TableHeader>
                <TableBody>
                  {members.map((m, i) => {
                    const colors = getGradeColor(m.grade);
                    return (
                      <TableRow key={i}>
                        <TableCell>{m.discord_username}</TableCell>
                        {hasPolesInCsv && (
                          <TableCell>
                            {m.pole ? (
                              <Badge variant="default">{POLE_LABELS[m.pole as Pole] ?? m.pole}</Badge>
                            ) : (
                              <span className="text-xs text-danger">?</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <span
                            className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {m.grade}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{m.discord_id}</span>
                        </TableCell>
                        {!hasPolesInCsv && (
                          <TableCell>
                            <span className="font-mono text-xs text-text-secondary">{m.steam_id || '—'}</span>
                          </TableCell>
                        )}
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
          <Button onClick={handleImport} disabled={!canImport} loading={loading}>
            {tr.members.bulkModal.import} ({members.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
