import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { t } from '@/i18n';
import { GRADES_BY_POLE } from '@/lib/constants';
import type { Pole } from '@/types';

export interface NewPoleMemberData {
  discord_username: string;
  discord_id: string;
  steam_id: string;
  grade: string;
}

interface AddPoleMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: NewPoleMemberData) => void;
  pole: Pole;
  loading?: boolean;
}

export default function AddPoleMemberModal({ isOpen, onClose, onAdd, pole, loading }: AddPoleMemberModalProps) {
  const tr = t();
  const [form, setForm] = useState<NewPoleMemberData>({
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
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.members.addModal.title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{tr.members.addModal.description}</p>
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
            disabled={!form.discord_username || !form.discord_id || !form.grade}
            loading={loading}
          >
            {tr.members.addMember}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
