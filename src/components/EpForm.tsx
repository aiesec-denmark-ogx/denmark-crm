'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  BACKGROUNDS,
  CITIZENSHIPS,
  INDUSTRIES,
  LANGUAGES,
  PRODUCTS,
  REFERRALS,
  REGIONS,
  SDGS,
  SELECTABLE_BRANCHES,
  type Branch,
} from '@/lib/options';
import { ALL_STATUSES } from '@/lib/status';
import type { Ep } from '@/lib/types';

function DynamicList({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <div className="mt-1 space-y-2">
        {values.map((value, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="rounded-md border border-neutral-300 px-2 text-sm text-neutral-500 dark:border-neutral-700"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="text-sm text-neutral-600 underline dark:text-neutral-400"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function CheckboxGroup<T extends string>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: readonly T[];
  values: T[];
  onChange: (values: T[]) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...values, option]
                    : values.filter((v) => v !== option)
                )
              }
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

const inputClass =
  'mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900';
const labelClass = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300';

export function EpForm({ initial, myBranch }: { initial?: Ep; myBranch: Branch }) {
  const router = useRouter();
  const isMc = myBranch === 'MC Denmark';
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    expa_ep_id: initial?.expa_ep_id ?? '',
    phone_number: initial?.phone_number ?? '',
    personal_emails: initial?.personal_emails ?? [],
    expa_email: initial?.expa_email ?? '',
    entity: initial?.entity ?? (isMc ? SELECTABLE_BRANCHES[0] : myBranch),
    status: initial?.status ?? 'Open',
    desired_product: initial?.desired_product ?? '',
    background: initial?.background ?? '',
    university: initial?.university ?? [],
    languages_spoken: initial?.languages_spoken ?? [],
    languages_other: initial?.languages_other ?? '',
    citizenship: initial?.citizenship ?? '',
    referral: initial?.referral ?? '',
    sdgs: initial?.sdgs ?? [],
    industries: initial?.industries ?? [],
    desired_region: initial?.desired_region ?? '',
    countries_desired: initial?.countries_desired ?? [],
    earliest_start_date: initial?.earliest_start_date ?? '',
    next_followup_date: initial?.next_followup_date?.slice(0, 16) ?? '',
    next_touchpoint_description: initial?.next_touchpoint_description ?? '',
    gdpr_accepted: initial?.gdpr_accepted ?? false,
    date_of_birth: initial?.date_of_birth ?? '',
    linkedin_url: initial?.linkedin_url ?? '',
    country_of_residence: initial?.country_of_residence ?? '',
    semester: initial?.semester ?? '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const payload = {
        ...form,
        desired_product: form.desired_product || null,
        background: form.background || null,
        citizenship: form.citizenship || null,
        referral: form.referral || null,
        desired_region: form.desired_region || null,
        earliest_start_date: form.earliest_start_date || null,
        date_of_birth: form.date_of_birth || null,
        linkedin_url: form.linkedin_url || null,
        country_of_residence: form.country_of_residence || null,
        semester: form.semester || null,
        next_followup_date: form.next_followup_date
          ? new Date(form.next_followup_date).toISOString()
          : null,
        personal_emails: form.personal_emails.filter(Boolean),
        university: form.university.filter(Boolean),
        countries_desired: form.countries_desired.filter(Boolean),
      };

      const result = initial
        ? await supabase.from('eps').update(payload).eq('id', initial.id).select('id').single()
        : await supabase.from('eps').insert(payload).select('id').single();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setSaved(true);
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (initial) {
        router.push('/dashboard');
      } else {
        const id = (result.data as { id: string }).id;
        router.replace(`/eps/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>EXPA EP ID *</label>
          <input
            required
            className={inputClass}
            value={form.expa_ep_id}
            onChange={(e) => set('expa_ep_id', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Phone number</label>
          <input
            className={inputClass}
            value={form.phone_number}
            onChange={(e) => set('phone_number', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>EXPA email</label>
          <input
            className={inputClass}
            value={form.expa_email}
            onChange={(e) => set('expa_email', e.target.value)}
          />
        </div>
      </section>

      <DynamicList
        label="Personal email(s)"
        values={form.personal_emails}
        onChange={(v) => set('personal_emails', v)}
        placeholder="name@example.com"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Entity *</label>
          <select
            required
            disabled={!isMc}
            className={inputClass}
            value={form.entity}
            onChange={(e) => set('entity', e.target.value as Branch)}
          >
            {(isMc ? SELECTABLE_BRANCHES.filter((b) => b !== 'MC Denmark') : [myBranch]).map(
              (b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status *</label>
          <select
            required
            className={inputClass}
            value={form.status}
            onChange={(e) => set('status', e.target.value as typeof form.status)}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Desired product</label>
          <select
            className={inputClass}
            value={form.desired_product}
            onChange={(e) => set('desired_product', e.target.value as typeof form.desired_product)}
          >
            <option value="">—</option>
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Background</label>
          <select
            className={inputClass}
            value={form.background}
            onChange={(e) => set('background', e.target.value as typeof form.background)}
          >
            <option value="">—</option>
            {BACKGROUNDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Citizenship</label>
          <select
            className={inputClass}
            value={form.citizenship}
            onChange={(e) => set('citizenship', e.target.value as typeof form.citizenship)}
          >
            <option value="">—</option>
            {CITIZENSHIPS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Referral</label>
          <select
            className={inputClass}
            value={form.referral}
            onChange={(e) => set('referral', e.target.value as typeof form.referral)}
          >
            <option value="">—</option>
            {REFERRALS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </section>

      <DynamicList
        label="University"
        values={form.university}
        onChange={(v) => set('university', v)}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Date of birth</label>
          <input
            type="date"
            className={inputClass}
            value={form.date_of_birth}
            onChange={(e) => set('date_of_birth', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Country of residence</label>
          <input
            className={inputClass}
            value={form.country_of_residence}
            onChange={(e) => set('country_of_residence', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Semester</label>
          <input
            className={inputClass}
            value={form.semester}
            onChange={(e) => set('semester', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>LinkedIn / portfolio</label>
          <input
            className={inputClass}
            value={form.linkedin_url}
            onChange={(e) => set('linkedin_url', e.target.value)}
          />
        </div>
      </section>

      <CheckboxGroup
        label="Languages spoken"
        options={LANGUAGES}
        values={form.languages_spoken}
        onChange={(v) => set('languages_spoken', v)}
      />
      {form.languages_spoken.includes('Other') && (
        <div>
          <label className={labelClass}>If other, which?</label>
          <input
            className={inputClass}
            value={form.languages_other}
            onChange={(e) => set('languages_other', e.target.value)}
          />
        </div>
      )}

      {form.desired_product === 'Global Volunteer' && (
        <CheckboxGroup label="Sustainable Development Goals" options={SDGS} values={form.sdgs} onChange={(v) => set('sdgs', v)} />
      )}
      {form.desired_product === 'Global Talent' && (
        <CheckboxGroup
          label="Industries"
          options={INDUSTRIES}
          values={form.industries}
          onChange={(v) => set('industries', v)}
        />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Desired region</label>
          <select
            className={inputClass}
            value={form.desired_region}
            onChange={(e) => set('desired_region', e.target.value as typeof form.desired_region)}
          >
            <option value="">—</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Earliest start date</label>
          <input
            type="date"
            className={inputClass}
            value={form.earliest_start_date}
            onChange={(e) => set('earliest_start_date', e.target.value)}
          />
        </div>
      </section>

      <DynamicList
        label="Countries desired"
        values={form.countries_desired}
        onChange={(v) => set('countries_desired', v)}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Next follow-up *</label>
          <input
            required
            type="datetime-local"
            className={inputClass}
            value={form.next_followup_date}
            onChange={(e) => set('next_followup_date', e.target.value)}
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.gdpr_accepted}
              onChange={(e) => set('gdpr_accepted', e.target.checked)}
            />
            GDPR consent given (EU 2016/679)
          </label>
        </div>
      </section>

      <div>
        <label className={labelClass}>Description of next touchpoint *</label>
        <textarea
          required
          rows={3}
          className={inputClass}
          value={form.next_touchpoint_description}
          onChange={(e) => set('next_touchpoint_description', e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || saved}
          className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
        >
          {saved ? 'Saved ✓' : saving ? 'Saving…' : initial ? 'Save changes' : 'Create EP'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
