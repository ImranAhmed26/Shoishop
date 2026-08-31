import { ReelsManager } from '@/components/dashboard/reels-manager';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardReelsPage() {
  return (
    <div>
      <PageHeader title="Reels" />
      <ReelsManager />
    </div>
  );
}
