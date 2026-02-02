import { AppLayout } from '@/components/layout';
import { TeamsManager } from '@/components/teams';

export default function Teams() {
  return (
    <AppLayout>
      <div className="container max-w-4xl py-8">
        <TeamsManager />
      </div>
    </AppLayout>
  );
}
