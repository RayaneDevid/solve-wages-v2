import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { t } from '@/i18n';
import { GRADES_BY_POLE } from '@/lib/constants';
import type { Pole } from '@/types';

export interface NewMemberData {
  discord_username: string;
  discord_id: string;
  steam_id: string;
  grade: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: NewMemberData) => void;
  pole: Pole;
}

export default function AddMemberModal({ isOpen, onClose, onAdd, pole }: AddMemberModalProps) {
  const tr = t();
  const [form, setForm] = useState<NewMemberData>({
    discord_username: '',
    discord_id: '',
    steam_id: '',
    grade: '',
  });

  const grades = GRADES_BY_POLE[pole] ?? [];
  const gradeOptions = grades.map((g) => ({ value: g, label: g }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.discord_username || !form.discord_id || !form.grade) return;
    onAdd(form);
    setForm({ discord_username: '', discord_id: '', steam_id: '', grade: '' });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.payroll.addMember.title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{tr.payroll.addMember.description}</p>
        <Input
          label={tr.payroll.fields.discordUsername}
          value={form.discord_username}
          onChange={(e) => setForm((f) => ({ ...f, discord_username: e.target.value }))}
          required
        />
        <Input
          label={tr.payroll.fields.discordId}
          value={form.discord_id}
          onChange={(e) => setForm((f) => ({ ...f, discord_id: e.target.value }))}
          required
        />
        <Input
          label={tr.payroll.fields.steamId}
          value={form.steam_id}
          onChange={(e) => setForm((f) => ({ ...f, steam_id: e.target.value }))}
        />
        <Select
          label={tr.payroll.fields.grade}
          value={form.grade}
          onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
          options={gradeOptions}
          placeholder={tr.payroll.fields.grade}
          required
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tr.common.cancel}
          </Button>
          <Button type="submit" disabled={!form.discord_username || !form.discord_id || !form.grade}>
            {tr.payroll.actions.addMember}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
