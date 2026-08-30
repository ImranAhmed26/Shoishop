import { OrdersManager } from '@/components/dashboard/orders-manager';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardOrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" />
      <OrdersManager />
    </div>
  );
}
