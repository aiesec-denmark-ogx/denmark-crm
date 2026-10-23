// The EP status pipeline. Order matters for the "main cycle" group — it is
// the left-to-right order used in the pipeline/kanban view.

export type StatusGroup = 'pipeline' | 'secondary' | 'dropped';

export const STATUS_PIPELINE = [
  'Open', 'Applied', 'Accepted', 'Paid', 'Approved', 'Realised', 'Finished', 'Completed',
] as const;

export const STATUS_SECONDARY = ['Consecutive Approval', 'Re-integrated'] as const;

export const STATUS_DROPPED = ['Dropped', 'Rejected', 'Withdrawn', 'No Response'] as const;

export const ALL_STATUSES = [...STATUS_PIPELINE, ...STATUS_SECONDARY, ...STATUS_DROPPED] as const;
export type Status = (typeof ALL_STATUSES)[number];

export function statusGroup(status: Status): StatusGroup {
  if ((STATUS_SECONDARY as readonly string[]).includes(status)) return 'secondary';
  if ((STATUS_DROPPED as readonly string[]).includes(status)) return 'dropped';
  return 'pipeline';
}

/** Tailwind classes for each status's badge, grouped by color. */
export function statusClasses(status: Status): string {
  switch (statusGroup(status)) {
    case 'pipeline':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    case 'secondary':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    case 'dropped':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
  }
}

export function formatDuration(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
