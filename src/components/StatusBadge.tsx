import { statusClasses, type Status } from '@/lib/status';

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses(status)}`}
    >
      {status}
    </span>
  );
}
