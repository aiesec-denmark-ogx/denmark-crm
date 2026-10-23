import { requireUser } from '@/lib/auth';
import { EpForm } from '@/components/EpForm';

export default async function NewEpPage() {
  const { profile } = await requireUser();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        New EP
      </h1>
      <EpForm myBranch={profile.branch} />
    </main>
  );
}
