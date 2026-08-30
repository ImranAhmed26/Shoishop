import { OrdersManager } from '@/components/dashboard/orders-manager';

export default function DashboardOrdersPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Orders</h1>
      <OrdersManager />
    </div>
  );
}
