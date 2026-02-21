import { AppLayout } from '@/components/layout';
import { TeamsManager } from '@/components/teams';

export default function Teams() {
  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-4xl">
        <TeamsManager />
      </div>
    </AppLayout>
  );
}
