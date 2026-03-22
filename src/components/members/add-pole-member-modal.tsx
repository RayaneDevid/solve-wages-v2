import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { t } from '@/i18n';
import { GRADES_BY_POLE, POLE_LABELS } from '@/lib/constants';
import { Pole } from '@/types';

export interface NewPoleMemberData {
  pole?: string;
  discord_username: string;
  discord_id: string;
  steam_id: string;
  grade: string;
}

interface AddPoleMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: NewPoleMemberData) => void;
  pole: Pole | null;
  loading?: boolean;
}

export default function AddPoleMemberModal({ isOpen, onClose, onAdd, pole, loading }: AddPoleMemberModalProps) {
  const tr = t();
  const [selectedPole, setSelectedPole] = useState<string>(pole ?? '');
  const [form, setForm] = useState<NewPoleMemberData>({
    discord_username: '',
    discord_id: '',
    steam_id: '',
    grade: '',
  });

  const showPoleSelector = pole === null;
  const effectivePole = showPoleSelector ? selectedPole : pole;
  const grades = effectivePole ? (GRADES_BY_POLE[effectivePole as Pole] ?? []) : [];
  const gradeOptions = grades.map((g) => ({ value: g, label: g }));

  const poleOptions = Object.values(Pole).map((p) => ({
    value: p,
    label: POLE_LABELS[p],
  }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.discord_username || !form.discord_id || !form.grade) return;
    if (showPoleSelector && !selectedPole) return;
    onAdd({ ...form, ...(showPoleSelector ? { pole: selectedPole } : {}) });
    setForm({ discord_username: '', discord_id: '', steam_id: '', grade: '' });
    if (showPoleSelector) setSelectedPole('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.members.addModal.title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{tr.members.addModal.description}</p>
        {showPoleSelector && (
          <Select
            label="Pôle"
            value={selectedPole}
            onChange={(e) => {
              setSelectedPole(e.target.value);
              setForm((f) => ({ ...f, grade: '' }));
            }}
            options={poleOptions}
            placeholder="Sélectionner un pôle"
            required
          />
        )}
        <Input
          label={tr.members.fields.discordUsername}
          value={form.discord_username}
          onChange={(e) => setForm((f) => ({ ...f, discord_username: e.target.value }))}
          required
        />
        <Input
          label={tr.members.fields.discordId}
          value={form.discord_id}
          onChange={(e) => setForm((f) => ({ ...f, discord_id: e.target.value }))}
          required
        />
        <Input
          label={tr.members.fields.steamId}
          value={form.steam_id}
          onChange={(e) => setForm((f) => ({ ...f, steam_id: e.target.value }))}
        />
        {grades.length > 0 ? (
          <Select
            label={tr.members.fields.grade}
            value={form.grade}
            onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
            options={gradeOptions}
            placeholder={tr.members.fields.grade}
            required
          />
        ) : (
          <Input
            label={tr.members.fields.grade}
            value={form.grade}
            onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
            required
          />
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tr.common.cancel}
          </Button>
          <Button
            type="submit"
            disabled={!form.discord_username || !form.discord_id || !form.grade || (showPoleSelector && !selectedPole)}
            loading={loading}
          >
            {tr.members.addMember}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
