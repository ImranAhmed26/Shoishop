import { ProductsManager } from '@/components/dashboard/products-manager';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardProductsPage() {
  return (
    <div>
      <PageHeader title="Products" />
      <ProductsManager />
    </div>
  );
}
