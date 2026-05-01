import { useState, useMemo, useRef } from 'react';
import { Upload } from 'lucide-react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { t } from '@/i18n';
import { POLE_LABELS } from '@/lib/constants';
import { Pole } from '@/types';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

export interface PayrollCsvRow {
  discord_id: string;
  steam_id: string;
  grade: string;
  moyenne: number;
  grande: number;
  heures: string;
  commentaire: string;
  montant: number;
}

export type MjCsvRow = PayrollCsvRow;

interface MjCsvImportModalProps {
  isOpen: boolean;
  pole: Pole.MJ | Pole.ANIMATION;
  onClose: () => void;
  onImport: (rows: PayrollCsvRow[]) => Promise<void>;
}

const GRADE_MAP_BY_POLE: Record<Pole.MJ | Pole.ANIMATION, Record<string, string>> = {
  [Pole.MJ]: {
    mj: 'MJ',
    mj_senior: 'MJ Senior',
    resp_mj: 'Responsable MJ',
    responsable_mj: 'Responsable MJ',
  },
  [Pole.ANIMATION]: {
    animateur: 'Animateur',
    animateur_senior: 'Animateur Senior',
    animation: 'Animateur',
    animation_senior: 'Animateur Senior',
    resp_animation: 'Responsable Animation',
    responsable_animation: 'Responsable Animation',
  },
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ';' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const EXPECTED_COLS = 9;

function normalizeGrade(pole: Pole.MJ | Pole.ANIMATION, gradeCode: string): string {
  const cleaned = gradeCode.trim();
  const key = cleaned.toLowerCase();
  return GRADE_MAP_BY_POLE[pole][key] ?? cleaned;
}

function parsePayrollCsv(raw: string, pole: Pole.MJ | Pole.ANIMATION): { rows: PayrollCsvRow[]; error: string | null } {
  const lines = raw
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { rows: [], error: null };

  let dataLines = lines;
  const firstCells = parseCsvLine(lines[0]);

  if (firstCells[0] === 'discord_id' || firstCells[0] === '"discord_id"') {
    dataLines = lines.slice(1);
  }

  if (dataLines.length === 0) return { rows: [], error: null };

  const rows: PayrollCsvRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const cells = parseCsvLine(dataLines[i]);
    if (cells.length < EXPECTED_COLS) {
      return { rows: [], error: `Ligne ${i + 1} : ${cells.length} colonne(s) au lieu de ${EXPECTED_COLS}` };
    }

    const [discord_id, steam_id, gradeCode, moyenneStr, grandeStr, , heures, commentaire, montantStr] = cells;

    if (!discord_id) {
      return { rows: [], error: `Ligne ${i + 1} : discord_id manquant` };
    }

    rows.push({
      discord_id,
      steam_id,
      grade: normalizeGrade(pole, gradeCode),
      moyenne: parseInt(moyenneStr) || 0,
      grande: parseInt(grandeStr) || 0,
      heures,
      commentaire,
      montant: parseInt(montantStr) || 0,
    });
  }

  return { rows, error: null };
}

export default function PayrollCsvImportModal({ isOpen, pole, onClose, onImport }: MjCsvImportModalProps) {
  const tr = t();
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalTitle = pole === Pole.ANIMATION
    ? tr.payroll.mjCsvImport.titles.animation
    : tr.payroll.mjCsvImport.titles.mj;
  const placeholder = pole === Pole.ANIMATION
    ? tr.payroll.mjCsvImport.placeholders.animation
    : tr.payroll.mjCsvImport.placeholders.mj;

  const { rows, error } = useMemo(() => parsePayrollCsv(csv, pole), [csv, pole]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsv((ev.target?.result as string) ?? '');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  function handleCsvChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCsv(e.target.value);
    setFileName(null);
  }

  async function handleImport() {
    if (rows.length === 0 || error) return;
    setLoading(true);
    try {
      await onImport(rows);
      setCsv('');
      setFileName(null);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-[820px]">
      <div className="flex flex-col gap-4">
        <div className="text-sm text-text-secondary">
          <p>{tr.payroll.mjCsvImport.description.replace('{pole}', POLE_LABELS[pole])}</p>
          <code className="mt-1 block rounded bg-white/[0.04] px-2 py-1 text-[11px] text-text-tertiary">
            {tr.payroll.mjCsvImport.format}
          </code>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border-secondary bg-white/[0.03] px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
          >
            <Upload className="h-4 w-4" />
            {fileName ?? tr.payroll.mjCsvImport.chooseFile}
          </button>
          <span className="text-xs text-text-tertiary">{tr.payroll.mjCsvImport.orPaste}</span>
        </div>

        <textarea
          value={csv}
          onChange={handleCsvChange}
          placeholder={placeholder}
          rows={6}
          className="w-full rounded-lg border border-border-secondary bg-white/[0.03] px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />

        {error && <p className="text-xs text-danger">{error}</p>}

        {rows.length > 0 && !error && (
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              {tr.payroll.mjCsvImport.preview} — {rows.length} entrée(s)
            </p>
            <div className="max-h-[260px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <tr>
                    <TableCell header>{tr.payroll.fields.discordId}</TableCell>
                    <TableCell header>{tr.payroll.fields.grade}</TableCell>
                    <TableCell header>{tr.payroll.fields.nbAnimationsMjM}</TableCell>
                    <TableCell header>{tr.payroll.fields.nbAnimationsMjG}</TableCell>
                    <TableCell header>{tr.payroll.fields.nbHeuresMj}</TableCell>
                    <TableCell header>{tr.payroll.fields.montant}</TableCell>
                    <TableCell header>{tr.payroll.fields.commentaire}</TableCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <span className="font-mono text-xs">{row.discord_id}</span>
                      </TableCell>
                      <TableCell>{row.grade}</TableCell>
                      <TableCell className="text-center">{row.moyenne}</TableCell>
                      <TableCell className="text-center">{row.grande}</TableCell>
                      <TableCell className="text-center">{row.heures}</TableCell>
                      <TableCell className="text-right font-medium text-accent">{row.montant.toLocaleString('fr-FR')}</TableCell>
                      <TableCell>
                        <span className="line-clamp-1 max-w-[220px] text-xs text-text-secondary" title={row.commentaire}>
                          {row.commentaire}
                        </span>
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
          <Button onClick={handleImport} disabled={rows.length === 0 || !!error} loading={loading}>
            {tr.payroll.mjCsvImport.import} ({rows.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
