import { OrdersManager } from '@/components/dashboard/orders-manager';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminOrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" />
      <OrdersManager />
    </div>
  );
}
